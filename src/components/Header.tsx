import React from 'react';
import { Resident, NotificationItem, Booking } from '../types';
import { GemmaStatus } from '../services/gemmaService';
import { NotificationCenter } from './NotificationCenter';
import { Shield, Sparkles, Terminal, User, Clock, Layers, Cpu, LogOut, ShoppingBag } from 'lucide-react';

interface HeaderProps {
  currentTab: 'matrix' | 'conflict' | 'companion' | 'marketplace' | 'audit';
  onSelectTab: (tab: 'matrix' | 'conflict' | 'companion' | 'marketplace' | 'audit') => void;
  currentUser: Resident;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
  onSignOut?: () => void;
  gemmaStatus: GemmaStatus;
  onOpenGemmaModal: () => void;
  notifications: NotificationItem[];
  onNotificationsChanged: () => void;
  onNavigateToBooking?: (bookingId?: string) => void;
  userBookings: Booking[];
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onOpenProfile,
  onOpenLogin,
  onSignOut,
  gemmaStatus,
  onOpenGemmaModal,
  notifications,
  onNotificationsChanged,
  onNavigateToBooking,
  userBookings,
}) => {
  return (
    <header className="border-b border-[#90AEAD]/30 bg-[#244855]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-sm bg-[#874F41] border border-[#90AEAD]/40 flex items-center justify-center overflow-hidden shadow-inner">
            <img
              src="/src/assets/images/hostel_nexus_crest_1791050425753.jpg"
              alt="Hostel Nexus Crest"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // graceful svg fallback
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectTab('matrix');
              }}
              className="font-serif text-xl lg:text-2xl font-bold tracking-tight text-[#FBE9D0] hover:text-[#E64833] transition-colors leading-none block"
            >
              Hostel Nexus
            </a>
            <span className="text-[11px] tracking-wider text-[#90AEAD] uppercase font-mono">
              Local AI Resource & Court Negotiator
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (single-line text controls) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => onSelectTab('matrix')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'matrix'
                ? 'bg-[#E64833] text-[#FBE9D0] shadow-md font-bold border border-[#FBE9D0]/20'
                : 'text-[#FBE9D0]/80 hover:text-[#FBE9D0] hover:bg-[#874F41]/60'
            }`}
          >
            Court & Slot Matrix
          </button>

          <button
            onClick={() => onSelectTab('conflict')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'conflict'
                ? 'bg-[#E64833] text-[#FBE9D0] shadow-md font-bold border border-[#FBE9D0]/20'
                : 'text-[#FBE9D0]/80 hover:text-[#FBE9D0] hover:bg-[#874F41]/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#90AEAD]" />
            Conflict Negotiator
          </button>

          <button
            onClick={() => onSelectTab('companion')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'companion'
                ? 'bg-[#E64833] text-[#FBE9D0] shadow-md font-bold border border-[#FBE9D0]/20'
                : 'text-[#FBE9D0]/80 hover:text-[#FBE9D0] hover:bg-[#874F41]/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#90AEAD]" />
            Warden & Roommate AI
          </button>

          <button
            onClick={() => onSelectTab('marketplace')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'marketplace'
                ? 'bg-[#E64833] text-[#FBE9D0] shadow-md font-bold border border-[#FBE9D0]/20'
                : 'text-[#FBE9D0]/80 hover:text-[#FBE9D0] hover:bg-[#874F41]/60'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#90AEAD]" />
            Hostel Mart & Bidding
          </button>

          <button
            onClick={() => onSelectTab('audit')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              currentTab === 'audit'
                ? 'bg-[#E64833] text-[#FBE9D0] shadow-md font-bold border border-[#FBE9D0]/20'
                : 'text-[#FBE9D0]/80 hover:text-[#FBE9D0] hover:bg-[#874F41]/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#90AEAD]" />
            Permanent Audit Ledger
          </button>
        </nav>

        {/* Zone 3: Primary Actions (Notification bell + Ollama status + User Credit info & Profile + Prominent Logout) */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Notification Center */}
          <NotificationCenter
            currentUser={currentUser}
            notifications={notifications}
            onNotificationsChanged={onNotificationsChanged}
            onNavigateToBooking={onNavigateToBooking}
            userBookings={userBookings}
          />

          {/* Google Gemma Architecture Badge */}
          <button
            onClick={onOpenGemmaModal}
            title="Inspect Google Gemma Model Runtime & Serving Provider"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono rounded-xl border border-[#90AEAD]/40 bg-[#874F41]/60 text-[#FBE9D0] hover:bg-[#874F41] transition-colors cursor-pointer shadow-sm"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                gemmaStatus === 'online' || gemmaStatus === 'local-active'
                  ? 'bg-emerald-400 animate-pulse'
                  : gemmaStatus === 'checking'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-amber-400'
              }`}
            />
            <span className="hidden sm:inline font-semibold">
              {gemmaStatus === 'checking'
                ? 'Gemma...'
                : gemmaStatus === 'online'
                ? 'Gemma Cloud'
                : gemmaStatus === 'local-active'
                ? 'Gemma Local'
                : 'Gemma · Demo Mode'}
            </span>
          </button>

          {/* User Quota & Profile trigger */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#874F41] border border-[#90AEAD]/50 hover:border-[#FBE9D0] transition-all text-left group cursor-pointer shadow-sm hover:shadow-md"
            title="View Student Profile & Active Bookings"
          >
            <div className="w-7 h-7 rounded-lg bg-[#244855] text-[#90AEAD] border border-[#90AEAD]/50 flex items-center justify-center text-[10px] font-bold font-mono">
              {currentUser.regDigits || currentUser.uid.slice(-3)}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-[#FBE9D0] group-hover:text-[#FBE9D0] leading-none">
                {currentUser.name}
              </div>
              <div className="text-[10px] font-mono tabular-nums text-[#90AEAD] mt-0.5">
                REG-{currentUser.regDigits || currentUser.uid.slice(-3)} · <span className="font-bold text-[#FBE9D0]">{currentUser.credits}/4 Cr</span>
              </div>
            </div>
          </button>

          {/* PROMINENT LOGOUT BUTTON */}
          <button
            onClick={onSignOut || onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#FBE9D0] bg-[#E64833] hover:bg-[#d03d2a] border border-[#FBE9D0]/30 hover:border-[#FBE9D0] rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap cursor-pointer"
            title="Logout active student session and return to Login Gate"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="font-semibold tracking-wide">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar row */}
      <div className="flex md:hidden items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-[#90AEAD]/20 overflow-x-auto">
        <button
          onClick={() => onSelectTab('matrix')}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
            currentTab === 'matrix' ? 'bg-[#E64833] text-[#FBE9D0] font-bold' : 'text-[#FBE9D0]/70'
          }`}
        >
          Matrix
        </button>
        <button
          onClick={() => onSelectTab('conflict')}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
            currentTab === 'conflict' ? 'bg-[#E64833] text-[#FBE9D0] font-bold' : 'text-[#FBE9D0]/70'
          }`}
        >
          Negotiator
        </button>
        <button
          onClick={() => onSelectTab('companion')}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
            currentTab === 'companion' ? 'bg-[#E64833] text-[#FBE9D0] font-bold' : 'text-[#FBE9D0]/70'
          }`}
        >
          Warden AI
        </button>
        <button
          onClick={() => onSelectTab('marketplace')}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
            currentTab === 'marketplace' ? 'bg-[#E64833] text-[#FBE9D0] font-bold' : 'text-[#FBE9D0]/70'
          }`}
        >
          Hostel Mart
        </button>
        <button
          onClick={() => onSelectTab('audit')}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap ${
            currentTab === 'audit' ? 'bg-[#E64833] text-[#FBE9D0] font-bold' : 'text-[#FBE9D0]/70'
          }`}
        >
          Audit Ledger
        </button>
        <button
          onClick={onSignOut || onOpenLogin}
          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#E64833] text-[#FBE9D0] border border-[#FBE9D0]/30 whitespace-nowrap flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
          title="Logout"
        >
          <LogOut className="w-3 h-3" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

