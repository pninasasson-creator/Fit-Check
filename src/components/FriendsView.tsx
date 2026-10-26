import React, { useState, useEffect } from 'react';
import { FitItem, ProfileStatus } from '../config/supabase';
import { dataService } from '../services/dataService';
import { UserAvatar } from './UserAvatar';
import { MirrorCollageModalBackdrop } from './MirrorCollageModalBackdrop';
import { getDemoMirrorSelfieByIndex } from '../services/demoImages';
import {
  Search,
  UserPlus,
  UserCheck,
  Tag,
  ExternalLink,
  Sparkles,
  X,
  ShoppingBag,
  GraduationCap,
  Briefcase,
  Palmtree,
  Users,
} from 'lucide-react';

export interface FriendProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  city: string;
  status: ProfileStatus;
  style_tags: string[];
  fits_count: number;
  latest_fit_image: string;
  latest_fit_items: FitItem[];
  isDemo?: boolean;
}

export const CURATED_FRIENDS: FriendProfile[] = [
  {
    id: 'friend-sofia',
    username: 'sofia.minimal',
    display_name: 'Sofia Chen',
    avatar_url: getDemoMirrorSelfieByIndex(0),
    city: 'New York / Tokyo',
    status: 'student',
    style_tags: ['Aritzia', 'Alo Yoga', 'Lululemon', 'Free People'],
    fits_count: 48,
    latest_fit_image: getDemoMirrorSelfieByIndex(0),
    isDemo: true,
    latest_fit_items: [
      {
        category: 'top',
        description: 'cream ribbed knit crewneck',
        brand: 'Aritzia',
        confidence: 'high',
        x: 50,
        y: 38,
        search_query: 'aritzia sunday best knit sweater',
        source: 'ai',
      },
      {
        category: 'bottoms',
        description: 'wide leg relaxed denim',
        brand: 'Free People',
        confidence: 'high',
        x: 50,
        y: 68,
        search_query: 'free people wide leg jeans',
        source: 'ai',
      },
      {
        category: 'shoes',
        description: 'gum sole low-top sneakers',
        brand: 'Adidas Samba',
        confidence: 'high',
        x: 50,
        y: 92,
        search_query: 'adidas samba classic',
        source: 'ai',
      },
    ],
  },
  {
    id: 'friend-chloe',
    username: 'chloe.fits',
    display_name: 'Chloé Dupuis',
    avatar_url: getDemoMirrorSelfieByIndex(1),
    city: 'Montreal',
    status: 'student',
    style_tags: ['Garage', 'Free People', 'Urban Outfitters', 'Brandy Melville'],
    fits_count: 29,
    latest_fit_image: getDemoMirrorSelfieByIndex(1),
    isDemo: true,
    latest_fit_items: [
      {
        category: 'top',
        description: 'oversized poplin button shirt',
        brand: 'Garage',
        confidence: 'high',
        x: 50,
        y: 40,
        search_query: 'garage clothing oversized button up shirt',
        source: 'ai',
      },
      {
        category: 'bottoms',
        description: 'cargo wide leg trousers',
        brand: 'Urban Outfitters',
        confidence: 'high',
        x: 50,
        y: 68,
        search_query: 'urban outfitters cargo pants',
        source: 'ai',
      },
    ],
  },
  {
    id: 'friend-elena',
    username: 'elena.lookbook',
    display_name: 'Elena Rostova',
    avatar_url: getDemoMirrorSelfieByIndex(2),
    city: 'London / LA',
    status: 'working',
    style_tags: ['Aritzia', 'Anthropologie', 'Reformation', 'Alo Yoga'],
    fits_count: 62,
    latest_fit_image: getDemoMirrorSelfieByIndex(2),
    isDemo: true,
    latest_fit_items: [
      {
        category: 'outerwear',
        description: 'effortless tailored wool blazer',
        brand: 'Aritzia',
        confidence: 'high',
        x: 48,
        y: 34,
        search_query: 'aritzia babaton agency blazer',
        source: 'ai',
      },
      {
        category: 'top',
        description: 'ribbed active tank',
        brand: 'Alo Yoga',
        confidence: 'high',
        x: 50,
        y: 46,
        search_query: 'alo yoga ribbed cropped tank',
        source: 'ai',
      },
      {
        category: 'shoes',
        description: 'chunky black leather loafers',
        brand: 'Anthropologie',
        confidence: 'high',
        x: 52,
        y: 90,
        search_query: 'anthropologie leather platform loafers',
        source: 'ai',
      },
    ],
  },
  {
    id: 'friend-mateo',
    username: 'mateo.archive',
    display_name: 'Mateo Silva',
    avatar_url: getDemoMirrorSelfieByIndex(3),
    city: 'Milan',
    status: 'working',
    style_tags: ["Levi's", 'Zara', 'PacSun', 'Abercrombie'],
    fits_count: 36,
    latest_fit_image: getDemoMirrorSelfieByIndex(3),
    isDemo: true,
    latest_fit_items: [
      {
        category: 'outerwear',
        description: 'distressed washed canvas work jacket',
        brand: 'Carhartt WIP',
        confidence: 'high',
        x: 48,
        y: 36,
        search_query: 'carhartt wip detroit jacket',
        source: 'ai',
      },
      {
        category: 'bottoms',
        description: 'vintage relaxed straight fit denim',
        brand: "Levi's",
        confidence: 'high',
        x: 50,
        y: 68,
        search_query: 'levis 501 vintage relaxed jeans',
        source: 'ai',
      },
    ],
  },
  {
    id: 'friend-julian',
    username: 'julian.vance',
    display_name: 'Julian Vance',
    avatar_url: getDemoMirrorSelfieByIndex(0),
    city: 'Miami',
    status: 'vacation',
    style_tags: ['Alo Yoga', 'Lululemon', 'Aritzia', 'Abercrombie'],
    fits_count: 41,
    latest_fit_image: getDemoMirrorSelfieByIndex(0),
    isDemo: true,
    latest_fit_items: [
      {
        category: 'outerwear',
        description: 'lightweight linen resort overshirt',
        brand: 'Abercrombie',
        confidence: 'high',
        x: 48,
        y: 35,
        search_query: 'abercrombie linen blend button up shirt',
        source: 'ai',
      },
      {
        category: 'bottoms',
        description: 'everyday active training shorts',
        brand: 'Lululemon',
        confidence: 'high',
        x: 50,
        y: 65,
        search_query: 'lululemon pace breaker shorts',
        source: 'ai',
      },
    ],
  },
];

interface FriendsViewProps {
  currentUserId?: string;
  isGuest?: boolean;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  currentUserId,
  isGuest = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterTag, setActiveFilterTag] = useState<string>('all');
  const [friendsList, setFriendsList] = useState<FriendProfile[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [selectedFriend, setSelectedFriend] = useState<FriendProfile | null>(null);
  const [showTagPins, setShowTagPins] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Load follows on mount
  useEffect(() => {
    async function loadFollows() {
      if (currentUserId) {
        const follows = await dataService.getFollows(currentUserId);
        const map: Record<string, boolean> = {};
        follows.forEach((id) => {
          map[id] = true;
        });
        setFollowingMap(map);
      }
    }
    loadFollows();
  }, [currentUserId]);

  // Load community profiles & real search query against Supabase
  useEffect(() => {
    if (isGuest) {
      setFriendsList(CURATED_FRIENDS);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (searchQuery.trim()) {
          const results = await dataService.searchProfiles(searchQuery, currentUserId);
          if (active) {
            setFriendsList(results);
          }
        } else {
          const realUsers = await dataService.getCommunityUsers(currentUserId, false);
          if (active) {
            if (realUsers.length > 0) {
              setFriendsList(realUsers);
            } else {
              // If no other registered users in Supabase yet, show curated friends clearly marked as Demo
              setFriendsList(CURATED_FRIENDS);
            }
          }
        }
      } catch (err) {
        console.warn('Friends search error:', err);
      } finally {
        if (active) setIsSearching(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUserId, isGuest]);

  const toggleFollow = async (friendId: string) => {
    if (!currentUserId) return;
    const isNowFollowing = !followingMap[friendId];
    setFollowingMap((prev) => ({
      ...prev,
      [friendId]: isNowFollowing,
    }));

    if (isNowFollowing) {
      await dataService.followUser(currentUserId, friendId);
    } else {
      await dataService.unfollowUser(currentUserId, friendId);
    }
  };

  const brandFilterOptions = [
    'all',
    'Aritzia',
    'Free People',
    'Garage',
    'Alo Yoga',
    'Lululemon',
    'Anthropologie',
    'Reformation',
    'Brandy Melville',
    'Abercrombie',
  ];

  const filteredFriends = friendsList.filter((friend) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      friend.username.toLowerCase().includes(q) ||
      friend.display_name.toLowerCase().includes(q) ||
      friend.city.toLowerCase().includes(q) ||
      friend.status.toLowerCase().includes(q) ||
      friend.style_tags.some((t) => t.toLowerCase().includes(q));

    const matchesTag =
      activeFilterTag === 'all' ||
      friend.style_tags.some((t) => t.toLowerCase() === activeFilterTag.toLowerCase());

    return matchesSearch && matchesTag;
  });

  const renderStatusBadge = (status: ProfileStatus) => {
    if (status === 'working') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-sans tracking-wider font-semibold bg-[#FCE7F3] text-[#BE185D] border border-[#F472B6]/40 flex items-center gap-1">
          <Briefcase strokeWidth={1.4} className="w-2.5 h-2.5 text-[#E11D48]" />
          <span>Working</span>
        </span>
      );
    }
    if (status === 'vacation') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-sans tracking-wider font-semibold bg-[#FCE7F3] text-[#BE185D] border border-[#F472B6]/40 flex items-center gap-1">
          <Palmtree strokeWidth={1.4} className="w-2.5 h-2.5 text-[#E11D48]" />
          <span>Vacation</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-sans tracking-wider font-semibold bg-[#FCE7F3] text-[#BE185D] border border-[#F472B6]/40 flex items-center gap-1">
        <GraduationCap strokeWidth={1.4} className="w-2.5 h-2.5 text-[#E11D48]" />
        <span>Student</span>
      </span>
    );
  };

  const getShoppingUrl = (item: FitItem) => {
    const query =
      item.search_query || [item.brand, item.description, item.category].filter(Boolean).join(' ');
    return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-28">
      {/* Editorial Header */}
      <div className="border-b border-[#F472B6]/20 pb-4">
        <span className="text-[10px] tracking-[0.25em] uppercase font-sans font-semibold text-[#BE185D] block">
          Directory & Network
        </span>
        <h2 className="font-bodoni italic text-3xl sm:text-4xl text-[#2B2420]">
          Friends & Discover
        </h2>
        <p className="text-xs font-sans text-[#2B2420]/70 mt-1">
          Follow friends and fashion archivist lookbooks to sync their fits into your daily feed.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search strokeWidth={1.4} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#BE185D]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username, brand (e.g. Aritzia, Alo), or status..."
          className="w-full bg-[#FFFDFD] border border-[#F472B6]/40 rounded-[3px] pl-10 pr-4 py-2.5 text-xs text-[#2B2420] placeholder-[#2B2420]/45 focus:outline-none focus:border-[#BE185D] shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#2B2420]/40 hover:text-[#2B2420]"
          >
            ✕
          </button>
        )}
      </div>

      {/* Brand Filters Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {brandFilterOptions.map((brand) => (
          <button
            key={brand}
            type="button"
            onClick={() => setActiveFilterTag(brand)}
            className={`shrink-0 px-3 py-1 rounded-[3px] text-[10px] uppercase tracking-wider font-sans font-semibold transition-all border ${
              activeFilterTag === brand
                ? 'bg-[#BE185D] text-white border-[#BE185D] shadow-xs'
                : 'bg-[#FFFDFD] text-[#2B2420]/75 border-[#F472B6]/30 hover:border-[#BE185D]'
            }`}
          >
            {brand === 'all' ? 'All Brands' : `#${brand}`}
          </button>
        ))}
      </div>

      {/* Responsive Friends Grid: 1 col on mobile, 2 cols on md, 3 cols on lg desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFriends.map((friend) => {
          const isFollowing = followingMap[friend.id];

          return (
            <div
              key={friend.id}
              className="film-frame p-4 bg-[#FAF7F2] flex flex-col justify-between shadow-xs transition-transform hover:-translate-y-0.5"
            >
              <div>
                {/* Header: Avatar, Name, Handle, Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    onClick={() => setSelectedFriend(friend)}
                    className="flex items-center gap-3 cursor-pointer group min-w-0"
                  >
                    <UserAvatar
                      avatarUrl={friend.avatar_url}
                      name={friend.display_name || friend.username}
                      size="md"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bodoni font-semibold text-base text-[#2B2420] group-hover:text-[#BE185D] transition-colors truncate">
                          {friend.display_name}
                        </h4>
                        {(friend.isDemo || friend.id.startsWith('friend-') || isGuest) && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#FCE7F3] border border-[#F472B6]/40 text-[#BE185D] text-[8px] uppercase font-sans font-bold tracking-wider">
                            Demo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-sans text-[#2B2420]/60 lowercase truncate">
                        @{friend.username}
                      </p>
                    </div>
                  </div>

                  {renderStatusBadge(friend.status)}
                </div>

                {/* Latest Fit Preview if available */}
                {friend.latest_fit_image ? (
                  <div
                    onClick={() => setSelectedFriend(friend)}
                    className="relative aspect-4/3 w-full rounded-[2px] overflow-hidden bg-[#2B2420]/5 cursor-pointer mb-3 group"
                  >
                    <img
                      src={friend.latest_fit_image}
                      alt={`${friend.display_name}'s lookbook fit`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-[2px] bg-[#FFFDFD]/90 backdrop-blur-xs text-[9px] uppercase font-sans tracking-wider text-[#BE185D] font-semibold border border-[#F472B6]/30">
                      {friend.fits_count} fits
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center rounded-[2px] bg-[#FFFDFD] border border-[#F472B6]/20 mb-3 text-xs font-sans text-[#2B2420]/50 italic">
                    No outfits posted yet
                  </div>
                )}

                {/* Favorite Brand Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {friend.style_tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-[2px] text-[9px] uppercase tracking-wider font-sans font-semibold bg-[#FFFDFD] text-[#BE185D] border border-[#F472B6]/30"
                    >
                      #{tag}
                    </span>
                  ))}
                  {friend.style_tags.length > 3 && (
                    <span className="text-[9px] text-[#2B2420]/50 font-sans self-center">
                      +{friend.style_tags.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Follow Button */}
              <div className="pt-2 border-t border-[#F472B6]/20 flex items-center justify-between">
                <span className="text-[10px] uppercase font-sans tracking-wider text-[#2B2420]/60">
                  {friend.city}
                </span>

                <button
                  type="button"
                  onClick={() => toggleFollow(friend.id)}
                  className={`py-1.5 px-4 rounded-[3px] text-[10px] uppercase tracking-wider font-sans font-semibold transition-all flex items-center gap-1.5 ${
                    isFollowing
                      ? 'bg-[#FFFDFD] text-[#BE185D] border border-[#F472B6]/40 hover:bg-[#FDF2F4]'
                      : 'bg-[#BE185D] text-white border border-[#BE185D] hover:bg-[#9D174D] shadow-xs'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck strokeWidth={1.5} className="w-3 h-3" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus strokeWidth={1.5} className="w-3 h-3" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Friend Detail Quick View Modal */}
      {selectedFriend && (
        <MirrorCollageModalBackdrop onBackdropClick={() => setSelectedFriend(null)} className="w-full max-w-lg">
          <div className="w-full bg-[#FAF7F2] border border-[#F472B6]/40 rounded-[3px] p-5 shadow-2xl relative my-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F472B6]/20">
              <div className="flex items-center gap-3">
                <UserAvatar
                  avatarUrl={selectedFriend.avatar_url}
                  name={selectedFriend.display_name}
                  size="md"
                />
                <div>
                  <h3 className="font-bodoni font-semibold text-lg text-[#2B2420]">
                    {selectedFriend.display_name}
                  </h3>
                  <p className="text-xs font-sans text-[#2B2420]/60 lowercase">
                    @{selectedFriend.username} · {selectedFriend.city}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFriend(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#2B2420]/60 hover:text-[#2B2420] hover:bg-black/5"
              >
                ✕
              </button>
            </div>

            {/* Friend Latest Fit with Tags */}
            {selectedFriend.latest_fit_image && (
              <div className="relative aspect-3/4 w-full rounded-[2px] overflow-hidden bg-[#2B2420]/5">
                <img
                  src={selectedFriend.latest_fit_image}
                  alt={selectedFriend.display_name}
                  className="w-full h-full object-cover"
                />

                {showTagPins &&
                  selectedFriend.latest_fit_items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{ left: `${item.x}%`, top: `${item.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-full z-20"
                    >
                      <a
                        href={getShoppingUrl(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-[#FFFDFD] text-[#2B2420] border border-[#BE185D]/40 rounded-[3px] shadow-lg flex items-center gap-1 text-xs font-sans font-semibold text-[#BE185D]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                        <span>{item.brand || item.category}</span>
                        <ExternalLink strokeWidth={1.3} className="w-2.5 h-2.5 text-[#2B2420]/50" />
                      </a>
                    </div>
                  ))}

                <button
                  type="button"
                  onClick={() => setShowTagPins(!showTagPins)}
                  className="absolute bottom-3 right-3 px-3 py-1 rounded-[3px] bg-[#FFFDFD]/90 backdrop-blur-xs text-[10px] uppercase font-sans tracking-wider font-semibold text-[#BE185D] border border-[#F472B6]/40 shadow-xs"
                >
                  {showTagPins ? 'Hide Pins' : 'Reveal Garment Pins'}
                </button>
              </div>
            )}

            {/* Brands breakdown */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-sans font-semibold text-[#BE185D]">
                Favorite Labels:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedFriend.style_tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-[2px] text-[10px] uppercase tracking-wider font-sans font-semibold bg-[#FFFDFD] text-[#BE185D] border border-[#F472B6]/40"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-[#F472B6]/20">
              <span className="text-xs font-sans text-[#2B2420]/60">
                {selectedFriend.fits_count} archived looks
              </span>
              <button
                type="button"
                onClick={() => toggleFollow(selectedFriend.id)}
                className={`py-2 px-5 rounded-[3px] text-xs uppercase tracking-wider font-sans font-semibold ${
                  followingMap[selectedFriend.id]
                    ? 'bg-[#FFFDFD] text-[#BE185D] border border-[#F472B6]/40'
                    : 'bg-[#BE185D] text-white shadow-xs'
                }`}
              >
                {followingMap[selectedFriend.id] ? 'Following' : 'Follow Lookbook'}
              </button>
            </div>
          </div>
        </MirrorCollageModalBackdrop>
      )}
    </div>
  );
};
