/**
 * Fit Check · Daily Outfit Lookbook Web App
 * 
 * Aesthetic: Editorial fashion lookbook / printed magazine zine.
 * Fonts: Italiana (wordmark), Bodoni Moda (headings & dates), Hanken Grotesk (body & buttons).
 * Palette: warm paper #F6F1EA, soft espresso #2B2420, oxblood #6B1E2B, dusty blush #E9C9C3, sage #C9D3C0.
 * Backend: Supabase Auth, PostgreSQL DB, and Storage bucket 'fits'.
 */

import React, { useState, useEffect } from 'react';
import { Navigation, TabType } from './components/Navigation';
import { SnapView } from './components/SnapView';
import { CalendarView } from './components/CalendarView';
import { FeedView } from './components/FeedView';
import { FriendsView } from './components/FriendsView';
import { ProfileView } from './components/ProfileView';
import { FitDetailCard } from './components/FitDetailCard';
import { WeekInReviewModal } from './components/WeekInReviewModal';
import { AuthModal } from './components/AuthModal';
import { LandingHero } from './components/LandingHero';
import { TagEditorModal } from './components/TagEditorModal';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { MirrorCollageModalBackdrop } from './components/MirrorCollageModalBackdrop';
import { UserAvatar } from './components/UserAvatar';
import { dataService, AuthState, DEMO_GUEST_PROFILE } from './services/dataService';
import { Fit, FitItem, Profile, isSupabaseConfigured, getSupabase } from './config/supabase';
import { formatToDateKey, formatEditorialDate } from './utils/image';
import {
  X,
  Sparkles,
  AlertTriangle,
  Home,
  Compass,
  Users,
  Camera,
  Calendar,
  User,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isSupabaseLive: false,
    isGuest: false,
    loading: true,
  });

  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [fits, setFits] = useState<Fit[]>([]);
  const [selectedDateForSnap, setSelectedDateForSnap] = useState<string | null>(null);
  const [selectedFitForModal, setSelectedFitForModal] = useState<Fit | null>(null);
  const [showWeekReview, setShowWeekReview] = useState<boolean>(false);
  const [weekReviewDate, setWeekReviewDate] = useState<Date>(new Date());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);
  const [editingFitTags, setEditingFitTags] = useState<Fit | null>(null);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  const todayKey = formatToDateKey(new Date());
  const todayFit = fits.find((f) => f.date === todayKey) || null;

  // Initialize session and attach Supabase auth state change listener
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const session = await dataService.getInitialSession();
        if (!mounted) return;

        setAuthState(session);

        if (session.user) {
          setShowLanding(false);

          if (!session.profile) {
            setShowProfileSetup(true);
          } else {
            const userFits = await dataService.getFits(session.user.id, false);
            if (mounted) setFits(userFits);
          }
        } else {
          // No session: strictly show landing page
          setShowLanding(true);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        if (mounted) {
          setShowLanding(true);
        }
      }
    }

    init();

    // Listen to real-time auth changes from Supabase
    const supabase = getSupabase();
    let authSubscription: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session?.user) {
          const user = { id: session.user.id, email: session.user.email || '' };
          const profile = await dataService.fetchSupabaseProfile(user.id);

          setAuthState({
            user,
            profile,
            isSupabaseLive: true,
            isGuest: false,
            loading: false,
          });
          setShowLanding(false);

          if (!profile) {
            setShowProfileSetup(true);
          } else {
            const userFits = await dataService.getFits(user.id, false);
            if (mounted) setFits(userFits);
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            profile: null,
            isSupabaseLive: isSupabaseConfigured(),
            isGuest: false,
            loading: false,
          });
          setFits([]);
          setShowLanding(true);
          setShowProfileSetup(false);
        }
      });
      authSubscription = data?.subscription;
    }

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  // Reload fits when user changes
  const refreshFits = async (userId: string, isGuest = false) => {
    try {
      const userFits = await dataService.getFits(userId, isGuest);
      setFits(userFits);
    } catch (err) {
      console.error('Failed to reload fits:', err);
    }
  };

  const handleFitSaved = (savedFit: Fit) => {
    setFits((prev) => {
      const existingIdx = prev.findIndex((f) => f.date === savedFit.date);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = savedFit;
        return copy;
      }
      return [savedFit, ...prev];
    });
  };

  const handleDeleteFit = async (fitToDelete: Fit) => {
    if (!authState.user) return;
    try {
      await dataService.deleteFit(fitToDelete.id, authState.user.id, fitToDelete.date);
      setFits((prev) => prev.filter((f) => f.id !== fitToDelete.id));
      setSelectedFitForModal(null);
    } catch (err) {
      console.error('Delete fit failed:', err);
    }
  };

  const handleGuestEnter = () => {
    setAuthState({
      user: { id: DEMO_GUEST_PROFILE.id, email: 'guest@fitcheck.lookbook' },
      profile: DEMO_GUEST_PROFILE,
      isSupabaseLive: false,
      isGuest: true,
      loading: false,
    });
    setShowLanding(false);
    setShowAuthModal(false);
    setShowProfileSetup(false);
    dataService.getFits(DEMO_GUEST_PROFILE.id, true).then((demoFits) => {
      setFits(demoFits);
    });
    setActiveTab('feed');
  };

  const handleAuthSuccess = async (user: any, profile: Profile | null) => {
    setAuthState({
      user,
      profile,
      isSupabaseLive: isSupabaseConfigured(),
      isGuest: false,
      loading: false,
    });
    setShowAuthModal(false);
    setShowLanding(false);

    if (!profile) {
      setShowProfileSetup(true);
    } else {
      const userFits = await dataService.getFits(user.id, false);
      setFits(userFits);
      setActiveTab('feed');
    }
  };

  const handleProfileSetupComplete = async (profileData: Profile) => {
    try {
      const saved = await dataService.saveProfile(profileData);
      setAuthState((prev) => ({
        ...prev,
        profile: saved,
      }));
      setShowProfileSetup(false);
      if (authState.user?.id) {
        const userFits = await dataService.getFits(authState.user.id, false);
        setFits(userFits);
      }
      setActiveTab('feed');
    } catch (err) {
      console.error('Profile setup complete error:', err);
      setShowProfileSetup(false);
    }
  };

  const handleLogout = async () => {
    await dataService.signOut();
    setAuthState({
      user: null,
      profile: null,
      isSupabaseLive: isSupabaseConfigured(),
      isGuest: false,
      loading: false,
    });
    setFits([]);
    setShowLanding(true);
    setShowAuthModal(false);
    setShowProfileSetup(false);
  };

  const handleOpenWeekReview = (date: Date) => {
    setWeekReviewDate(date);
    setShowWeekReview(true);
  };

  if (showLanding) {
    return (
      <LandingHero
        isLoggedIn={Boolean(authState.user && !authState.isGuest)}
        onEnterApp={() => setShowLanding(false)}
        onAuthSuccess={handleAuthSuccess}
        onContinueAsGuest={handleGuestEnter}
      />
    );
  }

  const isGuestMode = authState.isGuest || !authState.user;

  return (
    <div className="min-h-screen bg-[#FAF5F5] text-[#2B2420] flex flex-col justify-between selection:bg-[#FCE7F3] selection:text-[#BE185D] lg:pl-64">
      {/* Desktop Fixed Left Sidebar (lg: screens) */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 w-64 bg-[#FFFDFD] border-r border-[#F472B6]/25 z-40 flex-col justify-between p-6 shadow-xs">
        {/* Top: Wordmark & Navigation */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#F472B6]/20">
            <div>
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#BE185D] font-sans font-semibold block">
                Daily Lookbook
              </span>
              <h1
                onClick={() => setActiveTab('feed')}
                className="font-italiana text-3xl tracking-wider text-[#2B2420] cursor-pointer hover:text-[#E11D48] transition-colors"
              >
                FIT CHECK
              </h1>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5 font-sans">
            <button
              type="button"
              onClick={() => setActiveTab('feed')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[3px] text-xs uppercase tracking-[0.16em] font-semibold transition-all ${
                activeTab === 'feed'
                  ? 'bg-[#FDF2F4] text-[#BE185D] border border-[#F472B6]/40 shadow-xs'
                  : 'text-[#2B2420]/75 hover:bg-[#FDF2F4]/50 hover:text-[#BE185D]'
              }`}
            >
              <Compass strokeWidth={1.5} className="w-4 h-4 text-[#E11D48]" />
              <span>Feed</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('friends')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[3px] text-xs uppercase tracking-[0.16em] font-semibold transition-all ${
                activeTab === 'friends'
                  ? 'bg-[#FDF2F4] text-[#BE185D] border border-[#F472B6]/40 shadow-xs'
                  : 'text-[#2B2420]/75 hover:bg-[#FDF2F4]/50 hover:text-[#BE185D]'
              }`}
            >
              <Users strokeWidth={1.5} className="w-4 h-4 text-[#E11D48]" />
              <span>Friends</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedDateForSnap(null);
                setActiveTab('snap');
              }}
              className={`w-full flex items-center justify-center gap-2.5 px-3.5 py-3 rounded-[3px] text-xs uppercase tracking-[0.18em] font-bold transition-all shadow-xs my-2 cursor-pointer ${
                activeTab === 'snap'
                  ? 'bg-gradient-to-r from-[#E11D48] to-[#BE185D] text-white border border-[#E11D48]'
                  : 'bg-gradient-to-r from-[#BE185D] to-[#E11D48] text-white hover:opacity-95'
              }`}
            >
              <Camera strokeWidth={1.6} className="w-4 h-4" />
              <span>Check Fit</span>
              {todayFit && (
                <span className="w-2 h-2 rounded-full bg-white ml-auto" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fits')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[3px] text-xs uppercase tracking-[0.16em] font-semibold transition-all ${
                activeTab === 'fits'
                  ? 'bg-[#FDF2F4] text-[#BE185D] border border-[#F472B6]/40 shadow-xs'
                  : 'text-[#2B2420]/75 hover:bg-[#FDF2F4]/50 hover:text-[#BE185D]'
              }`}
            >
              <Calendar strokeWidth={1.5} className="w-4 h-4 text-[#E11D48]" />
              <span>My Fits</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[3px] text-xs uppercase tracking-[0.16em] font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#FDF2F4] text-[#BE185D] border border-[#F472B6]/40 shadow-xs'
                  : 'text-[#2B2420]/75 hover:bg-[#FDF2F4]/50 hover:text-[#BE185D]'
              }`}
            >
              <User strokeWidth={1.5} className="w-4 h-4 text-[#E11D48]" />
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Bottom of Sidebar: Mirror Wall Button & User Mini-Card */}
        <div className="pt-4 border-t border-[#F472B6]/20 space-y-3">
          <button
            type="button"
            onClick={() => setShowLanding(true)}
            className="w-full py-2 px-3 rounded-[3px] bg-[#FDF2F4] border border-[#F472B6]/40 text-[10px] uppercase tracking-[0.16em] font-sans font-bold text-[#BE185D] hover:bg-[#FCE7F3] transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>Mirror Wallpaper</span>
          </button>

          <div
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-3 p-2 rounded-[3px] hover:bg-[#FDF2F4] cursor-pointer transition-colors"
          >
            <UserAvatar
              avatarUrl={authState.profile?.avatar_url}
              name={authState.profile?.display_name || authState.profile?.username}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="font-bodoni font-semibold text-xs text-[#2B2420] truncate">
                {authState.profile?.display_name || 'Archivist'}
              </p>
              <p className="text-[10px] font-sans text-[#2B2420]/60 lowercase truncate">
                @{authState.profile?.username || 'member'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Desktop Top Header Bar (lg: screens) */}
      <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-[#FFFDFD]/80 backdrop-blur-md border-b border-[#F472B6]/20 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="font-bodoni italic text-xl text-[#2B2420]">
            {activeTab === 'feed' && 'Daily Lookbook Stream'}
            {activeTab === 'friends' && 'Friends & Style Network'}
            {activeTab === 'snap' && "Capture Today's Fit"}
            {activeTab === 'fits' && 'Lookbook Archive Calendar'}
            {activeTab === 'profile' && 'Wardrobe Dossier'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[11px] uppercase tracking-[0.18em] font-sans text-[#BE185D] font-semibold">
            {formatEditorialDate(new Date())}
          </span>
          {authState.profile?.status && (
            <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-sans tracking-wider font-semibold bg-[#FCE7F3] text-[#BE185D] border border-[#F472B6]/40">
              ● {authState.profile.status}
            </span>
          )}
        </div>
      </header>

      {/* Mobile Top Header (< lg screens) */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#FFFDFD]/90 backdrop-blur-md border-b border-[#F472B6]/25 px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#BE185D] font-sans font-semibold block">
              Daily Lookbook
            </span>
            <h1
              onClick={() => setActiveTab('feed')}
              className="font-italiana text-2xl tracking-wider text-[#2B2420] cursor-pointer hover:text-[#E11D48] transition-colors"
            >
              FIT CHECK
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowLanding(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-[#FDF2F4] border border-[#F472B6]/40 text-[9px] uppercase tracking-[0.16em] font-sans font-bold text-[#BE185D] hover:bg-[#FCE7F3] transition-colors shadow-xs cursor-pointer"
              title="View Homepage & Mirror Wall"
            >
              <Sparkles className="w-3 h-3 text-[#E11D48]" />
              <span>Home</span>
            </button>

            {/* Profile Avatar Trigger with pink fallback */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="focus:outline-none cursor-pointer"
            >
              <UserAvatar
                avatarUrl={authState.profile?.avatar_url}
                name={authState.profile?.display_name || authState.profile?.username}
                size="sm"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Guest Mode Persistent Notice Banner */}
      {authState.isGuest && (
        <div className="bg-gradient-to-r from-[#FCE7F3] via-[#FFFDFD] to-[#FCE7F3] border-b border-[#F472B6]/40 px-4 py-2 flex items-center justify-between text-xs font-sans shadow-xs z-20">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-[#E11D48] text-white text-[9px] uppercase tracking-wider font-bold shadow-xs">
              Guest Mode
            </span>
            <span className="hidden sm:inline text-[#2B2420]/80">
              Exploring demo looks. Create your personal account to save fits & mirror selfies to Supabase.
            </span>
            <span className="sm:hidden text-[#2B2420]/80 text-[11px]">
              Demo fits only.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="px-2.5 py-1 rounded-[3px] bg-gradient-to-r from-[#E11D48] to-[#BE185D] text-white text-[10px] uppercase font-bold tracking-wider hover:opacity-95 shadow-xs cursor-pointer"
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[10px] uppercase tracking-wider text-[#BE185D] hover:underline cursor-pointer"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area (Wide on Desktop max-w-6xl, centered max-w-md on mobile) */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {activeTab === 'feed' && (
          <FeedView
            currentUserProfile={authState.profile}
            userFits={fits}
            isGuest={isGuestMode}
            onSnapPrompt={() => {
              setSelectedDateForSnap(null);
              setActiveTab('snap');
            }}
          />
        )}

        {activeTab === 'friends' && (
          <FriendsView
            currentUserId={authState.user?.id}
            isGuest={isGuestMode}
          />
        )}

        {activeTab === 'snap' && (
          <SnapView
            userId={authState.user?.id || 'guest-user'}
            todayFit={todayFit}
            targetDate={selectedDateForSnap || undefined}
            isGuest={isGuestMode}
            targetFit={selectedDateForSnap ? fits.find((f) => f.date === selectedDateForSnap) || null : todayFit}
            onClearTargetDate={() => setSelectedDateForSnap(null)}
            onSetTargetDate={(dateStr) => setSelectedDateForSnap(dateStr)}
            onFitSaved={handleFitSaved}
            onDeleteFit={handleDeleteFit}
            allFits={fits}
          />
        )}

        {activeTab === 'fits' && (
          <CalendarView
            fits={fits}
            onSelectFit={(fit) => setSelectedFitForModal(fit)}
            onOpenWeekReview={handleOpenWeekReview}
            onSnapDay={(dateStr) => {
              setSelectedDateForSnap(dateStr);
              setActiveTab('snap');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            profile={authState.profile}
            fitsCount={fits.length}
            fits={fits}
            isGuest={authState.isGuest}
            onOpenAuth={() => setShowAuthModal(true)}
            onLogout={handleLogout}
            onProfileUpdated={(updated) => {
              setAuthState((prev) => ({ ...prev, profile: updated }));
            }}
          />
        )}
      </main>

      {/* Detail Modal for Selected Past Fit (Centered large modal on desktop max-w-4xl) */}
      {selectedFitForModal && (
        <MirrorCollageModalBackdrop onBackdropClick={() => setSelectedFitForModal(null)} className="w-full max-w-4xl">
          <div className="w-full bg-[#FAF7F2] border border-[#F472B6]/40 rounded-[3px] p-5 sm:p-6 shadow-2xl relative my-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F472B6]/20">
              <span className="text-[10px] tracking-[0.2em] uppercase font-sans font-semibold text-[#BE185D]">
                Fit Archive Entry
              </span>
              <button
                type="button"
                onClick={() => setSelectedFitForModal(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#2B2420]/60 hover:text-[#2B2420] hover:bg-black/5 transition-colors"
              >
                <X strokeWidth={1.4} className="w-5 h-5" />
              </button>
            </div>

            <FitDetailCard
              fit={selectedFitForModal}
              onEditTags={(fit) => {
                setEditingFitTags(fit);
                setSelectedFitForModal(null);
              }}
              onDeleteFit={handleDeleteFit}
              isOwner={true}
              allFits={fits}
              onSelectFit={(fit) => setSelectedFitForModal(fit)}
            />
          </div>
        </MirrorCollageModalBackdrop>
      )}

      {/* Edit Existing Fit Tags Modal */}
      {editingFitTags && (
        <MirrorCollageModalBackdrop onBackdropClick={() => setEditingFitTags(null)} className="w-full max-w-md">
          <div className="w-full bg-[#FAF7F2] border border-[#F472B6]/40 rounded-[3px] p-5 shadow-2xl relative my-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2420]/15">
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase font-sans font-medium text-[#2B2420]/60 block">
                  Modify Archive
                </span>
                <h3 className="font-bodoni italic text-xl text-[#2B2420]">
                  Edit Tags · {formatEditorialDate(editingFitTags.date)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingFitTags(null)}
                className="text-[#2B2420]/60 hover:text-[#2B2420]"
              >
                ✕
              </button>
            </div>

            {/* List of tags */}
            <div className="space-y-2 max-h-64 overflow-y-auto divide-y divide-[#2B2420]/10">
              {editingFitTags.items.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveTagIndex(idx)}
                  className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#F6F1EA] px-2 rounded-[2px]"
                >
                  <div>
                    <span className="text-[10px] uppercase font-sans tracking-widest text-[#6B1E2B] block">
                      {item.category}
                    </span>
                    <span className="text-xs font-sans text-[#2B2420] font-medium lowercase">
                      {item.brand ? `${item.brand} — ${item.description}` : item.description}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#2B2420]/50 uppercase tracking-wider font-sans">
                    Edit
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#2B2420]/15 flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  if (authState.user) {
                    await dataService.saveFit(
                      authState.user.id,
                      editingFitTags.date,
                      editingFitTags.image_url,
                      editingFitTags.items
                    );
                    handleFitSaved(editingFitTags);
                  }
                  setEditingFitTags(null);
                }}
                className="px-5 py-2.5 rounded-[2px] bg-[#6B1E2B] text-[#F6F1EA] text-xs uppercase tracking-[0.2em] font-sans hover:bg-[#521721] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </MirrorCollageModalBackdrop>
      )}

      {/* Active Tag Editor Bottom Sheet for Edit Flow */}
      {editingFitTags && activeTagIndex !== null && (
        <TagEditorModal
          isOpen={true}
          tag={editingFitTags.items[activeTagIndex]}
          onSave={(updated) => {
            const nextItems = [...editingFitTags.items];
            nextItems[activeTagIndex] = updated;
            setEditingFitTags({ ...editingFitTags, items: nextItems });
            setActiveTagIndex(null);
          }}
          onDelete={() => {
            const nextItems = editingFitTags.items.filter((_, i) => i !== activeTagIndex);
            setEditingFitTags({ ...editingFitTags, items: nextItems });
            setActiveTagIndex(null);
          }}
          onClose={() => setActiveTagIndex(null)}
        />
      )}

      {/* Week in Review Instagram Story Modal */}
      <WeekInReviewModal
        isOpen={showWeekReview}
        onClose={() => setShowWeekReview(false)}
        fits={fits}
        initialDate={weekReviewDate}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        onContinueAsGuest={handleGuestEnter}
      />

      {/* Step 01: Profile & Style Tags Setup Modal */}
      <ProfileSetupModal
        isOpen={showProfileSetup}
        initialProfile={
          authState.profile ||
          (authState.user
            ? {
                id: authState.user.id,
                username: '',
                display_name: '',
                status: 'student',
                style_tags: [],
              }
            : null)
        }
        onComplete={handleProfileSetupComplete}
      />

      {/* Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasPostedToday={Boolean(todayFit)}
      />
    </div>
  );
}
