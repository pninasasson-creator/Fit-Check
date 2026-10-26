import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { Profile } from '../config/supabase';
import { ArrowRight, Sparkles, AlertCircle, X } from 'lucide-react';
import { MirrorCollageModalBackdrop } from './MirrorCollageModalBackdrop';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: any, profile: Profile | null) => void;
  onContinueAsGuest?: () => void;
  onClose?: () => void;
  defaultIsSignUp?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  onContinueAsGuest,
  onClose,
  defaultIsSignUp = true,
}) => {
  const [isSignUp, setIsSignUp] = useState(defaultIsSignUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const res = await dataService.signUp(
          cleanEmail,
          password,
          username.trim() || undefined,
          displayName.trim() || undefined
        );
        onSuccess(res.user, res.profile);
      } else {
        const res = await dataService.signIn(cleanEmail, password);
        onSuccess(res.user, res.profile);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MirrorCollageModalBackdrop onBackdropClick={onClose} className="w-full max-w-sm">
      <div className="w-full bg-[#FFFDFD] border border-[#F472B6]/40 rounded-[4px] p-6 shadow-2xl relative my-auto space-y-5">
        {/* Optional Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-[#2B2420]/50 hover:text-[#BE185D] transition-colors rounded-full hover:bg-[#FDF2F4]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Editorial Pink Masthead */}
        <div className="text-center space-y-1">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-[0.25em] bg-[#FCE7F3] text-[#BE185D] border border-[#F472B6]/30 font-sans font-semibold">
            {isSignUp ? 'New Archivist' : 'Welcome Back'}
          </span>
          <h1 className="font-italiana text-4xl text-[#2B2420] tracking-wide pt-1">
            FIT CHECK
          </h1>
          <p className="font-bodoni italic text-sm text-[#2B2420]/80">
            {isSignUp ? 'Log your fit every day. Never forget what you wore.' : 'Welcome back to your wardrobe memory archive'}
          </p>
        </div>

        {/* Tab switch between Sign Up and Log In */}
        <div className="flex border-b border-[#F472B6]/25">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg(null);
            }}
            className={`flex-1 pb-2.5 text-xs uppercase tracking-[0.18em] font-sans font-semibold transition-all ${
              isSignUp
                ? 'border-b-2 border-[#E11D48] text-[#E11D48]'
                : 'text-[#2B2420]/50 hover:text-[#BE185D]'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg(null);
            }}
            className={`flex-1 pb-2.5 text-xs uppercase tracking-[0.18em] font-sans font-semibold transition-all ${
              !isSignUp
                ? 'border-b-2 border-[#E11D48] text-[#E11D48]'
                : 'text-[#2B2420]/50 hover:text-[#BE185D]'
            }`}
          >
            Sign In
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FDF2F4] border border-[#E11D48]/30 rounded-[3px] text-xs text-[#BE185D] flex items-start gap-2 font-sans animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E11D48]" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-[#BE185D] font-bold block mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@lookbook.com"
              className="w-full bg-[#FAF5F5] border border-[#F472B6]/30 rounded-[3px] px-3 py-2 text-xs text-[#2B2420] focus:outline-none focus:border-[#E11D48] transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-[#BE185D] font-bold block mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-[#FAF5F5] border border-[#F472B6]/30 rounded-[3px] px-3 py-2 text-xs text-[#2B2420] focus:outline-none focus:border-[#E11D48] transition-colors"
            />
          </div>

          {isSignUp && (
            <div className="pt-1">
              <span className="text-[10px] font-sans text-[#2B2420]/60 block leading-tight">
                ✦ You'll curate your username, mirror selfie photo, and brand tags right after sign up.
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-[3px] bg-gradient-to-r from-[#E11D48] via-[#F43F5E] to-[#BE185D] text-white text-xs font-sans font-bold uppercase tracking-[0.22em] shadow-md hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Lookbook Account ✦' : 'Sign In to Archive'}</span>
                <ArrowRight strokeWidth={1.5} className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Guest fallback preview option */}
        {onContinueAsGuest && (
          <div className="pt-2 text-center border-t border-[#F472B6]/20">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-[10px] uppercase font-sans tracking-[0.16em] text-[#BE185D] hover:text-[#E11D48] transition-colors font-semibold inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-[#E11D48]" />
              <span>Explore as Guest / Studio Demo →</span>
            </button>
          </div>
        )}
      </div>
    </MirrorCollageModalBackdrop>
  );
};
