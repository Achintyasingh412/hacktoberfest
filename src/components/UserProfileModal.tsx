import React, { useState } from 'react';
import { Booking, Resident } from '../types';
import { cancelBooking, getBookings } from '../services/storageService';
import { STRICT_RESOURCES } from '../constants';
import { X, User, Award, Calendar, RotateCcw, CheckCircle, AlertTriangle, ShieldCheck, LogOut } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Resident;
  onBookingCancelled: () => void;
  onSignOut?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onBookingCancelled,
  onSignOut,
}) => {
  const [cancelStatus, setCancelStatus] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const allBookings = getBookings();
  const userBookings = allBookings.filter((b) => b.userId === currentUser.id || b.userId === currentUser.uid);
  const activeBookings = userBookings.filter((b) => b.status === 'active');
  const pastBookings = userBookings.filter((b) => b.status === 'cancelled');

  const handleCancelBooking = (bookingId: string) => {
    setCancelStatus(null);
    setErrorStatus(null);

    const res = cancelBooking(bookingId, currentUser.id || currentUser.uid);
    if (res.success) {
      setCancelStatus('Booking successfully cancelled. 1 Credit automatically refunded to your quota.');
      onBookingCancelled();
    } else {
      setErrorStatus(res.error || 'Failed to cancel booking.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#874F41] border border-[#90AEAD] shadow-2xl rounded-2xl p-6 lg:p-8 text-[#FBE9D0] max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#FBE9D0]/70 hover:text-[#FBE9D0] transition-colors p-1 cursor-pointer"
          aria-label="Close resident profile"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Card Header */}
        <div className="border-b border-[#90AEAD]/40 pb-5 mb-5">
          <div className="text-[11px] font-mono tracking-widest text-[#90AEAD] uppercase">
            HOSTEL RESIDENT RECORD
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div>
              <h2 className="font-serif text-2xl lg:text-3xl font-bold text-[#FBE9D0]">
                {currentUser.name}
              </h2>
              <div className="text-xs text-[#90AEAD] font-mono mt-1">
                REG-{currentUser.regDigits || currentUser.uid.replace('REG-', '')} · {currentUser.room} · {currentUser.branch || 'Resident'}
              </div>
              {onSignOut && (
                <button
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-[#FBE9D0] bg-[#E64833] hover:bg-[#d03d2a] border border-[#FBE9D0]/30 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout of Session</span>
                </button>
              )}
            </div>

            {/* Quota Badge */}
            <div className="p-4 bg-[#244855] border border-[#90AEAD]/50 rounded-xl text-right shrink-0 shadow-inner">
              <div className="text-[10px] font-mono text-[#90AEAD] uppercase">Weekly Credit Quota</div>
              <div className="text-2xl font-bold font-mono text-[#FBE9D0] tabular-nums mt-0.5">
                {currentUser.credits} <span className="text-xs font-normal text-[#90AEAD]">/ 4 Credits</span>
              </div>
              <div className="text-[10px] text-[#FBE9D0]/70">
                {currentUser.credits > 0 ? `${currentUser.credits} slots remaining this week` : 'Quota exhausted (0 remaining)'}
              </div>
            </div>
          </div>
        </div>

        {/* Success / Error Banners */}
        {cancelStatus && (
          <div className="mb-4 p-3.5 bg-[#244855] border border-emerald-400 text-xs text-[#FBE9D0] rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{cancelStatus}</span>
          </div>
        )}

        {errorStatus && (
          <div className="mb-4 p-3.5 bg-[#E64833]/20 border border-[#E64833] text-xs text-[#FBE9D0] rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E64833] shrink-0" />
            <span>{errorStatus}</span>
          </div>
        )}

        {/* Active Reservations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-[#FBE9D0] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#90AEAD]" />
              <span>Active Slot Reservations ({activeBookings.length})</span>
            </h3>
            <span className="text-[11px] font-mono text-[#90AEAD]">
              1 Credit Refund on Cancellation (Capped at 4)
            </span>
          </div>

          {activeBookings.length === 0 ? (
            <div className="p-6 bg-[#244855]/60 border border-[#90AEAD]/30 rounded-xl text-center text-xs text-[#FBE9D0]/70 font-serif italic">
              You currently have no active slot reservations. Visit the Court & Slot Matrix to claim an open slot.
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeBookings.map((b) => {
                const res = STRICT_RESOURCES.find((r) => r.id === b.resourceId);
                return (
                  <div
                    key={b.id}
                    className="p-4 bg-[#244855] border border-[#90AEAD]/50 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[#90AEAD] transition-all shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{res?.icon || '🎾'}</span>
                        <div className="font-bold text-sm text-[#FBE9D0]">
                          {res?.name || b.resourceId}
                        </div>
                      </div>
                      <div className="text-xs text-[#90AEAD] font-mono mt-1">
                        {b.slotLabel} · {b.date}
                      </div>
                      {b.wardenVerdict && (
                        <div className="text-xs text-[#FBE9D0]/80 italic mt-1.5 font-serif border-l-2 border-[#E64833] pl-2 line-clamp-2">
                          "{b.wardenVerdict}"
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="px-3.5 py-1.5 bg-[#874F41] hover:bg-[#E64833] border border-[#90AEAD]/40 text-[#FBE9D0] text-xs font-mono rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Cancel & Refund 1 Cr</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Past / Cancelled History */}
          {pastBookings.length > 0 && (
            <div className="pt-4 border-t border-[#90AEAD]/30 mt-6">
              <h4 className="text-xs font-mono text-[#90AEAD] uppercase tracking-wider mb-2">
                Cancelled & Refunded History
              </h4>
              <div className="space-y-1.5">
                {pastBookings.map((pb) => (
                  <div
                    key={pb.id}
                    className="p-2.5 bg-[#244855]/40 border border-[#90AEAD]/20 rounded-lg flex items-center justify-between text-xs text-[#FBE9D0]/60 font-mono"
                  >
                    <span>
                      {pb.resourceId} · {pb.slotLabel} ({pb.date})
                    </span>
                    <span className="text-amber-400 font-semibold">Cancelled · +1 Cr Refunded</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
