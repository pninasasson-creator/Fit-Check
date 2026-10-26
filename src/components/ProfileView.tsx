import React, { useState, useRef, useMemo } from 'react';
import { Profile, ProfileStatus, Fit } from '../config/supabase';
import { cropAndResizeToSquare, formatToDateKey } from '../utils/image';
import { dataService } from '../services/dataService';
import { UserAvatar } from './UserAvatar';
import {
  Camera,
  LogOut,
  Tag,
  Plus,
  X,
  Briefcase,
  GraduationCap,
  Palmtree,
  Flame,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface ProfileViewProps {
  profile: Profile | null;
  fitsCount: number;
  fits?: Fit[];
  onLogout: () => void;
  onProfileUpdated?: (updated: Profile) => void;
  isGuest?: boolean;
  onOpenAuth?: (isSignUp?: boolean) => void;
}

const POPULAR_BRAND_SUGGESTIONS = [
  'Aritzia',
  'Free People',
  'Garage',
  'Alo Yoga',
  'Lululemon',
  'Anthropologie',
  'Reformation',
  'Brandy Melville',
  'Abercrombie',
  'Oak + Fort',
  'Zara',
  'Djerf Avenue',
  'COS',
  "Levi's",
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  fitsCount,
  fits = [],
  onLogout,
  onProfileUpdated,
  isGuest = false,
  onOpenAuth,
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [brandInput, setBrandInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Calculate day streak
  const streak = useMemo(() => {
    if (!fits || fits.length === 0) return 0;
    const dateSet = new Set(fits.map((f) => f.date));
    let count = 0;
    const current = new Date();
    const todayStr = formatToDateKey(current);
    const checkDate = new Date(current);

    // If today hasn't been logged yet, start checking from yesterday so active streak doesn't prematurely show 0
    if (!dateSet.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (dateSet.has(formatToDateKey(checkDate))) {
      count++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return count;
  }, [fits]);

  // Avatar upload handler: Crops square & resizes to 400px, uploads to 'avatars' bucket at <user_id>/avatar.jpg
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsUploadingAvatar(true);
    setStatusMessage(null);

    try {
      const { blob } = await cropAndResizeToSquare(file, 400, 0.88);
      const uploadedUrl = await dataService.uploadAvatar(profile.id, blob);
      const updatedProfile = await dataService.updateProfileAvatar(profile.id, uploadedUrl);

      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
      setStatusMessage('Avatar updated successfully!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      setStatusMessage('Could not update avatar. Please retry.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  // Add a brand tag
  const handleAddBrand = async (brandName: string) => {
    if (!profile) return;
    const trimmed = brandName.trim();
    if (!trimmed) return;

    const currentTags = profile.style_tags || [];
    if (currentTags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setBrandInput('');
      return;
    }

    const nextTags = [...currentTags, trimmed];
    try {
      const updated = await dataService.updateProfileStyleTags(profile.id, nextTags);
      if (onProfileUpdated) onProfileUpdated(updated);
      setBrandInput('');
      setIsAddingBrand(false);
    } catch (err) {
      console.error('Failed to save brand tag:', err);
    }
  };

  // Remove a brand tag
  const handleRemoveBrand = async (brandToRemove: string) => {
    if (!profile) return;
    const currentTags = profile.style_tags || [];
    const nextTags = currentTags.filter((t) => t !== brandToRemove);

    try {
      const updated = await dataService.updateProfileStyleTags(profile.id, nextTags);
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch (err) {
      console.error('Failed to remove brand tag:', err);
    }
  };

  // Switch status ('student' | 'working' | 'vacation')
  const handleStatusChange = async (newStatus: ProfileStatus) => {
    if (!profile || profile.status === newStatus) return;
    try {
      const updated = await dataService.updateProfileStatus(profile.id, newStatus);
      if (onProfileUpdated) onProfileUpdated(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const styleTags = profile?.style_tags || [];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-28">
      {/* Editorial Header */}
      <div className="px-1 flex items-baseline justify-between border-b border-[#F472B6]/20 pb-3">
        <div>
          <span className="text-[10px] tracking-[0.25em] uppercase font-sans font-semibold text-[#BE185D] block">
            Archivist Profile
          </span>
          <h2 className="font-bodoni italic text-3xl sm:text-4xl text-[#2B2420]">
            Profile & Style
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
          <span className="text-[11px] font-sans uppercase tracking-[0.15em] text-[#BE185D] font-medium">
            Active Archivist
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-[#FCE7F3] border border-[#F472B6]/40 text-[#BE185D] text-xs font-sans px-3.5 py-2 rounded-[3px] flex items-center justify-between animate-in fade-in">
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-[#BE185D] hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Simplified Profile Card */}
      <div className="film-frame p-6 sm:p-7 bg-[#FAF7F2] space-y-6 shadow-xs">
        {/* Avatar, Display Name, Username */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative group">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="relative rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#E11D48] focus:ring-offset-2 transition-transform hover:scale-105"
              title="Tap to change avatar"
            >
              <UserAvatar
                avatarUrl={profile?.avatar_url}
                name={profile?.display_name || profile?.username}
                size="xl"
                className="border-2 border-[#BE185D]/40 shadow-sm"
              />

              {/* Camera Icon Overlay */}
              <div className="absolute bottom-0 right-0 p-1.5 bg-[#BE185D] text-[#FFFDFD] rounded-full shadow-md group-hover:bg-[#9D174D] transition-colors border border-white">
                <Camera strokeWidth={1.6} className="w-3.5 h-3.5" />
              </div>

              {/* Uploading Spinner */}
              {isUploadingAvatar && (
                <div className="absolute inset-0 bg-[#2B2420]/50 backdrop-blur-xs rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#FCE7F3] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              className="hidden"
            />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <h3 className="font-bodoni text-2xl text-[#2B2420]">
                {profile?.display_name || (isGuest ? 'Guest Archivist' : 'Archivist')}
              </h3>
              {isGuest && (
                <span className="px-2 py-0.5 rounded-full bg-[#FCE7F3] border border-[#F472B6]/40 text-[#BE185D] text-[9px] uppercase font-sans font-bold tracking-wider">
                  Guest
                </span>
              )}
            </div>
            <p className="text-xs font-sans text-[#2B2420]/60 lowercase tracking-wide mt-0.5">
              @{profile?.username || (isGuest ? 'guest' : 'member')}
            </p>
          </div>
        </div>

        {/* Editable Status Label */}
        <div className="pt-4 border-t border-[#F472B6]/20 space-y-2">
          <span className="text-[10px] uppercase font-sans tracking-[0.2em] text-[#BE185D] font-semibold block text-center sm:text-left">
            Editable Status
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleStatusChange('student')}
              className={`py-2 px-3 rounded-[3px] text-[10px] uppercase tracking-wider font-sans font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                profile?.status === 'student' || !profile?.status
                  ? 'bg-[#BE185D] text-white border-[#BE185D] shadow-xs'
                  : 'bg-[#FFFDFD] text-[#2B2420]/75 border-[#F472B6]/30 hover:border-[#BE185D]'
              }`}
            >
              <GraduationCap strokeWidth={1.5} className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('working')}
              className={`py-2 px-3 rounded-[3px] text-[10px] uppercase tracking-wider font-sans font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                profile?.status === 'working'
                  ? 'bg-[#BE185D] text-white border-[#BE185D] shadow-xs'
                  : 'bg-[#FFFDFD] text-[#2B2420]/75 border-[#F472B6]/30 hover:border-[#BE185D]'
              }`}
            >
              <Briefcase strokeWidth={1.5} className="w-3.5 h-3.5" />
              <span>Working</span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('vacation')}
              className={`py-2 px-3 rounded-[3px] text-[10px] uppercase tracking-wider font-sans font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                profile?.status === 'vacation'
                  ? 'bg-[#BE185D] text-white border-[#BE185D] shadow-xs'
                  : 'bg-[#FFFDFD] text-[#2B2420]/75 border-[#F472B6]/30 hover:border-[#BE185D]'
              }`}
            >
              <Palmtree strokeWidth={1.5} className="w-3.5 h-3.5" />
              <span>Vacation</span>
            </button>
          </div>
        </div>

        {/* Basic Stats: Fits Logged & Streak */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#F472B6]/20">
          <div className="p-3.5 rounded-[3px] bg-[#FFFDFD] border border-[#F472B6]/25 text-center shadow-xs">
            <span className="font-bodoni italic text-3xl text-[#BE185D] block">
              {fitsCount}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#2B2420]/60 font-sans font-medium flex items-center justify-center gap-1 mt-0.5">
              <Calendar strokeWidth={1.4} className="w-3 h-3 text-[#BE185D]" />
              <span>Fits Logged</span>
            </span>
          </div>

          <div className="p-3.5 rounded-[3px] bg-[#FFFDFD] border border-[#F472B6]/25 text-center shadow-xs">
            <span className="font-bodoni italic text-3xl text-[#E11D48] block">
              {streak} {streak === 1 ? 'Day' : 'Days'}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#2B2420]/60 font-sans font-medium flex items-center justify-center gap-1 mt-0.5">
              <Flame strokeWidth={1.4} className="w-3 h-3 text-[#E11D48]" />
              <span>Logging Streak</span>
            </span>
          </div>
        </div>

        {/* Editable Favorite Brands Chips */}
        <div className="pt-4 border-t border-[#F472B6]/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag strokeWidth={1.4} className="w-4 h-4 text-[#E11D48]" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#BE185D] font-semibold">
                Favorite Brands ({styleTags.length})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingBrand(!isAddingBrand)}
              className="text-[10px] uppercase font-sans tracking-[0.15em] font-semibold text-[#BE185D] hover:text-[#9D174D] flex items-center gap-1 cursor-pointer"
            >
              <Plus strokeWidth={1.5} className="w-3 h-3" />
              <span>{isAddingBrand ? 'Done' : 'Add Brand'}</span>
            </button>
          </div>

          {/* Active Chips with Remove Buttons */}
          <div className="flex flex-wrap gap-2">
            {styleTags.length > 0 ? (
              styleTags.map((brand) => (
                <span
                  key={brand}
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-[0.12em] font-sans text-[#BE185D] bg-[#FFFDFD] rounded-[3px] border border-[#F472B6]/40 font-semibold shadow-xs hover:border-[#BE185D] transition-colors"
                >
                  <span>#{brand}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBrand(brand)}
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[#BE185D]/60 hover:text-white hover:bg-[#E11D48] transition-colors cursor-pointer"
                    title={`Remove ${brand}`}
                  >
                    <X strokeWidth={1.8} className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))
            ) : (
              <div className="w-full py-4 text-center rounded-[3px] bg-[#FFFDFD] border border-dashed border-[#F472B6]/40 text-xs font-sans text-[#BE185D]/70 italic">
                No favorite brands saved yet. Tap "Add Brand" or select suggestions below.
              </div>
            )}
          </div>

          {/* Inline Add Brand Input */}
          {isAddingBrand && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddBrand(brandInput);
              }}
              className="pt-1 flex items-center gap-2"
            >
              <input
                type="text"
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                placeholder="Enter brand name (e.g. Aritzia, Alo Yoga)..."
                className="flex-1 bg-[#FFFDFD] border border-[#F472B6]/50 rounded-[3px] px-3 py-2 text-xs text-[#2B2420] focus:outline-none focus:border-[#BE185D] shadow-xs"
                autoFocus
              />
              <button
                type="submit"
                disabled={!brandInput.trim()}
                className="py-2 px-4 rounded-[3px] bg-[#BE185D] text-white text-xs uppercase font-sans tracking-wider font-semibold hover:bg-[#9D174D] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                Add
              </button>
            </form>
          )}

          {/* Popular Brand Quick Suggestions */}
          <div className="pt-2">
            <span className="text-[10px] uppercase font-sans tracking-[0.18em] text-[#2B2420]/60 font-medium block mb-2">
              Popular Brand Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_BRAND_SUGGESTIONS.filter(
                (b) => !styleTags.some((t) => t.toLowerCase() === b.toLowerCase())
              ).slice(0, 8).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleAddBrand(suggestion)}
                  className="px-2.5 py-1 rounded-[2px] bg-[#FFFDFD] border border-[#2B2420]/15 text-[10px] uppercase font-sans tracking-wider text-[#2B2420]/80 hover:text-[#BE185D] hover:border-[#BE185D]/40 transition-colors cursor-pointer"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Log Out Button */}
        <div className="pt-4 border-t border-[#F472B6]/20">
          {isGuest ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onOpenAuth?.(true)}
                className="w-full py-2.5 px-4 rounded-[3px] bg-gradient-to-r from-[#E11D48] to-[#BE185D] text-white text-xs uppercase tracking-[0.2em] font-sans font-bold hover:opacity-95 shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create Personal Account</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 px-4 rounded-[3px] border border-[#2B2420]/25 text-xs uppercase tracking-[0.2em] font-sans text-[#BE185D] hover:bg-[#FDF2F4] transition-colors flex items-center justify-center gap-2 font-medium cursor-pointer"
              >
                <LogOut strokeWidth={1.4} className="w-3.5 h-3.5" />
                <span>Exit Guest Mode</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-[3px] border border-[#2B2420]/25 text-xs uppercase tracking-[0.2em] font-sans text-[#BE185D] hover:bg-[#FDF2F4] transition-colors flex items-center justify-center gap-2 font-medium cursor-pointer"
            >
              <LogOut strokeWidth={1.4} className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
