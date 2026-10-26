import React, { useState, useMemo } from 'react';
import { Fit, FitItem } from '../config/supabase';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Calendar as CalendarIcon,
  Search,
  X,
  Clock,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { formatToDateKey, formatEditorialDate, formatMagazineDate } from '../utils/image';

interface CalendarViewProps {
  fits: Fit[];
  onSelectFit: (fit: Fit) => void;
  onOpenWeekReview: (selectedDate: Date) => void;
  onSnapDay?: (dateStr: string) => void;
}

interface OnThisDayEntry {
  title: string;
  badge: string;
  dateKey: string;
  fit: Fit;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  fits,
  onSelectFit,
  onOpenWeekReview,
  onSnapDay,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const todayKey = formatToDateKey(new Date());

  // Map of date string -> Fit
  const fitMap = useMemo(() => {
    const map = new Map<string, Fit>();
    fits.forEach((fit) => {
      map.set(fit.date, fit);
    });
    return map;
  }, [fits]);

  // ON THIS DAY: 1 week ago (7 days) and 1 month ago (30 days / same day last month)
  const onThisDayEntries = useMemo(() => {
    const list: OnThisDayEntry[] = [];
    const now = new Date();

    // 1 week ago
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekKey = formatToDateKey(oneWeekAgo);
    const weekFit = fitMap.get(oneWeekKey);
    if (weekFit) {
      list.push({
        title: 'One Week Ago',
        badge: '7 Days Ago',
        dateKey: oneWeekKey,
        fit: weekFit,
      });
    }

    // 1 month ago (approx 30 days or same day last month)
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const oneMonthKey = formatToDateKey(oneMonthAgo);
    const monthFit = fitMap.get(oneMonthKey);
    if (monthFit) {
      list.push({
        title: 'One Month Ago',
        badge: '1 Month Ago',
        dateKey: oneMonthKey,
        fit: monthFit,
      });
    } else {
      // Check 30 days ago if exact month date doesn't match
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyKey = formatToDateKey(thirtyDaysAgo);
      const thirtyFit = fitMap.get(thirtyKey);
      if (thirtyFit && thirtyKey !== oneWeekKey) {
        list.push({
          title: 'One Month Ago',
          badge: '30 Days Ago',
          dateKey: thirtyKey,
          fit: thirtyFit,
        });
      }
    }

    // 1 year ago (365 days ago)
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearKey = formatToDateKey(oneYearAgo);
    const yearFit = fitMap.get(oneYearKey);
    if (yearFit) {
      list.push({
        title: 'One Year Ago',
        badge: '1 Year Ago',
        dateKey: oneYearKey,
        fit: yearFit,
      });
    }

    return list;
  }, [fitMap]);

  // CLOSET SEARCH: filter all fits by garment description, brand, or category (newest first)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matches: Array<{ fit: Fit; matchingItems: FitItem[] }> = [];

    // Sort fits newest first
    const sortedFits = [...fits].sort((a, b) => b.date.localeCompare(a.date));

    sortedFits.forEach((fit) => {
      const matched = (fit.items || []).filter(
        (it) =>
          it.description?.toLowerCase().includes(q) ||
          it.brand?.toLowerCase().includes(q) ||
          it.category?.toLowerCase().includes(q) ||
          (it.search_query && it.search_query.toLowerCase().includes(q))
      );

      if (matched.length > 0) {
        matches.push({ fit, matchingItems: matched });
      }
    });

    return matches;
  }, [fits, searchQuery]);

  // Calendar calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Mon-first starting weekday (Mon=0, Sun=6)
  let startingWeekday = firstDayOfMonth.getDay() - 1;
  if (startingWeekday === -1) startingWeekday = 6;

  const totalDays = lastDayOfMonth.getDate();

  // Navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const monthTitle = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const weekDayHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-28">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F472B6]/20 pb-4">
        <div>
          <span className="text-[10px] tracking-[0.25em] uppercase font-sans font-semibold text-[#BE185D] block">
            Wardrobe Memory · Archive
          </span>
          <h2 className="font-bodoni italic text-3xl sm:text-4xl text-[#2B2420]">
            My Fits
          </h2>
          <p className="text-xs font-sans text-[#2B2420]/70 mt-0.5">
            Never forget what you wore. Search any piece, view repeat dates, and revisit memories.
          </p>
        </div>

        {/* Week in Review Button with Rosy Gradient */}
        <button
          type="button"
          onClick={() => onOpenWeekReview(currentMonth)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-[3px] bg-gradient-to-r from-[#E11D48] to-[#BE185D] text-white text-[11px] uppercase tracking-[0.2em] font-sans font-semibold border border-[#E11D48] hover:opacity-95 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Sparkles strokeWidth={1.5} className="w-4 h-4" />
          <span>Launch Week in Review</span>
        </button>
      </div>

      {/* CLOSET SEARCH BAR */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#BE185D]/60 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search closet memories (e.g. 'white sneakers', 'zara', 'blazer', 'knit')..."
            className="w-full pl-10 pr-10 py-3 rounded-[3px] bg-[#FFFDFD] border border-[#F472B6]/40 text-xs font-sans text-[#2B2420] placeholder:text-[#2B2420]/40 focus:outline-none focus:border-[#E11D48] focus:ring-1 focus:ring-[#F472B6]/40 shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 rounded-full text-[#2B2420]/40 hover:text-[#BE185D] hover:bg-[#FDF2F4] transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* CLOSET SEARCH RESULTS VIEW (When query entered) */}
      {searchResults !== null ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
              <span className="text-xs uppercase font-sans font-semibold tracking-wider text-[#BE185D]">
                Closet History: "{searchQuery}"
              </span>
            </div>
            <span className="text-xs font-sans text-[#2B2420]/60">
              Worn on {searchResults.length} {searchResults.length === 1 ? 'date' : 'dates'} (newest first)
            </span>
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map(({ fit, matchingItems }) => (
                <div
                  key={fit.id}
                  onClick={() => onSelectFit(fit)}
                  className="film-frame p-3.5 bg-[#FAF7F2] hover:border-[#BE185D]/60 transition-all cursor-pointer group shadow-xs space-y-3"
                >
                  {/* Date Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-[#F472B6]/20">
                    <span className="text-[10px] uppercase font-sans font-semibold tracking-wider text-[#BE185D]">
                      {formatEditorialDate(fit.date)}
                    </span>
                    <span className="text-[9px] uppercase font-sans text-[#2B2420]/50 tracking-wider">
                      {formatMagazineDate(fit.date)}
                    </span>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative aspect-3/4 rounded-[2px] overflow-hidden bg-[#2B2420]/5">
                    <img
                      src={fit.image_url}
                      alt={`Fit on ${fit.date}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-[2px] bg-[#FFFDFD]/90 backdrop-blur-xs text-[9px] uppercase font-sans tracking-wider text-[#BE185D] font-semibold border border-[#F472B6]/40">
                      {fit.items?.length || 0} pieces
                    </div>
                  </div>

                  {/* Matching Garments Highlight */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] uppercase tracking-wider text-[#BE185D] font-semibold block">
                      Matched Pieces Worn:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {matchingItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-[2px] bg-[#FCE7F3] border border-[#F472B6]/40 text-[#BE185D] text-[10px] font-sans font-semibold lowercase"
                        >
                          {item.brand ? `${item.brand} · ${item.description}` : item.description}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-[3px] bg-[#FFFDFD] border border-dashed border-[#F472B6]/40 space-y-2">
              <Clock className="w-6 h-6 text-[#BE185D]/50 mx-auto" />
              <p className="font-bodoni italic text-base text-[#2B2420]">
                No recorded outfits matching "{searchQuery}"
              </p>
              <p className="text-xs font-sans text-[#2B2420]/60 max-w-sm mx-auto">
                Try searching for another garment type like "blazer", "jeans", "sweater", or a brand like "Aritzia".
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs uppercase tracking-wider font-sans font-semibold text-[#BE185D] hover:underline cursor-pointer"
              >
                Clear Search & View Calendar
              </button>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD CALENDAR VIEW (With ON THIS DAY banner) */
        <div className="space-y-6">
          {/* ON THIS DAY BANNER (Only when 1 week / 1 month ago fits exist) */}
          {onThisDayEntries.length > 0 && (
            <div className="p-4 sm:p-5 rounded-[4px] bg-[#FFFDFD] border border-[#F472B6]/40 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#F472B6]/20">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#E11D48]" />
                  <span className="text-[10px] uppercase font-sans tracking-[0.2em] font-semibold text-[#BE185D]">
                    On This Day · Wardrobe Memories
                  </span>
                </div>
                <span className="text-[10px] font-sans uppercase tracking-wider text-[#2B2420]/50">
                  {onThisDayEntries.length} {onThisDayEntries.length === 1 ? 'flashback' : 'flashbacks'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {onThisDayEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectFit(entry.fit)}
                    className="p-3 rounded-[3px] bg-[#FAF7F2] border border-[#F472B6]/30 hover:border-[#BE185D] transition-all cursor-pointer group flex gap-3 items-center"
                  >
                    <div className="w-16 h-20 rounded-[2px] overflow-hidden bg-[#2B2420]/5 shrink-0 relative">
                      <img
                        src={entry.fit.image_url}
                        alt={`Worn ${entry.title}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="inline-block px-1.5 py-0.2 rounded-full bg-[#FCE7F3] border border-[#F472B6]/40 text-[#BE185D] text-[8px] uppercase font-sans font-bold tracking-wider">
                        {entry.badge}
                      </span>
                      <h4 className="font-bodoni font-semibold text-sm text-[#2B2420] truncate">
                        {formatEditorialDate(entry.dateKey)}
                      </h4>
                      <p className="text-[10px] font-sans text-[#2B2420]/60 truncate">
                        {entry.fit.items && entry.fit.items.length > 0
                          ? entry.fit.items
                              .slice(0, 2)
                              .map((i) => i.brand || i.category)
                              .join(' · ')
                          : 'Daily fit'}
                      </p>
                      <span className="text-[9px] uppercase tracking-wider font-sans font-semibold text-[#BE185D] group-hover:underline inline-flex items-center gap-0.5">
                        <span>Revisit Fit</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Month Navigator Card with Pink Borders */}
          <div className="p-4 bg-[#FFFDFD] border border-[#F472B6]/25 rounded-[4px] shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F472B6]/20">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 text-[#2B2420]/60 hover:text-[#E11D48] transition-colors rounded-[2px] hover:bg-[#FDF2F4] cursor-pointer"
                aria-label="Previous Month"
              >
                <ChevronLeft strokeWidth={1.4} className="w-5 h-5" />
              </button>

              <span className="font-bodoni italic text-xl text-[#2B2420]">
                {monthTitle}
              </span>

              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 text-[#2B2420]/60 hover:text-[#E11D48] transition-colors rounded-[2px] hover:bg-[#FDF2F4] cursor-pointer"
                aria-label="Next Month"
              >
                <ChevronRight strokeWidth={1.4} className="w-5 h-5" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 pt-3 pb-2 text-center">
              {weekDayHeaders.map((day) => (
                <span
                  key={day}
                  className="text-[9px] font-sans font-semibold text-[#BE185D] tracking-[0.2em] uppercase"
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 pt-2">
              {/* Leading empty cells */}
              {Array.from({ length: startingWeekday }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-3/4 sm:aspect-auto sm:min-h-[110px] rounded-[3px] opacity-10 bg-[#2B2420]/5"
                />
              ))}

              {/* Month Day Cells */}
              {Array.from({ length: totalDays }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const fit = fitMap.get(dateStr);
                const isToday = dateStr === todayKey;
                const isPast = dateStr < todayKey;
                const isFuture = dateStr > todayKey;

                return (
                  <div
                    key={dateStr}
                    onClick={() => {
                      if (fit) {
                        onSelectFit(fit);
                      } else if (onSnapDay && !isFuture) {
                        onSnapDay(dateStr);
                      }
                    }}
                    className={`relative aspect-3/4 sm:aspect-auto sm:min-h-[110px] rounded-[3px] p-1.5 sm:p-2 border transition-all flex flex-col justify-between overflow-hidden cursor-pointer select-none group ${
                      isToday
                        ? 'border-[#E11D48] bg-[#FDF2F4] ring-1 ring-[#F472B6]/40 shadow-xs'
                        : fit
                          ? 'border-[#F472B6]/30 bg-[#FAF7F2] hover:border-[#BE185D] shadow-xs'
                          : isFuture
                            ? 'border-transparent bg-[#2B2420]/[0.02] opacity-40 cursor-default'
                            : 'border-[#2B2420]/10 bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] hover:border-[#F472B6]/40'
                    }`}
                  >
                    {/* Top Row: Date Number & Badging */}
                    <div className="flex items-center justify-between w-full relative z-10">
                      <span
                        className={`text-[11px] font-sans font-semibold ${
                          isToday
                            ? 'text-[#E11D48]'
                            : fit
                              ? 'text-[#2B2420]'
                              : 'text-[#2B2420]/50'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {isToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                      )}
                    </div>

                    {/* Fit Thumbnail if outfit logged */}
                    {fit ? (
                      <div className="absolute inset-0 z-0">
                        <img
                          src={fit.image_url}
                          alt={`Fit for day ${dayNum}`}
                          className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                        <div className="absolute bottom-1 left-1.5 right-1.5 z-10 flex items-center justify-between text-white text-[8px] font-sans uppercase tracking-wider font-semibold">
                          <span className="truncate">
                            {fit.items && fit.items.length > 0
                              ? `${fit.items.length} ${fit.items.length === 1 ? 'pc' : 'pcs'}`
                              : 'Logged'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Empty Day State */
                      <div className="flex-1 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isFuture && (
                          <span className="text-[8px] uppercase tracking-wider font-sans text-[#BE185D] font-semibold">
                            + Snap
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
