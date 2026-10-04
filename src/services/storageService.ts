import { Resident, Booking, AuditLogEntry, ChatMessage, ResourceId } from '../types';
import { INITIAL_RESIDENTS, INITIAL_BOOKINGS, INITIAL_AUDIT_LOGS, STRICT_RESOURCES, TODAY_STR } from '../constants';

const STORAGE_KEYS = {
  RESIDENTS: 'hostel_nexus_residents_v4',
  CURRENT_UID: 'hostel_nexus_current_uid_v4',
  BOOKINGS: 'hostel_nexus_bookings_v4',
  AUDIT_LOGS: 'hostel_nexus_audit_logs_v4',
  CHAT_MESSAGES: 'hostel_nexus_companion_chat_v4',
};

// Safe sequence hash generator for audit logs
function generateAuditHash(prevHash: string, timestamp: string, action: string): string {
  const seed = `${prevHash}_${timestamp}_${action}_${Math.random().toString(36).substring(2, 8)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return `0x${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

// -------------------------------------------------------------
// Residents & Dynamic Sign-Up / Login Portal Storage
// -------------------------------------------------------------
export function getResidents(): Resident[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESIDENTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load residents', e);
  }
  return [];
}

export function saveResidents(residents: Resident[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.RESIDENTS, JSON.stringify(residents));
  } catch (e) {
    console.error('Failed to save residents', e);
  }
}

export function getResidentByUid(identifier: string): Resident | undefined {
  if (!identifier) return undefined;
  const list = getResidents();
  const clean = identifier.trim().toUpperCase();
  return list.find(
    (r) =>
      r.id.toUpperCase() === clean ||
      r.uid.toUpperCase() === clean ||
      r.regDigits === identifier.trim()
  );
}

export function getCurrentUser(): Resident | null {
  const currentUid = localStorage.getItem(STORAGE_KEYS.CURRENT_UID);
  if (!currentUid) return null;
  const resident = getResidentByUid(currentUid);
  return resident || null;
}

export function setCurrentUser(identifier: string) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_UID, identifier);
}

export function logoutResident(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_UID);
}

export interface RegisterResidentParams {
  name: string;
  regDigits: string;
  passcode?: string;
  room?: string;
  branch?: string;
}

export function registerResident(params: RegisterResidentParams): {
  success: boolean;
  resident?: Resident;
  error?: string;
} {
  const cleanName = params.name.trim();
  const cleanDigits = params.regDigits.trim().replace(/\D/g, '');

  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: 'Please enter your full name (at least 2 characters).' };
  }
  if (!cleanDigits || cleanDigits.length !== 3) {
    return { success: false, error: 'Please enter exactly the last 3 digits of your registration number (e.g. 412).' };
  }

  const residents = getResidents();
  const existing = residents.find((r) => r.regDigits === cleanDigits);
  if (existing) {
    return {
      success: false,
      error: `Registration number ending in "${cleanDigits}" is already registered under "${existing.name}". Please switch to Sign In.`,
    };
  }

  const generatedId = `REG-${cleanDigits}`;
  const newResident: Resident = {
    id: generatedId,
    uid: generatedId,
    name: cleanName,
    regDigits: cleanDigits,
    passcode: params.passcode?.trim() || undefined,
    room: params.room?.trim() || `Wing-${cleanDigits[0]} · Room ${cleanDigits}`,
    branch: params.branch?.trim() || 'Computer Science & Engineering',
    credits: 4, // Initialized with 4 Weekly Credits
    role: 'resident',
    createdAt: new Date().toISOString(),
  };

  residents.push(newResident);
  saveResidents(residents);
  setCurrentUser(newResident.id);

  // Append student onboarding to permanent immutable audit ledger
  appendAuditLog({
    action: 'CONFLICT_RESOLVED',
    userId: newResident.id,
    userName: newResident.name,
    resourceId: 'badminton-a',
    resourceName: 'Student Registry',
    slotLabel: 'Semester Session',
    date: TODAY_STR,
    details: `Student registered: ${cleanName} (${generatedId}, ${newResident.room}). Initialized with 4/4 weekly credits quota.`,
    creditsChanged: 0,
  });

  return { success: true, resident: newResident };
}

export interface AuthenticateResidentParams {
  name: string;
  regDigits: string;
  passcode?: string;
}

export function authenticateResident(
  paramsOrUid: AuthenticateResidentParams | string,
  maybePasscode?: string
): { success: boolean; resident?: Resident; error?: string } {
  // Overload support for (name, regDigits) or legacy (uid, passcode)
  if (typeof paramsOrUid === 'string') {
    const uid = paramsOrUid;
    const resident = getResidentByUid(uid);
    if (!resident) {
      return { success: false, error: `Resident identifier "${uid}" not found.` };
    }
    if (resident.passcode && resident.passcode !== maybePasscode?.trim()) {
      return { success: false, error: 'Incorrect passcode.' };
    }
    setCurrentUser(resident.id);
    return { success: true, resident };
  }

  const { name, regDigits, passcode } = paramsOrUid;
  const cleanName = name.trim().toLowerCase();
  const cleanDigits = regDigits.trim().replace(/\D/g, '');

  if (!cleanName) {
    return { success: false, error: 'Please enter your registered student name.' };
  }
  if (!cleanDigits || cleanDigits.length !== 3) {
    return { success: false, error: 'Please enter the last 3 digits of your registration number.' };
  }

  const residents = getResidents();
  const resident = residents.find((r) => {
    const digitsMatch = r.regDigits === cleanDigits;
    const nameMatch = r.name.trim().toLowerCase() === cleanName;
    return digitsMatch && nameMatch;
  });

  if (!resident) {
    const digitMatch = residents.find((r) => r.regDigits === cleanDigits);
    if (digitMatch) {
      return {
        success: false,
        error: `Found registration ending in "${cleanDigits}", but the registered name doesn't match "${name.trim()}". Check your spelling.`,
      };
    }
    return {
      success: false,
      error: `No resident found with name "${name.trim()}" and registration ending in "${cleanDigits}". Please click "Sign Up" to register first.`,
    };
  }

  if (resident.passcode && resident.passcode.trim() !== '') {
    if (!passcode || resident.passcode !== passcode.trim()) {
      return { success: false, error: 'Incorrect 4-digit security passcode.' };
    }
  }

  setCurrentUser(resident.id);
  return { success: true, resident };
}

// -------------------------------------------------------------
// Bookings & Quotas (Max 4 Bookings / Credits + Refund Logic)
// -------------------------------------------------------------
export function getBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load bookings', e);
  }
  saveBookings(INITIAL_BOOKINGS);
  return INITIAL_BOOKINGS;
}

export function saveBookings(bookings: Booking[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  } catch (e) {
    console.error('Failed to save bookings', e);
  }
}

export interface ClaimSlotResult {
  success: boolean;
  booking?: Booking;
  error?: string;
}

export function claimSlot(params: {
  resourceId: ResourceId;
  date: string;
  slotId: string;
  slotLabel: string;
  userId: string;
}): ClaimSlotResult {
  const residents = getResidents();
  const residentIndex = residents.findIndex((r) => r.id === params.userId || r.uid === params.userId);
  if (residentIndex === -1) {
    return { success: false, error: 'Resident profile not found.' };
  }

  const resident = residents[residentIndex];

  // 1. Check weekly credit quota
  if (resident.credits <= 0) {
    return {
      success: false,
      error: `Weekly credit quota exhausted (0/4 Credits remaining). Cancel an existing booking or wait for next week's quota reset.`,
    };
  }

  // 2. Check if slot is already booked for this resource & date
  const bookings = getBookings();
  const existing = bookings.find(
    (b) =>
      b.resourceId === params.resourceId &&
      b.date === params.date &&
      b.slotId === params.slotId &&
      b.status === 'active'
  );

  if (existing) {
    return {
      success: false,
      error: `Slot ${params.slotLabel} is already claimed by ${existing.userName} (${existing.userId}).`,
    };
  }

  // 3. Deduct 1 credit
  residents[residentIndex].credits = Math.max(0, resident.credits - 1);
  saveResidents(residents);

  // 4. Create booking
  const resource = STRICT_RESOURCES.find((r) => r.id === params.resourceId);
  const resourceName = resource ? resource.name : params.resourceId;

  const newBooking: Booking = {
    id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    resourceId: params.resourceId,
    date: params.date,
    slotId: params.slotId,
    slotLabel: params.slotLabel,
    userId: resident.uid,
    userName: resident.name,
    userRoom: resident.room,
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  bookings.unshift(newBooking);
  saveBookings(bookings);

  // 5. Append to PERMANENT Immutable Audit Log
  appendAuditLog({
    action: 'BOOKING_CLAIM',
    userId: resident.uid,
    userName: resident.name,
    resourceId: params.resourceId,
    resourceName,
    slotLabel: params.slotLabel,
    date: params.date,
    details: `Claimed slot for ${resourceName}. 1 credit deducted. Balance: ${residents[residentIndex].credits}/4.`,
    creditsChanged: -1,
  });

  return { success: true, booking: newBooking };
}

export function updateBookingVerdict(
  bookingId: string,
  verdict: string,
  source: 'gemma-open-weight' | 'gemma-builtin' | 'gemma-cloud'
) {
  const bookings = getBookings();
  const booking = bookings.find((b) => b.id === bookingId);
  if (booking) {
    booking.wardenVerdict = verdict;
    booking.wardenVerdictSource = source;
    saveBookings(bookings);

    // Also record warden verdict in permanent audit ledger
    const resource = STRICT_RESOURCES.find((r) => r.id === booking.resourceId);
    appendAuditLog({
      action: 'WARDEN_VERDICT',
      userId: booking.userId,
      userName: booking.userName,
      resourceId: booking.resourceId,
      resourceName: resource ? resource.name : booking.resourceId,
      slotLabel: booking.slotLabel,
      date: booking.date,
      details: `Warden Gemma Verdict (${source}): "${verdict}"`,
      creditsChanged: 0,
    });
  }
}

export function cancelBooking(bookingId: string, requestingUid: string): { success: boolean; error?: string } {
  const bookings = getBookings();
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return { success: false, error: 'Booking record not found.' };
  }

  if (booking.status === 'cancelled') {
    return { success: false, error: 'Booking has already been cancelled.' };
  }

  // Check authorization (owner or warden)
  const current = getResidentByUid(requestingUid);
  if (booking.userId !== requestingUid && current?.role !== 'warden') {
    return { success: false, error: 'You are only authorized to cancel your own bookings.' };
  }

  // Update booking status
  booking.status = 'cancelled';
  saveBookings(bookings);

  // Automatic 1-Credit Refund logic (capped at 4)
  const residents = getResidents();
  const resident = residents.find((r) => r.id === booking.userId || r.uid === booking.userId);
  let newBalance = 4;
  if (resident) {
    resident.credits = Math.min(4, resident.credits + 1);
    newBalance = resident.credits;
    saveResidents(residents);
  }

  const resource = STRICT_RESOURCES.find((r) => r.id === booking.resourceId);
  const resourceName = resource ? resource.name : booking.resourceId;

  // Append cancellation & refund to PERMANENT Immutable Audit Log
  appendAuditLog({
    action: 'BOOKING_CANCELLED',
    userId: booking.userId,
    userName: booking.userName,
    resourceId: booking.resourceId,
    resourceName,
    slotLabel: booking.slotLabel,
    date: booking.date,
    details: `Slot cancelled by ${current?.name || requestingUid}. 1 Credit automatically refunded (Balance: ${newBalance}/4). Slot reopened.`,
    creditsChanged: 1,
  });

  return { success: true };
}

// -------------------------------------------------------------
// PERMANENT Immutable Audit Logs (NO CLEAR / DELETE FUNCTIONS ALLOWED)
// -------------------------------------------------------------
export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load audit logs', e);
  }
  // Initialize with seeded permanent logs
  localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
  return INITIAL_AUDIT_LOGS;
}

export function appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'hash'>): AuditLogEntry {
  const logs = getAuditLogs();
  const timestamp = new Date().toISOString();
  const prevHash = logs.length > 0 ? logs[0].hash : '0x00000000';
  const hash = generateAuditHash(prevHash, timestamp, entry.action);

  const fullEntry: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp,
    hash,
  };

  logs.unshift(fullEntry);
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to persist audit log', e);
  }

  return fullEntry;
}

// -------------------------------------------------------------
// Interactive AI Companion Chat Storage
// -------------------------------------------------------------
export function getCompanionChatMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load companion messages', e);
  }
  const defaultMessages: ChatMessage[] = [
    {
      id: 'init-1',
      sender: 'gemma',
      text: 'Namaste residents. I am your Hostel Nexus Companion, backed by Google Gemma open-weight intelligence. Whether you are caught in an AC temperature stalemate, looking for 2 AM Maggi hacks, or need the warden rules clarified before checking out sports gear, state your grievance.',
      timestamp: new Date().toISOString(),
      source: 'gemma-builtin',
    },
  ];
  saveCompanionChatMessages(defaultMessages);
  return defaultMessages;
}

export function saveCompanionChatMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to save companion messages', e);
  }
}

export function appendCompanionChatMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
  const list = getCompanionChatMessages();
  const full: ChatMessage = {
    ...msg,
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  list.push(full);
  saveCompanionChatMessages(list);
  return full;
}
