import React from 'react';
import { Fit, FitItem } from '../config/supabase';
import { formatEditorialDate } from '../utils/image';
import { MirrorCollageModalBackdrop } from './MirrorCollageModalBackdrop';
import { Sparkles, Calendar, ShoppingBag, X, ExternalLink, Clock } from 'lucide-react';

interface ItemHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: FitItem | null;
  currentFitDate?: string;
  allFits: Fit[];
  onSelectFit?: (fit: Fit) => void;
}

export const ItemHistoryModal: React.FC<ItemHistoryModalProps> = ({
  isOpen,
  onClose,
  item,
  currentFitDate,
  allFits = [],
  onSelectFit,
}) => {
  if (!isOpen || !item) return null;

  // Find all fits that include this piece
  const matchingFits = allFits.filter((fit) => {
    if (!fit.items || !Array.isArray(fit.items)) return false;
    return fit.items.some((it) => {
      // 1. Direct item_id match
      if (item.item_id && it.item_id && item.item_id === it.item_id) {
        return true;
      }
      // 2. Fallback category + brand + description similarity
      if (item.category && it.category && item.category === it.category) {
        const itemBrand = (item.brand || '').trim().toLowerCase();
        const itBrand = (it.brand || '').trim().toLowerCase();
        if (itemBrand && itBrand && itemBrand === itBrand) {
          const w1 = (item.description || '').toLowerCase().split(/\s+/).filter((w) => w.length > 2);
          const w2 = (it.description || '').toLowerCase();
          if (w1.some((w) => w2.includes(w))) {
            return true;
          }
        }
      }
      return false;
    });
  });

  // Sort newest first
  const sortedFits = [...matchingFits].sort((a, b) => b.date.localeCompare(a.date));
  const wearCount = Math.max(1, sortedFits.length);

  // Compute last worn date
  const lastWornFit = sortedFits[0];
  const lastWornDateStr = lastWornFit ? lastWornFit.date : (currentFitDate || 'today');

  // Compute relative days
  const computeDaysAgo = (dateStr: string) => {
    const target = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const diffDays = Math.round((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    return `${diffDays} days ago`;
  };

  const daysAgoText = computeDaysAgo(lastWornDateStr);

  const getShoppingUrl = () => {
    const brand = (item.brand || '').trim();
    const desc = (item.description || '').trim();
    const query =
      item.search_query || (brand ? `${brand} ${desc}` : desc || item.category || 'clothing');
    return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
  };

  const itemTitle = item.brand
    ? `${item.brand} · ${item.description || item.category}`
    : item.description || item.category;

  return (
    <MirrorCollageModalBackdrop onBackdropClick={onClose} className="w-full max-w-md">
      <div className="w-full bg-[#FAF7F2] border border-[#F472B6]/40 rounded-[3px] p-5 sm:p-6 shadow-2xl relative my-auto space-y-4 font-sans">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#F472B6]/20">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#BE185D]">
              <Sparkles strokeWidth={1.4} className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>Wardrobe Memory</span>
            </div>
            <h3 className="font-bodoni italic text-2xl text-[#2B2420] mt-0.5 leading-tight">
              {itemTitle}
            </h3>
            <span className="inline-block mt-1 text-[10px] font-sans uppercase tracking-widest text-[#BE185D] bg-[#FCE7F3]/70 px-2 py-0.5 rounded-[2px] border border-[#F472B6]/30 font-medium">
              #{item.category}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#2B2420]/60 hover:text-[#2B2420] hover:bg-black/5 transition-colors"
          >
            <X strokeWidth={1.4} className="w-5 h-5" />
          </button>
        </div>

        {/* Wear History Stat Card */}
        <div className="bg-[#FFFDFD] border border-[#F472B6]/30 p-3.5 rounded-[3px] shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#2B2420]/60 font-semibold flex items-center gap-1">
              <Clock strokeWidth={1.3} className="w-3.5 h-3.5 text-[#BE185D]" />
              Wear Frequency
            </span>
            <span className="text-xs font-semibold text-[#BE185D]">
              {daysAgoText}
            </span>
          </div>

          <p className="font-bodoni italic text-lg text-[#2B2420]">
            last worn {formatEditorialDate(lastWornDateStr)} · worn {wearCount} {wearCount === 1 ? 'time' : 'times'}
          </p>
        </div>

        {/* Thumbnails of Other Fits Including This Piece */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#2B2420]/70">
              Fits Including This Piece ({sortedFits.length})
            </span>
            <span className="text-[10px] text-[#2B2420]/50 lowercase">
              tap thumbnail to view fit
            </span>
          </div>

          {sortedFits.length > 0 ? (
            <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
              {sortedFits.map((f) => {
                const isCurrent = currentFitDate && f.date === currentFitDate;
                return (
                  <div
                    key={f.id || f.date}
                    onClick={() => {
                      if (onSelectFit) {
                        onSelectFit(f);
                        onClose();
                      }
                    }}
                    className={`cursor-pointer group rounded-[2px] overflow-hidden border transition-all ${
                      isCurrent
                        ? 'border-[#E11D48] ring-1 ring-[#E11D48]/40 shadow-xs'
                        : 'border-[#2B2420]/20 hover:border-[#BE185D] hover:shadow-xs'
                    }`}
                  >
                    <div className="relative aspect-3/4 bg-[#2B2420]/5 overflow-hidden">
                      <img
                        src={f.image_url}
                        alt={`Fit for ${f.date}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isCurrent && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-[2px] bg-[#E11D48] text-white text-[8px] font-bold uppercase tracking-wider shadow-xs">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="p-1.5 bg-[#FAF7F2] text-center border-t border-[#2B2420]/10">
                      <span className="text-[9px] uppercase tracking-wider text-[#2B2420]/80 font-medium block truncate">
                        {formatEditorialDate(f.date)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-[#FFFDFD] border border-dashed border-[#F472B6]/40 rounded-[3px] text-center">
              <p className="font-bodoni italic text-sm text-[#2B2420]/60">
                This is the first time you’ve logged this piece!
              </p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 border-t border-[#F472B6]/20 flex items-center justify-between gap-3">
          <a
            href={getShoppingUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-3 rounded-[2px] bg-[#FFFDFD] border border-[#F472B6]/40 text-[#BE185D] hover:bg-[#FDF2F4] text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <ShoppingBag strokeWidth={1.3} className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>Find & Shop Piece</span>
            <ExternalLink strokeWidth={1.3} className="w-3 h-3 opacity-60" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-[2px] bg-[#6B1E2B] text-[#F6F1EA] text-xs uppercase tracking-wider font-semibold hover:bg-[#521721] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </MirrorCollageModalBackdrop>
  );
};
