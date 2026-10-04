export type ResourceId = 
  | 'tt-racket-1'
  | 'tt-racket-2'
  | 'badminton-a'
  | 'badminton-b'
  | 'basketball-hoop'
  | 'bluetooth-speaker';

export interface ResourceInfo {
  id: ResourceId;
  name: string;
  category: 'Table Tennis' | 'Badminton' | 'Courts' | 'Audio';
  icon: string;
  description: string;
  curfewRule: string;
  depositRule: string;
}

export interface TimeSlot {
  id: string; // e.g., '17:00-18:00'
  label: string; // '5:00 PM - 6:00 PM'
  startHour: number; // 17
  endHour: number; // 18
}

export interface Resident {
  id: string; // e.g. 'REG-412'
  uid: string; // e.g. 'REG-412' (synced with id for cross-compatibility)
  name: string; // Student Full Name
  regDigits: string; // Exact 3 digits of registration number (e.g. '412')
  passcode?: string; // Optional simple 4-digit PIN for security
  room: string; // e.g. 'Room 302'
  branch?: string; // e.g. 'Computer Science'
  credits: number; // starts at 4, max 4
  role: 'resident' | 'warden';
  createdAt: string;
}

export interface Booking {
  id: string;
  resourceId: ResourceId;
  date: string; // 'YYYY-MM-DD'
  slotId: string; // '17:00-18:00'
  slotLabel: string;
  userId: string;
  userName: string;
  userRoom: string;
  createdAt: string;
  status: 'active' | 'cancelled';
  wardenVerdict?: string;
  wardenVerdictSource?: 'gemma-open-weight' | 'gemma-builtin' | 'gemma-cloud';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 
    | 'BOOKING_CLAIM' 
    | 'BOOKING_CANCELLED' 
    | 'WARDEN_VERDICT' 
    | 'CONFLICT_RESOLVED'
    | 'MARKETPLACE_LISTING'
    | 'BID_PLACED'
    | 'AUCTION_WON'
    | 'AUCTION_PAID_PICKUP';
  userId: string;
  userName: string;
  resourceId?: ResourceId | string;
  resourceName: string;
  slotLabel?: string;
  date: string;
  details: string;
  creditsChanged: number; // -1 for claim, +1 for refund, 0 for note/market
  hash: string; // Cryptographic-like immutable sequence hash
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemma' | 'system';
  text: string;
  timestamp: string;
  source?: 'gemma-open-weight' | 'gemma-builtin' | 'gemma-cloud';
}

export interface ConflictSuggestion {
  id: string;
  title: string;
  description: string;
  resourceId: ResourceId;
  targetSlotId: string;
  alternativeSlotId: string;
  affectedUsers: string[];
  rationale: string;
  urgency: 'low' | 'medium' | 'high';
}

export type NotificationType = 
  | 'UPCOMING_BOOKING' 
  | 'NEW_WARDEN_NOTE' 
  | 'CONFLICT_RESOLUTION'
  | 'OUTBID_ALERT'
  | 'AUCTION_WON_ALERT'
  | 'AUCTION_ITEM_SOLD';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  userId: string; // Target student UID or 'ALL'
  bookingId?: string;
  resourceId?: ResourceId | string;
  slotLabel?: string;
  date?: string;
  read: boolean;
  dismissed: boolean;
  marketItemId?: string;
}

export type MarketplaceCategory = 
  | 'Snacks & Munchies'
  | 'Beverages'
  | 'Study & Stationery'
  | 'Tech & Gadgets'
  | 'Hostel Essentials'
  | 'Sports Gear';

export interface Bid {
  id: string;
  itemId: string;
  bidderId: string;
  bidderName: string;
  bidderRegDigits: string;
  bidderRoom: string;
  amount: number; // in INR
  timestamp: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  category: MarketplaceCategory;
  imageUrl: string;
  startingBid: number; // in INR
  currentBid: number; // in INR
  highestBidderId?: string;
  highestBidderName?: string;
  highestBidderRegDigits?: string;
  highestBidderRoom?: string;
  bids: Bid[];
  sellerId: string;
  sellerName: string;
  sellerRegDigits: string;
  sellerRoom: string; // e.g. "N-Block Room 304, South Wing"
  createdAt: string;
  endTime: string; // ISO string
  durationHours: number; // 1 to 48 hours (strict max 48 hrs)
  status: 'active' | 'ended' | 'completed';
  winnerId?: string;
  winnerName?: string;
  winnerRegDigits?: string;
  winningBid?: number;
  wardenInspectionNote?: string;
  wardenVerdictSource?: 'gemma-open-weight' | 'gemma-builtin' | 'gemma-cloud';
  cashPaid?: boolean;
}

export interface LiveHostelContext {
  currentUser: Resident;
  activeBookings: Booking[];
  resources: ResourceInfo[];
  sessionDate: string;
  marketplaceItems?: MarketplaceItem[];
}

