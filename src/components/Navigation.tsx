import React from 'react';
import { Camera, Calendar, User, Compass, Users } from 'lucide-react';

export type TabType = 'feed' | 'friends' | 'snap' | 'fits' | 'profile';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasPostedToday: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  hasPostedToday,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDFD]/95 backdrop-blur-md border-t border-[#F472B6]/25 pb-[env(safe-area-inset-bottom,16px)] pt-2 transition-all shadow-sm">
      <div className="max-w-md mx-auto px-3 flex items-center justify-between">
        {/* Tab: Feed */}
        <button
          type="button"
          onClick={() => onTabChange('feed')}
          className={`flex flex-col items-center py-1 px-2 transition-colors ${
            activeTab === 'feed' ? 'text-[#E11D48] font-semibold' : 'text-[#2B2420]/60 hover:text-[#BE185D]'
          }`}
        >
          <Compass strokeWidth={1.4} className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] tracking-[0.16em] uppercase font-sans">
            Feed
          </span>
        </button>

        {/* Tab: Friends / Community */}
        <button
          type="button"
          onClick={() => onTabChange('friends')}
          className={`flex flex-col items-center py-1 px-2 transition-colors ${
            activeTab === 'friends' ? 'text-[#E11D48] font-semibold' : 'text-[#2B2420]/60 hover:text-[#BE185D]'
          }`}
        >
          <Users strokeWidth={1.4} className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] tracking-[0.16em] uppercase font-sans">
            Friends
          </span>
        </button>

        {/* Tab: Snap (Emphasized Center Button with Pink Accent) */}
        <div className="-mt-5 relative px-1">
          <button
            type="button"
            onClick={() => onTabChange('snap')}
            className={`w-12 h-12 rounded-[4px] border flex flex-col items-center justify-center transition-all shadow-md ${
              activeTab === 'snap'
                ? 'bg-gradient-to-tr from-[#E11D48] to-[#FB7185] text-white border-[#E11D48] shadow-pink-900/20'
                : 'bg-[#FFFDFD] text-[#BE185D] border-[#F472B6]/40 hover:bg-[#FDF2F4]'
            }`}
            aria-label="Snap Today's Fit"
          >
            <Camera strokeWidth={1.4} className="w-5 h-5" />
            {hasPostedToday && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#E11D48] border-2 border-[#FFFDFD]" />
            )}
          </button>
          <span className="block text-center text-[9px] tracking-[0.16em] uppercase font-sans font-semibold mt-1 text-[#BE185D]">
            Snap
          </span>
        </div>

        {/* Tab: My Fits */}
        <button
          type="button"
          onClick={() => onTabChange('fits')}
          className={`flex flex-col items-center py-1 px-2 transition-colors ${
            activeTab === 'fits' ? 'text-[#E11D48] font-semibold' : 'text-[#2B2420]/60 hover:text-[#BE185D]'
          }`}
        >
          <Calendar strokeWidth={1.4} className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] tracking-[0.16em] uppercase font-sans">
            My Fits
          </span>
        </button>

        {/* Tab: Profile */}
        <button
          type="button"
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center py-1 px-2 transition-colors ${
            activeTab === 'profile' ? 'text-[#E11D48] font-semibold' : 'text-[#2B2420]/60 hover:text-[#BE185D]'
          }`}
        >
          <User strokeWidth={1.4} className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] tracking-[0.16em] uppercase font-sans">
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};
