import React, { useState } from 'react';
import { Resident } from '../types';
import {
  registerResident,
  authenticateResident,
  getResidents,
} from '../services/storageService';
import {
  KeyRound,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Award,
  Layers,
  CheckCircle2,
  GraduationCap,
  Building,
  Hash,
  Compass,
} from 'lucide-react';
import crestImage from '../assets/images/hostel_nexus_crest_1791050425753.jpg';

interface AuthPortalProps {
  onAuthSuccess: (resident: Resident) => void;
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In State
  const [loginName, setLoginName] = useState('');
  const [loginDigits, setLoginDigits] = useState('');
  const [loginPasscode, setLoginPasscode] = useState('');

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupDigits, setSignupDigits] = useState('');
  const [signupRoom, setSignupRoom] = useState('');
  const [signupBranch, setSignupBranch] = useState('');
  const [signupPasscode, setSignupPasscode] = useState('');

  // UI state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingResidents = getResidents();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!loginName.trim()) {
      setErrorMsg('Please enter your full registered name.');
      return;
    }

    const cleanDigits = loginDigits.trim().replace(/\D/g, '');
    if (cleanDigits.length !== 3) {
      setErrorMsg('Please enter exactly the last 3 digits of your registration number (e.g. 412).');
      return;
    }

    setIsSubmitting(true);
    const result = authenticateResident({
      name: loginName,
      regDigits: cleanDigits,
      passcode: loginPasscode,
    });
    setIsSubmitting(false);

    if (result.success && result.resident) {
      setSuccessMsg(`Welcome back, ${result.resident.name}! Initializing session...`);
      setTimeout(() => {
        onAuthSuccess(result.resident!);
      }, 400);
    } else {
      setErrorMsg(result.error || 'Authentication failed. Please verify your details.');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!signupName.trim()) {
      setErrorMsg('Please enter your student full name.');
      return;
    }

    const cleanDigits = signupDigits.trim().replace(/\D/g, '');
    if (cleanDigits.length !== 3) {
      setErrorMsg('Registration number must be exactly 3 digits (e.g. 412 or 024).');
      return;
    }

    if (signupPasscode && signupPasscode.trim().length > 0 && signupPasscode.trim().length !== 4) {
      setErrorMsg('If setting a security PIN, it must be exactly 4 digits.');
      return;
    }

    setIsSubmitting(true);
    const result = registerResident({
      name: signupName,
      regDigits: cleanDigits,
      room: signupRoom,
      branch: signupBranch,
      passcode: signupPasscode,
    });
    setIsSubmitting(false);

    if (result.success && result.resident) {
      setSuccessMsg(`Account created for ${result.resident.name}! Initialized with 4 Weekly Credits.`);
      setTimeout(() => {
        onAuthSuccess(result.resident!);
      }, 500);
    } else {
      setErrorMsg(result.error || 'Registration failed.');
    }
  };

  const handleSelectQuickFill = (r: Resident) => {
    setMode('signin');
    setLoginName(r.name);
    setLoginDigits(r.regDigits);
    setLoginPasscode(r.passcode || '');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[#244855] text-[#FBE9D0] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 selection:bg-[#E64833] selection:text-[#FBE9D0]">
      {/* Background Decor Vignette */}
      <div className="w-full max-w-xl">
        {/* Heraldic Header Card */}
        <div className="bg-[#874F41] border border-[#90AEAD] shadow-2xl rounded-sm p-6 sm:p-8 text-[#FBE9D0] relative overflow-hidden">
          {/* Subtle collegiate seal backdrop */}
          <div className="absolute -top-12 -right-12 w-48 h-48 opacity-10 pointer-events-none rounded-full overflow-hidden">
            <img src={crestImage} alt="Hostel Crest" className="w-full h-full object-cover" />
          </div>

          {/* Top Crest & Branding */}
          <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-[#90AEAD]/40 pb-5 mb-6 text-center sm:text-left">
            <div className="w-16 h-16 rounded-sm border border-[#90AEAD] overflow-hidden bg-[#244855] shadow-md shrink-0 flex items-center justify-center">
              <img src={crestImage} alt="Hostel Crest" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[10px] font-mono tracking-widest text-[#90AEAD] uppercase">
                  Collegiate Residence Board
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E64833]"></span>
                <span className="text-[10px] font-mono text-[#FBE9D0]/70">Auth Guard Active</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#FBE9D0] mt-0.5">
                Hostel Nexus Portal
              </h1>
              <p className="text-xs text-[#FBE9D0]/80 mt-1">
                Resource & Court Conflict Negotiator with Local Gemma AI Arbitration.
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#244855] border border-[#90AEAD]/50 rounded-sm mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-sm transition-all flex items-center justify-center gap-2 ${
                mode === 'signin'
                  ? 'bg-[#E64833] text-[#FBE9D0] shadow-sm font-bold'
                  : 'text-[#FBE9D0]/80 hover:text-[#FBE9D0] hover:bg-[#874F41]/60'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Resident Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 px-3 text-xs sm:text-sm font-medium rounded-sm transition-all flex items-center justify-center gap-2 ${
                mode === 'signup'
                  ? 'bg-[#E64833] text-[#FBE9D0] shadow-sm font-bold'
                  : 'text-[#FBE9D0]/80 hover:text-[#FBE9D0] hover:bg-[#874F41]/60'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              New Registration
            </button>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-[#E64833]/25 border border-[#E64833] text-xs text-[#FBE9D0] rounded-sm flex items-start gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-[#E64833] shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-[#90AEAD]/25 border border-[#90AEAD] text-xs text-[#FBE9D0] rounded-sm flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#90AEAD] shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMsg}</div>
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#90AEAD] uppercase mb-1.5 flex items-center justify-between">
                  <span>Student Full Name</span>
                  <span className="text-[10px] text-[#FBE9D0]/60 normal-case">e.g. Rahul Sharma</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder="Enter your registered name"
                    className="w-full px-3.5 py-2.5 bg-[#244855] border border-[#90AEAD]/60 rounded-sm text-sm text-[#FBE9D0] placeholder-[#FBE9D0]/40 focus:outline-none focus:border-[#E64833] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#90AEAD] uppercase mb-1.5 flex items-center justify-between">
                  <span>Last 3 Digits of Reg. Number</span>
                  <span className="text-[10px] text-[#FBE9D0]/60 font-mono">3 Digits (e.g. 412)</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 font-mono text-xs text-[#90AEAD] pointer-events-none select-none">
                    REG-
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={loginDigits}
                    onChange={(e) => setLoginDigits(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="412"
                    className="w-full pl-14 pr-3.5 py-2.5 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-mono text-sm tracking-widest text-[#FBE9D0] placeholder-[#FBE9D0]/40 focus:outline-none focus:border-[#E64833]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#90AEAD] uppercase mb-1.5 flex items-center justify-between">
                  <span>Security Passcode / PIN</span>
                  <span className="text-[10px] text-[#FBE9D0]/60 normal-case">(If configured on registration)</span>
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={loginPasscode}
                  onChange={(e) => setLoginPasscode(e.target.value)}
                  placeholder="•••• (Leave blank if none)"
                  className="w-full px-3.5 py-2.5 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-mono text-sm tracking-widest text-[#FBE9D0] placeholder-[#FBE9D0]/40 focus:outline-none focus:border-[#E64833]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#E64833] hover:bg-[#d03d2a] active:scale-[0.99] text-[#FBE9D0] font-semibold text-sm rounded-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  Sign In & Unlock Dashboard
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-[#FBE9D0]/70">First time claiming hostel facilities? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                  }}
                  className="text-xs text-[#FBE9D0] font-bold underline decoration-[#E64833] hover:text-[#E64833] transition-colors ml-1 cursor-pointer"
                >
                  Register here
                </button>
              </div>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#90AEAD] uppercase mb-1 flex items-center justify-between">
                  <span>Full Name</span>
                  <span className="text-[10px] text-[#FBE9D0]/60 normal-case">Official Student Name</span>
                </label>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 bg-[#244855] border border-[#90AEAD]/60 rounded-sm text-sm text-[#FBE9D0] placeholder-[#FBE9D0]/40 focus:outline-none focus:border-[#E64833] font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#90AEAD] uppercase mb-1 flex items-center justify-between">
                    <span>Last 3 Digits of Reg. No.</span>
                    <span className="text-[10px] text-[#E64833] font-bold">*Required</span>
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 font-mono text-xs text-[#90AEAD] pointer-events-none select-none">
                      REG-
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={3}
                      value={signupDigits}
                      onChange={(e) => setSignupDigits(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="412"
                      className="w-full pl-14 pr-3 py-2.5 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-mono text-sm tracking-widest text-[#FBE9D0] placeholder-[#FBE9D0]/40 focus:outline-none focus:border-[#E64833]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#90AEAD] uppercase mb-1">
                    Hostel Room & Wing
                  </label>
                  <input
                    type="text"
                    value={signupRoom}
                    onChange={(e) => setSignupRoom(e.target.value)}
                    placeholder="e.g. Wing B - Room 302"
                    className="w-full px-3.5 py-2.5 bg-[#244855] border border-[#90AEAD]/60 rounded-sm text-sm text-[#FBE9D0] placeholder-[#FBE9D0]/40 focus:outline-none focus:border-[#E64833]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#90AEAD] uppercase mb-1">
                    Branch / Major
                  </label>
                  <input
                    type="text"
                    value={signupBranch}
                    onChange={(e) => setSignupBranch(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3.5 py-2.5 bg-[#244855] border border-[#90AEAD]/60 rounded-sm text-sm text-[#FBE9D0] placeholder-[#FBE9D0]/40 focus:outline-none focus:border-[#E64833]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#90AEAD] uppercase mb-1 flex items-center justify-between">
                    <span>4-Digit PIN</span>
                    <span className="text-[10px] text-[#FBE9D0]/60">(Optional)</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={signupPasscode}
                    onChange={(e) => setSignupPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full px-3.5 py-2.5 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-mono text-sm tracking-widest text-[#FBE9D0] placeholder-[#FBE9D0]/40 focus:outline-none focus:border-[#E64833]"
                  />
                </div>
              </div>

              {/* Quota Guarantee Notice */}
              <div className="p-3 bg-[#244855] border border-[#90AEAD]/40 rounded-sm flex items-center gap-3">
                <Award className="w-5 h-5 text-[#90AEAD] shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-[#FBE9D0]">
                    Allocated Quota: 4 Weekly Credits
                  </div>
                  <div className="text-[#FBE9D0]/70 text-[11px]">
                    Automatic 1-credit refund on booking cancellation. Transparent permanent ledger.
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#E64833] hover:bg-[#d03d2a] active:scale-[0.99] text-[#FBE9D0] font-semibold text-sm rounded-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Enroll Resident & Unlock Dashboard
                </button>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-[#FBE9D0]/70">Already created your profile? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg('');
                  }}
                  className="text-xs text-[#FBE9D0] font-bold underline decoration-[#E64833] hover:text-[#E64833] transition-colors ml-1 cursor-pointer"
                >
                  Sign In here
                </button>
              </div>
            </form>
          )}

          {/* Quick Roster for terminal convenience (if students are registered) */}
          {existingResidents.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[#90AEAD]/30">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#90AEAD] mb-2">
                <span>ENROLLED STUDENTS ON THIS TERMINAL ({existingResidents.length}):</span>
                <span className="text-[10px] text-[#FBE9D0]/60">(Click to quick-fill)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {existingResidents.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectQuickFill(r)}
                    className="p-2 text-left rounded-sm border border-[#90AEAD]/30 bg-[#244855]/70 hover:bg-[#244855] hover:border-[#E64833] transition-colors text-xs flex flex-col"
                  >
                    <div className="font-semibold text-[#FBE9D0] truncate">{r.name}</div>
                    <div className="font-mono text-[10px] text-[#90AEAD] flex items-center justify-between mt-0.5">
                      <span>REG-{r.regDigits}</span>
                      <span>{r.credits}/4 Credits</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vintage Footer Notice */}
        <div className="mt-4 text-center text-xs text-[#FBE9D0]/60 font-mono flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#90AEAD]" />
          <span>Local Gemma AI & Privacy-First Offline Architecture • Zero Cloud Telemetry</span>
        </div>
      </div>
    </div>
  );
};
