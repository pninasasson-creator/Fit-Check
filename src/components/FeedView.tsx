import React, { useState, useEffect } from 'react';
import { Fit, FitItem, Profile } from '../config/supabase';
import { formatEditorialDate } from '../utils/image';
import { dataService } from '../services/dataService';
import { getDemoMirrorSelfieByIndex } from '../services/demoImages';
import { UserAvatar } from './UserAvatar';
import { ItemHistoryModal } from './ItemHistoryModal';
import {
  Tag,
  ExternalLink,
  ShoppingBag,
  Heart,
  Bookmark,
  Share2,
  Check,
  UserPlus,
  UserCheck,
  Sparkles,
  Camera,
  Clock,
} from 'lucide-react';

export interface FeedPost {
  id: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
    city: string;
  };
  date: string;
  timeAgo: string;
  image_url: string;
  items: FitItem[];
  likesCount: number;
}

export const INITIAL_FEED_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    author: {
      id: 'friend-sofia',
      username: 'sofia.minimal',
      display_name: 'Sofia Chen',
      avatar_url: getDemoMirrorSelfieByIndex(0),
      city: 'New York / Tokyo',
    },
    date: '2026-10-25',
    timeAgo: '2h ago',
    image_url: getDemoMirrorSelfieByIndex(0),
    items: [
      {
        category: 'top',
        description: 'cream ribbed knit crewneck sweater',
        brand: 'Aritzia',
        confidence: 'high',
        x: 50,
        y: 38,
        search_query: 'aritzia sunday best oversized sweater',
        source: 'ai',
      },
      {
        category: 'bottoms',
        description: 'wide leg relaxed denim',
        brand: 'Free People',
        confidence: 'high',
        x: 50,
        y: 68,
        search_query: 'free people wide leg denim',
        source: 'ai',
      },
      {
        category: 'shoes',
        description: 'gum sole retro low-top sneakers',
        brand: 'Adidas Samba',
        confidence: 'high',
        x: 50,
        y: 92,
        search_query: 'adidas samba classic sneakers',
        source: 'ai',
      },
    ],
    likesCount: 142,
  },
  {
    id: 'post-2',
    author: {
      id: 'friend-chloe',
      username: 'chloe.fits',
      display_name: 'Chloé Dupuis',
      avatar_url: getDemoMirrorSelfieByIndex(1),
      city: 'Montreal',
    },
    date: '2026-10-25',
    timeAgo: '4h ago',
    image_url: getDemoMirrorSelfieByIndex(1),
    items: [
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
        description: 'cargo relaxed pants',
        brand: 'Urban Outfitters',
        confidence: 'high',
        x: 50,
        y: 68,
        search_query: 'urban outfitters cargo pants',
        source: 'ai',
      },
    ],
    likesCount: 98,
  },
  {
    id: 'post-3',
    author: {
      id: 'friend-elena',
      username: 'elena.lookbook',
      display_name: 'Elena Rostova',
      avatar_url: getDemoMirrorSelfieByIndex(2),
      city: 'London / LA',
    },
    date: '2026-10-24',
    timeAgo: 'Yesterday',
    image_url: getDemoMirrorSelfieByIndex(2),
    items: [
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
        search_query: 'alo yoga cropped ribbed tank',
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
    likesCount: 215,
  },
  {
    id: 'post-4',
    author: {
      id: 'friend-julian',
      username: 'julian.vance',
      display_name: 'Julian Vance',
      avatar_url: getDemoMirrorSelfieByIndex(3),
      city: 'Miami',
    },
    date: '2026-10-23',
    timeAgo: '2d ago',
    image_url: getDemoMirrorSelfieByIndex(3),
    items: [
      {
        category: 'outerwear',
        description: 'linen resort shirt',
        brand: 'Abercrombie',
        confidence: 'high',
        x: 48,
        y: 35,
        search_query: 'abercrombie linen shirt',
        source: 'ai',
      },
      {
        category: 'bottoms',
        description: 'pace breaker shorts',
        brand: 'Lululemon',
        confidence: 'high',
        x: 50,
        y: 65,
        search_query: 'lululemon pace breaker shorts',
        source: 'ai',
      },
    ],
    likesCount: 178,
  },
];

interface FeedViewProps {
  currentUserProfile: Profile | null;
  userFits: Fit[];
  isGuest?: boolean;
  onSnapPrompt?: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  currentUserProfile,
  userFits,
  isGuest = false,
  onSnapPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'following'>('discover');
  const [activeBrandFilter, setActiveBrandFilter] = useState<string>('all');
  const [communityPosts, setCommunityPosts] = useState<FeedPost[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [visibleTagsMap, setVisibleTagsMap] = useState<Record<string, boolean>>({});
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [historyItem, setHistoryItem] = useState<{ item: FitItem; date: string } | null>(null);

  // Load follows and community feed
  useEffect(() => {
    async function loadData() {
      if (currentUserProfile) {
        const follows = await dataService.getFollows(currentUserProfile.id);
        const map: Record<string, boolean> = {};
        follows.forEach((id) => {
          map[id] = true;
        });
        setFollowingMap(map);
      }

      if (isGuest) {
        setCommunityPosts(INITIAL_FEED_POSTS);
      } else {
        const realPosts = await dataService.getCommunityFeed(isGuest);
        if (realPosts.length > 0) {
          setCommunityPosts(realPosts);
        } else {
          // If no posts in Supabase yet, show initial posts so feed isn't a blank void
          setCommunityPosts(INITIAL_FEED_POSTS);
        }
      }
    }

    loadData();
  }, [currentUserProfile?.id, isGuest]);

  const toggleFollow = async (authorId: string) => {
    if (!currentUserProfile) return;
    const isNowFollowing = !followingMap[authorId];
    setFollowingMap((prev) => ({
      ...prev,
      [authorId]: isNowFollowing,
    }));

    if (isNowFollowing) {
      await dataService.followUser(currentUserProfile.id, authorId);
    } else {
      await dataService.unfollowUser(currentUserProfile.id, authorId);
    }
  };

  const toggleShowTags = (postId: string) => {
    setVisibleTagsMap((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const toggleLike = (postId: string) => {
    setLikedMap((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  // Convert current user's fits into feed items
  const userFeedPosts: FeedPost[] = userFits.map((fit) => ({
    id: `user-fit-${fit.id}`,
    author: {
      id: currentUserProfile?.id || 'me',
      username: currentUserProfile?.username || 'you',
      display_name: currentUserProfile?.display_name || 'You',
      avatar_url: currentUserProfile?.avatar_url || '',
      city: currentUserProfile?.status ? `${currentUserProfile.status} lookbook` : 'Your Archive',
    },
    date: fit.date,
    timeAgo: formatEditorialDate(fit.date),
    image_url: fit.image_url,
    items: fit.items || [],
    likesCount: 12,
  }));

  // Merge user fits with community posts
  const allPosts = [...userFeedPosts, ...communityPosts];

  // Filter by Tab (Discover vs Following) and Brand Filter
  const filteredPosts = allPosts.filter((post) => {
    // 1. Following tab filter
    const matchesTab =
      activeTab === 'discover' ||
      post.author.id === (currentUserProfile?.id || 'me') ||
      followingMap[post.author.id];

    if (!matchesTab) return false;

    // 2. Brand filter
    if (activeBrandFilter === 'all') return true;
    return post.items.some(
      (it) => it.brand && it.brand.toLowerCase() === activeBrandFilter.toLowerCase()
    );
  });

  const getShoppingUrl = (item: FitItem) => {
    const brand = (item.brand || '').trim();
    const desc = (item.description || '').trim();
    const query =
      item.search_query || (brand ? `${brand} ${desc}` : desc || item.category || 'clothing');
    return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
  };

  const brandPills = [
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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-28">
      {/* Editorial Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F472B6]/20 pb-4">
        <div>
          <span className="text-[10px] tracking-[0.25em] uppercase font-sans font-semibold text-[#BE185D] block">
            Community Stream · Issue 02
          </span>
          <h2 className="font-bodoni italic text-3xl sm:text-4xl text-[#2B2420]">
            Feed
          </h2>
        </div>

        {/* Tab Filter: Discover / Following */}
        <div className="flex items-center self-start sm:self-auto border border-[#F472B6]/30 rounded-[3px] bg-[#FFFDFD] p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] font-sans rounded-[2px] transition-all font-semibold ${
              activeTab === 'discover'
                ? 'bg-[#E11D48] text-white shadow-xs'
                : 'text-[#2B2420]/70 hover:text-[#BE185D]'
            }`}
          >
            All Fits
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.18em] font-sans rounded-[2px] transition-all font-semibold ${
              activeTab === 'following'
                ? 'bg-[#E11D48] text-white shadow-xs'
                : 'text-[#2B2420]/70 hover:text-[#BE185D]'
            }`}
          >
            Following
          </button>
        </div>
      </div>

      {/* Brand Filters Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {brandPills.map((brand) => (
          <button
            key={brand}
            type="button"
            onClick={() => setActiveBrandFilter(brand)}
            className={`shrink-0 px-3 py-1 rounded-[3px] text-[10px] uppercase tracking-wider font-sans font-semibold transition-all border ${
              activeBrandFilter === brand
                ? 'bg-[#BE185D] text-white border-[#BE185D] shadow-xs'
                : 'bg-[#FFFDFD] text-[#2B2420]/75 border-[#F472B6]/30 hover:border-[#BE185D]'
            }`}
          >
            {brand === 'all' ? 'All Brands' : `#${brand}`}
          </button>
        ))}
      </div>

      {/* Responsive Feed Cards Grid: 1 col on mobile, 2 cols on md, 3 cols on xl desktop */}
      {filteredPosts.length === 0 ? (
        <div className="film-frame p-10 bg-[#FAF7F2] text-center space-y-3">
          <p className="font-bodoni italic text-2xl text-[#2B2420]">
            No fits found in this stream
          </p>
          <p className="text-xs font-sans text-[#2B2420]/60 max-w-sm mx-auto">
            {activeTab === 'following'
              ? 'You are not following anyone yet or your friends have not posted today. Discover friends to follow in the Friends tab!'
              : 'No outfits match the selected brand filter. Try clearing the filter.'}
          </p>
          {onSnapPrompt && (
            <button
              type="button"
              onClick={onSnapPrompt}
              className="mt-2 py-2.5 px-5 rounded-[3px] bg-[#BE185D] text-white text-xs uppercase tracking-widest font-sans font-semibold hover:bg-[#9D174D] shadow-xs"
            >
              Post Today's Fit
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const isOwner = post.author.id === (currentUserProfile?.id || 'me');
            const isFollowing = followingMap[post.author.id];
            const areTagsVisible = visibleTagsMap[post.id];
            const isLiked = likedMap[post.id];

            return (
              <div
                key={post.id}
                className="film-frame p-3 sm:p-4 bg-[#FAF7F2] flex flex-col justify-between shadow-xs transition-transform hover:-translate-y-0.5"
              >
                {/* Post Author Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#F472B6]/20">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar
                      avatarUrl={post.author.avatar_url}
                      name={post.author.display_name || post.author.username}
                      size="sm"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bodoni font-semibold text-sm text-[#2B2420] truncate">
                          {post.author.display_name}
                        </span>
                        {isOwner && (
                          <span className="px-1.5 py-0.2 rounded-full text-[8px] uppercase tracking-wider font-sans bg-[#FCE7F3] text-[#BE185D] border border-[#F472B6]/30 font-semibold">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-sans text-[#2B2420]/60 lowercase block truncate">
                        @{post.author.username} · {post.timeAgo}
                      </span>
                    </div>
                  </div>

                  {!isOwner && (
                    <button
                      type="button"
                      onClick={() => toggleFollow(post.author.id)}
                      className={`text-[9px] uppercase tracking-wider font-sans font-semibold px-2.5 py-1 rounded-[3px] border transition-all ${
                        isFollowing
                          ? 'bg-[#FFFDFD] text-[#BE185D] border-[#F472B6]/40 hover:bg-[#FDF2F4]'
                          : 'bg-[#BE185D] text-white border-[#BE185D] hover:bg-[#9D174D] shadow-xs'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>

                {/* Outfit Photo Viewport with Tap-to-Reveal Pins */}
                <div
                  onClick={() => toggleShowTags(post.id)}
                  className="relative aspect-3/4 w-full rounded-[2px] overflow-hidden bg-[#2B2420]/5 cursor-pointer select-none group"
                >
                  <img
                    src={post.image_url}
                    alt={`${post.author.display_name}'s fit`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                  />

                  {/* Editorial Tag Indicator Pill on Top-Right */}
                  <div className="absolute top-2.5 right-2.5 z-20">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] text-[9px] uppercase tracking-wider font-sans font-semibold bg-[#FFFDFD]/95 text-[#BE185D] border border-[#F472B6]/40 shadow-xs backdrop-blur-xs">
                      <Tag strokeWidth={1.4} className="w-2.5 h-2.5 text-[#E11D48]" />
                      <span>{post.items.length} {post.items.length === 1 ? 'tag' : 'tags'}</span>
                    </span>
                  </div>

                  {/* Interactive Garment Pins (Visible ONLY on Tap) */}
                  {areTagsVisible && (
                    <div
                      className="absolute inset-0 z-20 pointer-events-auto"
                      onClick={(e) => {
                        // Tapping the photo area again hides tags
                        if (e.target === e.currentTarget) {
                          toggleShowTags(post.id);
                        }
                      }}
                    >
                      {post.items.map((item, idx) => {
                        const hasBrand = Boolean(item.brand && item.brand.trim());
                        const labelText = hasBrand
                          ? item.brand.trim().toLowerCase()
                          : (item.description || item.category || 'piece').toLowerCase();

                        return (
                          <div
                            key={idx}
                            style={{ left: `${item.x}%`, top: `${item.y}%` }}
                            className="absolute -translate-x-1/2 -translate-y-full z-20 animate-in fade-in zoom-in-90 duration-150 pointer-events-auto cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHistoryItem({ item, date: post.date });
                            }}
                          >
                            <div className="flex flex-col items-center">
                              <div className="px-2.5 py-1 bg-[#FFFDFD] text-[#2B2420] border border-[#BE185D]/40 rounded-[3px] shadow-lg flex items-center gap-1.5 whitespace-nowrap text-xs font-sans hover:border-[#E11D48] transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                                <span className="font-semibold lowercase text-[#BE185D] max-w-[180px] truncate">
                                  {labelText}
                                </span>
                                {!hasBrand && isOwner && (
                                  <span className="text-[10px] text-[#BE185D] font-medium border-l border-[#F472B6]/40 pl-1.5 ml-0.5">
                                    + add brand
                                  </span>
                                )}
                                <Clock strokeWidth={1.3} className="w-2.5 h-2.5 text-[#2B2420]/50" />
                              </div>
                              <div className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-[#BE185D]/40 -mt-px" />
                              <div className="w-1.5 h-1.5 rounded-full bg-[#E11D48] -mt-0.5" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tap overlay hint when hidden */}
                  {!areTagsVisible && (
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-sans uppercase tracking-widest pointer-events-none">
                      Tap photo to view tags
                    </div>
                  )}
                </div>

                {/* Outfit Garment Breakdown List */}
                <div className="pt-3 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {post.items.map((it, idx) => {
                      const hasBrand = Boolean(it.brand && it.brand.trim());
                      const chipText = hasBrand
                        ? `#${it.brand}`
                        : it.description
                          ? `#${it.description.slice(0, 18)}`
                          : `#${it.category}`;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setHistoryItem({ item: it, date: post.date })}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] bg-[#FFFDFD] border border-[#F472B6]/30 text-[10px] uppercase font-sans tracking-wider text-[#BE185D] hover:border-[#BE185D] transition-colors font-semibold shadow-xs cursor-pointer"
                          title="View wear history"
                        >
                          <span>{chipText}</span>
                          {!hasBrand && isOwner && (
                            <span className="text-[9px] text-[#BE185D]/70 font-normal lowercase">+brand</span>
                          )}
                          <Clock strokeWidth={1.2} className="w-2.5 h-2.5 text-[#BE185D]/60" />
                        </button>
                      );
                    })}
                  </div>

                  {/* Action Bar (Likes, Shop, Share) */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F472B6]/20">
                    <button
                      type="button"
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 text-xs font-sans font-semibold transition-colors ${
                        isLiked ? 'text-[#E11D48]' : 'text-[#2B2420]/70 hover:text-[#BE185D]'
                      }`}
                    >
                      <Heart
                        strokeWidth={1.5}
                        className={`w-4 h-4 ${isLiked ? 'fill-[#E11D48] text-[#E11D48]' : ''}`}
                      />
                      <span>{post.likesCount + (isLiked ? 1 : 0)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleShowTags(post.id)}
                      className="text-[10px] uppercase font-sans tracking-widest text-[#BE185D] font-semibold hover:underline flex items-center gap-1"
                    >
                      <ShoppingBag strokeWidth={1.4} className="w-3.5 h-3.5 text-[#E11D48]" />
                      <span>{areTagsVisible ? 'Hide Pins' : 'Inspect Look'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Wardrobe Memory Item History Modal */}
      <ItemHistoryModal
        isOpen={Boolean(historyItem)}
        onClose={() => setHistoryItem(null)}
        item={historyItem?.item || null}
        currentFitDate={historyItem?.date}
        allFits={userFits}
      />
    </div>
  );
};
