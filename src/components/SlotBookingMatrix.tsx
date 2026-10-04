import React, { useState } from 'react';
import { Booking, Resident, ResourceId, TimeSlot } from '../types';
import { STRICT_RESOURCES, TIME_SLOTS, TODAY_STR } from '../constants';
import { claimSlot, updateBookingVerdict } from '../services/storageService';
import { generateWardenVerdict } from '../services/gemmaService';
import { triggerWardenNoteNotification, triggerUpcomingBookingReminder } from '../services/notificationService';
import { Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, Sparkles, Filter, Info } from 'lucide-react';

interface SlotBookingMatrixProps {
  currentUser: Resident;
  bookings: Booking[];
  onBookingCreated: (booking: Booking) => void;
  onSelectBookingForVerdict: (booking: Booking) => void;
  selectedBookingId?: string;
  onNotificationTriggered?: () => void;
}

export const SlotBookingMatrix: React.FC<SlotBookingMatrixProps> = ({
  currentUser,
  bookings,
  onBookingCreated,
  onSelectBookingForVerdict,
  selectedBookingId,
  onNotificationTriggered,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_STR);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [claimingSlotKey, setClaimingSlotKey] = useState<string | null>(null);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Generate tomorrow and day after options
  const dateOptions = [
    { label: 'Today (Evening Session)', value: TODAY_STR },
    {
      label: 'Tomorrow',
      value: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    },
    {
      label: 'Day After Tomorrow',
      value: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    },
  ];

  const categories = ['All', 'Table Tennis', 'Badminton', 'Courts', 'Audio'];

  const filteredResources = STRICT_RESOURCES.filter((res) => {
    if (selectedCategory === 'All') return true;
    return res.category === selectedCategory;
  });

  const handleClaim = async (resourceId: ResourceId, slot: TimeSlot) => {
    setQuotaError(null);
    setSuccessToast(null);

    // Check credits
    if (currentUser.credits <= 0) {
      setQuotaError(
        `Weekly credit quota exhausted (0/4 Credits remaining). Cancel an existing booking in your profile or wait for the weekly reset.`
      );
      return;
    }

    const slotKey = `${resourceId}_${selectedDate}_${slot.id}`;
    setClaimingSlotKey(slotKey);

    const resource = STRICT_RESOURCES.find((r) => r.id === resourceId);
    const resourceName = resource ? resource.name : resourceId;

    // 1. Claim slot locally
    const result = claimSlot({
      resourceId,
      date: selectedDate,
      slotId: slot.id,
      slotLabel: slot.label,
      userId: currentUser.uid,
    });

    if (!result.success || !result.booking) {
      setQuotaError(result.error || 'Failed to claim slot.');
      setClaimingSlotKey(null);
      return;
    }

    const newBooking = result.booking;
    onBookingCreated(newBooking);
    onSelectBookingForVerdict(newBooking);

    setSuccessToast(
      `Slot reserved for ${resourceName} (${slot.label}). 1 credit deducted. Consulting Warden Gemma for safety verdict...`
    );

    // 2. Automated "Hostel Warden" Arbitration via local Gemma (async)
    try {
      const verdictRes = await generateWardenVerdict({
        userName: currentUser.name,
        userRoom: currentUser.room,
        resourceName,
        slotLabel: slot.label,
        date: selectedDate,
      });

      updateBookingVerdict(newBooking.id, verdictRes.text, verdictRes.source);
      newBooking.wardenVerdict = verdictRes.text;
      newBooking.wardenVerdictSource = verdictRes.source;
      onBookingCreated(newBooking); // refresh parent state

      // Trigger notification for newly generated AI Warden note!
      triggerWardenNoteNotification(newBooking, verdictRes.text);

      // Trigger upcoming reminder if session is today
      if (selectedDate === TODAY_STR) {
        triggerUpcomingBookingReminder(newBooking);
      }

      if (onNotificationTriggered) {
        onNotificationTriggered();
      }
    } catch (e) {
      console.error('Warden arbitration error:', e);
    } finally {
      setClaimingSlotKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Date Bar */}
      <div className="bg-[#874F41] border border-[#90AEAD] rounded-2xl p-5 text-[#FBE9D0] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xl">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#90AEAD] shrink-0" />
          <span className="text-xs font-mono text-[#90AEAD] uppercase tracking-wider">Session Date:</span>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#244855] border border-[#90AEAD]/60 rounded-xl px-3.5 py-1.5 text-xs font-mono text-[#FBE9D0] focus:outline-none focus:border-[#E64833] cursor-pointer"
          >
            {dateOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.value})
              </option>
            ))}
          </select>
        </div>

        {/* Category Filters (Segmented Controls) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-[#90AEAD] shrink-0 mr-1 hidden sm:inline" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#E64833] text-[#FBE9D0] shadow-sm font-semibold'
                  : 'bg-[#244855]/70 text-[#FBE9D0]/70 hover:text-[#FBE9D0] border border-[#90AEAD]/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Legend indicator */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-sm" />
            <span className="text-[#90AEAD]">Open Slot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E64833] inline-block shadow-sm" />
            <span className="text-[#90AEAD]">Booked</span>
          </div>
        </div>
      </div>

      {/* Quota Exhausted Warning Banner */}
      {currentUser.credits <= 0 && (
        <div className="p-3.5 bg-[#E64833]/20 border border-[#E64833] rounded-xl text-xs text-[#FBE9D0] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#E64833] shrink-0" />
            <span>
              <strong>Weekly Credit Quota Exhausted:</strong> You have 0/4 credits remaining. You cannot book any new slots until you cancel an existing booking or reset occurs.
            </span>
          </div>
          <span className="font-mono text-[#90AEAD] text-[11px]">4 Max Quota</span>
        </div>
      )}

      {/* Error / Toast Feedback */}
      {quotaError && (
        <div className="p-3.5 bg-[#E64833]/25 border border-[#E64833] rounded-xl text-xs text-[#FBE9D0] flex items-center gap-2 shadow-sm">
          <XCircle className="w-4 h-4 text-[#E64833] shrink-0" />
          <span>{quotaError}</span>
        </div>
      )}

      {successToast && (
        <div className="p-3.5 bg-[#244855] border border-[#90AEAD] rounded-xl text-xs text-[#FBE9D0] flex items-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Live Booking Visual Matrix */}
      <div className="bg-[#874F41] border border-[#90AEAD] rounded-2xl p-5 lg:p-7 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between mb-4 border-b border-[#90AEAD]/30 pb-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#FBE9D0]">
              5:00 PM – 11:00 PM Hourly Court & Resource Grid
            </h3>
            <p className="text-xs text-[#FBE9D0]/70 mt-0.5">
              Live slot availability for shared hostel amenities. Strictly 60-minute blocks. 1 credit deducted per slot.
            </p>
          </div>
          <div className="text-xs font-mono text-[#90AEAD] text-right hidden sm:block">
            <span>Quota Available: </span>
            <span className="font-bold text-[#FBE9D0]">{currentUser.credits}/4 Credits</span>
          </div>
        </div>

        {/* Desktop / Tablet Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[#90AEAD]/40 text-[11px] font-mono text-[#90AEAD]">
                <th className="py-2.5 px-3 w-56 font-semibold uppercase tracking-wider">
                  Resource & Equipment
                </th>
                {TIME_SLOTS.map((slot) => (
                  <th key={slot.id} className="py-2.5 px-2 text-center font-semibold">
                    <span className="block text-[#FBE9D0]">{slot.label.split(' - ')[0]}</span>
                    <span className="text-[10px] text-[#90AEAD] block">to {slot.label.split(' - ')[1]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#90AEAD]/20">
              {filteredResources.map((resource) => (
                <tr key={resource.id} className="hover:bg-[#244855]/20 transition-colors">
                  {/* Resource Column */}
                  <td className="py-3 px-3 align-top">
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl shrink-0 p-1 rounded-sm bg-[#244855] border border-[#90AEAD]/30">
                        {resource.icon}
                      </span>
                      <div>
                        <div className="font-medium text-xs text-[#FBE9D0] leading-snug">
                          {resource.name}
                        </div>
                        <div className="text-[10px] font-mono text-[#90AEAD] mt-0.5">
                          {resource.category}
                        </div>
                        <div className="text-[10px] text-[#FBE9D0]/60 line-clamp-1 mt-0.5" title={resource.curfewRule}>
                          {resource.curfewRule}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Hourly Slot Columns (5 PM to 11 PM) */}
                  {TIME_SLOTS.map((slot) => {
                    const slotKey = `${resource.id}_${selectedDate}_${slot.id}`;
                    const booking = bookings.find(
                      (b) =>
                        b.resourceId === resource.id &&
                        b.date === selectedDate &&
                        b.slotId === slot.id &&
                        b.status === 'active'
                    );

                    const isBooked = !!booking;
                    const isBookedByCurrentUser = booking?.userId === currentUser.id || booking?.userId === currentUser.uid;
                    const isClaiming = claimingSlotKey === slotKey;
                    const isSelected = selectedBookingId === booking?.id;

                    return (
                      <td key={slot.id} className="py-2 px-1.5 text-center align-middle">
                        {isBooked ? (
                          <div
                            onClick={() => onSelectBookingForVerdict(booking)}
                            className={`p-2 rounded-sm border cursor-pointer transition-all text-left group ${
                              isSelected
                                ? 'bg-[#244855] border-[#E64833] ring-1 ring-[#E64833]'
                                : isBookedByCurrentUser
                                ? 'bg-[#244855]/90 border-emerald-500/80 hover:border-emerald-400'
                                : 'bg-[#244855]/70 border-[#E64833]/60 hover:border-[#E64833]'
                            }`}
                            title={`Booked by ${booking.userName} (${booking.userRoom}). Click to view AI Warden verdict.`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono text-[#90AEAD]">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#E64833]" />
                                <span>Booked</span>
                              </span>
                              <span className="text-[9px] text-[#FBE9D0]/80 font-mono">
                                {isBookedByCurrentUser ? 'YOU' : booking.userId}
                              </span>
                            </div>

                            <div className="font-semibold text-[11px] text-[#FBE9D0] truncate mt-0.5">
                              {booking.userName.split(' ')[0]}
                            </div>

                            <div className="text-[9px] text-[#90AEAD] truncate">
                              {booking.userRoom}
                            </div>

                            {booking.wardenVerdict && (
                              <div className="text-[9px] text-[#90AEAD] flex items-center gap-1 mt-1 opacity-80 group-hover:opacity-100">
                                <Sparkles className="w-2.5 h-2.5 text-[#E64833]" />
                                <span className="truncate">Verdict log</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleClaim(resource.id, slot)}
                            disabled={isClaiming || currentUser.credits <= 0}
                            className={`w-full py-2.5 px-2 rounded-sm border text-xs font-medium transition-all flex flex-col items-center justify-center gap-0.5 ${
                              currentUser.credits <= 0
                                ? 'bg-[#244855]/40 border-[#90AEAD]/20 text-[#FBE9D0]/40 cursor-not-allowed'
                                : 'bg-[#244855] hover:bg-[#E64833] border-[#90AEAD]/50 hover:border-[#E64833] text-[#FBE9D0] shadow-sm'
                            }`}
                            title={
                              currentUser.credits <= 0
                                ? 'Weekly credit limit reached'
                                : `Click to reserve ${slot.label} (-1 credit)`
                            }
                          >
                            <span className="flex items-center gap-1 text-[11px] font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>{isClaiming ? 'Claiming...' : 'Claim Slot'}</span>
                            </span>
                            <span className="text-[9px] text-[#90AEAD] group-hover:text-[#FBE9D0] font-mono">
                              -1 Credit
                            </span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
