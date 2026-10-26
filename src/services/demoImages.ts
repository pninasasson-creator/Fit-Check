/**
 * Demo Mirror Selfie Loader
 * Exclusively loads mirror selfie photos from the user's public Supabase Storage bucket 'demo'.
 * Never uses random stock photos or Unsplash URLs.
 */

import { getSupabase, SUPABASE_PROJECT_URL } from '../config/supabase';

export const DEMO_BASE_STORAGE_URL = `${SUPABASE_PROJECT_URL}/storage/v1/object/public/demo`;

// Default mirror selfies verified in the 'demo' bucket
const INITIAL_DEMO_MIRROR_SELFIES: string[] = [
  `${DEMO_BASE_STORAGE_URL}/selfie1.jpg`,
  `${DEMO_BASE_STORAGE_URL}/selfie4.jpg`,
  `${DEMO_BASE_STORAGE_URL}/selfie5.jpeg`,
  `${DEMO_BASE_STORAGE_URL}/selfie6.jpeg`,
];

let cachedMirrorSelfies: string[] = [...INITIAL_DEMO_MIRROR_SELFIES];
let hasAttemptedLoad = false;

/**
 * Lists all uploaded mirror selfie files in the 'demo' bucket.
 * If Supabase storage.from('demo').list() returns files, updates the active list.
 */
export async function loadDemoMirrorSelfies(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return cachedMirrorSelfies;

  try {
    const { data, error } = await supabase.storage.from('demo').list('', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (!error && data && data.length > 0) {
      const publicUrls = data
        .filter((f) => f.name && !f.name.startsWith('.'))
        .map((f) => {
          const { data: p } = supabase.storage.from('demo').getPublicUrl(f.name);
          return p.publicUrl;
        });

      if (publicUrls.length > 0) {
        cachedMirrorSelfies = publicUrls;
      }
    }
  } catch (err) {
    console.warn('loadDemoMirrorSelfies notice:', err);
  }

  hasAttemptedLoad = true;
  return cachedMirrorSelfies;
}

/**
 * Returns the current array of mirror selfies from the 'demo' bucket.
 */
export function getDemoMirrorSelfies(): string[] {
  return cachedMirrorSelfies;
}

/**
 * Get a specific demo mirror selfie URL by index (with wrapping).
 */
export function getDemoMirrorSelfieByIndex(index: number): string {
  const list = cachedMirrorSelfies;
  if (!list || list.length === 0) return `${DEMO_BASE_STORAGE_URL}/selfie1.jpg`;
  return list[Math.abs(index) % list.length];
}
