-- ==============================================================================
-- FIT CHECK · SUPABASE COMPLETE SCHEMA, FOLLOWS & AVATARS
-- Safe to re-run (IF NOT EXISTS, DROP POLICY IF EXISTS, ON CONFLICT)
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

-- 3. Follows Table (Social Graph)
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

-- 8. Storage Buckets ('fits' and 'avatars')
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
  );

-- 11. Storage Bucket & Public Policy for 'demo' (Public Mirror Selfie Looks)
INSERT INTO storage.buckets (id, name, public)
VALUES ('demo', 'demo', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public demo access" ON storage.objects;
CREATE POLICY "Public demo access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'demo');

