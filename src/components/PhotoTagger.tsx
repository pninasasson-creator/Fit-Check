import React, { useState, useRef, useMemo } from 'react';
import { Fit, FitItem } from '../config/supabase';
import { TagEditorModal } from './TagEditorModal';
import { ItemHistoryModal } from './ItemHistoryModal';
import { formatEditorialDate } from '../utils/image';
import { Sparkles, Plus, Move, Clock, Info } from 'lucide-react';

interface PhotoTaggerProps {
  imageUrl: string;
  items: FitItem[];
  onItemsChange: (items: FitItem[]) => void;
  isAnalyzing: boolean;
  onPost: () => void;
  isPosting: boolean;
  onRetake: () => void;
  allFits?: Fit[];
  targetDate?: string;
}

export const PhotoTagger: React.FC<PhotoTaggerProps> = ({
  imageUrl,
  items,
  onItemsChange,
  isAnalyzing,
  onPost,
  isPosting,
  onRetake,
  allFits = [],
  targetDate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeEditingIndex, setActiveEditingIndex] = useState<number | null>(null);
  const [historyItem, setHistoryItem] = useState<FitItem | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasMovedSignificantly = useRef<boolean>(false);

  // Compute gentle non-blocking Repeat Check notes
  const repeatCheckNotes = useMemo(() => {
    if (!items.length || !allFits.length) return [];
    const notes: { type: 'exact' | 'item'; message: string; date: string }[] = [];

    const effectiveCurrentDate = targetDate || new Date().toISOString().slice(0, 10);
    const pastFits = allFits
      .filter((f) => f.date !== effectiveCurrentDate)
      .sort((a, b) => b.date.localeCompare(a.date));

    // 1. Exact outfit repeat check
    for (const pastFit of pastFits) {
      if (!pastFit.items || pastFit.items.length === 0) continue;
      let matchedCount = 0;
      for (const curItem of items) {
        const match = pastFit.items.some((pi) => {
          if (curItem.item_id && pi.item_id && curItem.item_id === pi.item_id) return true;
          const curBrand = (curItem.brand || '').trim().toLowerCase();
          const piBrand = (pi.brand || '').trim().toLowerCase();
          const curDesc = (curItem.description || '').toLowerCase();
          const piDesc = (pi.description || '').toLowerCase();
          if (curItem.category === pi.category) {
            if (curBrand && piBrand && curBrand === piBrand) return true;
            if (curDesc && piDesc && (curDesc.includes(piDesc) || piDesc.includes(curDesc))) return true;
          }
          return false;
        });
        if (match) matchedCount++;
      }

      if (matchedCount >= 2 && matchedCount >= Math.min(items.length, pastFit.items.length) * 0.75) {
        const days = Math.round(
          (new Date(effectiveCurrentDate + 'T00:00:00').getTime() - new Date(pastFit.date + 'T00:00:00').getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const timeAgo = days > 0 ? (days === 1 ? 'yesterday' : `${days} days ago`) : 'recently';
        notes.push({
          type: 'exact',
          message: `this exact fit was last worn ${formatEditorialDate(pastFit.date)} (${timeAgo}).`,
          date: pastFit.date,
        });
        break; // Only show most recent exact match
      }
    }

    // 2. Key individual pieces worn recently (past 14 days)
    for (const curItem of items) {
      const itemLabel = curItem.brand
        ? `${curItem.brand} ${curItem.description || curItem.category}`
        : curItem.description || curItem.category;

      for (const pastFit of pastFits) {
        const matchedPiece = pastFit.items?.find((pi) => {
          if (curItem.item_id && pi.item_id && curItem.item_id === pi.item_id) return true;
          const curBrand = (curItem.brand || '').trim().toLowerCase();
          const piBrand = (pi.brand || '').trim().toLowerCase();
          const curDesc = (curItem.description || '').toLowerCase();
          const piDesc = (pi.description || '').toLowerCase();
          if (curItem.category === pi.category) {
            if (curBrand && piBrand && curBrand === piBrand) return true;
            if (curDesc && piDesc && curDesc === piDesc) return true;
          }
          return false;
        });

        if (matchedPiece) {
          const days = Math.round(
            (new Date(effectiveCurrentDate + 'T00:00:00').getTime() - new Date(pastFit.date + 'T00:00:00').getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (days > 0 && days <= 14) {
            const daysText = days === 1 ? 'yesterday' : `${days} days ago`;
            notes.push({
              type: 'item',
              message: `you wore this ${itemLabel.toLowerCase()} ${daysText} (${formatEditorialDate(pastFit.date)}).`,
              date: pastFit.date,
            });
          }
          break;
        }
      }
    }

    return notes;
  }, [items, allFits, targetDate]);

  // Handle pointer down on a tag for dragging
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragIndex(index);
    hasMovedSignificantly.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignored if not supported
    }
  };

  // Handle dragging
  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragIndex === null || !containerRef.current) return;

    if (dragStartPos.current) {
      const dist = Math.hypot(
        e.clientX - dragStartPos.current.x,
        e.clientY - dragStartPos.current.y
      );
      if (dist > 5) {
        hasMovedSignificantly.current = true;
      }
    }

    const rect = containerRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(4, Math.min(96, Math.round(rawX)));
    const clampedY = Math.max(4, Math.min(96, Math.round(rawY)));

    const updated = [...items];
    updated[dragIndex] = {
      ...updated[dragIndex],
      x: clampedX,
      y: clampedY,
    };
    onItemsChange(updated);
  };

  // Handle pointer up
  const handlePointerUp = (index: number, e: React.PointerEvent) => {
    if (dragIndex !== null) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
      setDragIndex(null);

      // If it didn't move significantly, it was a click/tap: open the edit sheet
      if (!hasMovedSignificantly.current) {
        setActiveEditingIndex(index);
      }
    }
  };

  // Tap empty area to add a new tag
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(5, Math.min(95, Math.round(((e.clientY - rect.top) / rect.height) * 100)));

    const newTag: FitItem = {
      category: 'top',
      description: 'garment',
      brand: '',
      confidence: 'high',
      x,
      y,
      search_query: '',
      source: 'user',
    };

    const newItems = [...items, newTag];
    onItemsChange(newItems);
    setActiveEditingIndex(newItems.length - 1);
  };

  const handleSaveTag = (updated: FitItem) => {
    if (activeEditingIndex === null) return;
    const next = [...items];
    next[activeEditingIndex] = updated;
    onItemsChange(next);
    setActiveEditingIndex(null);
  };

  const handleDeleteTag = () => {
    if (activeEditingIndex === null) return;
    const next = items.filter((_, i) => i !== activeEditingIndex);
    onItemsChange(next);
    setActiveEditingIndex(null);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Editorial Step Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-[10px] tracking-[0.2em] uppercase font-sans font-medium text-[#2B2420]/60 block">
            Step 02 · Archive
          </span>
          <h2 className="font-bodoni italic text-2xl text-[#2B2420]">
            Tag Your Fit
          </h2>
        </div>
        <div className="text-right">
          <span className="inline-block text-[11px] font-sans tracking-wider text-[#6B1E2B] bg-[#E9C9C3]/40 px-2 py-0.5 rounded-[2px] border border-[#6B1E2B]/20">
            {items.length} {items.length === 1 ? 'item' : 'items'} tagged
          </span>
        </div>
      </div>

      {/* Editorial Helper Banner */}
      <div className="text-xs font-sans text-[#2B2420]/75 bg-[#FAF7F2] border border-[#2B2420]/15 p-2.5 rounded-[2px] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Move strokeWidth={1.3} className="w-3.5 h-3.5 text-[#6B1E2B]" />
          Drag tags to reposition · Tap empty area to add
        </span>
        {isAnalyzing && (
          <span className="text-[10px] uppercase tracking-widest text-[#6B1E2B] animate-pulse flex items-center gap-1">
            <Sparkles strokeWidth={1.3} className="w-3 h-3" />
            Scanning
          </span>
        )}
      </div>

      {/* Main Tagging Photo Canvas (Film Print Framed) */}
      <div className="film-frame p-2.5 sm:p-3 relative bg-[#FAF7F2]">
        <div
          ref={containerRef}
          onClick={handleContainerClick}
          onPointerMove={handlePointerMove}
          className="relative w-full aspect-3/4 rounded-[2px] overflow-hidden bg-[#2B2420]/5 cursor-crosshair select-none touch-none"
        >
          {/* Photo */}
          <img
            src={imageUrl}
            alt="Outfit fit to tag"
            className="w-full h-full object-cover pointer-events-none select-none"
            draggable={false}
          />

          {/* AI Scanning Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-[#2B2420]/40 backdrop-blur-xs flex flex-col items-center justify-center text-[#FDF2F4] p-4 text-center z-30">
              <div className="w-9 h-9 rounded-full border-2 border-[#F472B6] border-t-transparent animate-spin mb-3" />
              <p className="font-bodoni italic text-xl tracking-wide text-[#FCE7F3]">
                analyzing your fit…
              </p>
              <p className="text-[11px] font-sans text-[#F472B6] mt-1 uppercase tracking-widest font-medium">
                Detecting garments, silhouettes & brands
              </p>
            </div>
          )}

          {/* Interactive Tag Pins */}
          {!isAnalyzing &&
            items.map((item, index) => {
              const hasBrand = Boolean(item.brand && item.brand.trim());
              const labelText = hasBrand
                ? item.brand.trim().toLowerCase()
                : (item.description || item.category || 'item').toLowerCase();

              return (
                <div
                  key={index}
                  onPointerDown={(e) => handlePointerDown(index, e)}
                  onPointerUp={(e) => handlePointerUp(index, e)}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-full cursor-grab active:cursor-grabbing select-none transition-transform ${
                    dragIndex === index ? 'scale-110 z-40' : 'hover:scale-105 z-20'
                  }`}
                >
                  {/* Tag Label Box */}
                  <div className="flex flex-col items-center">
                    <div className="px-2.5 py-1 bg-[#FFFDFD] text-[#2B2420] border border-[#BE185D]/40 rounded-[3px] shadow-md flex items-center gap-1.5 whitespace-nowrap text-xs font-sans tracking-tight">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                      <span className="font-medium lowercase text-[#2B2420] max-w-[200px] truncate">{labelText}</span>
                      {!hasBrand && (
                        <span className="text-[10px] text-[#BE185D] hover:text-[#9D174D] font-semibold tracking-wide border-l border-[#F472B6]/40 pl-1.5 ml-0.5">
                          + add brand
                        </span>
                      )}
                    </div>
                    {/* Downward Pointer Triangle */}
                    <div className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-[#BE185D]/40 -mt-px" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E11D48] -mt-0.5" />
                  </div>
                </div>
              );
            })}
        </div>

        {/* Polaroid Caption Footer */}
        <div className="pt-2 px-1 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-sans text-[#2B2420]/60">
          <span>Tap tag to edit details</span>
          <span>Fit Check Archive</span>
        </div>
      </div>

      {/* Gentle, Informational Repeat Check Note */}
      {repeatCheckNotes.length > 0 && (
        <div className="p-3.5 bg-[#FFF5F5] border border-[#F472B6]/40 rounded-[3px] space-y-1.5 shadow-2xs font-sans">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#BE185D]">
            <Clock strokeWidth={1.4} className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>Wardrobe Memory · Repeat Check</span>
          </div>
          <div className="space-y-1 text-xs">
            {repeatCheckNotes.map((note, idx) => (
              <p key={idx} className="font-bodoni italic text-sm text-[#2B2420]">
                ✦ {note.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onRetake}
          disabled={isPosting}
          className="flex-1 py-3 px-4 rounded-[2px] border border-[#2B2420]/30 text-xs font-sans uppercase tracking-[0.15em] text-[#2B2420] hover:bg-[#FAF7F2] transition-colors"
        >
          Retake Photo
        </button>

        <button
          type="button"
          onClick={onPost}
          disabled={isPosting || isAnalyzing}
          className="flex-2 py-3 px-6 rounded-[2px] bg-[#6B1E2B] text-[#F6F1EA] text-xs font-sans font-medium uppercase tracking-[0.2em] border border-[#6B1E2B] hover:bg-[#521721] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-xs"
        >
          {isPosting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-[#F6F1EA] border-t-transparent rounded-full animate-spin" />
              <span>Archiving Fit...</span>
            </>
          ) : (
            <span>Post Fit</span>
          )}
        </button>
      </div>

      {/* Tag Editor Bottom Sheet */}
      <TagEditorModal
        isOpen={activeEditingIndex !== null}
        tag={activeEditingIndex !== null ? items[activeEditingIndex] : null}
        onSave={handleSaveTag}
        onDelete={handleDeleteTag}
        onClose={() => setActiveEditingIndex(null)}
      />

      {/* Optional Item History Modal if tag history is inspected */}
      <ItemHistoryModal
        isOpen={Boolean(historyItem)}
        onClose={() => setHistoryItem(null)}
        item={historyItem}
        currentFitDate={targetDate}
        allFits={allFits}
      />
    </div>
  );
};
