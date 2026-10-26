/**
 * Fit Check · Unified Data & Auth Service
 * Supports:
 * - Supabase Auth, Profiles, Fits table, and Storage bucket 'fits'
 * - Offline / Local Studio Archive fallback with persisted sessions and sample editorial fits
 */

import {
  getSupabase,
  isSupabaseConfigured,
  Fit,
  FitItem,
  Profile,
} from '../config/supabase';
import { formatToDateKey } from '../utils/image';
import { getDemoMirrorSelfieByIndex } from './demoImages';

const LOCAL_STORAGE_SESSION_KEY = 'fitcheck_local_session';
const LOCAL_STORAGE_FITS_KEY = 'fitcheck_local_fits';
const LOCAL_STORAGE_PROFILE_KEY = 'fitcheck_local_profile';

// Curated aesthetic initial fits for the initial lookbook experience (mirror selfies from public 'demo' bucket)
const INITIAL_DEMO_FITS: Fit[] = [
  {
    id: 'demo-fit-1',
    user_id: 'studio-user-1',
    date: '2026-10-25',
    image_url: getDemoMirrorSelfieByIndex(0),
    items: [
      {
        item_id: 'item_top_toteme_sweater',
        category: 'top',
        description: 'cream ribbed knit crewneck sweater',
        brand: 'Toteme',
        confidence: 'high',
        x: 50,
        y: 38,
        search_query: 'toteme cream ribbed knit crewneck sweater',
        source: 'ai',
      },
      {
        item_id: 'item_bottoms_khaite_denim',
        category: 'bottoms',
        description: 'wide leg vintage wash relaxed denim',
        brand: 'Khaite',
        confidence: 'high',
        x: 50,
        y: 68,
        search_query: 'khaite danielle wide leg relaxed denim',
        source: 'ai',
      },
      {
        item_id: 'item_shoes_adidas_samba',
        category: 'shoes',
        description: 'gum sole retro low-top sneakers',
        brand: 'Adidas Samba',
        confidence: 'high',
        x: 50,
        y: 92,
        search_query: 'adidas samba classic white black gum sole',
        source: 'ai',
      },
    ],
  },
  {
    id: 'demo-fit-2',
    user_id: 'studio-user-1',
    date: '2026-10-24',
    image_url: getDemoMirrorSelfieByIndex(1),
    items: [
      {
        item_id: 'item_outerwear_dries_blazer',
        category: 'outerwear',
        description: 'oversized tailored wool blazer',
        brand: 'Dries Van Noten',
        confidence: 'high',
        x: 48,
        y: 34,
        search_query: 'dries van noten oversized wool blazer charcoal',
        source: 'ai',
      },
      {
        item_id: 'item_top_nicholson_shirt',
        category: 'top',
        description: 'blue striped poplin button down shirt',
        brand: 'Studio Nicholson',
        confidence: 'high',
        x: 50,
        y: 46,
        search_query: 'studio nicholson striped poplin cotton shirt',
        source: 'ai',
      },
      {
        item_id: 'item_shoes_prada_loafers',
        category: 'shoes',
        description: 'chunky brushed black leather loafers',
        brand: 'Prada',
        confidence: 'high',
        x: 52,
        y: 90,
        search_query: 'prada brushed leather chunky loafers black',
        source: 'ai',
      },
    ],
  },
  {
    id: 'demo-fit-3',
    user_id: 'studio-user-1',
    date: '2026-10-23',
    image_url: getDemoMirrorSelfieByIndex(2),
    items: [
      {
        item_id: 'item_outerwear_carhartt_jacket',
        category: 'outerwear',
        description: 'distressed washed canvas work jacket',
        brand: 'Carhartt WIP',
        confidence: 'high',
        x: 48,
        y: 36,
        search_query: 'carhartt wip washed canvas detroit work jacket',
        source: 'ai',
      },
      {
        item_id: 'item_bottoms_ourlegacy_trousers',
        category: 'bottoms',
        description: 'relaxed pleated charcoal wool trousers',
        brand: 'Our Legacy',
        confidence: 'high',
        x: 50,
        y: 68,
        search_query: 'our legacy pleated charcoal wool trousers',
        source: 'ai',
      },
      {
        item_id: 'item_shoes_adidas_samba',
        category: 'shoes',
        description: 'gum sole retro low-top sneakers',
        brand: 'Adidas Samba',
        confidence: 'high',
        x: 52,
        y: 92,
        search_query: 'adidas samba classic white black gum sole',
        source: 'ai',
      },
    ],
  },
  {
    id: 'demo-fit-4',
    user_id: 'studio-user-1',
    date: '2026-10-21',
    image_url: getDemoMirrorSelfieByIndex(3),
    items: [
      {
        item_id: 'item_outerwear_lemaire_coat',
        category: 'outerwear',
        description: 'relaxed caramel double-breasted coat',
        brand: 'Lemaire',
        confidence: 'high',
        x: 48,
        y: 35,
        search_query: 'lemaire caramel relaxed wool trench coat',
        source: 'ai',
      },
      {
        item_id: 'item_top_toteme_sweater',
        category: 'top',
        description: 'cream ribbed knit crewneck sweater',
        brand: 'Toteme',
        confidence: 'high',
        x: 50,
        y: 28,
        search_query: 'toteme cream ribbed knit crewneck sweater',
        source: 'ai',
      },
      {
        item_id: 'item_bag_therow_tote',
        category: 'bag',
        description: 'slouchy espresso leather shoulder tote',
        brand: 'The Row',
        confidence: 'high',
        x: 26,
        y: 55,
        search_query: 'the row espresso brown leather shoulder bag',
        source: 'ai',
      },
    ],
  },
];

export interface AuthState {
  user: {
    id: string;
    email: string;
  } | null;
  profile: Profile | null;
  isSupabaseLive: boolean;
  isGuest: boolean;
  loading: boolean;
}

export const DEMO_GUEST_PROFILE: Profile = {
  id: 'guest-curator',
  username: 'guest',
  display_name: 'Guest Curator',
  avatar_url: getDemoMirrorSelfieByIndex(0),
  status: 'student',
  style_tags: ['Aritzia', 'Free People', 'Alo Yoga'],
};

function formatSupabaseAuthError(error: any): string {
  if (!error) return 'Authentication failed. Please try again.';
  const raw = (error.message || error.error_description || String(error)).toLowerCase();

  if (raw.includes('invalid login credentials') || raw.includes('invalid_grant')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (
    raw.includes('user already registered') ||
    raw.includes('user_already_exists') ||
    raw.includes('already in use')
  ) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (
    raw.includes('password should be at least 6 characters') ||
    raw.includes('weak_password') ||
    raw.includes('at least 6')
  ) {
    return 'Password must be at least 6 characters long.';
  }
  if (raw.includes('rate limit') || raw.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (raw.includes('valid email') || raw.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  return error.message || 'Authentication error. Please check your credentials.';
}

class DataService {
  /**
   * Check persistent session on app start.
   * If there is NO session, returns user: null and profile: null.
   * Never assumes or fabricates a logged-in user!
   */
  async getInitialSession(): Promise<AuthState> {
    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Supabase auth getSession warning:', error.message);
        }

        if (data?.session?.user) {
          const user = data.session.user;
          const profile = await this.fetchSupabaseProfile(user.id);
          return {
            user: { id: user.id, email: user.email || '' },
            profile,
            isSupabaseLive: true,
            isGuest: false,
            loading: false,
          };
        }
      } catch (err) {
        console.error('Supabase getSession failed:', err);
      }
    }

    // No session: return clean unauthenticated state
    return {
      user: null,
      profile: null,
      isSupabaseLive: isSupabaseConfigured(),
      isGuest: false,
      loading: false,
    };
  }

  getLocalProfile(): Profile | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  async fetchSupabaseProfile(userId: string): Promise<Profile | null> {
    const supabase = getSupabase();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('fetchSupabaseProfile error:', error.message);
        return null;
      }
      return data || null;
    } catch (err) {
      console.error('Error fetching Supabase profile:', err);
      return null;
    }
  }

  /**
   * Upsert profile in Supabase (id = auth user id)
   */
  async saveProfile(profile: Profile): Promise<Profile> {
    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id);

    if (supabase && isSupabaseConfigured() && isUuid) {
      const cleanUsername = profile.username.trim().toLowerCase();
      const cleanDisplayName = profile.display_name.trim() || cleanUsername;

      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: profile.id,
            username: cleanUsername,
            display_name: cleanDisplayName,
            avatar_url: profile.avatar_url || '',
            status: profile.status || 'student',
            bio: profile.status || 'student',
            style_tags: profile.style_tags || [],
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (error) {
        console.error('saveProfile error from Supabase:', error);
        throw error;
      }

      if (data) {
        return data;
      }
    }

    return profile;
  }

  /**
   * Upload user avatar photo to public 'avatars' bucket at <user_id>/avatar.jpg
   * Overwrites old avatar and returns cache-busted public URL
   */
  async uploadAvatar(userId: string, blob: Blob): Promise<string> {
    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    if (supabase && isSupabaseConfigured() && isUuid) {
      try {
        const filePath = `${userId}/avatar.jpg`;
        const { error } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!error) {
          const { data: publicData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          if (publicData?.publicUrl) {
            return `${publicData.publicUrl}?t=${Date.now()}`;
          }
        } else {
          console.warn('Supabase avatar upload warning:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase avatar upload error:', err?.message);
      }
    }

    // Local mode / fallback: convert to dataUrl
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Update profile avatar URL in Supabase and local cache
   */
  async updateProfileAvatar(userId: string, avatarUrl: string): Promise<Profile> {
    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    let updatedProfile: Profile | null = null;

    if (supabase && isSupabaseConfigured() && isUuid) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ avatar_url: avatarUrl })
          .eq('id', userId)
          .select()
          .single();

        if (!error && data) {
          updatedProfile = data;
        } else {
          console.warn('Supabase avatar update notice:', error?.message);
        }
      } catch (err: any) {
        console.warn('Supabase avatar update error:', err?.message);
      }
    }

    // Always keep local profile cache in sync
    const current = this.getLocalProfile();
    const merged: Profile = {
      username: updatedProfile?.username || current?.username || 'member',
      display_name: updatedProfile?.display_name || current?.display_name || 'Member',
      ...(current || {}),
      ...(updatedProfile || {}),
      id: userId,
      avatar_url: avatarUrl,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(merged));
    }

    return merged;
  }

  /**
   * Update user's favorite brand tags (style_tags) in Supabase and local cache
   */
  async updateProfileStyleTags(userId: string, styleTags: string[]): Promise<Profile> {
    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    let updatedProfile: Profile | null = null;

    if (supabase && isSupabaseConfigured() && isUuid) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ style_tags: styleTags })
          .eq('id', userId)
          .select()
          .single();

        if (!error && data) {
          updatedProfile = data;
        }
      } catch (err: any) {
        console.warn('Failed to update style tags in Supabase:', err?.message);
      }
    }

    const current = this.getLocalProfile();
    const merged: Profile = {
      username: updatedProfile?.username || current?.username || 'member',
      display_name: updatedProfile?.display_name || current?.display_name || 'Member',
      ...(current || {}),
      ...(updatedProfile || {}),
      id: userId,
      style_tags: styleTags,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(merged));
    }

    return merged;
  }

  /**
   * Update user status ('student' | 'working' | 'vacation')
   */
  async updateProfileStatus(userId: string, status: string): Promise<Profile> {
    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    let updatedProfile: Profile | null = null;

    if (supabase && isSupabaseConfigured() && isUuid) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({ status })
          .eq('id', userId)
          .select()
          .single();

        if (!error && data) {
          updatedProfile = data;
        }
      } catch (err: any) {
        console.warn('Failed to update status in Supabase:', err?.message);
      }
    }

    const current = this.getLocalProfile();
    const merged: Profile = {
      username: updatedProfile?.username || current?.username || 'member',
      display_name: updatedProfile?.display_name || current?.display_name || 'Member',
      ...(current || {}),
      ...(updatedProfile || {}),
      id: userId,
      status,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(merged));
    }

    return merged;
  }

  /**
   * Get list of following user IDs for the current user
   */
  async getFollows(currentUserId: string): Promise<string[]> {
    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUserId);

    if (supabase && isSupabaseConfigured() && isUuid) {
      try {
        const { data, error } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId);

        if (!error && data) {
          return data.map((row: any) => row.following_id);
        }
      } catch (err: any) {
        console.warn('Failed to fetch follows from Supabase:', err?.message);
      }
    }

    // Local / guest mode fallback
    try {
      const stored = localStorage.getItem('fitcheck_local_follows');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignored
    }

    return [];
  }

  /**
   * Follow a user in Supabase or local storage
   */
  async followUser(currentUserId: string, targetUserId: string): Promise<void> {
    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUserId);

    if (supabase && isSupabaseConfigured() && isUuid) {
      try {
        await supabase
          .from('follows')
          .insert({ follower_id: currentUserId, following_id: targetUserId });
        return;
      } catch (err: any) {
        console.warn('Supabase followUser error:', err?.message);
      }
    }

    // Local storage update
    try {
      const follows = await this.getFollows(currentUserId);
      if (!follows.includes(targetUserId)) {
        follows.push(targetUserId);
        localStorage.setItem('fitcheck_local_follows', JSON.stringify(follows));
      }
    } catch {
      // Ignored
    }
  }

  /**
   * Unfollow a user in Supabase or local storage
   */
  async unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUserId);

    if (supabase && isSupabaseConfigured() && isUuid) {
      try {
        await supabase
          .from('follows')
          .delete()
          .match({ follower_id: currentUserId, following_id: targetUserId });
        return;
      } catch (err: any) {
        console.warn('Supabase unfollowUser error:', err?.message);
      }
    }

    // Local storage update
    try {
      const follows = await this.getFollows(currentUserId);
      const filtered = follows.filter((id) => id !== targetUserId);
      localStorage.setItem('fitcheck_local_follows', JSON.stringify(filtered));
    } catch {
      // Ignored
    }
  }

  /**
   * Search real Supabase profiles table (username and display_name, case-insensitive, partial match)
   */
  async searchProfiles(queryText: string, currentUserId?: string): Promise<any[]> {
    const supabase = getSupabase();
    const cleanQuery = queryText.trim().replace(/^@/, '');
    if (!cleanQuery) return [];

    if (supabase && isSupabaseConfigured()) {
      try {
        let q = supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%`)
          .limit(25);

        if (currentUserId) {
          q = q.neq('id', currentUserId);
        }

        const { data: profiles, error } = await q;
        if (!error && profiles && profiles.length > 0) {
          const results = await Promise.all(
            profiles.map(async (p: any) => {
              const { data: userFits } = await supabase
                .from('fits')
                .select('*')
                .eq('user_id', p.id)
                .order('date', { ascending: false })
                .limit(1);

              const { count } = await supabase
                .from('fits')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', p.id);

              const latest = userFits && userFits.length > 0 ? userFits[0] : null;

              return {
                id: p.id,
                username: p.username || 'archivist',
                display_name: p.display_name || p.username || 'Member',
                avatar_url: p.avatar_url || getDemoMirrorSelfieByIndex(0),
                city: p.status ? `${p.status} archivist` : 'Lookbook Member',
                status: p.status || 'student',
                style_tags: Array.isArray(p.style_tags) ? p.style_tags : [],
                fits_count: count || (latest ? 1 : 0),
                latest_fit_image: latest?.image_url || '',
                latest_fit_items: Array.isArray(latest?.items) ? latest.items : [],
                isDemo: false,
              };
            })
          );
          return results;
        }
      } catch (err: any) {
        console.warn('searchProfiles Supabase error:', err?.message);
      }
    }

    return [];
  }

  /**
   * Fetch real community users from Supabase, or seeded demo friends in guest mode
   */
  async getCommunityUsers(currentUserId?: string, isGuest = false): Promise<any[]> {
    if (isGuest || !isSupabaseConfigured()) {
      return []; // Return empty so FriendsView will use CURATED_FRIENDS for guest mode
    }

    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (currentUserId) {
        query = query.neq('id', currentUserId);
      }
      const { data: profiles, error } = await query;
      if (error || !profiles || profiles.length === 0) {
        return [];
      }

      const usersWithFits = await Promise.all(
        profiles.map(async (p: any) => {
          const { data: userFits } = await supabase
            .from('fits')
            .select('*')
            .eq('user_id', p.id)
            .order('date', { ascending: false })
            .limit(1);

          const { count } = await supabase
            .from('fits')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', p.id);

          const latest = userFits && userFits.length > 0 ? userFits[0] : null;

          return {
            id: p.id,
            username: p.username || 'archivist',
            display_name: p.display_name || p.username || 'Member',
            avatar_url: p.avatar_url || '',
            city: p.status ? `${p.status} archivist` : 'Lookbook Member',
            status: p.status || 'student',
            style_tags: Array.isArray(p.style_tags) ? p.style_tags : [],
            fits_count: count || (latest ? 1 : 0),
            latest_fit_image: latest?.image_url || '',
            latest_fit_items: Array.isArray(latest?.items) ? latest.items : [],
            isDemo: false,
          };
        })
      );

      return usersWithFits;
    } catch (err: any) {
      console.warn('Failed to load community users from Supabase:', err?.message);
      return [];
    }
  }

  /**
   * Fetch community feed from Supabase fits table (with joined profiles)
   */
  async getCommunityFeed(isGuest = false): Promise<any[]> {
    if (isGuest || !isSupabaseConfigured()) {
      return [];
    }

    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('fits')
        .select(`
          id,
          date,
          image_url,
          items,
          created_at,
          user_id,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url,
            status
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data || data.length === 0) {
        return [];
      }

      return data.map((d: any) => {
        const profile = d.profiles || {};
        return {
          id: d.id,
          author: {
            id: d.user_id,
            username: profile.username || 'curator',
            display_name: profile.display_name || profile.username || 'Archivist',
            avatar_url: profile.avatar_url || '',
            city: profile.status ? `${profile.status}` : 'Member',
          },
          date: d.date,
          timeAgo: 'Recently',
          image_url: d.image_url,
          items: Array.isArray(d.items) ? d.items : [],
          likesCount: 12,
        };
      });
    } catch (err: any) {
      console.warn('Failed to load community feed from Supabase:', err?.message);
      return [];
    }
  }

  /**
   * Sign In with Email & Password
   */
  async signIn(email: string, pass: string): Promise<{ user: any; profile: Profile | null }> {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!pass || pass.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (error) {
        throw new Error(formatSupabaseAuthError(error));
      }

      if (!data.user) {
        throw new Error('Authentication succeeded but user record not found.');
      }

      const profile = await this.fetchSupabaseProfile(data.user.id);

      return {
        user: { id: data.user.id, email: data.user.email || cleanEmail },
        profile,
      };
    }

    throw new Error('Supabase client is not available. Please verify credentials.');
  }

  /**
   * Sign Up with Email & Password (creates user in auth.users)
   * ProfileSetupModal will then create or update their public.profiles row.
   */
  async signUp(
    email: string,
    pass: string,
    username?: string,
    displayName?: string
  ): Promise<{ user: any; profile: Profile | null }> {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!pass || pass.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const supabase = getSupabase();

    if (supabase && isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
      });

      if (error) {
        throw new Error(formatSupabaseAuthError(error));
      }

      if (!data.user) {
        throw new Error('Sign up failed: no user returned.');
      }

      let profile: Profile | null = null;

      // If username was provided upfront, initialize profile record
      if (username && username.trim()) {
        const cleanUser = username.trim().toLowerCase().replace(/^@/, '');
        const cleanDisplay = displayName?.trim() || cleanUser;
        profile = {
          id: data.user.id,
          username: cleanUser,
          display_name: cleanDisplay,
          status: 'student',
          bio: 'student',
          style_tags: [],
        };

        const { error: profileErr } = await supabase
          .from('profiles')
          .upsert(profile, { onConflict: 'id' });

        if (profileErr) {
          console.warn('Profile initialization warning:', profileErr.message);
        }
      } else {
        profile = await this.fetchSupabaseProfile(data.user.id);
      }

      return {
        user: { id: data.user.id, email: data.user.email || cleanEmail },
        profile,
      };
    }

    throw new Error('Supabase client is not available. Please verify credentials.');
  }

  /**
   * Sign Out: Clears Supabase session and all cached storage keys
   */
  async signOut(): Promise<void> {
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out error:', err);
      }
    }

    // Thoroughly purge any cached keys from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
        localStorage.removeItem(LOCAL_STORAGE_PROFILE_KEY);
        localStorage.removeItem(LOCAL_STORAGE_FITS_KEY);
        localStorage.removeItem('fitcheck_local_follows');
        localStorage.removeItem('fitcheck_is_guest');
        localStorage.removeItem('fitcheck_has_completed_onboarding');
      } catch {
        // Ignored
      }
    }
  }

  /**
   * Fetch fits for user.
   * If isGuest is true, returns curated demo fits.
   * For signed-in users, returns ONLY their real fits from Supabase (never leaks demo fits).
   */
  async getFits(userId: string, isGuest = false): Promise<Fit[]> {
    if (isGuest) {
      return INITIAL_DEMO_FITS;
    }

    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    if (supabase && isSupabaseConfigured() && isUuid) {
      try {
        const { data, error } = await supabase
          .from('fits')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (error) {
          console.warn('Supabase getFits error:', error.message);
          return [];
        }

        if (data) {
          return data.map((d: any) => ({
            id: d.id,
            user_id: d.user_id,
            date: d.date,
            image_url: d.image_url,
            items: Array.isArray(d.items) ? d.items : [],
            created_at: d.created_at,
          }));
        }
      } catch (err) {
        console.error('getFits error:', err);
        return [];
      }
    }

    return [];
  }


  /**
   * Get fit for specific date
   */
  async getFitByDate(userId: string, date: string): Promise<Fit | null> {
    const fits = await this.getFits(userId);
    return fits.find((f) => f.date === date) || null;
  }

  /**
   * Upload fit photo
   * Compresses image to ~1200px before uploading.
   * If Supabase bucket is missing or throws error, seamlessly falls back to inline image
   * so posting never fails for the user!
   */
  async uploadPhoto(userId: string, blob: Blob): Promise<string> {
    const toDataUrl = (): Promise<string> =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    if (supabase && isSupabaseConfigured() && isUuid) {
      try {
        const fileExt = 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('fits')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!error && data?.path) {
          const { data: publicData } = supabase.storage
            .from('fits')
            .getPublicUrl(data.path);

          if (publicData?.publicUrl) {
            return publicData.publicUrl;
          }
        } else {
          console.warn('Supabase storage upload notice (using fallback):', error?.message);
        }
      } catch (err: any) {
        console.warn('Supabase storage error (using fallback):', err?.message);
      }
    }

    // Reliable fallback: inline data URL
    return toDataUrl();
  }

  /**
   * Save or update daily fit
   * Enforces unique constraint (user_id, date) so there's one fit per day
   */
  async saveFit(
    userId: string,
    date: string,
    imageUrl: string,
    items: FitItem[]
  ): Promise<Fit> {
    const supabase = getSupabase();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    if (supabase && isSupabaseConfigured() && isUuid) {
      try {
        const { data, error } = await supabase
          .from('fits')
          .upsert(
            {
              user_id: userId,
              date,
              image_url: imageUrl,
              items,
            },
            { onConflict: 'user_id,date' }
          )
          .select()
          .single();

        if (!error && data) {
          this.cacheFitLocally(data);
          return data;
        }

        console.warn('Supabase saveFit warning, falling back to local archive:', error?.message);
      } catch (err: any) {
        console.warn('Supabase saveFit exception, falling back to local archive:', err?.message);
      }
    }

    // Local mode save fallback
    const currentFits = await this.getFits(userId);
    const existingIndex = currentFits.findIndex((f) => f.date === date);

    const fitRecord: Fit = {
      id: existingIndex >= 0 ? currentFits[existingIndex].id : `fit-${Date.now()}`,
      user_id: userId,
      date,
      image_url: imageUrl,
      items,
      created_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      currentFits[existingIndex] = fitRecord;
    } else {
      currentFits.unshift(fitRecord);
    }

    localStorage.setItem(LOCAL_STORAGE_FITS_KEY, JSON.stringify(currentFits));
    return fitRecord;
  }

  private cacheFitLocally(fit: Fit) {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_FITS_KEY);
      const currentFits: Fit[] = stored ? JSON.parse(stored) : [];
      const idx = currentFits.findIndex((f) => f.date === fit.date);
      if (idx >= 0) {
        currentFits[idx] = fit;
      } else {
        currentFits.unshift(fit);
      }
      localStorage.setItem(LOCAL_STORAGE_FITS_KEY, JSON.stringify(currentFits));
    } catch {
      // Ignored
    }
  }

  /**
   * Delete a fit
   */
  async deleteFit(fitId: string, userId: string, date: string): Promise<void> {
    const supabase = getSupabase();
    if (supabase && isSupabaseConfigured()) {
      const { error } = await supabase.from('fits').delete().eq('id', fitId);
      if (error) throw new Error(error.message);
    }

    const currentFits = await this.getFits(userId);
    const filtered = currentFits.filter((f) => f.id !== fitId && f.date !== date);
    localStorage.setItem(LOCAL_STORAGE_FITS_KEY, JSON.stringify(filtered));
  }
}

export const dataService = new DataService();
