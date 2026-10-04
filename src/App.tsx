import React, { useState, useEffect, useCallback } from 'react';
import { Resident, Booking, NotificationItem } from './types';
import {
  getCurrentUser,
  getBookings,
  logoutResident,
} from './services/storageService';
import { checkGemmaHealth, GemmaStatus, getGemmaConfig } from './services/gemmaService';
import { getUserNotifications, triggerUpcomingBookingReminder } from './services/notificationService';
import { STRICT_RESOURCES, TODAY_STR } from './constants';
import { Header } from './components/Header';
import { WardenVerdictCard } from './components/WardenVerdictCard';
import { SlotBookingMatrix } from './components/SlotBookingMatrix';
import { ConflictNegotiator } from './components/ConflictNegotiator';
import { AICompanion } from './components/AICompanion';
import { HostelMarketplace } from './components/HostelMarketplace';
import { AuditLedger } from './components/AuditLedger';
import { LoginModal } from './components/LoginModal';
import { UserProfileModal } from './components/UserProfileModal';
import { GemmaConfigModal } from './components/GemmaConfigModal';
import { NotificationToast } from './components/NotificationToast';
import { AuthPortal } from './components/AuthPortal';
import { getMarketplaceItems } from './services/marketplaceService';
import { Clock, Shield, Sparkles, AlertCircle, Compass, Users } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'matrix' | 'conflict' | 'companion' | 'marketplace' | 'audit'>('matrix');
  const [currentUser, setCurrentUser] = useState<Resident | null>(() => getCurrentUser());
  const [bookings, setBookings] = useState<Booking[]>(getBookings());
  const [selectedBookingForVerdict, setSelectedBookingForVerdict] = useState<Booking | null>(null);
  const [isGeneratingVerdict, setIsGeneratingVerdict] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isGemmaModalOpen, setIsGemmaModalOpen] = useState(false);
  const [gemmaStatus, setGemmaStatus] = useState<GemmaStatus>('checking');
  const [isDemoMode, setIsDemoMode] = useState(true);

  const refreshNotifications = useCallback(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    const list = getUserNotifications(currentUser.id || currentUser.uid);
    setNotifications(list);
  }, [currentUser]);

  // Check Google Gemma health on mount
  const checkStatus = async () => {
    setGemmaStatus('checking');
    try {
      const config = getGemmaConfig();
      const res = await checkGemmaHealth(config);
      setIsDemoMode(res.isDemoMode);
      if (res.available) {
        setGemmaStatus(res.provider === 'local-open-weight' ? 'local-active' : 'online');
      } else {
        setGemmaStatus('demo-mode');
      }
    } catch {
      setIsDemoMode(true);
      setGemmaStatus('demo-mode');
    }
  };

  useEffect(() => {
    checkStatus();
    const bList = getBookings();
    setBookings(bList);
    const latestWithVerdict = bList.find((b) => b.wardenVerdict);
    if (latestWithVerdict) {
      setSelectedBookingForVerdict(latestWithVerdict);
    } else if (bList.length > 0) {
      setSelectedBookingForVerdict(bList[0]);
    }
    refreshNotifications();
  }, [refreshNotifications]);

  const refreshAllState = () => {
    const user = getCurrentUser();
    setCurrentUser(user);
    const bList = getBookings();
    setBookings(bList);
    refreshNotifications();
  };

  const handleBookingCreated = (newBooking: Booking) => {
    refreshAllState();
    setSelectedBookingForVerdict(newBooking);
  };

  const handleBookingCancelled = () => {
    refreshAllState();
    const bList = getBookings();
    const active = bList.find((b) => b.status === 'active' && b.wardenVerdict);
    if (active) setSelectedBookingForVerdict(active);
  };

  const handleLoginSuccess = (resident: Resident) => {
    setCurrentUser(resident);
    const userNotifs = getUserNotifications(resident.id || resident.uid);
    setNotifications(userNotifs);
    const bList = getBookings();
    setBookings(bList);
  };

  const handleSignOut = () => {
    logoutResident();
    setCurrentUser(null);
    setNotifications([]);
    setIsProfileOpen(false);
    setIsLoginOpen(false);
  };

  const handleNotificationTriggered = () => {
    refreshNotifications();
    if (currentUser) {
      const updated = getUserNotifications(currentUser.id || currentUser.uid);
      if (updated.length > 0) {
        setActiveToast(updated[0]);
      }
    }
  };

  const handleNavigateToBooking = (bookingId?: string) => {
    if (!bookingId) return;
    const b = bookings.find((item) => item.id === bookingId);
    if (b) {
      setSelectedBookingForVerdict(b);
      setCurrentTab('matrix');
    }
  };

  // STRICT AUTH GUARD: Unauthenticated users can only see the Sign In / Sign Up portal
  if (!currentUser) {
    return (
      <AuthPortal onAuthSuccess={handleLoginSuccess} />
    );
  }

  return (
    <div className="min-h-screen bg-[#244855] text-[#FBE9D0] flex flex-col font-sans selection:bg-[#E64833] selection:text-[#FBE9D0]">
      {/* 3-Zone Header Contract with Notification Center */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onSignOut={handleSignOut}
        gemmaStatus={gemmaStatus}
        onOpenGemmaModal={() => setIsGemmaModalOpen(true)}
        notifications={notifications}
        onNotificationsChanged={refreshNotifications}
        onNavigateToBooking={handleNavigateToBooking}
        userBookings={bookings.filter((b) => b.userId === currentUser.id || b.userId === currentUser.uid)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Demo Mode Fallback Banner Notice */}
        {isDemoMode && (
          <div className="bg-[#874F41] border border-[#90AEAD]/60 rounded-xl px-4 py-2.5 text-xs font-mono text-[#FBE9D0] flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E64833] shrink-0" />
              <span>
                <strong>Demo Mode Active:</strong> Running in demo mode (pre-scripted responses). Run locally for live AI.
              </span>
            </div>
            <button
              onClick={() => setIsGemmaModalOpen(true)}
              className="px-2.5 py-1 bg-[#244855] hover:bg-[#E64833] text-[#FBE9D0] border border-[#90AEAD]/40 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
            >
              Configure Local Endpoint / Live AI →
            </button>
          </div>
        )}
        {/* Vintage Courtyard Hero Banner (Asymmetrical Bento SaaS Card) */}
        <div className="relative rounded-2xl overflow-hidden border border-[#90AEAD]/50 bg-[#874F41] shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img
              src="/src/assets/images/vintage_court_grounds_1791050438891.jpg"
              alt="Collegiate Court Grounds at Dusk"
              className="w-full h-full object-cover opacity-25 filter saturate-75 mix-blend-multiply"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#244855]/95 via-[#244855]/85 to-transparent" />
          </div>

          <div className="relative z-10 p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest text-[#90AEAD] uppercase mb-1">
                <span>Resident Halls Common Amenity Accord</span>
                <span>·</span>
                <span>5:00 PM – 11:00 PM</span>
              </div>
              <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#FBE9D0] tracking-tight">
                Hostel Nexus Resource & Court Conflict Negotiator
              </h1>
              <p className="text-xs lg:text-sm text-[#FBE9D0]/85 mt-1.5 leading-relaxed">
                Privacy-first local resource scheduler powered by <strong>Gemma AI</strong>. Track badminton courts, table tennis blades, basketballs, and courtyard speakers with transparent weekly quotas, automated warden arbitration, and 15-minute dispatch reminders.
              </p>
            </div>

            {/* Resident Fast-Fact Strip */}
            <div className="flex items-center gap-4 shrink-0 bg-[#244855]/95 border border-[#90AEAD]/40 p-4 rounded-xl text-xs font-mono shadow-md">
              <div>
                <div className="text-[10px] text-[#90AEAD] uppercase">Active Resident</div>
                <div className="font-bold text-sm text-[#FBE9D0] truncate max-w-[140px]">{currentUser.name}</div>
                <div className="text-[10px] text-[#90AEAD] mt-0.5">REG-{currentUser.regDigits} · {currentUser.room}</div>
              </div>
              <div className="h-8 w-px bg-[#90AEAD]/30" />
              <div>
                <div className="text-[10px] text-[#90AEAD] uppercase">Weekly Quota</div>
                <div className="font-bold text-lg text-[#FBE9D0] tabular-nums">
                  {currentUser.credits} <span className="text-xs text-[#90AEAD]">/ 4 Cr</span>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold">Refund on cancel</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1: Live Court & Slot Matrix + Warden Verdict */}
        {currentTab === 'matrix' && (
          <div className="space-y-6">
            {/* Highlighted Automated Warden Verdict Card */}
            <WardenVerdictCard
              latestBooking={selectedBookingForVerdict}
              isGenerating={isGeneratingVerdict}
            />

            {/* Live 5 PM to 11 PM Visual Booking Matrix */}
            <SlotBookingMatrix
              currentUser={currentUser}
              bookings={bookings}
              onBookingCreated={handleBookingCreated}
              onSelectBookingForVerdict={(b) => setSelectedBookingForVerdict(b)}
              selectedBookingId={selectedBookingForVerdict?.id}
              onNotificationTriggered={handleNotificationTriggered}
            />
          </div>
        )}

        {/* Tab 2: Smart Conflict Negotiator Agent */}
        {currentTab === 'conflict' && (
          <ConflictNegotiator
            currentUser={currentUser}
            bookings={bookings}
            onRefreshBookings={refreshAllState}
            onNotificationTriggered={handleNotificationTriggered}
          />
        )}

        {/* Tab 3: Warden & Roommate AI Companion (Matrix & Catalog Aware) */}
        {currentTab === 'companion' && (
          <AICompanion
            currentUser={currentUser}
            activeBookings={bookings}
            resources={STRICT_RESOURCES}
            sessionDate={TODAY_STR}
            marketplaceItems={getMarketplaceItems()}
          />
        )}

        {/* Tab 4: Hostel Marketplace & Midnight Snack Auction */}
        {currentTab === 'marketplace' && (
          <HostelMarketplace
            currentUser={currentUser}
            onRefreshState={refreshAllState}
            onNotificationTriggered={handleNotificationTriggered}
          />
        )}

        {/* Tab 5: Permanent Audit Ledger (NO Clear Buttons) */}
        {currentTab === 'audit' && (
          <AuditLedger onRefresh={refreshAllState} />
        )}
      </main>

      {/* Floating Dismissible Toast Alert */}
      <NotificationToast
        toast={activeToast}
        onDismiss={() => setActiveToast(null)}
        onClick={(toast) => {
          handleNavigateToBooking(toast.bookingId);
          setActiveToast(null);
        }}
      />

      {/* Footer: Quiet vintage collegiate imprint */}
      <footer className="border-t border-[#90AEAD]/30 bg-[#244855] text-xs font-mono text-[#90AEAD] py-6 px-4 text-center mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E64833]" />
            <span>Hostel Nexus · Deep Vintage Mood · Local Gemma Architecture</span>
          </div>
          <div className="text-[11px] text-[#FBE9D0]/70">
            Strict Resource Registry: Table Tennis #1 & #2 · Badminton A & B · Basketball & Hoop · Bluetooth Speaker
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onBookingCancelled={handleBookingCancelled}
        onSignOut={handleSignOut}
      />

      <GemmaConfigModal
        isOpen={isGemmaModalOpen}
        onClose={() => setIsGemmaModalOpen(false)}
        onConfigUpdated={checkStatus}
      />
    </div>
  );
}

