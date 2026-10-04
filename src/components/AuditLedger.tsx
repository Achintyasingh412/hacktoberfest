import React, { useState } from 'react';
import { AuditLogEntry } from '../types';
import { getAuditLogs } from '../services/storageService';
import { STRICT_RESOURCES } from '../constants';
import { ShieldCheck, Search, Filter, Lock, CheckCircle2, History, AlertCircle } from 'lucide-react';

interface AuditLedgerProps {
  onRefresh?: () => void;
}

export const AuditLedger: React.FC<AuditLedgerProps> = () => {
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const logs = getAuditLogs();

  const filteredLogs = logs.filter((log) => {
    if (filterAction !== 'ALL' && log.action !== filterAction) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${log.userName} ${log.userId} ${log.resourceName} ${log.details} ${log.slotLabel} ${log.hash}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const getActionBadge = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'BOOKING_CLAIM':
        return (
          <span className="font-mono text-[10px] text-emerald-400 font-semibold">
            CLAIM [-1 CR]
          </span>
        );
      case 'BOOKING_CANCELLED':
        return (
          <span className="font-mono text-[10px] text-amber-400 font-semibold">
            CANCEL [+1 CR REFUND]
          </span>
        );
      case 'WARDEN_VERDICT':
        return (
          <span className="font-mono text-[10px] text-[#E64833] font-semibold">
            WARDEN VERDICT
          </span>
        );
      case 'CONFLICT_RESOLVED':
        return (
          <span className="font-mono text-[10px] text-[#90AEAD] font-semibold">
            CONFLICT RESOLVED
          </span>
        );
      case 'MARKETPLACE_LISTING':
        return (
          <span className="font-mono text-[10px] text-cyan-300 font-semibold">
            MARKET LISTING
          </span>
        );
      case 'BID_PLACED':
        return (
          <span className="font-mono text-[10px] text-amber-300 font-semibold">
            BID PLACED
          </span>
        );
      case 'AUCTION_WON':
        return (
          <span className="font-mono text-[10px] text-emerald-400 font-semibold">
            AUCTION WON
          </span>
        );
      case 'AUCTION_PAID_PICKUP':
        return (
          <span className="font-mono text-[10px] text-emerald-300 font-semibold">
            CASH ON PICKUP
          </span>
        );
      default:
        return <span className="font-mono text-[10px] text-[#90AEAD]">{action}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#874F41] border border-[#90AEAD] rounded-sm p-6 text-[#FBE9D0] shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#90AEAD]/30 pb-4 mb-4">
          <div>
            <div className="text-[11px] font-mono text-[#90AEAD] tracking-widest uppercase flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#E64833]" />
              <span>NON-REPUDIABLE IMMUTABLE AUDIT TRAIL</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#FBE9D0] mt-0.5">
              Permanent Transparent Hostel Ledger
            </h2>
            <p className="text-xs text-[#FBE9D0]/80 mt-1 max-w-2xl">
              By hostel constitutional charter, all booking claims, quota refund events, cancellations, and AI Warden arbitration verdicts are permanently etched into this shared log. No participant or administrator possesses the authority to delete or clear ledger entries.
            </p>
          </div>

          <div className="p-3 bg-[#244855] border border-[#90AEAD]/40 rounded-sm text-right font-mono text-xs shrink-0">
            <div className="text-[#90AEAD] text-[10px] uppercase">Ledger Integrity</div>
            <div className="text-emerald-400 font-bold flex items-center justify-end gap-1 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Cryptographically Chained</span>
            </div>
            <div className="text-[10px] text-[#FBE9D0]/60 tabular-nums">
              Total Records: {logs.length}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Action Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'BOOKING_CLAIM', 'BOOKING_CANCELLED', 'WARDEN_VERDICT', 'MARKETPLACE_LISTING', 'BID_PLACED', 'AUCTION_WON', 'CONFLICT_RESOLVED'].map((act) => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`px-3 py-1 text-xs font-mono rounded-sm transition-all whitespace-nowrap ${
                  filterAction === act
                    ? 'bg-[#E64833] text-[#FBE9D0] font-semibold shadow-sm'
                    : 'bg-[#244855] text-[#90AEAD] hover:text-[#FBE9D0] border border-[#90AEAD]/30'
                }`}
              >
                {act.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#90AEAD]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search UID, student name, or court..."
              className="w-full pl-9 pr-3 py-1.5 bg-[#244855] border border-[#90AEAD]/60 rounded-sm text-xs font-mono text-[#FBE9D0] placeholder-[#FBE9D0]/50 focus:outline-none focus:border-[#E64833]"
            />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[#874F41] border border-[#90AEAD] rounded-sm shadow-xl overflow-hidden">
        <div className="p-4 border-b border-[#90AEAD]/30 flex items-center justify-between">
          <span className="text-xs font-mono text-[#90AEAD] uppercase tracking-wider">
            Showing {filteredLogs.length} of {logs.length} Permanent Ledger Entries
          </span>
          <span className="text-[11px] font-mono text-[#FBE9D0]/60">
            Immutable Sequence: Hash Linked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#90AEAD]/40 text-[10px] font-mono text-[#90AEAD] bg-[#244855]/60 uppercase tracking-wider">
                <th className="py-2.5 px-3">Sequence Hash</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action Event</th>
                <th className="py-2.5 px-3">Resident / Room</th>
                <th className="py-2.5 px-3">Amenity & Slot</th>
                <th className="py-2.5 px-4">Permanent Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#90AEAD]/20 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#FBE9D0]/60 italic font-serif">
                    No matching audit records found in the hostel archive.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#244855]/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-[#90AEAD] whitespace-nowrap">
                      {entry.hash}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#FBE9D0]/80 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="text-[10px] text-[#90AEAD] block">
                        {entry.date}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getActionBadge(entry.action)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium text-[#FBE9D0]">{entry.userName}</div>
                      <div className="font-mono text-[10px] text-[#90AEAD]">{entry.userId}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-[#FBE9D0]">{entry.resourceName}</div>
                      <div className="font-mono text-[10px] text-[#90AEAD]">{entry.slotLabel}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#FBE9D0]/90 max-w-md">
                      {entry.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
