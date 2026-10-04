import React, { useState } from 'react';
import { NotificationItem, Resident, Booking } from '../types';
import {
  dismissNotification,
  dismissAllUserNotifications,
  markNotificationAsRead,
  markAllUserNotificationsAsRead,
  triggerUpcomingBookingReminder,
} from '../services/notificationService';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Clock,
  Scroll,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface NotificationCenterProps {
  currentUser: Resident;
  notifications: NotificationItem[];
  onNotificationsChanged: () => void;
  onNavigateToBooking?: (bookingId?: string) => void;
  userBookings: Booking[];
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUser,
  notifications,
  onNotificationsChanged,
  onNavigateToBooking,
  userBookings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifs = notifications.filter((n) => {
    if (filterType === 'UPCOMING') return n.type === 'UPCOMING_BOOKING';
    if (filterType === 'WARDEN') return n.type === 'NEW_WARDEN_NOTE';
    if (filterType === 'CONFLICT') return n.type === 'CONFLICT_RESOLUTION';
    return true;
  });

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dismissNotification(id);
    onNotificationsChanged();
  };

  const handleDismissAll = () => {
    dismissAllUserNotifications(currentUser.uid);
    onNotificationsChanged();
  };

  const handleMarkAllRead = () => {
    markAllUserNotificationsAsRead(currentUser.uid);
    onNotificationsChanged();
  };

  const handleClickItem = (n: NotificationItem) => {
    markNotificationAsRead(n.id);
    onNotificationsChanged();
    if (n.bookingId && onNavigateToBooking) {
      onNavigateToBooking(n.bookingId);
      setIsOpen(false);
    }
  };

  const handleSimulateUpcoming = () => {
    const active = userBookings.find((b) => b.status === 'active') || {
      id: `sim-book-${Date.now()}`,
      resourceId: 'badminton-a',
      date: new Date().toISOString().split('T')[0],
      slotId: '18:00-19:00',
      slotLabel: '6:00 PM - 7:00 PM',
      userId: currentUser.uid,
      userName: currentUser.name,
      userRoom: currentUser.room,
      createdAt: new Date().toISOString(),
      status: 'active' as const,
    };

    triggerUpcomingBookingReminder(active);
    onNotificationsChanged();
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-sm bg-[#874F41]/80 hover:bg-[#874F41] border border-[#90AEAD]/40 text-[#FBE9D0] transition-colors flex items-center justify-center"
        title="Hostel Dispatch Alerts & Upcoming Booking Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-[#FBE9D0]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-[#E64833] text-[#FBE9D0] text-[10px] font-bold font-mono rounded-full border border-[#244855] animate-pulse tabular-nums">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out / Dropdown Notification Center */}
      {isOpen && (
        <>
          {/* Backdrop click to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#874F41] border-2 border-[#90AEAD] shadow-2xl rounded-sm z-50 overflow-hidden text-[#FBE9D0] animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="p-3.5 bg-[#244855] border-b border-[#90AEAD]/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#E64833]" />
                <span className="font-serif font-bold text-sm tracking-wide text-[#FBE9D0]">
                  Hostel Nexus Dispatches
                </span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono text-[#90AEAD] bg-[#874F41] px-1.5 py-0.5 rounded-sm">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-[#90AEAD] hover:text-[#FBE9D0] transition-colors p-1"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions & 15-Minute Simulator */}
            <div className="px-3 py-2 bg-[#244855]/90 border-b border-[#90AEAD]/30 flex items-center justify-between text-[11px] font-mono">
              <button
                onClick={handleSimulateUpcoming}
                className="text-[#90AEAD] hover:text-emerald-300 transition-colors flex items-center gap-1 underline underline-offset-2"
                title="Simulate an upcoming 15-minute booking reminder alert"
              >
                <Clock className="w-3 h-3" />
                <span>Test 15-Min Reminder</span>
              </button>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[#90AEAD] hover:text-[#FBE9D0] transition-colors"
                  >
                    Mark read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleDismissAll}
                    className="text-[#90AEAD] hover:text-[#E64833] transition-colors"
                  >
                    Dismiss all
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-3 py-1.5 bg-[#874F41] border-b border-[#90AEAD]/30 flex items-center gap-1 overflow-x-auto text-[10px] font-mono">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'UPCOMING', label: '15-Min Alert' },
                { id: 'WARDEN', label: 'Warden Notes' },
                { id: 'CONFLICT', label: 'Resolutions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2 py-0.5 rounded-sm transition-colors whitespace-nowrap ${
                    filterType === tab.id
                      ? 'bg-[#E64833] text-[#FBE9D0] font-semibold'
                      : 'text-[#90AEAD] hover:text-[#FBE9D0] bg-[#244855]/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-[#90AEAD]/20 bg-[#244855]/40">
              {filteredNotifs.length === 0 ? (
                <div className="py-8 px-4 text-center text-xs text-[#FBE9D0]/60 font-serif italic">
                  No active dispatches. All notifications have been cleared or addressed.
                </div>
              ) : (
                filteredNotifs.map((n) => {
                  const isUpcoming = n.type === 'UPCOMING_BOOKING';
                  const isWarden = n.type === 'NEW_WARDEN_NOTE';
                  const isConflict = n.type === 'CONFLICT_RESOLUTION';

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClickItem(n)}
                      className={`p-3 transition-colors cursor-pointer group flex items-start justify-between gap-2.5 ${
                        n.read
                          ? 'bg-transparent opacity-85 hover:opacity-100 hover:bg-[#244855]/60'
                          : 'bg-[#244855]/90 border-l-2 border-[#E64833] hover:bg-[#244855]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-sm shrink-0 flex items-center justify-center mt-0.5 ${
                            isUpcoming
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isWarden
                              ? 'bg-[#E64833]/20 text-[#E64833]'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {isUpcoming ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : isWarden ? (
                            <Scroll className="w-3.5 h-3.5" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-[#FBE9D0] leading-tight">
                              {n.title}
                            </span>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#E64833]" />
                            )}
                          </div>

                          <p className="text-[11px] text-[#FBE9D0]/80 mt-1 leading-snug line-clamp-3 font-sans">
                            {n.message}
                          </p>

                          <div className="text-[9px] font-mono text-[#90AEAD] mt-1.5 flex items-center gap-2">
                            <span>
                              {new Date(n.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {n.slotLabel && <span>· {n.slotLabel}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Dismiss Action */}
                      <button
                        onClick={(e) => handleDismiss(n.id, e)}
                        className="text-[#90AEAD] hover:text-[#E64833] p-1 shrink-0 rounded-sm opacity-60 group-hover:opacity-100 transition-opacity"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-[#244855] border-t border-[#90AEAD]/30 text-[10px] font-mono text-[#90AEAD] flex items-center justify-between">
              <span>Automatic 15-min countdown & warden alerts</span>
              <span>Dismissible · Zero UI clutter</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
