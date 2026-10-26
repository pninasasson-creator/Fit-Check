import React, { useState, useRef } from 'react';
import { Profile, ProfileStatus } from '../config/supabase';
import { compressAndResizeImage } from '../utils/image';
import { dataService } from '../services/dataService';
import { Camera, Check, ArrowRight, Plus, GraduationCap, Briefcase, Palmtree } from 'lucide-react';
import { MirrorCollageModalBackdrop } from './MirrorCollageModalBackdrop';

interface ProfileSetupModalProps {
  isOpen: boolean;
  initialProfile?: Profile | null;
  onComplete: (profile: Profile) => void;
}

export const POPULAR_BRAND_TAGS = [
  'Free People',
  'Aritzia',
  'Garage',
  'Alo Yoga',
  'Lululemon',
  'Anthropologie',
  'Brandy Melville',
  'Zara',
  'Urban Outfitters',
  'Reformation',
  'Skims',
  'Abercrombie',
  'Princess Polly',
  'Djerf Avenue',
  'Aerie',
  'Edikted',
  'PacSun',
  "Levi's",
  'COS',
  'Frankies Bikinis',
  'Mango',
];

export const AVAILABLE_STYLE_TAGS = POPULAR_BRAND_TAGS;

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  isOpen,
  initialProfile,
  onComplete,
}) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Form starts empty: no pre-filled name, username, photo, or brands
  const [displayName, setDisplayName] = useState(initialProfile?.display_name || '');
  const [username, setUsername] = useState(initialProfile?.username || '');
  const [status, setStatus] = useState<ProfileStatus>(
    (initialProfile?.status as ProfileStatus) ||
      (initialProfile?.bio === 'working' || initialProfile?.bio === 'vacation'
        ? initialProfile.bio
        : 'student')
  );
  const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialProfile?.style_tags && initialProfile.style_tags.length > 0
      ? initialProfile.style_tags
      : []
  );
  const [customBrandInput, setCustomBrandInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { blob, dataUrl } = await compressAndResizeImage(file, 400, 0.88);
      setAvatarUrl(dataUrl);

      // If user ID exists, upload
      const userId = initialProfile?.id || `local-${Date.now()}`;
      try {
        const uploaded = await dataService.uploadPhoto(userId, blob);
        if (uploaded) setAvatarUrl(uploaded);
      } catch (uploadErr) {
        console.warn('Upload fallback to dataUrl:', uploadErr);
      }
    } catch (err: any) {
      console.error('Avatar processing error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomBrand = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customBrandInput.trim();
    if (!trimmed) return;
    if (!selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    setCustomBrandInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Please choose an archival username.');
      return;
    }

    const userId = initialProfile?.id;
    if (!userId) {
      setErrorMsg('No active user found. Please try signing up again.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

    const profileData: Profile = {
      id: userId,
      username: cleanUsername,
      display_name: displayName.trim() || cleanUsername,
      avatar_url: avatarUrl,
      status: status,
      bio: status,
      style_tags: selectedTags,
    };

    try {
      const saved = await dataService.saveProfile(profileData);
      onComplete(saved);
    } catch (err: any) {
      console.error('Failed to save profile setup:', err);
      let msg = err?.message || 'Failed to save profile. Please try again.';
      if (
        err?.code === '23505' ||
        msg.toLowerCase().includes('unique') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('duplicate key')
      ) {
        msg = `The username "@${cleanUsername}" is already taken. Please choose another username.`;
      }
      setErrorMsg(msg);
    }
  };

  return (
    <MirrorCollageModalBackdrop>
      <div className="w-full max-w-md bg-[#FAF5F5] border border-[#F472B6]/40 rounded-[4px] p-6 shadow-2xl relative my-auto space-y-5">
        {/* Editorial Pink Header */}
        <div className="text-center space-y-1">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-[0.25em] bg-[#FCE7F3] text-[#BE185D] border border-[#F472B6]/40 font-sans font-semibold">
            Step 01 · Welcome Archivist
          </span>
          <h2 className="font-bodoni italic text-3xl text-[#2B2420]">
            Curate Your Profile
          </h2>
          <p className="text-xs font-sans text-[#2B2420]/70 max-w-xs mx-auto">
            Set your status, mirror selfie avatar, and favorite brands you wear.
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-[#FCE7F3] border border-[#F43F5E]/30 text-xs text-[#BE185D] rounded-[2px] font-sans">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload Box with Rosy Accents */}
          <div className="flex flex-col items-center space-y-2">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="group relative w-20 h-20 rounded-[3px] overflow-hidden border-2 border-dashed border-[#F472B6]/50 hover:border-[#E11D48] bg-[#FCE7F3]/40 flex items-center justify-center cursor-pointer transition-all shadow-inner"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#BE185D]/70 group-hover:text-[#BE185D]">
                  <Camera strokeWidth={1.3} className="w-7 h-7 mb-1" />
                  <span className="text-[9px] uppercase tracking-wider font-sans font-semibold">
                    Add Pic
                  </span>
                </div>
              )}

              {/* Pink Camera Badge */}
              <div className="absolute bottom-0 right-0 p-1 bg-[#E11D48] text-white rounded-tl-[3px] shadow-xs">
                <Camera strokeWidth={1.4} className="w-3 h-3" />
              </div>

              {isUploading && (
                <div className="absolute inset-0 bg-[#2B2420]/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[#FAF5F5] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>

            <span className="text-[10px] uppercase tracking-widest text-[#BE185D]/75 font-sans font-medium">
              Tap to add mirror selfie or portrait
            </span>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>

          {/* Name & Handle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-[#2B2420]/70 block mb-1">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#FFFDFD] border border-[#F472B6]/25 rounded-[2px] px-3 py-2 text-xs text-[#2B2420] focus:outline-none focus:border-[#E11D48] focus:ring-1 focus:ring-[#F472B6]/30"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-[#2B2420]/70 block mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#BE185D]/60 font-sans">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full bg-[#FFFDFD] border border-[#F472B6]/25 rounded-[2px] pl-6 pr-3 py-2 text-xs text-[#2B2420] focus:outline-none focus:border-[#E11D48] focus:ring-1 focus:ring-[#F472B6]/30"
                />
              </div>
            </div>
          </div>

          {/* Status Selection (Student, Working, Vacation) */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-[#2B2420]/70 block">
              Current Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('student')}
                className={`py-2 px-2 rounded-[3px] text-xs font-sans font-medium flex items-center justify-center gap-1.5 transition-all border ${
                  status === 'student'
                    ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-xs'
                    : 'bg-[#FFFDFD] text-[#2B2420]/70 border-[#F472B6]/30 hover:border-[#F472B6] hover:bg-[#FCE7F3]/30'
                }`}
              >
                <GraduationCap strokeWidth={1.4} className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('working')}
                className={`py-2 px-2 rounded-[3px] text-xs font-sans font-medium flex items-center justify-center gap-1.5 transition-all border ${
                  status === 'working'
                    ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-xs'
                    : 'bg-[#FFFDFD] text-[#2B2420]/70 border-[#F472B6]/30 hover:border-[#F472B6] hover:bg-[#FCE7F3]/30'
                }`}
              >
                <Briefcase strokeWidth={1.4} className="w-3.5 h-3.5" />
                <span>Working</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('vacation')}
                className={`py-2 px-2 rounded-[3px] text-xs font-sans font-medium flex items-center justify-center gap-1.5 transition-all border ${
                  status === 'vacation'
                    ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-xs'
                    : 'bg-[#FFFDFD] text-[#2B2420]/70 border-[#F472B6]/30 hover:border-[#F472B6] hover:bg-[#FCE7F3]/30'
                }`}
              >
                <Palmtree strokeWidth={1.4} className="w-3.5 h-3.5" />
                <span>Vacation</span>
              </button>
            </div>
          </div>

          {/* Brand Tags Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-[#2B2420]/70 block">
                Favorite Brands (Select or Add)
              </label>
              <span className="text-[9px] uppercase tracking-wider text-[#BE185D] font-sans font-semibold">
                {selectedTags.length} selected
              </span>
            </div>

            {/* Custom brand input field */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <input
                type="text"
                value={customBrandInput}
                onChange={(e) => setCustomBrandInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomBrand();
                  }
                }}
                placeholder="Type any brand (e.g. Oak + Fort, Brandy)..."
                className="flex-1 bg-[#FFFDFD] border border-[#F472B6]/30 rounded-[2px] px-2.5 py-1.5 text-xs text-[#2B2420] placeholder:text-[#2B2420]/40 focus:outline-none focus:border-[#E11D48]"
              />
              <button
                type="button"
                onClick={() => handleAddCustomBrand()}
                className="px-2.5 py-1.5 rounded-[2px] bg-[#FCE7F3] border border-[#F472B6]/40 text-[#BE185D] hover:bg-[#E11D48] hover:text-white transition-colors text-[10px] uppercase tracking-wider font-sans font-semibold flex items-center gap-1"
              >
                <Plus strokeWidth={1.5} className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Brand Pills */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar pt-0.5">
              {/* If user added custom tags that aren't in popular, show them first */}
              {selectedTags
                .filter((tag) => !POPULAR_BRAND_TAGS.includes(tag))
                .map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="py-1 px-2.5 rounded-[2px] text-[10px] uppercase tracking-wider font-sans transition-colors border flex items-center gap-1 bg-[#BE185D] text-white border-[#BE185D] shadow-xs"
                  >
                    <Check strokeWidth={1.5} className="w-2.5 h-2.5" />
                    <span>{tag}</span>
                  </button>
                ))}

              {POPULAR_BRAND_TAGS.map((brand) => {
                const isSelected = selectedTags.includes(brand);
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => toggleTag(brand)}
                    className={`py-1 px-2.5 rounded-[2px] text-[10px] uppercase tracking-wider font-sans transition-colors border flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-xs font-semibold'
                        : 'bg-[#FFFDFD] text-[#2B2420]/80 border-[#F472B6]/25 hover:border-[#F472B6] hover:bg-[#FCE7F3]/30'
                    }`}
                  >
                    {isSelected && <Check strokeWidth={1.5} className="w-2.5 h-2.5" />}
                    <span>{brand}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit with Rosy Gradient */}
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-[3px] bg-gradient-to-r from-[#E11D48] via-[#BE185D] to-[#9D174D] text-white text-xs font-sans font-semibold uppercase tracking-[0.2em] border border-[#E11D48] hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-sm shadow-pink-900/10 mt-3"
          >
            <span>Complete Setup & Open Lookbook</span>
            <ArrowRight strokeWidth={1.4} className="w-4 h-4" />
          </button>
        </form>
      </div>
    </MirrorCollageModalBackdrop>
  );
};
