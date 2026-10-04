import { NotificationItem, Booking, ResourceId } from '../types';
import { STRICT_RESOURCES, TODAY_STR } from '../constants';

const STORAGE_KEY = 'hostel_nexus_notifications_v4';

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-system-welcome',
    type: 'CONFLICT_RESOLUTION',
    title: 'Welcome to Hostel Nexus',
    message: 'Hostel Nexus sports and equipment booking portal is active. Claim open slots from 5:00 PM to 11:00 PM with your 4 weekly credits.',
    timestamp: new Date().toISOString(),
    userId: 'ALL',
    resourceId: 'badminton-a',
    slotLabel: 'Evening Session',
    date: TODAY_STR,
    read: false,
    dismissed: false,
  },
];

export function getStoredNotifications(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load notifications', e);
  }
  saveStoredNotifications(INITIAL_NOTIFICATIONS);
  return INITIAL_NOTIFICATIONS;
}

export function saveStoredNotifications(notifs: NotificationItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs));
  } catch (e) {
    console.error('Failed to save notifications', e);
  }
}

export function getUserNotifications(userId: string, includeDismissed = false): NotificationItem[] {
  const all = getStoredNotifications();
  return all.filter((n) => {
    const isTarget = n.userId === userId || n.userId === 'ALL';
    if (!isTarget) return false;
    return includeDismissed ? true : !n.dismissed;
  });
}

export function addNotification(
  item: Omit<NotificationItem, 'id' | 'timestamp' | 'read' | 'dismissed'>
): NotificationItem {
  const all = getStoredNotifications();
  const newNotif: NotificationItem = {
    ...item,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    read: false,
    dismissed: false,
  };
  all.unshift(newNotif);
  saveStoredNotifications(all);
  return newNotif;
}

export function dismissNotification(id: string) {
  const all = getStoredNotifications();
  const notif = all.find((n) => n.id === id);
  if (notif) {
    notif.dismissed = true;
    saveStoredNotifications(all);
  }
}

export function dismissAllUserNotifications(userId: string) {
  const all = getStoredNotifications();
  all.forEach((n) => {
    if (n.userId === userId || n.userId === 'ALL') {
      n.dismissed = true;
    }
  });
  saveStoredNotifications(all);
}

export function markNotificationAsRead(id: string) {
  const all = getStoredNotifications();
  const notif = all.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
    saveStoredNotifications(all);
  }
}

export function markAllUserNotificationsAsRead(userId: string) {
  const all = getStoredNotifications();
  all.forEach((n) => {
    if (n.userId === userId || n.userId === 'ALL') {
      n.read = true;
    }
  });
  saveStoredNotifications(all);
}

/**
 * Checks for upcoming bookings (within 15 minutes or simulates reminder for active bookings)
 */
export function triggerUpcomingBookingReminder(booking: Booking): NotificationItem {
  const resource = STRICT_RESOURCES.find((r) => r.id === booking.resourceId);
  const resourceName = resource ? resource.name : booking.resourceId;

  return addNotification({
    type: 'UPCOMING_BOOKING',
    title: '15-Minute Pre-Slot Dispatch',
    message: `Reminder: Your reservation for ${resourceName} begins in approximately 15 minutes (${booking.slotLabel}). Ensure return before curfew!`,
    userId: booking.userId,
    bookingId: booking.id,
    resourceId: booking.resourceId,
    slotLabel: booking.slotLabel,
    date: booking.date,
  });
}

export function triggerWardenNoteNotification(
  booking: Booking,
  wardenVerdict: string
): NotificationItem {
  const resource = STRICT_RESOURCES.find((r) => r.id === booking.resourceId);
  const resourceName = resource ? resource.name : booking.resourceId;

  return addNotification({
    type: 'NEW_WARDEN_NOTE',
    title: `New Warden Note · ${resourceName}`,
    message: `Warden Gemma commented on your ${booking.slotLabel} reservation: "${wardenVerdict.slice(0, 110)}..."`,
    userId: booking.userId,
    bookingId: booking.id,
    resourceId: booking.resourceId,
    slotLabel: booking.slotLabel,
    date: booking.date,
  });
}

export function triggerConflictResolutionNotification(
  affectedUserIds: string[],
  proposalText: string,
  resourceName: string
): NotificationItem {
  return addNotification({
    type: 'CONFLICT_RESOLUTION',
    title: 'Conflict Resolution Adopted',
    message: `A court compromise was approved for ${resourceName}: "${proposalText.slice(0, 120)}". Check schedule for adjustments.`,
    userId: affectedUserIds.length === 1 ? affectedUserIds[0] : 'ALL',
  });
}
