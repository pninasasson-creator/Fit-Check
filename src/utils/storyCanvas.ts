/**
 * Fit Check · 1080x1920 Instagram Story Canvas Generator
 * 
 * Features:
 * - High-resolution 1080x1920 (9:16) rendering
 * - Cream paper background (#F6F1EA) with hairline accents
 * - Bodoni Moda italic headings, Italiana wordmark, Hanken Grotesk labels
 * - 7 film-print frames (Mon–Sun) with cream borders and date captions
 * - Soft placeholders for empty days
 * - Ensures fonts are loaded before drawing
 * - crossOrigin="anonymous" image loading
 * - Web Share API with download fallback
 */

import { Fit } from '../config/supabase';

export interface DayFitSlot {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // "MON", "TUE", etc.
  dateDisplay: string; // "OCT 26"
  fit?: Fit;
}

/**
 * Load an image safely with crossOrigin="anonymous"
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Retry without anonymous if it was a data URI or local blob
      if (src.startsWith('data:') || src.startsWith('blob:')) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.onerror = () => reject(new Error('Failed to load image'));
        fallbackImg.src = src;
      } else {
        reject(new Error(`Failed to load image from ${src}`));
      }
    };
    img.src = src;
  });
}

/**
 * Generate 1080x1920 Instagram Story Canvas
 */
export async function generateWeekStoryCanvas(
  weekTitle: string,
  days: DayFitSlot[]
): Promise<{ blob: Blob; dataUrl: string }> {
  // Ensure custom web fonts are fully loaded
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font loading check bypassed:', e);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // 1. Background: Warm Paper (#F6F1EA)
  ctx.fillStyle = '#F6F1EA';
  ctx.fillRect(0, 0, 1080, 1920);

  // Subtle paper grain dot grid
  ctx.fillStyle = 'rgba(43, 36, 32, 0.03)';
  for (let x = 20; x < 1080; x += 24) {
    for (let y = 20; y < 1920; y += 24) {
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  // 2. Editorial Hairline Frame Inset
  ctx.strokeStyle = 'rgba(43, 36, 32, 0.16)';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, 1000, 1840);
  ctx.strokeRect(48, 48, 984, 1824);

  // 3. Header Section
  ctx.textAlign = 'center';

  // Subtitle
  ctx.fillStyle = 'rgba(43, 36, 32, 0.6)';
  ctx.font = '500 16px "Hanken Grotesk", sans-serif';
  // Simulate letter spacing
  drawSpacedText(ctx, 'FIT CHECK · WEEK IN REVIEW', 540, 130, 4);

  // Big Title in Bodoni Moda Italic
  ctx.fillStyle = '#2B2420';
  ctx.font = 'italic 58px "Bodoni Moda", serif';
  ctx.fillText(weekTitle, 540, 205);

  // Divider line
  ctx.strokeStyle = 'rgba(107, 30, 43, 0.35)'; // Soft oxblood tint
  ctx.beginPath();
  ctx.moveTo(460, 235);
  ctx.lineTo(620, 235);
  ctx.stroke();

  // 4. Frames Layout (7 Days: Mon - Sun)
  // Grid layout:
  // Row 1: 2 items (Mon, Tue)
  // Row 2: 3 items (Wed, Thu, Fri)
  // Row 3: 2 items (Sat, Sun)
  interface FramePos {
    x: number;
    y: number;
    w: number;
    h: number;
  }

  const positions: FramePos[] = [
    // Mon, Tue
    { x: 100, y: 280, w: 410, h: 420 },
    { x: 570, y: 280, w: 410, h: 420 },
    // Wed, Thu, Fri
    { x: 80, y: 740, w: 280, h: 430 },
    { x: 400, y: 740, w: 280, h: 430 },
    { x: 720, y: 740, w: 280, h: 430 },
    // Sat, Sun
    { x: 100, y: 1210, w: 410, h: 430 },
    { x: 570, y: 1210, w: 410, h: 430 },
  ];

  // Draw each day slot
  for (let i = 0; i < 7; i++) {
    const slot = days[i] || {
      dateStr: '',
      dayLabel: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][i],
      dateDisplay: '',
    };
    const pos = positions[i];

    await drawDayFrame(ctx, pos, slot);
  }

  // 5. Footer Section
  ctx.textAlign = 'center';

  // Small wordmark in Italiana
  ctx.fillStyle = '#2B2420';
  ctx.font = '400 38px "Italiana", serif';
  ctx.fillText('FIT CHECK', 540, 1750);

  // Minimal footer label
  ctx.fillStyle = 'rgba(43, 36, 32, 0.5)';
  ctx.font = '500 13px "Hanken Grotesk", sans-serif';
  drawSpacedText(ctx, 'A DAILY WARDROBE ARCHIVE', 540, 1785, 3);

  // Return generated image as blob & dataUrl
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create canvas blob'));
          return;
        }
        const dataUrl = canvas.toDataURL('image/png');
        resolve({ blob, dataUrl });
      },
      'image/png',
      0.95
    );
  });
}

/**
 * Draws text with simulated letter-spacing on HTML5 canvas
 */
function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
) {
  const characters = text.split('');
  let totalWidth = 0;
  for (const ch of characters) {
    totalWidth += ctx.measureText(ch).width + spacing;
  }
  totalWidth -= spacing;

  let currentX = x - totalWidth / 2;
  for (const ch of characters) {
    ctx.fillText(ch, currentX, y);
    currentX += ctx.measureText(ch).width + spacing;
  }
}

/**
 * Draw an individual day polaroid / film-print frame
 */
async function drawDayFrame(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number; w: number; h: number },
  slot: DayFitSlot
) {
  const { x, y, w, h } = pos;
  const padding = 10;
  const captionHeight = 44;

  // Cream polaroid backing
  ctx.fillStyle = '#FAF7F2';
  ctx.fillRect(x, y, w, h);

  // 1px hairline border
  ctx.strokeStyle = 'rgba(43, 36, 32, 0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);

  // Photo area inside polaroid frame
  const photoX = x + padding;
  const photoY = y + padding;
  const photoW = w - padding * 2;
  const photoH = h - padding * 2 - captionHeight;

  if (slot.fit?.image_url) {
    try {
      const img = await loadImage(slot.fit.image_url);

      ctx.save();
      ctx.beginPath();
      ctx.rect(photoX, photoY, photoW, photoH);
      ctx.clip();

      // Cover-crop fit image
      const imgAspect = img.width / img.height;
      const targetAspect = photoW / photoH;
      let drawW = photoW;
      let drawH = photoH;
      let offsetX = photoX;
      let offsetY = photoY;

      if (imgAspect > targetAspect) {
        drawW = photoH * imgAspect;
        offsetX = photoX - (drawW - photoW) / 2;
      } else {
        drawH = photoW / imgAspect;
        offsetY = photoY - (drawH - photoH) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      ctx.restore();

      // Photo hairline border
      ctx.strokeStyle = 'rgba(43, 36, 32, 0.12)';
      ctx.strokeRect(photoX, photoY, photoW, photoH);
    } catch (e) {
      console.warn('Failed to draw fit photo onto story canvas:', e);
      drawEmptyPlaceholder(ctx, photoX, photoY, photoW, photoH);
    }
  } else {
    // Empty day placeholder
    drawEmptyPlaceholder(ctx, photoX, photoY, photoW, photoH);
  }

  // Polaroid Caption Area
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2B2420';
  ctx.font = '600 12px "Hanken Grotesk", sans-serif';
  ctx.fillText(slot.dayLabel, x + padding + 4, y + h - 22);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(43, 36, 32, 0.6)';
  ctx.font = 'italic 12px "Bodoni Moda", serif';
  ctx.fillText(
    slot.fit?.items?.length ? `${slot.fit.items.length} items` : slot.dateDisplay || 'rest day',
    x + w - padding - 4,
    y + h - 22
  );
}

/**
 * Draw minimal editorial empty frame placeholder
 */
function drawEmptyPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.fillStyle = 'rgba(233, 201, 195, 0.18)'; // Soft dusty blush wash
  ctx.fillRect(x, y, w, h);

  // Delicate dashed border
  ctx.save();
  ctx.strokeStyle = 'rgba(43, 36, 32, 0.15)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(43, 36, 32, 0.38)';
  ctx.font = 'italic 13px "Bodoni Moda", serif';
  ctx.fillText('no fit recorded', x + w / 2, y + h / 2);
}

/**
 * Share or save story graphic with Web Share API or download fallback
 */
export async function shareOrSaveStoryGraphic(
  blob: Blob,
  fileName = 'fit-check-week-recap.png'
): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], fileName, { type: 'image/png' });

  // Check if Web Share API with files is supported (iOS Safari 15+, modern Android)
  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        title: 'Fit Check · Week in Review',
        text: 'My weekly outfit recap from Fit Check',
        files: [file],
      });
      return 'shared';
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return 'shared'; // User simply cancelled share dialog
      }
      console.warn('Share API threw error, falling back to download:', err);
    }
  }

  // Fallback: direct download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}
