import React, { useState, useEffect } from 'react';
import { Fit } from '../config/supabase';
import {
  generateWeekStoryCanvas,
  shareOrSaveStoryGraphic,
  DayFitSlot,
} from '../utils/storyCanvas';
import { X, Share2, Download, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { formatToDateKey } from '../utils/image';
import { MirrorCollageModalBackdrop } from './MirrorCollageModalBackdrop';

interface WeekInReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fits: Fit[];
  initialDate?: Date;
}

export const WeekInReviewModal: React.FC<WeekInReviewModalProps> = ({
  isOpen,
  onClose,
  fits,
  initialDate = new Date(),
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  // Calculate Monday of the selected week
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const monday = getMonday(selectedDate);

  // Generate 7 day slots for the week
  const weekSlots: DayFitSlot[] = React.useMemo(() => {
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const slots: DayFitSlot[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatToDateKey(d);
      const fit = fits.find((f) => f.date === dateStr);
      const monthShort = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const dayNum = d.getDate();

      slots.push({
        dateStr,
        dayLabel: dayNames[i],
        dateDisplay: `${monthShort} ${dayNum}`,
        fit,
      });
    }

    return slots;
  }, [monday, fits]);

  const weekHeading = React.useMemo(() => {
    const month = monday.toLocaleDateString('en-US', { month: 'long' });
    const day = monday.getDate();
    return `Week of ${month} ${day}`;
  }, [monday]);

  // Generate story canvas when week slots change
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    async function renderCanvas() {
      setIsGenerating(true);
      try {
        const { blob, dataUrl } = await generateWeekStoryCanvas(weekHeading, weekSlots);
        if (!cancelled) {
          setGeneratedBlob(blob);
          setPreviewUrl(dataUrl);
        }
      } catch (err) {
        console.error('Failed to generate week story canvas:', err);
      } finally {
        if (!cancelled) {
          setIsGenerating(false);
        }
      }
    }

    renderCanvas();

    return () => {
      cancelled = true;
    };
  }, [isOpen, weekHeading, weekSlots]);

  if (!isOpen) return null;

  const handlePrevWeek = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 7);
    setSelectedDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 7);
    setSelectedDate(next);
  };

  const handleShareOrSave = async () => {
    if (!generatedBlob) return;
    try {
      const fileName = `fit-check-${weekHeading.toLowerCase().replace(/\s+/g, '-')}.png`;
      const result = await shareOrSaveStoryGraphic(generatedBlob, fileName);
      setShareStatus(result === 'shared' ? 'Shared successfully' : 'Saved to downloads');
      setTimeout(() => setShareStatus(null), 3000);
    } catch (err) {
      console.error('Share action failed:', err);
    }
  };

  const fitsInWeek = weekSlots.filter((s) => s.fit).length;

  return (
    <MirrorCollageModalBackdrop onBackdropClick={onClose} className="w-full max-w-md">
      <div className="w-full bg-[#FAF7F2] border border-[#F472B6]/40 rounded-[4px] p-5 shadow-2xl relative my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2B2420]/15">
          <div>
            <span className="text-[10px] tracking-[0.2em] uppercase font-sans font-medium text-[#2B2420]/60 block">
              Instagram Story · 9:16
            </span>
            <h3 className="font-bodoni italic text-2xl text-[#2B2420]">
              Week in Review
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#2B2420]/60 hover:text-[#2B2420] transition-colors"
          >
            <X strokeWidth={1.3} className="w-5 h-5" />
          </button>
        </div>

        {/* Week Selector Bar */}
        <div className="flex items-center justify-between py-3 my-1">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="p-1.5 text-[#2B2420]/70 hover:text-[#2B2420] transition-colors rounded-[2px] border border-[#2B2420]/15 hover:bg-[#F6F1EA]"
          >
            <ChevronLeft strokeWidth={1.3} className="w-4 h-4" />
          </button>

          <div className="text-center">
            <span className="font-bodoni italic text-base text-[#2B2420] block">
              {weekHeading}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#6B1E2B] font-sans">
              {fitsInWeek} {fitsInWeek === 1 ? 'look' : 'looks'} recorded
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextWeek}
            className="p-1.5 text-[#2B2420]/70 hover:text-[#2B2420] transition-colors rounded-[2px] border border-[#2B2420]/15 hover:bg-[#F6F1EA]"
          >
            <ChevronRight strokeWidth={1.3} className="w-4 h-4" />
          </button>
        </div>

        {/* Story Graphic Preview in 9:16 Phone Aspect Ratio */}
        <div className="relative w-full aspect-9/16 max-h-[58vh] mx-auto rounded-[3px] border border-[#2B2420]/25 overflow-hidden bg-[#F6F1EA] shadow-inner flex items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Week in review Instagram story preview"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-[#2B2420]/60">
              <div className="w-7 h-7 border-2 border-[#6B1E2B] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="font-bodoni italic text-sm">
                Compiling 7-day lookbook canvas...
              </p>
            </div>
          )}

          {isGenerating && previewUrl && (
            <div className="absolute inset-0 bg-[#FAF7F2]/50 backdrop-blur-xs flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#6B1E2B] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Share Feedback Toast */}
        {shareStatus && (
          <div className="mt-2 text-center text-xs font-sans text-[#6B1E2B] flex items-center justify-center gap-1.5 animate-in fade-in">
            <Check strokeWidth={1.4} className="w-3.5 h-3.5" />
            <span>{shareStatus}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 mt-1 border-t border-[#2B2420]/15">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-[2px] border border-[#2B2420]/25 text-xs uppercase tracking-[0.15em] text-[#2B2420]/70 hover:bg-[#F6F1EA] transition-colors font-sans"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleShareOrSave}
            disabled={!generatedBlob || isGenerating}
            className="flex-1 py-3 px-5 rounded-[2px] bg-[#6B1E2B] text-[#F6F1EA] text-xs font-sans font-medium uppercase tracking-[0.2em] border border-[#6B1E2B] hover:bg-[#521721] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
          >
            <Share2 strokeWidth={1.3} className="w-4 h-4" />
            <span>Save / Share Story</span>
          </button>
        </div>
      </div>
    </MirrorCollageModalBackdrop>
  );
};
