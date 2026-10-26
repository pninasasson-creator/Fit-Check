import React, { useState, useEffect } from 'react';
import { FitItem } from '../config/supabase';
import { Trash2, X, Check } from 'lucide-react';
import { MirrorCollageModalBackdrop } from './MirrorCollageModalBackdrop';

interface TagEditorModalProps {
  isOpen: boolean;
  tag: FitItem | null;
  onSave: (updated: FitItem) => void;
  onDelete: () => void;
  onClose: () => void;
}

const CATEGORIES: Array<FitItem['category']> = [
  'top',
  'bottoms',
  'shoes',
  'outerwear',
  'bag',
  'accessory',
];

export const TagEditorModal: React.FC<TagEditorModalProps> = ({
  isOpen,
  tag,
  onSave,
  onDelete,
  onClose,
}) => {
  const [category, setCategory] = useState<FitItem['category']>('top');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const brandInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tag && isOpen) {
      setCategory(tag.category || 'top');
      setBrand(tag.brand || '');
      setDescription(tag.description || '');

      // Focus brand input if brand is empty
      setTimeout(() => {
        if (!tag.brand && brandInputRef.current) {
          brandInputRef.current.focus();
        }
      }, 50);
    }
  }, [tag, isOpen]);

  if (!isOpen || !tag) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...tag,
      category,
      brand: brand.trim(),
      description: description.trim() || category,
      source: 'user',
    });
  };

  return (
    <MirrorCollageModalBackdrop onBackdropClick={onClose} className="w-full max-w-md">
      <div
        className="w-full bg-[#FAF7F2] border border-[#F472B6]/40 rounded-[4px] p-6 shadow-2xl relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#2B2420]/15">
          <div>
            <span className="text-[10px] tracking-[0.2em] uppercase font-sans font-medium text-[#2B2420]/60 block">
              Garment Detail
            </span>
            <h3 className="font-bodoni italic text-xl text-[#2B2420]">
              Edit Tag
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selector */}
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase font-sans font-medium text-[#2B2420]/70 block mb-2">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-2 text-xs font-sans tracking-wide rounded-[2px] border transition-colors ${
                    category === cat
                      ? 'bg-[#2B2420] text-[#F6F1EA] border-[#2B2420]'
                      : 'bg-[#F6F1EA] text-[#2B2420] border-[#2B2420]/20 hover:border-[#2B2420]/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Brand */}
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase font-sans font-medium text-[#2B2420]/70 block mb-1.5">
              Brand or Designer
            </label>
            <input
              ref={brandInputRef}
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Zara, Toteme, Vintage"
              className="w-full bg-[#F6F1EA] border border-[#2B2420]/20 rounded-[2px] px-3 py-2 text-sm text-[#2B2420] focus:outline-none focus:border-[#6B1E2B] transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase font-sans font-medium text-[#2B2420]/70 block mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. pleated wide-leg trousers"
              className="w-full bg-[#F6F1EA] border border-[#2B2420]/20 rounded-[2px] px-3 py-2 text-sm text-[#2B2420] focus:outline-none focus:border-[#6B1E2B] transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 gap-3">
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2.5 rounded-[2px] border border-[#2B2420]/25 text-xs text-[#6B1E2B] hover:bg-[#E9C9C3]/30 transition-colors flex items-center gap-1.5 font-sans"
            >
              <Trash2 strokeWidth={1.3} className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-[2px] border border-[#2B2420]/20 text-xs text-[#2B2420]/70 hover:bg-[#F6F1EA] transition-colors font-sans"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-[2px] bg-[#6B1E2B] text-[#F6F1EA] text-xs font-sans font-medium tracking-wide border border-[#6B1E2B] hover:bg-[#521721] transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Check strokeWidth={1.4} className="w-3.5 h-3.5" />
                <span>Save Tag</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </MirrorCollageModalBackdrop>
  );
};
