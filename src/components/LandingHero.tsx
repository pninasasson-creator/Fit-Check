import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { Profile } from '../config/supabase';
import {
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Tag,
  Camera,
  Heart,
  Compass,
} from 'lucide-react';

import {
  getDemoMirrorSelfies,
  getDemoMirrorSelfieByIndex,
  loadDemoMirrorSelfies,
} from '../services/demoImages';

// Mirror selfies loaded exclusively from public Supabase 'demo' bucket
const CAPTION_PRESETS = [
  { caption: 'Oversized Knit & Denim', brand: 'Aritzia / Free People' },
  { caption: 'Studio Mirror Fit Check', brand: 'Garage / Brandy' },
  { caption: 'Clean Activewear Layers', brand: 'Alo Yoga / Lululemon' },
  { caption: 'Tailored Blazer & Loafers', brand: 'Reformation / Zara' },
  { caption: 'Autumn Daily Lookbook', brand: 'Free People / Anthropologie' },
  { caption: 'Weekend Chill Fit', brand: 'Abercrombie / Aritzia' },
];

interface LandingHeroProps {
  onAuthSuccess: (user: any, profile: Profile | null) => void;
  onContinueAsGuest: () => void;
  isLoggedIn?: boolean;
  onEnterApp?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onAuthSuccess,
  onContinueAsGuest,
  isLoggedIn = false,
  onEnterApp,
}) => {
  const [authMode, setAuthMode] = useState<'create' | 'login'>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hideCard, setHideCard] = useState(false);

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
      if (authMode === 'create') {
        const res = await dataService.signUp(
          cleanEmail,
          password,
          username.trim() || undefined,
          displayName.trim() || undefined
        );
        onAuthSuccess(res.user, res.profile);
      } else {
        const res = await dataService.signIn(cleanEmail, password);
        onAuthSuccess(res.user, res.profile);
      }
    } catch (err: any) {
      console.error('Landing auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDemoMirrorSelfies().then(() => {
      // Trigger re-render if loaded
      setCollageTick((t) => t + 1);
    });
  }, []);

  const [collageTick, setCollageTick] = useState(0);

  const makeSelfieItem = (idx: number) => {
    const preset = CAPTION_PRESETS[idx % CAPTION_PRESETS.length];
    return {
      url: getDemoMirrorSelfieByIndex(idx),
      caption: preset.caption,
      brand: preset.brand,
    };
  };

  // Divide images into 4 responsive columns for staggered masonry
  const col1 = [makeSelfieItem(0), makeSelfieItem(4), makeSelfieItem(8)];
  const col2 = [makeSelfieItem(1), makeSelfieItem(5), makeSelfieItem(9)];
  const col3 = [makeSelfieItem(2), makeSelfieItem(6), makeSelfieItem(10), makeSelfieItem(3)];
  const col4 = [makeSelfieItem(3), makeSelfieItem(7), makeSelfieItem(11)];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#160B10] text-[#2B2420] flex items-center justify-center">
      {/* Background Mirror Selfie Masonry Grid */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-6 opacity-65 scale-[1.02]">
          {/* Column 1 */}
          <div className="flex flex-col gap-3 sm:gap-4 animate-in fade-in duration-700">
            {col1.map((item, idx) => (
              <div
                key={`c1-${idx}`}
                className="relative rounded-[6px] overflow-hidden shadow-lg border border-pink-500/20 group"
              >
                <img
                  src={item.url}
                  alt={item.caption}
                  className="w-full h-auto object-cover aspect-3/4 sm:aspect-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                <div className="absolute bottom-2 left-2 right-2 text-white text-[10px] font-sans">
                  <span className="block font-semibold uppercase tracking-wider text-pink-300">
                    {item.brand}
                  </span>
                  <span className="opacity-80 truncate block">{item.caption}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-3 sm:gap-4 -mt-6 sm:-mt-10 animate-in fade-in duration-800">
            {col2.map((item, idx) => (
              <div
                key={`c2-${idx}`}
                className="relative rounded-[6px] overflow-hidden shadow-lg border border-pink-500/20 group"
              >
                <img
                  src={item.url}
                  alt={item.caption}
                  className="w-full h-auto object-cover aspect-3/4 sm:aspect-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                <div className="absolute bottom-2 left-2 right-2 text-white text-[10px] font-sans">
                  <span className="block font-semibold uppercase tracking-wider text-pink-300">
                    {item.brand}
                  </span>
                  <span className="opacity-80 truncate block">{item.caption}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-3 sm:gap-4 -mt-2 sm:-mt-4 animate-in fade-in duration-900 hidden sm:flex">
            {col3.map((item, idx) => (
              <div
                key={`c3-${idx}`}
                className="relative rounded-[6px] overflow-hidden shadow-lg border border-pink-500/20 group"
              >
                <img
                  src={item.url}
                  alt={item.caption}
                  className="w-full h-auto object-cover aspect-3/4 sm:aspect-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                <div className="absolute bottom-2 left-2 right-2 text-white text-[10px] font-sans">
                  <span className="block font-semibold uppercase tracking-wider text-pink-300">
                    {item.brand}
                  </span>
                  <span className="opacity-80 truncate block">{item.caption}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Column 4 */}
          <div className="flex flex-col gap-3 sm:gap-4 -mt-8 sm:-mt-12 animate-in fade-in duration-1000 hidden lg:flex">
            {col4.map((item, idx) => (
              <div
                key={`c4-${idx}`}
                className="relative rounded-[6px] overflow-hidden shadow-lg border border-pink-500/20 group"
              >
                <img
                  src={item.url}
                  alt={item.caption}
                  className="w-full h-auto object-cover aspect-3/4 sm:aspect-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                <div className="absolute bottom-2 left-2 right-2 text-white text-[10px] font-sans">
                  <span className="block font-semibold uppercase tracking-wider text-pink-300">
                    {item.brand}
                  </span>
                  <span className="opacity-80 truncate block">{item.caption}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Atmospheric Vignette & Pink Ambient Halo */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-[#180A12]/85 via-[#230C19]/80 to-[#12050D]/90 backdrop-blur-[2px]" />
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-500/20 via-rose-900/10 to-transparent" />

      {/* Quick Toggle to Peek Mirror Selfie Wallpaper */}
      <div className="absolute top-4 right-4 z-30">
        <button
          type="button"
          onClick={() => setHideCard((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 text-pink-200 border border-pink-500/30 text-xs font-sans backdrop-blur-md transition-all shadow-md"
          title={hideCard ? 'Show sign in card' : 'View full mirror selfies wallpaper'}
        >
          {hideCard ? (
            <>
              <Eye className="w-3.5 h-3.5 text-pink-400" />
              <span>Show Card</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-pink-400" />
              <span>View Mirror Wall</span>
            </>
          )}
        </button>
      </div>

      {/* Center Editorial Card */}
      <div
        className={`relative z-20 w-full max-w-md mx-4 my-8 transition-all duration-300 ${
          hideCard ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        <div className="bg-[#FFFDFD]/95 backdrop-blur-xl border border-[#F472B6]/40 rounded-[6px] p-6 sm:p-7 shadow-2xl relative space-y-5">
          {/* Header Badging */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCE7F3] border border-[#F472B6]/40 text-[#BE185D] text-[9px] uppercase tracking-[0.22em] font-sans font-bold shadow-xs">
              <Sparkles className="w-3 h-3 text-[#E11D48]" />
              <span>Wardrobe Memory & Daily Lookbook</span>
            </div>

            <h1 className="font-italiana text-4xl sm:text-5xl text-[#2B2420] tracking-wide pt-1">
              FIT CHECK
            </h1>

            <p className="font-bodoni italic text-base sm:text-lg text-[#2B2420] px-2 leading-snug">
              Log your fit every day. Never forget what you wore.
            </p>

            {/* Popular Brands Ticker */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-[9px] font-sans uppercase tracking-wider text-[#BE185D] font-medium">
              <span className="px-2 py-0.5 rounded-[2px] bg-[#FDF2F4] border border-[#F472B6]/30">
                Free People
              </span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#FDF2F4] border border-[#F472B6]/30">
                Aritzia
              </span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#FDF2F4] border border-[#F472B6]/30">
                Garage
              </span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#FDF2F4] border border-[#F472B6]/30">
                Alo Yoga
              </span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#FDF2F4] border border-[#F472B6]/30">
                Lululemon
              </span>
              <span className="px-2 py-0.5 rounded-[2px] bg-[#FDF2F4] border border-[#F472B6]/30">
                Brandy Melville
              </span>
            </div>
          </div>

          {/* If already logged in, offer 1-click enter button */}
          {isLoggedIn && onEnterApp && (
            <div className="p-3 bg-[#FDF2F4] border border-[#F472B6]/30 rounded-[3px] text-center space-y-2">
              <span className="text-[10px] uppercase font-sans tracking-widest text-[#BE185D] font-bold block">
                You are currently signed in
              </span>
              <button
                type="button"
                onClick={onEnterApp}
                className="w-full py-2.5 px-4 rounded-[3px] bg-gradient-to-r from-[#E11D48] to-[#BE185D] text-white text-xs uppercase tracking-[0.2em] font-sans font-bold hover:opacity-95 shadow-md flex items-center justify-center gap-2"
              >
                <span>Enter Your Lookbook Feed</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Segmented Switcher: Make an Account vs Log In */}
          <div className="flex border-b border-[#F472B6]/25">
            <button
              type="button"
              onClick={() => {
                setAuthMode('create');
                setErrorMsg(null);
              }}
              className={`flex-1 pb-2.5 text-xs uppercase tracking-[0.18em] font-sans font-semibold transition-all ${
                authMode === 'create'
                  ? 'border-b-2 border-[#E11D48] text-[#E11D48]'
                  : 'text-[#2B2420]/50 hover:text-[#BE185D]'
              }`}
            >
              Make an Account
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 pb-2.5 text-xs uppercase tracking-[0.18em] font-sans font-semibold transition-all ${
                authMode === 'login'
                  ? 'border-b-2 border-[#E11D48] text-[#E11D48]'
                  : 'text-[#2B2420]/50 hover:text-[#BE185D]'
              }`}
            >
              Log In
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-[#FDF2F4] border border-[#E11D48]/30 rounded-[3px] text-xs text-[#BE185D] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#E11D48]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Inline Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {authMode === 'create' && (
              <>
                <div>
                  <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-[#BE185D] font-bold block mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. mia.fits"
                    className="w-full bg-[#FAF5F5] border border-[#F472B6]/30 rounded-[3px] px-3 py-2 text-xs text-[#2B2420] focus:outline-none focus:border-[#E11D48]"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-[#BE185D] font-bold block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Mia Jenkins"
                    className="w-full bg-[#FAF5F5] border border-[#F472B6]/30 rounded-[3px] px-3 py-2 text-xs text-[#2B2420] focus:outline-none focus:border-[#E11D48]"
                  />
                </div>
              </>
            )}

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
                className="w-full bg-[#FAF5F5] border border-[#F472B6]/30 rounded-[3px] px-3 py-2 text-xs text-[#2B2420] focus:outline-none focus:border-[#E11D48]"
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
                placeholder="••••••••"
                className="w-full bg-[#FAF5F5] border border-[#F472B6]/30 rounded-[3px] px-3 py-2 text-xs text-[#2B2420] focus:outline-none focus:border-[#E11D48]"
              />
            </div>

            {/* Main Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-[3px] bg-gradient-to-r from-[#E11D48] via-[#F43F5E] to-[#BE185D] text-white text-xs font-sans font-bold uppercase tracking-[0.22em] shadow-lg shadow-pink-500/25 hover:from-[#BE185D] hover:to-[#9D174D] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {authMode === 'create' ? 'Create Account ✦' : 'Log In to Lookbook'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Guest Preview Button */}
          <div className="pt-3 border-t border-[#F472B6]/20 text-center space-y-2">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-[11px] font-sans font-semibold tracking-wider text-[#BE185D] hover:text-[#E11D48] transition-colors uppercase inline-flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-[#FDF2F4]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>Explore as Guest / Studio Demo →</span>
            </button>
            <p className="text-[9px] font-sans text-[#2B2420]/50 tracking-wider">
              No password needed to preview all fits, mirror snaps, and friend feeds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
