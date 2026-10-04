import React, { useState } from 'react';
import { Resident } from '../types';
import {
  authenticateResident,
  registerResident,
  getResidents,
} from '../services/storageService';
import { KeyRound, UserPlus, ShieldAlert, X, Award, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (resident: Resident) => void;
  currentUser: Resident;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');

  // Sign In inputs
  const [name, setName] = useState(currentUser.name || '');
  const [regDigits, setRegDigits] = useState(currentUser.regDigits || '');
  const [passcode, setPasscode] = useState('');

  // Sign Up inputs
  const [signupName, setSignupName] = useState('');
  const [signupDigits, setSignupDigits] = useState('');
  const [signupRoom, setSignupRoom] = useState('');
  const [signupBranch, setSignupBranch] = useState('');
  const [signupPasscode, setSignupPasscode] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const residents = getResidents();

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full registered name.');
      return;
    }

    const cleanDigits = regDigits.trim().replace(/\D/g, '');
    if (cleanDigits.length !== 3) {
      setErrorMsg('Please enter the last 3 digits of your registration number (e.g. 412).');
      return;
    }

    const res = authenticateResident({
      name,
      regDigits: cleanDigits,
      passcode,
    });

    if (res.success && res.resident) {
      setSuccessMsg(`Session unlocked for ${res.resident.name}!`);
      setTimeout(() => {
        onLoginSuccess(res.resident!);
        onClose();
      }, 350);
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!signupName.trim()) {
      setErrorMsg('Please enter your full student name.');
      return;
    }

    const cleanDigits = signupDigits.trim().replace(/\D/g, '');
    if (cleanDigits.length !== 3) {
      setErrorMsg('Registration number must be exactly 3 digits.');
      return;
    }

    if (signupPasscode && signupPasscode.trim().length > 0 && signupPasscode.trim().length !== 4) {
      setErrorMsg('PIN must be exactly 4 digits if provided.');
      return;
    }

    const res = registerResident({
      name: signupName,
      regDigits: cleanDigits,
      room: signupRoom,
      branch: signupBranch,
      passcode: signupPasscode,
    });

    if (res.success && res.resident) {
      setSuccessMsg(`Enrolled ${res.resident.name} with 4 Weekly Credits!`);
      setTimeout(() => {
        onLoginSuccess(res.resident!);
        onClose();
      }, 400);
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  const handleQuickSelect = (r: Resident) => {
    setTab('signin');
    setName(r.name);
    setRegDigits(r.regDigits);
    setPasscode(r.passcode || '');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#874F41] border border-[#90AEAD] shadow-2xl rounded-sm p-6 text-[#FBE9D0] relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#FBE9D0]/70 hover:text-[#FBE9D0] transition-colors p-1 cursor-pointer"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Vintage Header */}
        <div className="border-b border-[#90AEAD]/40 pb-4 mb-5">
          <div className="text-[11px] font-mono tracking-widest text-[#90AEAD] uppercase">
            Collegiate Resident Registry
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#FBE9D0] mt-1">
            {tab === 'signin' ? 'Switch Student Account' : 'Register New Resident'}
          </h2>
          <p className="text-xs text-[#FBE9D0]/80 mt-1">
            Authenticate using your Name and last 3 digits of your registration number.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#244855] border border-[#90AEAD]/50 rounded-sm mb-4">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setErrorMsg('');
            }}
            className={`py-1.5 px-3 text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'signin'
                ? 'bg-[#E64833] text-[#FBE9D0]'
                : 'text-[#FBE9D0]/80 hover:bg-[#874F41]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('signup');
              setErrorMsg('');
            }}
            className={`py-1.5 px-3 text-xs font-semibold rounded-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'signup'
                ? 'bg-[#E64833] text-[#FBE9D0]'
                : 'text-[#FBE9D0]/80 hover:bg-[#874F41]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Register
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-[#E64833]/25 border border-[#E64833] text-xs text-[#FBE9D0] rounded-sm flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-[#E64833] shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-[#90AEAD]/25 border border-[#90AEAD] text-xs text-[#FBE9D0] rounded-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#90AEAD] shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {tab === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono text-[#90AEAD] mb-1">
                STUDENT FULL NAME
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-sans text-sm text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[#90AEAD] mb-1">
                LAST 3 DIGITS OF REGISTRATION NUMBER
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-mono text-xs text-[#90AEAD]">REG-</span>
                <input
                  type="text"
                  required
                  maxLength={3}
                  value={regDigits}
                  onChange={(e) => setRegDigits(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="412"
                  className="w-full pl-14 pr-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-mono text-sm tracking-widest text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#90AEAD] mb-1 flex items-center justify-between">
                <span>SECURITY PASSCODE (OPTIONAL)</span>
                <span className="text-[10px] text-[#FBE9D0]/60">(If set)</span>
              </label>
              <input
                type="password"
                maxLength={4}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••"
                className="w-full px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-mono text-sm tracking-widest text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-[#E64833] hover:bg-[#d03d2a] text-[#FBE9D0] font-medium text-sm rounded-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              Authenticate & Unlock Session
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-3">
            <div>
              <label className="block text-xs font-mono text-[#90AEAD] mb-1">
                STUDENT FULL NAME
              </label>
              <input
                type="text"
                required
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-sans text-sm text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-mono text-[#90AEAD] mb-1">
                  LAST 3 DIGITS
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 font-mono text-xs text-[#90AEAD]">REG-</span>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={signupDigits}
                    onChange={(e) => setSignupDigits(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    placeholder="412"
                    className="w-full pl-12 pr-2.5 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-mono text-sm tracking-wider text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#90AEAD] mb-1">
                  ROOM & WING
                </label>
                <input
                  type="text"
                  value={signupRoom}
                  onChange={(e) => setSignupRoom(e.target.value)}
                  placeholder="Wing B - 302"
                  className="w-full px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm text-sm text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-mono text-[#90AEAD] mb-1">
                  BRANCH / MAJOR
                </label>
                <input
                  type="text"
                  value={signupBranch}
                  onChange={(e) => setSignupBranch(e.target.value)}
                  placeholder="Computer Science"
                  className="w-full px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm text-sm text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#90AEAD] mb-1">
                  4-DIGIT PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={signupPasscode}
                  onChange={(e) => setSignupPasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full px-3 py-2 bg-[#244855] border border-[#90AEAD]/60 rounded-sm font-mono text-sm text-[#FBE9D0] focus:outline-none focus:border-[#E64833]"
                />
              </div>
            </div>

            <div className="p-2.5 bg-[#244855] border border-[#90AEAD]/40 rounded-sm flex items-center gap-2 text-xs">
              <Award className="w-4 h-4 text-[#90AEAD] shrink-0" />
              <span className="text-[#FBE9D0]/80">
                Starts with <strong className="text-[#FBE9D0]">4 Weekly Booking Credits</strong>.
              </span>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-[#E64833] hover:bg-[#d03d2a] text-[#FBE9D0] font-medium text-sm rounded-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Register Account & Login
            </button>
          </form>
        )}

        {/* Quick Directory Selector if residents exist */}
        {residents.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#90AEAD]/30">
            <div className="text-[11px] font-mono text-[#90AEAD] mb-2 flex items-center justify-between">
              <span>REGISTERED STUDENTS ({residents.length}):</span>
              <span className="text-[10px] text-[#FBE9D0]/60">(Click to auto-fill)</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1">
              {residents.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleQuickSelect(r)}
                  className={`p-2 text-left rounded-sm border transition-all text-xs cursor-pointer ${
                    name.toLowerCase() === r.name.toLowerCase() && regDigits === r.regDigits
                      ? 'border-[#E64833] bg-[#244855]'
                      : 'border-[#90AEAD]/30 bg-[#244855]/60 hover:bg-[#244855]'
                  }`}
                >
                  <div className="font-semibold text-[#FBE9D0] truncate">{r.name}</div>
                  <div className="font-mono text-[10px] text-[#90AEAD] flex justify-between mt-0.5">
                    <span>REG-{r.regDigits}</span>
                    <span>{r.credits}/4 Cr</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
