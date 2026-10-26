/**
 * Image processing utilities for Fit Check
 * - Resizes outfit photo to ~1200px wide before uploading
 * - Compresses to balanced JPEG quality for fast mobile uploads
 * - Converts to Base64 for Gemini vision API
 */

export async function compressAndResizeImage(
  file: File | Blob,
  maxWidth = 1200,
  quality = 0.86
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image into memory'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Resize down if wider than maxWidth
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // Draw image onto canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl, width, height });
            } else {
              reject(new Error('Failed to generate image blob'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Crops an image to a square from center and resizes to targetSize (e.g. 400x400)
 * Designed for user avatars and profile photos
 */
export async function cropAndResizeToSquare(
  file: File | Blob,
  targetSize = 400,
  quality = 0.88
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image into memory'));
      img.onload = () => {
        const origWidth = img.naturalWidth || img.width;
        const origHeight = img.naturalHeight || img.height;
        const minDim = Math.min(origWidth, origHeight);

        // Center crop coordinates
        const sx = Math.max(0, (origWidth - minDim) / 2);
        const sy = Math.max(0, (origHeight - minDim) / 2);

        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetSize, targetSize);
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, dataUrl });
            } else {
              reject(new Error('Failed to generate square avatar blob'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatToDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format date for editorial headers: "TUESDAY · OCT 27"
 */
export function formatEditorialDate(dateStrOrObj: string | Date): string {
  const date = typeof dateStrOrObj === 'string' ? new Date(`${dateStrOrObj}T12:00:00`) : dateStrOrObj;
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const monthName = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dayNum = date.getDate();
  return `${dayName} · ${monthName} ${dayNum}`;
}

/**
 * Format date for magazine headings: "October 27, 2026"
 */
export function formatMagazineDate(dateStrOrObj: string | Date): string {
  const date = typeof dateStrOrObj === 'string' ? new Date(`${dateStrOrObj}T12:00:00`) : dateStrOrObj;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
