import React from 'react';
import { getDemoMirrorSelfies, getDemoMirrorSelfieByIndex } from '../services/demoImages';

interface MirrorCollageModalBackdropProps {
  children: React.ReactNode;
  onBackdropClick?: () => void;
  className?: string;
}

export const MirrorCollageModalBackdrop: React.FC<MirrorCollageModalBackdropProps> = ({
  children,
  onBackdropClick,
  className = '',
}) => {
  const selfies = getDemoMirrorSelfies();

  // 4 columns of mirror selfies for staggered collage
  const col1 = [getDemoMirrorSelfieByIndex(0), getDemoMirrorSelfieByIndex(3), getDemoMirrorSelfieByIndex(1)];
  const col2 = [getDemoMirrorSelfieByIndex(1), getDemoMirrorSelfieByIndex(2), getDemoMirrorSelfieByIndex(0)];
  const col3 = [getDemoMirrorSelfieByIndex(2), getDemoMirrorSelfieByIndex(0), getDemoMirrorSelfieByIndex(3)];
  const col4 = [getDemoMirrorSelfieByIndex(3), getDemoMirrorSelfieByIndex(1), getDemoMirrorSelfieByIndex(2)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      {/* Background Mirror Selfie Photo Collage (Never Flat Gray!) */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 bg-[#FAF5F5]">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 p-2 sm:p-4 opacity-55 scale-[1.02]">
          <div className="flex flex-col gap-3 sm:gap-4">
            {col1.map((url, idx) => (
              <div
                key={`bg-c1-${idx}`}
                className="relative rounded-[6px] overflow-hidden shadow-sm border border-[#F472B6]/30 aspect-3/4"
              >
                <img src={url} alt="Mirror lookbook" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:gap-4 -mt-6 sm:-mt-8">
            {col2.map((url, idx) => (
              <div
                key={`bg-c2-${idx}`}
                className="relative rounded-[6px] overflow-hidden shadow-sm border border-[#F472B6]/30 aspect-3/4"
              >
                <img src={url} alt="Mirror lookbook" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:gap-4 -mt-3 hidden sm:flex">
            {col3.map((url, idx) => (
              <div
                key={`bg-c3-${idx}`}
                className="relative rounded-[6px] overflow-hidden shadow-sm border border-[#F472B6]/30 aspect-3/4"
              >
                <img src={url} alt="Mirror lookbook" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:gap-4 -mt-10 hidden lg:flex">
            {col4.map((url, idx) => (
              <div
                key={`bg-c4-${idx}`}
                className="relative rounded-[6px] overflow-hidden shadow-sm border border-[#F472B6]/30 aspect-3/4"
              >
                <img src={url} alt="Mirror lookbook" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editorial Blush / Cream Soft Tint & Blur Overlay */}
      <div
        onClick={onBackdropClick}
        className="fixed inset-0 z-10 bg-gradient-to-b from-[#FFFDFD]/85 via-[#FAF5F5]/82 to-[#FFFDFD]/90 backdrop-blur-[5px]"
      />
      <div className="fixed inset-0 z-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-400/10 via-rose-300/5 to-transparent" />

      {/* Centered Modal Card Container */}
      <div className={`relative z-20 my-auto ${className}`}>{children}</div>
    </div>
  );
};
