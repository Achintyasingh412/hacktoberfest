import React, { useState } from 'react';
import { Booking, Resident, ResourceId } from '../types';
import { STRICT_RESOURCES, TIME_SLOTS, TODAY_STR } from '../constants';
import { analyzeScheduleConflicts } from '../services/gemmaService';
import { appendAuditLog, getBookings, saveBookings, getResidents, saveResidents } from '../services/storageService';
import { triggerConflictResolutionNotification } from '../services/notificationService';
import { SpeakButton } from './SpeakButton';
import { Sparkles, ArrowRightLeft, Users, AlertCircle, CheckCircle, RefreshCw, Clock, ShieldCheck, Cpu } from 'lucide-react';

interface ConflictNegotiatorProps {
  currentUser: Resident;
  bookings: Booking[];
  onRefreshBookings: () => void;
  onNotificationTriggered?: () => void;
}

export const ConflictNegotiator: React.FC<ConflictNegotiatorProps> = ({
  currentUser,
  bookings,
  onRefreshBookings,
  onNotificationTriggered,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [source, setSource] = useState<'gemma-open-weight' | 'gemma-builtin'>('gemma-builtin');
  const [appliedProposal, setAppliedProposal] = useState<string | null>(null);

  // Compute live utilization metrics
  const activeBookings = bookings.filter((b) => b.status === 'active' && b.date === TODAY_STR);
  const totalAvailableSlots = STRICT_RESOURCES.length * TIME_SLOTS.length; // 6 * 6 = 36 slots
  const bookedSlotsCount = activeBookings.length;
  const utilizationRate = Math.round((bookedSlotsCount / totalAvailableSlots) * 100);

  // Find peak hours
  const slotCountMap: Record<string, number> = {};
  TIME_SLOTS.forEach((s) => (slotCountMap[s.id] = 0));
  activeBookings.forEach((b) => {
    slotCountMap[b.slotId] = (slotCountMap[b.slotId] || 0) + 1;
  });

  const peakSlot = TIME_SLOTS.reduce(
    (max, slot) => ((slotCountMap[slot.id] || 0) > (slotCountMap[max.id] || 0) ? slot : max),
    TIME_SLOTS[0]
  );

  const handleRunNegotiator = async () => {
    setIsAnalyzing(true);
    setAppliedProposal(null);

    // Prepare human-readable summary of bookings
    const summary = activeBookings
      .map((b) => {
        const res = STRICT_RESOURCES.find((r) => r.id === b.resourceId);
        return `- ${res?.name || b.resourceId} at ${b.slotLabel}: Booked by ${b.userName} (${b.userRoom})`;
      })
      .join('\n');

    try {
      const res = await analyzeScheduleConflicts(
        summary || 'No active bookings currently registered for today.'
      );
      setAnalysisResult(res.analysis);
      setSuggestions(res.suggestions);
      setSource(res.source);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Allow one-click conflict resolution simulation that registers a permanent audit record
  const handleApplySuggestion = (suggestion: string, idx: number) => {
    // Record resolution in permanent audit ledger
    appendAuditLog({
      action: 'CONFLICT_RESOLVED',
      userId: currentUser.uid,
      userName: currentUser.name,
      resourceId: 'badminton-a',
      resourceName: 'Badminton Court A',
      slotLabel: 'Evening Multi-Wing Session',
      date: TODAY_STR,
      details: `Conflict Negotiator Resolution: "${suggestion}". Endorsed by ${currentUser.name} (${currentUser.uid}).`,
      creditsChanged: 0,
    });

    // Dispatch conflict resolution alert to affected roommates
    triggerConflictResolutionNotification(['ALL'], suggestion, 'Badminton Court A');

    setAppliedProposal(suggestion);
    onRefreshBookings();
    if (onNotificationTriggered) {
      onNotificationTriggered();
    }
  };

  // Interactive Warden Directives Carousel State
  const [directiveIndex, setDirectiveIndex] = useState(0);
  const WARDEN_DIRECTIVES = [
    {
      title: 'Rule 1: Non-Marking Court Shoes',
      desc: 'Mandatory for Badminton Courts A & B. Black-soled running shoes leave scuffs on our newly varnished cedar floors and carry a ₹200 mess maintenance penalty.',
      category: 'Court Safety',
      icon: '👟',
    },
    {
      title: 'Rule 2: 15-Minute Grace & No-Show Forfeiture',
      desc: 'If a booked slot is unclaimed within 15 minutes of the hour, the slot auto-releases to waiting residents in the common lounge.',
      category: 'Slot Policy',
      icon: '⏰',
    },
    {
      title: 'Rule 3: Cash on Pickup & Roommate Privacy',
      desc: 'Marketplace auction winners collect items directly from the seller’s room. Exact cash is required; digital transfers must be verified on the spot.',
      category: 'Marketplace',
      icon: '💵',
    },
    {
      title: 'Rule 4: Evening Quiet Hours (11:00 PM onwards)',
      desc: 'Bluetooth speakers and table tennis matches must conclude by 11:00 PM. Courtyard floodlights automatically cut power at 11:15 PM.',
      category: 'Hostel Curfew',
      icon: '🌙',
    },
  ];

  const nextDirective = () => setDirectiveIndex((prev) => (prev + 1) % WARDEN_DIRECTIVES.length);
  const prevDirective = () => setDirectiveIndex((prev) => (prev - 1 + WARDEN_DIRECTIVES.length) % WARDEN_DIRECTIVES.length);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-[#874F41] border border-[#90AEAD] rounded-sm p-6 text-[#FBE9D0] shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#90AEAD]/30 pb-4 mb-4">
          <div>
            <div className="text-[11px] font-mono text-[#90AEAD] tracking-widest uppercase">
              LOCAL GEMMA AI AGENT · LAYER 3
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#FBE9D0] mt-0.5">
              Smart Court & Equipment Conflict Negotiator
            </h2>
            <p className="text-xs text-[#FBE9D0]/80 mt-1 max-w-2xl">
              When high contention strikes evening hours (7:00 PM – 10:00 PM), Gemma analyzes overlapping schedules to craft fair, win-win court sharing and staggered slot compromises.
            </p>
          </div>

          <button
            onClick={handleRunNegotiator}
            disabled={isAnalyzing}
            className="px-4 py-2.5 bg-[#E64833] hover:bg-[#d03d2a] text-[#FBE9D0] font-medium text-xs rounded-sm transition-all shadow-md flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Arbitrating Schedules...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Prompt Gemma to Negotiate Overlaps</span>
              </>
            )}
          </button>
        </div>

        {/* Live Slot Pressure Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#244855] border border-[#90AEAD]/40 p-3 rounded-sm">
            <span className="text-[10px] font-mono text-[#90AEAD] uppercase block">
              Active Evening Load
            </span>
            <div className="text-xl font-bold font-mono tabular-nums text-[#FBE9D0] mt-0.5">
              {bookedSlotsCount} / {totalAvailableSlots} <span className="text-xs text-[#90AEAD]">Slots Booked</span>
            </div>
            <div className="text-[11px] text-[#90AEAD] mt-1">
              Overall Utilization: <span className="text-[#FBE9D0] font-semibold">{utilizationRate}%</span>
            </div>
          </div>

          <div className="bg-[#244855] border border-[#90AEAD]/40 p-3 rounded-sm">
            <span className="text-[10px] font-mono text-[#90AEAD] uppercase block">
              Peak Bottleneck Window
            </span>
            <div className="text-base font-bold font-mono text-[#FBE9D0] mt-0.5 truncate">
              {peakSlot.label}
            </div>
            <div className="text-[11px] text-[#90AEAD] mt-1">
              Concentration: <span className="text-[#E64833] font-semibold">{slotCountMap[peakSlot.id] || 0} concurrent bookings</span>
            </div>
          </div>

          <div className="bg-[#244855] border border-[#90AEAD]/40 p-3 rounded-sm">
            <span className="text-[10px] font-mono text-[#90AEAD] uppercase block">
              Most Contested Equipment
            </span>
            <div className="text-base font-bold text-[#FBE9D0] mt-0.5 flex items-center gap-1.5">
              <span>🏸</span>
              <span>Badminton Court A</span>
            </div>
            <div className="text-[11px] text-[#90AEAD] mt-1">
              Status: <span className="text-amber-400 font-semibold">High Evening Demand</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Sliding Card Stack & Carousel of Warden Directives */}
      <div className="bg-[#874F41] border-2 border-[#90AEAD] rounded-2xl p-6 lg:p-7 text-[#FBE9D0] shadow-2xl relative overflow-hidden transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#90AEAD]/40 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{WARDEN_DIRECTIVES[directiveIndex].icon}</span>
            <div>
              <div className="text-[10px] font-mono tracking-widest text-[#90AEAD] uppercase">
                Interactive Warden Directives Carousel ({directiveIndex + 1} of {WARDEN_DIRECTIVES.length})
              </div>
              <h3 className="font-serif text-xl font-bold text-[#FBE9D0] mt-0.5">
                {WARDEN_DIRECTIVES[directiveIndex].title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevDirective}
              className="px-3 py-1.5 bg-[#244855] hover:bg-[#E64833] border border-[#90AEAD]/50 text-[#FBE9D0] text-xs font-mono rounded-xl transition-colors cursor-pointer shadow-sm active:scale-95"
              title="Previous Directive"
            >
              ← Prev
            </button>
            <span className="text-xs font-mono text-[#90AEAD] px-1">
              {directiveIndex + 1} / {WARDEN_DIRECTIVES.length}
            </span>
            <button
              onClick={nextDirective}
              className="px-3 py-1.5 bg-[#244855] hover:bg-[#E64833] border border-[#90AEAD]/50 text-[#FBE9D0] text-xs font-mono rounded-xl transition-colors cursor-pointer shadow-sm active:scale-95"
              title="Next Directive"
            >
              Next →
            </button>
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 py-1">
          <p className="text-sm text-[#FBE9D0]/90 leading-relaxed font-serif italic flex-1">
            "{WARDEN_DIRECTIVES[directiveIndex].desc}"
          </p>
          <SpeakButton
            id={`directive-${directiveIndex}`}
            text={WARDEN_DIRECTIVES[directiveIndex].desc}
            label="Speak Directive"
            size="xs"
            className="shrink-0"
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-[#90AEAD] pt-3 border-t border-[#90AEAD]/30">
          <span>Category: <strong className="text-[#FBE9D0]">{WARDEN_DIRECTIVES[directiveIndex].category}</strong></span>
          <span className="text-emerald-400 font-bold">Enforced by Gemma AI Arbitration</span>
        </div>
      </div>

      {/* Applied Proposal Feedback */}
      {appliedProposal && (
        <div className="p-4 bg-[#244855] border border-emerald-500 rounded-sm text-xs text-[#FBE9D0] shadow-md flex items-start gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-emerald-400 font-mono text-[11px] uppercase">
              Conflict Resolution Recorded in Immutable Ledger
            </div>
            <p className="mt-1 text-[#FBE9D0]">
              The following compromise was formally adopted: <em>"{appliedProposal}"</em>
            </p>
            <div className="text-[10px] text-[#90AEAD] mt-1">
              All participating roommates have been notified. Non-repudiable audit sequence updated.
            </div>
          </div>
        </div>
      )}

      {/* AI Negotiator Output */}
      {analysisResult ? (
        <div className="bg-[#874F41] border border-[#90AEAD] rounded-sm p-6 text-[#FBE9D0] shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#90AEAD]/30 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E64833]" />
              <h3 className="font-serif text-xl font-bold text-[#FBE9D0]">
                Gemma AI Arbitrated Recommendations
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[#90AEAD]">
                Model: <strong className="text-[#FBE9D0]">{source === 'gemma-open-weight' ? 'Google Gemma 2 9B (Open Weights)' : 'Google Gemma 2 9B (Built-In Engine)'}</strong>
              </span>
              <SpeakButton id="conflict-analysis-result" text={analysisResult} label="Speak Analysis" size="xs" />
            </div>
          </div>

          <div className="bg-[#244855] p-4 rounded-sm border-l-4 border-[#90AEAD] text-sm text-[#FBE9D0] font-serif leading-relaxed">
            {analysisResult}
          </div>

          {/* Actionable Proposals */}
          <div>
            <div className="text-xs font-mono text-[#90AEAD] uppercase tracking-wider mb-3">
              Actionable Compromise Directives for Roommates:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {suggestions.map((sugg, idx) => (
                <div
                  key={idx}
                  className="bg-[#244855] border border-[#90AEAD]/40 p-4 rounded-sm flex flex-col justify-between hover:border-[#90AEAD] transition-all"
                >
                  <div>
                    <div className="text-[10px] font-mono text-[#90AEAD] mb-1">
                      PROPOSAL #{idx + 1}
                    </div>
                    <div className="text-xs text-[#FBE9D0] font-medium leading-normal">
                      {sugg}
                    </div>
                  </div>

                  <button
                    onClick={() => handleApplySuggestion(sugg, idx)}
                    className="mt-4 w-full py-1.5 px-2 bg-[#874F41] hover:bg-[#E64833] border border-[#90AEAD]/40 text-[#FBE9D0] text-xs font-mono rounded-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Adopt Proposal</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#874F41] border border-[#90AEAD]/40 rounded-sm p-8 text-center text-[#FBE9D0]/70">
          <ArrowRightLeft className="w-8 h-8 text-[#90AEAD] mx-auto mb-2 opacity-60" />
          <p className="font-serif text-lg text-[#FBE9D0]">
            No Schedule Review Run Yet
          </p>
          <p className="text-xs text-[#FBE9D0]/70 max-w-md mx-auto mt-1">
            Click <strong>"Prompt Gemma to Negotiate Overlaps"</strong> above to trigger an intelligent review of live bookings and identify win-win schedule adjustments.
          </p>
        </div>
      )}
    </div>
  );
};
