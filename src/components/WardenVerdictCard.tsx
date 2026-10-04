import React from 'react';
import { Booking } from '../types';
import { STRICT_RESOURCES } from '../constants';
import { Scroll, Award, Sparkles, AlertCircle, RefreshCw, Feather } from 'lucide-react';
import { SpeakButton } from './SpeakButton';

interface WardenVerdictCardProps {
  latestBooking: Booking | null;
  onRefreshVerdict?: () => void;
  isGenerating?: boolean;
}

export const WardenVerdictCard: React.FC<WardenVerdictCardProps> = ({
  latestBooking,
  onRefreshVerdict,
  isGenerating = false,
}) => {
  if (!latestBooking) {
    return (
      <div className="bg-[#874F41] border border-[#90AEAD]/60 rounded-2xl p-6 text-[#FBE9D0] shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-2 text-xs font-mono text-[#90AEAD] uppercase tracking-wider mb-2">
          <Scroll className="w-4 h-4 text-[#90AEAD]" />
          <span>Office of the Hostel Warden · Disciplinary & Court Arbitration</span>
        </div>
        <div className="text-center py-6 text-sm text-[#FBE9D0]/70 font-serif italic">
          No recent slot claims recorded in this active session. Select an available court or equipment slot from the matrix below to trigger local Gemma warden arbitration.
        </div>
      </div>
    );
  }

  const resource = STRICT_RESOURCES.find((r) => r.id === latestBooking.resourceId);
  const resourceName = resource ? resource.name : latestBooking.resourceId;
  const isBuiltinFallback = latestBooking.wardenVerdictSource === 'gemma-builtin';

  return (
    <div className="bg-[#874F41] border-2 border-[#90AEAD] rounded-2xl p-6 lg:p-7 text-[#FBE9D0] shadow-2xl relative overflow-hidden transition-all">
      {/* Decorative vintage seal watermark */}
      <div className="absolute top-2 right-3 opacity-15 pointer-events-none select-none font-serif text-6xl text-[#FBE9D0]">
        OFFICIAL
      </div>

      {/* Top Banner / Stamp */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#90AEAD]/40 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#244855] border border-[#90AEAD]/50 flex items-center justify-center text-[#E64833] shadow-inner">
            <Feather className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-mono tracking-widest text-[#90AEAD] uppercase">
              OFFICIAL WARDEN ARBITRATION VERDICT
            </div>
            <div className="text-xs text-[#FBE9D0]/80 mt-0.5">
              Disciplinary Council · Dispatched for <span className="font-semibold text-[#FBE9D0]">{latestBooking.userName}</span> ({latestBooking.userRoom})
            </div>
          </div>
        </div>

        {/* Source Badge (Zero-pill text format) */}
        <div className="text-right text-[11px] font-mono">
          <div className="text-[#90AEAD]">
            Engine: <span className="text-[#FBE9D0] font-semibold">{latestBooking.wardenVerdictSource === 'gemma-open-weight' ? 'Google Gemma (Local Weights / Server)' : 'Google Gemma 2 9B (Built-In Engine)'}</span>
          </div>
          <div className="text-[10px] text-[#FBE9D0]/60">
            {latestBooking.slotLabel} · {latestBooking.date}
          </div>
        </div>
      </div>

      {/* Engine Info Banner */}
      <div className="mb-3 px-3.5 py-2 bg-[#244855]/90 border border-[#90AEAD]/40 rounded-xl text-[11px] font-mono text-[#FBE9D0] flex items-center justify-between shadow-inner">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#E64833]" />
          <span>Arbitrated via Google Gemma open-weight architecture</span>
        </span>
        <span className="text-[10px] text-[#90AEAD]">Open Weights · Privacy-First</span>
      </div>

      {/* Highlighted Verdict Quote */}
      <div className="bg-[#244855] border-l-4 border-[#E64833] p-4 lg:p-5 rounded-r-sm my-3 shadow-inner">
        {isGenerating ? (
          <div className="flex items-center gap-3 py-2 text-sm font-mono text-[#90AEAD]">
            <RefreshCw className="w-4 h-4 animate-spin text-[#E64833]" />
            <span>Summoning Warden Gemma for equipment review...</span>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-3">
              <p className="font-serif text-base lg:text-lg text-[#FBE9D0] leading-relaxed italic flex-1">
                "{latestBooking.wardenVerdict || 'Slot confirmed. Keep equipment safe and observe quiet hours.'}"
              </p>
              <SpeakButton
                id={`verdict-${latestBooking.id}`}
                text={latestBooking.wardenVerdict || 'Slot confirmed. Keep equipment safe and observe quiet hours.'}
                label="Speak Verdict"
                size="sm"
                className="shrink-0"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-[#90AEAD] pt-2 border-t border-[#90AEAD]/20">
              <span>— Mr. V.K. Aggarwal, Chief Hostel Warden (via Gemma AI)</span>
              <span>Allocated: {resourceName}</span>
            </div>
          </div>
        )}
      </div>

      {/* Equipment rules reminder footer */}
      {resource && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#244855]/60 border border-[#90AEAD]/30 p-3 rounded-xl">
          <div>
            <span className="text-[#90AEAD] font-mono block text-[10px] uppercase">Curfew & Equipment Rule:</span>
            <span className="text-[#FBE9D0]/90 text-[11px]">{resource.curfewRule}</span>
          </div>
          <div>
            <span className="text-[#90AEAD] font-mono block text-[10px] uppercase">Deposit & Penalty Clause:</span>
            <span className="text-[#FBE9D0]/90 text-[11px]">{resource.depositRule}</span>
          </div>
        </div>
      )}
    </div>
  );
};
