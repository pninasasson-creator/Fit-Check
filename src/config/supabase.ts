/**
 * ==============================================================================
 * FIT CHECK · SUPABASE CONFIGURATION
 * ==============================================================================
 * 
 * Instructions:
 * 1. Create a project at https://supabase.com
 * 2. In your Supabase Project Settings -> API, find your Project URL & Anon Key.
 * 3. Paste them below (or define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your env).
 * 4. Run the SQL script from `/supabase/schema.sql` (or copy from the Profile tab)
 *    in the Supabase SQL Editor.
 * 
 * NEVER use the service_role key here. Only use the public 'anon' key.
 * ==============================================================================
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// ---> PASTE YOUR SUPABASE CREDENTIALS HERE <---
export const SUPABASE_PROJECT_URL = 'https://xuxoalwyzyjsrdvrfden.supabase.co';
export const SUPABASE_ANON_PUBLIC_KEY = 'sb_publishable_tgF9Az-U0BgKv9UzDIdUEA_9LUCfS4L';
// ------------------------------------------------

// Helper to get active configuration from environment variables
export function getActiveSupabaseConfig(): { url: string; anonKey: string } {
  const url = (
    (import.meta.env?.VITE_SUPABASE_URL as string) ||
    SUPABASE_PROJECT_URL
  )?.trim();

  const anonKey = (
    (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) ||
    SUPABASE_ANON_PUBLIC_KEY
  )?.trim();

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getActiveSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    !url.includes('YOUR_PROJECT_ID') &&
    !anonKey.includes('YOUR_SUPABASE_ANON_KEY') &&
    url.startsWith('https://')
  );
}

// Global Supabase client instance (initialized if credentials provided)
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey } = getActiveSupabaseConfig();
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'fitcheck_supabase_auth_token',
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Reset instance if config changes
export function resetSupabaseClient() {
  supabaseInstance = null;
}

// Types
export interface FitItem {
  id?: string;
  item_id?: string; // Stable wardrobe item ID linking the same garment across fits
  category: 'top' | 'bottoms' | 'shoes' | 'outerwear' | 'bag' | 'accessory';
  description: string;
  brand: string;
  confidence?: 'high' | 'medium' | 'low';
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  search_query: string;
  source: 'ai' | 'user';
}

export interface Fit {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  image_url: string;
  items: FitItem[];
  created_at?: string;
}

export type ProfileStatus = 'student' | 'working' | 'vacation';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  status?: ProfileStatus | string;
  style_tags?: string[]; // user's favorite brand tags (Aritzia, Free People, Alo, etc.)
  created_at?: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at?: string;
}

export const COMPLETE_SUPABASE_SQL = `-- ==============================================================================
-- FIT CHECK · COMPLETE DATABASE & STORAGE CONFIGURATION
-- Safe to re-run (idempotent: IF NOT EXISTS, DROP POLICY IF EXISTS, ON CONFLICT)
-- ==============================================================================

-- 1. Profiles Table & Columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'student',
  style_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS style_tags TEXT[] DEFAULT '{}';

-- 2. Fits Table
CREATE TABLE IF NOT EXISTS public.fits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  image_url TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_fits_user_id ON public.fits(user_id);
CREATE INDEX IF NOT EXISTS idx_fits_date ON public.fits(date);
CREATE INDEX IF NOT EXISTS idx_fits_items_gin ON public.fits USING gin (items);

-- 3. Follows Table (Social graph)
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- 5. Profiles RLS Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 6. Fits RLS Policies
DROP POLICY IF EXISTS "Fits are viewable by everyone" ON public.fits;
CREATE POLICY "Fits are viewable by everyone"
  ON public.fits FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own fits" ON public.fits;
CREATE POLICY "Users can insert their own fits"
  ON public.fits FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own fits" ON public.fits;
CREATE POLICY "Users can update their own fits"
  ON public.fits FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own fits" ON public.fits;
CREATE POLICY "Users can delete their own fits"
  ON public.fits FOR DELETE USING (auth.uid() = user_id);

-- 7. Follows RLS Policies
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow others" ON public.follows;
CREATE POLICY "Users can unfollow others"
  ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- 8. Storage Buckets (fits + avatars)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fits', 'fits', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 9. Storage RLS Policies for 'fits'
DROP POLICY IF EXISTS "Public fits access" ON storage.objects;
CREATE POLICY "Public fits access"
  ON storage.objects FOR SELECT USING (bucket_id = 'fits');

DROP POLICY IF EXISTS "Users can upload their own fits" ON storage.objects;
CREATE POLICY "Users can upload their own fits"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fits'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own fits" ON storage.objects;
CREATE POLICY "Users can update their own fits"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'fits'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own fits" ON storage.objects;
CREATE POLICY "Users can delete their own fits"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'fits'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 10. Storage RLS Policies for 'avatars'
DROP POLICY IF EXISTS "Public avatars access" ON storage.objects;
CREATE POLICY "Public avatars access"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );`;
