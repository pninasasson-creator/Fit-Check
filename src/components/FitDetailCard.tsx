import React, { useState } from 'react';
import { Fit, FitItem } from '../config/supabase';
import { formatEditorialDate } from '../utils/image';
import { ItemHistoryModal } from './ItemHistoryModal';
import { Tag, ExternalLink, Edit3, Trash2, ShoppingBag, Clock } from 'lucide-react';

interface FitDetailCardProps {
  fit: Fit;
  onEditTags?: (fit: Fit) => void;
  onDeleteFit?: (fit: Fit) => void;
  isOwner?: boolean;
  allFits?: Fit[];
  onSelectFit?: (fit: Fit) => void;
}

export const FitDetailCard: React.FC<FitDetailCardProps> = ({
  fit,
  onEditTags,
  onDeleteFit,
  isOwner = true,
  allFits = [],
  onSelectFit,
}) => {
  const [showTags, setShowTags] = useState<boolean>(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<FitItem | null>(null);

  // Generate safe shopping search url: uses user-entered brand if there is one, otherwise description
  const getShoppingUrl = (item: FitItem) => {
    const brand = (item.brand || '').trim();
    const desc = (item.description || '').trim();
    const query = item.search_query || (brand ? `${brand} ${desc}` : desc || item.category || 'clothing');
    return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
  };

  const handlePhotoClick = () => {
    // Toggle tags visibility on photo tap
    setShowTags((prev) => !prev);
  };

  const handleTagClick = (e: React.MouseEvent, item: FitItem) => {
    e.stopPropagation();
    setSelectedItemForHistory(item);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Film-Print Framed Polaroid Presentation */}
      <div className="film-frame p-4 sm:p-6 bg-[#FAF7F2] transition-all">
        <div className="md:grid md:grid-cols-12 md:gap-6 items-start">
          {/* Left Column: Photo Container (7 cols on md) */}
          <div className="md:col-span-7">
            <div
              onClick={handlePhotoClick}
              className="relative w-full aspect-3/4 rounded-[2px] overflow-hidden bg-[#2B2420]/5 cursor-pointer select-none group"
            >
          <img
            src={fit.image_url}
            alt={`Fit for ${fit.date}`}
            className="w-full h-full object-cover select-none"
          />

          {/* Tiny Tag Indicator Icon in Corner */}
          <div className="absolute top-2.5 right-2.5 z-20">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTags(!showTags);
              }}
              className={`p-2 rounded-[2px] border backdrop-blur-md transition-all ${
                showTags
                  ? 'bg-[#6B1E2B] text-[#F6F1EA] border-[#6B1E2B]'
                  : 'bg-[#FAF7F2]/90 text-[#2B2420] border-[#2B2420]/20 hover:bg-[#FAF7F2]'
              }`}
              title={showTags ? 'Hide garment tags' : 'Reveal garment tags'}
            >
              <Tag strokeWidth={1.3} className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Tags Overlay (Fades In / Out, Hidden by Default) */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              showTags ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowTags(false);
              }
            }}
          >
            {fit.items?.map((item, idx) => {
              const hasBrand = Boolean(item.brand && item.brand.trim());
              const label = hasBrand
                ? item.brand.trim().toLowerCase()
                : (item.description || item.category || 'item').toLowerCase();

              return (
                <div
                  key={idx}
                  onClick={(e) => handleTagClick(e, item)}
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-105 active:scale-95 group/tag z-30"
                >
                  <div className="flex flex-col items-center">
                    <div className="px-2.5 py-1 bg-[#FAF7F2] text-[#2B2420] border border-[#2B2420]/30 rounded-[2px] shadow-sm flex items-center gap-1.5 whitespace-nowrap text-xs font-sans tracking-tight hover:border-[#6B1E2B] transition-colors">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6B1E2B]" />
                      <span className="font-medium lowercase max-w-[200px] truncate">{label}</span>
                      {!hasBrand && isOwner && onEditTags && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTags(fit);
                          }}
                          className="text-[10px] text-[#BE185D] font-semibold border-l border-[#2B2420]/20 pl-1.5 ml-0.5 hover:underline"
                          title="Add brand name"
                        >
                          + add brand
                        </span>
                      )}
                      <Clock strokeWidth={1.2} className="w-2.5 h-2.5 text-[#2B2420]/50" />
                    </div>
                    {/* Tiny pointer triangle */}
                    <div className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-[#2B2420]/30 -mt-px" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2B2420]/80 -mt-0.5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tap hint banner if tags hidden */}
          {!showTags && fit.items?.length > 0 && (
            <div className="absolute bottom-2 inset-x-2 py-1 px-2.5 rounded-[2px] bg-[#2B2420]/60 backdrop-blur-xs text-[#FAF7F2] text-[10px] font-sans tracking-widest uppercase flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Tap photo to view tags</span>
              <span>{fit.items.length} pieces</span>
            </div>
          )}
            </div>
          </div>

          {/* Right Column: Date, Actions, & Wardrobe Breakdown (5 cols on md) */}
          <div className="md:col-span-5 space-y-4 pt-4 md:pt-0">
            {/* Polaroid Date & Caption Area */}
            <div className="px-1 flex items-baseline justify-between border-b border-[#F472B6]/20 pb-3">
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase font-sans font-semibold text-[#BE185D] block">
                  {formatEditorialDate(fit.date)}
                </span>
                <span className="font-bodoni italic text-base text-[#2B2420]">
                  Daily Lookbook Archive
                </span>
              </div>

              {isOwner && onEditTags && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditTags(fit)}
                    className="p-1.5 text-xs font-sans text-[#BE185D] hover:text-[#9D174D] transition-colors flex items-center gap-1 font-semibold"
                    title="Edit outfit tags"
                  >
                    <Edit3 strokeWidth={1.3} className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase tracking-wider">Edit</span>
                  </button>

                  {onDeleteFit && (
                    <button
                      type="button"
                      onClick={() => onDeleteFit(fit)}
                      className="p-1.5 text-xs font-sans text-[#2B2420]/40 hover:text-[#E11D48] transition-colors"
                      title="Delete fit"
                    >
                      <Trash2 strokeWidth={1.3} className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Garment Details List (Editorial Lowercase Caption Style) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] tracking-[0.2em] uppercase font-sans font-semibold text-[#BE185D]">
                  Wardrobe Breakdown
                </span>
                <span className="text-[9px] uppercase tracking-widest text-[#2B2420]/50 flex items-center gap-1 font-sans">
                  <Clock strokeWidth={1.2} className="w-3 h-3 text-[#E11D48]" />
                  Tap piece to view wear history
                </span>
              </div>

              {fit.items && fit.items.length > 0 ? (
                <div className="divide-y divide-[#F472B6]/20 font-sans text-xs">
                  {fit.items.map((item, idx) => {
                    const categoryLabel = item.category || 'piece';
                    const hasBrand = Boolean(item.brand && item.brand.trim());

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedItemForHistory(item)}
                        className="py-2.5 flex items-center justify-between text-[#2B2420] hover:text-[#BE185D] transition-colors cursor-pointer group/item"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] group-hover/item:scale-125 transition-transform shrink-0" />
                          <span className="lowercase truncate">
                            <span className="text-[#BE185D] font-medium lowercase">#{categoryLabel}</span>
                            <span className="mx-1.5 text-[#2B2420]/40">—</span>
                            {hasBrand ? (
                              <span className="font-semibold lowercase text-[#2B2420] group-hover/item:text-[#BE185D]">
                                {item.brand} {item.description ? `· ${item.description}` : ''}
                              </span>
                            ) : (
                              <>
                                <span className="font-medium lowercase text-[#2B2420] group-hover/item:text-[#BE185D]">
                                  {item.description || categoryLabel}
                                </span>
                                {isOwner && onEditTags && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditTags(fit);
                                    }}
                                    className="ml-2 text-[10px] text-[#BE185D] hover:underline font-semibold"
                                  >
                                    + add brand
                                  </button>
                                )}
                              </>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-sans text-[#BE185D] opacity-0 group-hover/item:opacity-100 transition-opacity uppercase tracking-wider font-semibold">
                            History
                          </span>
                          <a
                            href={getShoppingUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Shop this piece"
                            className="p-1 text-[#2B2420]/40 hover:text-[#E11D48] transition-colors"
                          >
                            <ExternalLink strokeWidth={1.3} className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs font-bodoni italic text-[#2B2420]/50 py-1">
                  No garments tagged for this fit.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wardrobe Memory Item History Modal */}
      <ItemHistoryModal
        isOpen={Boolean(selectedItemForHistory)}
        onClose={() => setSelectedItemForHistory(null)}
        item={selectedItemForHistory}
        currentFitDate={fit.date}
        allFits={allFits}
        onSelectFit={onSelectFit}
      />
    </div>
  );
};
