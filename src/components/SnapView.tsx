import React, { useState, useRef, useMemo } from 'react';
import { Fit, FitItem } from '../config/supabase';
import { PhotoTagger } from './PhotoTagger';
import { FitDetailCard } from './FitDetailCard';
import { compressAndResizeImage, formatEditorialDate, formatToDateKey } from '../utils/image';
import { dataService } from '../services/dataService';
import {
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  AlertCircle,
  PlusCircle,
  Image as ImageIcon,
  Calendar,
} from 'lucide-react';

interface SnapViewProps {
  userId: string;
  todayFit: Fit | null;
  targetDate?: string;
  isGuest?: boolean;
  onClearTargetDate?: () => void;
  onSetTargetDate?: (dateStr: string) => void;
  targetFit?: Fit | null;
  onFitSaved: (savedFit: Fit) => void;
  onDeleteFit: (fit: Fit) => void;
  allFits?: Fit[];
}

export const SnapView: React.FC<SnapViewProps> = ({
  userId,
  todayFit,
  targetDate,
  isGuest = false,
  onClearTargetDate,
  onSetTargetDate,
  targetFit,
  onFitSaved,
  onDeleteFit,
  allFits = [],
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<'idle' | 'tagging'>('idle');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [taggedItems, setTaggedItems] = useState<FitItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const todayStr = formatToDateKey(new Date());
  const effectiveDate = targetDate || todayStr;
  const isPastDate = effectiveDate < todayStr;
  const isToday = effectiveDate === todayStr;
  const activeFit = targetFit !== undefined ? targetFit : (isToday ? todayFit : null);

  // Extract catalog of user's previous wardrobe items to compare against
  const previousWardrobeItems = useMemo(() => {
    if (!allFits || allFits.length === 0) return [];
    const itemMap = new Map<string, { item_id: string; category: string; description: string; brand: string }>();
    for (const f of allFits) {
      for (const it of f.items || []) {
        if (!it.description && !it.brand) continue;
        const key = it.item_id || `${it.category}_${(it.brand || '').toLowerCase().trim()}_${(it.description || '').toLowerCase().trim()}`;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            item_id: it.item_id || `item_${it.category || 'top'}_${(it.brand || '').toLowerCase().replace(/[^a-z0-9]+/g, '')}_${(it.description || '').slice(0, 10).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
            category: it.category,
            description: it.description,
            brand: it.brand,
          });
        }
      }
    }
    return Array.from(itemMap.values());
  }, [allFits]);

  // Handle image capture/selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setCurrentStep('tagging');

    try {
      // 1. Compress & resize image to ~1200px
      const { blob, dataUrl } = await compressAndResizeImage(file, 1200, 0.86);
      setPhotoDataUrl(dataUrl);
      setPhotoBlob(blob);

      // 2. Tagging logic: Mock in guest mode; real Gemini vision call for signed-in users
      if (isGuest) {
        // Guest mode mock tagging with recurring wardrobe pieces to demonstrate wardrobe memory
        const guestItems: FitItem[] = [
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
            search_query: 'adidas samba classic sneakers',
            source: 'ai',
          },
        ];
        setTaggedItems(guestItems);
      } else {
        // Real Gemini AI vision call with user's past wardrobe items context
        setIsAnalyzing(true);
        try {
          const res = await fetch('/api/analyze-fit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: dataUrl,
              mimeType: 'image/jpeg',
              previousWardrobeItems,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.items && Array.isArray(data.items) && data.items.length > 0) {
              setTaggedItems(data.items);
            } else {
              setErrorMessage('AI didn’t detect any specific garments — tap anywhere on your photo to add tags manually.');
              setTaggedItems([]);
            }
          } else {
            console.warn('AI analysis returned status:', res.status);
            setErrorMessage('AI tagging unavailable right now — tap anywhere on your photo to add tags manually.');
            setTaggedItems([]);
          }
        } catch (aiErr) {
          console.warn('Gemini AI analysis request failed:', aiErr);
          setErrorMessage('AI tagging unavailable right now — tap anywhere on your photo to add tags manually.');
          setTaggedItems([]);
        } finally {
          setIsAnalyzing(false);
        }
      }
    } catch (err: any) {
      console.error('Image capture processing error:', err);
      setErrorMessage(err.message || 'Failed to process photo.');
      setCurrentStep('idle');
    } finally {
      setIsAnalyzing(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  // Post fit action
  const handlePostFit = async () => {
    if (!photoBlob || !photoDataUrl) return;

    setIsPosting(true);
    setErrorMessage(null);

    try {
      let finalItems = [...taggedItems];

      // 1. Compare and match tagged items with user's previous wardrobe items (assigning/reusing stable item_ids)
      try {
        const matchRes = await fetch('/api/match-wardrobe-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newItems: finalItems,
            previousWardrobeItems,
          }),
        });

        if (matchRes.ok) {
          const matchData = await matchRes.json();
          if (Array.isArray(matchData.matchedItems) && matchData.matchedItems.length > 0) {
            finalItems = matchData.matchedItems;
          }
        }
      } catch (matchErr) {
        console.warn('Wardrobe matching endpoint fallback applied:', matchErr);
      }

      // 2. Generate optimized Google Shopping search queries for each tag
      try {
        const queryRes = await fetch('/api/generate-search-queries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: finalItems }),
        });

        if (queryRes.ok) {
          const queryData = await queryRes.json();
          if (Array.isArray(queryData.searchQueries)) {
            finalItems = finalItems.map((item, idx) => ({
              ...item,
              search_query:
                queryData.searchQueries[idx] ||
                (item.brand?.trim()
                  ? `${item.brand.trim()} ${item.description.trim()}`
                  : item.description.trim() || item.category),
            }));
          }
        }
      } catch (queryErr) {
        console.warn('Query generation fallback applied:', queryErr);
        finalItems = finalItems.map((item) => ({
          ...item,
          search_query: item.brand?.trim()
            ? `${item.brand.trim()} ${item.description.trim()}`
            : item.description.trim() || item.category,
        }));
      }

      // 3. Upload photo to Supabase storage bucket 'fits'
      const uploadedUrl = await dataService.uploadPhoto(userId, photoBlob);

      // 4. Save fit record to Supabase database (unique user_id, date)
      const saved = await dataService.saveFit(userId, effectiveDate, uploadedUrl, finalItems);

      onFitSaved(saved);
      setCurrentStep('idle');
      setPhotoDataUrl(null);
      setPhotoBlob(null);
      setTaggedItems([]);
    } catch (err: any) {
      console.error('Failed to post fit:', err);
      setErrorMessage(err.message || 'Could not post fit. Please check network and try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleRetake = () => {
    setCurrentStep('idle');
    setPhotoDataUrl(null);
    setPhotoBlob(null);
    setTaggedItems([]);
  };

  const handleEditExistingFit = (fit: Fit) => {
    setPhotoDataUrl(fit.image_url);
    // Convert existing items
    setTaggedItems(fit.items || []);
    setCurrentStep('tagging');
  };

  // If currently in the interactive tagging step
  if (currentStep === 'tagging' && photoDataUrl) {
    return (
      <div className="pb-24">
        <PhotoTagger
          imageUrl={photoDataUrl}
          items={taggedItems}
          onItemsChange={setTaggedItems}
          isAnalyzing={isAnalyzing}
          onPost={handlePostFit}
          isPosting={isPosting}
          onRetake={handleRetake}
          allFits={allFits}
          targetDate={effectiveDate}
        />
      </div>
    );
  }

  // If fit already exists for effectiveDate, show that look!
  if (activeFit) {
    return (
      <div className="w-full max-w-md mx-auto space-y-5 pb-24">
        {/* Missed Day Banner if viewing past date */}
        {!isToday && (
          <div className="bg-[#FAF7F2] border border-[#2B2420]/15 p-2.5 rounded-[2px] flex items-center justify-between text-xs font-sans">
            <div className="flex items-center gap-2">
              <Calendar strokeWidth={1.3} className="w-4 h-4 text-[#6B1E2B]" />
              <span className="font-bodoni italic text-sm text-[#2B2420]">
                Viewing Look for {formatEditorialDate(effectiveDate)}
              </span>
            </div>
            {onClearTargetDate && (
              <button
                type="button"
                onClick={onClearTargetDate}
                className="text-[10px] uppercase tracking-wider text-[#6B1E2B] hover:underline"
              >
                Go to Today
              </button>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <div>
            <span className="text-[10px] tracking-[0.2em] uppercase font-sans font-medium text-[#6B1E2B] block">
              {isToday ? "Today's Entry Recorded" : "Archived Entry"}
            </span>
            <h2 className="font-bodoni italic text-3xl text-[#2B2420]">
              {isToday ? "Today's Fit" : formatEditorialDate(effectiveDate)}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="px-3 py-2 rounded-[2px] border border-[#2B2420]/25 text-[10px] uppercase tracking-[0.2em] font-sans text-[#2B2420] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5"
          >
            <Camera strokeWidth={1.3} className="w-3.5 h-3.5 text-[#6B1E2B]" />
            <span>Re-Snap</span>
          </button>
        </div>

        {/* Fit Detail Card */}
        <FitDetailCard
          fit={activeFit}
          onEditTags={handleEditExistingFit}
          onDeleteFit={onDeleteFit}
          isOwner={true}
          allFits={allFits}
        />

        {/* Hidden Camera Input for Re-snap */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  // Idle state: Prompt user to snap today's outfit or a missed date
  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-24">
      {/* Missed Day Banner if past date selected */}
      {!isToday && (
        <div className="bg-[#FCE7F3]/50 border border-[#F472B6]/40 p-3 rounded-[3px] flex items-center justify-between text-xs font-sans">
          <div className="flex items-center gap-2">
            <Calendar strokeWidth={1.4} className="w-4 h-4 text-[#E11D48]" />
            <div>
              <span className="text-[9px] uppercase tracking-widest text-[#BE185D] font-semibold block">
                Archiving Missed Fit
              </span>
              <span className="font-bodoni italic text-sm text-[#2B2420]">
                {formatEditorialDate(effectiveDate)}
              </span>
            </div>
          </div>
          {onClearTargetDate && (
            <button
              type="button"
              onClick={onClearTargetDate}
              className="text-[10px] uppercase tracking-wider text-[#BE185D] hover:underline font-semibold"
            >
              Switch to Today
            </button>
          )}
        </div>
      )}

      {/* Editorial Header */}
      <div className="px-1 text-center space-y-1">
        <span className="text-[10px] tracking-[0.25em] uppercase font-sans font-semibold text-[#BE185D] block">
          {formatEditorialDate(effectiveDate)}
        </span>
        <h2 className="font-bodoni italic text-4xl text-[#2B2420]">
          {isToday ? "Daily Fit Check" : "Log Missed Fit"}
        </h2>
        <p className="font-sans text-xs text-[#2B2420]/70 max-w-xs mx-auto">
          {isToday
            ? "One outfit photo per day. Tag garments, build your lookbook calendar, and create weekly recaps."
            : `Add your outfit for ${formatEditorialDate(effectiveDate)} to complete your lookbook archive.`}
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-[#FCE7F3] border border-[#F43F5E]/30 rounded-[3px] text-xs text-[#BE185D] flex items-center gap-2 font-sans">
          <AlertCircle strokeWidth={1.4} className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Large Snap Camera Trigger with Rosy Styling */}
      <div className="p-6 bg-[#FFFDFD] border border-[#F472B6]/30 rounded-[4px] text-center space-y-6 shadow-xs">
        <div className="w-full aspect-3/4 rounded-[3px] border border-dashed border-[#F472B6]/50 bg-[#FDF2F4]/50 flex flex-col items-center justify-center p-6 text-center space-y-4 relative group">
          <div className="w-20 h-20 rounded-full border border-[#F472B6]/50 bg-[#FFFDFD] flex items-center justify-center text-[#E11D48] shadow-sm transition-transform group-hover:scale-105">
            <Camera strokeWidth={1.3} className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="font-bodoni italic text-2xl text-[#2B2420] block">
              Capture Outfit
            </span>
            <p className="text-xs font-sans text-[#2B2420]/65 max-w-xs">
              Take a full-length mirror selfie or select from your camera roll
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="w-full max-w-xs py-3.5 px-6 rounded-[3px] bg-gradient-to-r from-[#E11D48] via-[#BE185D] to-[#9D174D] text-white text-xs font-sans font-semibold uppercase tracking-[0.2em] border border-[#E11D48] hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-sm shadow-pink-900/10"
          >
            <Camera strokeWidth={1.4} className="w-4 h-4" />
            <span>Open Camera</span>
          </button>

          {/* Secondary Camera Roll Button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="text-[11px] font-sans uppercase tracking-[0.15em] text-[#2B2420]/70 hover:text-[#6B1E2B] transition-colors flex items-center gap-1.5 pt-1"
          >
            <ImageIcon strokeWidth={1.3} className="w-3.5 h-3.5" />
            <span>Choose from Photos</span>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#2B2420]/10 text-center">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider font-sans text-[#6B1E2B] font-semibold block">
              AI Vision
            </span>
            <span className="text-[10px] text-[#2B2420]/60 font-sans block">
              auto-tags brands
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider font-sans text-[#6B1E2B] font-semibold block">
              Interactive
            </span>
            <span className="text-[10px] text-[#2B2420]/60 font-sans block">
              tap to shop items
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider font-sans text-[#6B1E2B] font-semibold block">
              Story Recap
            </span>
            <span className="text-[10px] text-[#2B2420]/60 font-sans block">
              1080x1920 graphic
            </span>
          </div>
        </div>
      </div>

      {/* Hidden File Inputs: Camera & Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
