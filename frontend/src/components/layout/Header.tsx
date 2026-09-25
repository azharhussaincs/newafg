import React, { useState, useEffect } from 'react';
import { Search, Database, RefreshCw, Download, X, ArrowRight, Sun, Moon, Menu, Flame } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { SearchWithAfghanKeyboard } from '../common/SearchWithAfghanKeyboard';

interface HeaderProps {
  onExportClick: () => void;
  activeView: string;
  onSearchSubmit?: (query: string) => void;
  onSelectRecordId?: (recordId: number) => void;
  onToggleMobileSidebar?: () => void;
  onNavigateHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onExportClick,
  activeView,
  onSearchSubmit,
  onSelectRecordId,
  onToggleMobileSidebar,
  onNavigateHome
}) => {
  const { filters, setSearchQuery, triggerRefresh, searchScope, setSearchScope } = useFilters();
  const { theme, isDark, toggleTheme } = useTheme();
  const [searchInput, setSearchInput] = useState(filters.search_query || '');

  // Keep search input synchronized with global filter state
  useEffect(() => {
    setSearchInput(filters.search_query || '');
  }, [filters.search_query]);

  const getSearchPlaceholder = () => {
    const { name, fname, gname } = searchScope;
    if (name && !fname && !gname) return "جستجو فقط در نام شخص (Name only)...";
    if (!name && fname && !gname) return "جستجو فقط در نام پدر (Father only)...";
    if (!name && !fname && gname) return "جستجو فقط در نام پدرکلان (Grandfather only)...";
    if (name && fname && !gname) return "جستجو در نام و پدر (Name & Father)...";
    if (name && !fname && gname) return "جستجو در نام و پدرکلان (Name & Grandfather)...";
    if (!name && fname && gname) return "جستجو در پدر و پدرکلان (Father & Grandfather)...";
    return "جستجو در ۳ ستون (نام، ولد، پدرکلان)... (Search all 3...)";
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchInput.trim();
    setSearchQuery(query || undefined);
    if (onSearchSubmit) {
      onSearchSubmit(query);
    }
  };

  const getTitle = () => {
    switch (activeView) {
      case 'overview': return 'Executive Overview';
      case 'gis_cartography': return '34-Province Geocartography GIS Matrix';
      case 'search': return 'Universal Search & Filter Hub';
      case 'geographic': return 'Province';
      case 'books': return 'Registry Volumes & Page Explorer';
      case 'relationships': return 'Family Tree & Lineage Intelligence Lab';
      default: return 'Civil Registry & GIS Intelligence Platform';
    }
  };

  return (
    <header className="sticky top-0 z-40 flex flex-col border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#05070d]/90 backdrop-blur-2xl transition-all shadow-sm">
      
      {/* Top Tier: Brand, Active View Indicator, Universal Search & Telemetry Controls */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Brand & View Context */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
          {/* Mobile Hamburger Toggle */}
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer shrink-0"
              title="Toggle Menu"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Clickable Brand Flame Logo (Executive Overview Home) */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400/40 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title="KOCHI MANAGER - Executive Overview Home"
            aria-label="Kochi Manager Home"
          >
            <Flame className="w-5 h-5 text-white group-hover:animate-pulse" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onNavigateHome}
                className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer text-left"
                title="Go to Executive Overview"
              >
                {getTitle()}
              </button>
            </div>
          </div>
        </div>

        {/* Global Quick Search Form & Action Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          
          <div className="flex flex-col items-end">
            <div className="w-64 sm:w-80 md:w-96">
              <SearchWithAfghanKeyboard
                value={searchInput}
                onChange={(val) => {
                  setSearchInput(val);
                  if (!val.trim()) {
                    setSearchQuery(undefined);
                  }
                }}
                onSearch={(query) => {
                  setSearchInput(query);
                  setSearchQuery(query || undefined);
                  if (onSearchSubmit) {
                    onSearchSubmit(query);
                  }
                }}
                onSelectRecordId={(recId) => {
                  if (onSelectRecordId) {
                    onSelectRecordId(recId);
                  }
                }}
                dropdownAlign="right"
                size="sm"
                placeholder={getSearchPlaceholder()}
                searchScope={searchScope}
              />
            </div>

            {/* 3 Scope Checkboxes: Name, Father Name, Grandfather Name */}
            <div className="flex items-center gap-2 mt-1 px-1 text-[11px] font-medium select-none">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">ستون:</span>

              <label 
                className={`inline-flex items-center gap-1 cursor-pointer transition-all px-1.5 py-0.5 rounded text-[11px] ${
                  searchScope.name 
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 font-bold border border-emerald-300 dark:border-emerald-700/60 shadow-2xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
                title="Search strictly by citizen's first name (نام شخص)"
              >
                <input
                  type="checkbox"
                  checked={searchScope.name}
                  onChange={(e) => setSearchScope(prev => ({ ...prev, name: e.target.checked }))}
                  className="w-3 h-3 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <span>نام (Name)</span>
              </label>

              <label 
                className={`inline-flex items-center gap-1 cursor-pointer transition-all px-1.5 py-0.5 rounded text-[11px] ${
                  searchScope.fname 
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 font-bold border border-emerald-300 dark:border-emerald-700/60 shadow-2xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
                title="Search strictly by father's name (نام پدر / ولد)"
              >
                <input
                  type="checkbox"
                  checked={searchScope.fname}
                  onChange={(e) => setSearchScope(prev => ({ ...prev, fname: e.target.checked }))}
                  className="w-3 h-3 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <span>نام پدر (Father)</span>
              </label>

              <label 
                className={`inline-flex items-center gap-1 cursor-pointer transition-all px-1.5 py-0.5 rounded text-[11px] ${
                  searchScope.gname 
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 font-bold border border-emerald-300 dark:border-emerald-700/60 shadow-2xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'
                }`}
                title="Search strictly by grandfather's name (نام پدرکلان)"
              >
                <input
                  type="checkbox"
                  checked={searchScope.gname}
                  onChange={(e) => setSearchScope(prev => ({ ...prev, gname: e.target.checked }))}
                  className="w-3 h-3 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
                <span>پدرکلان (Grandfather)</span>
              </label>
            </div>
          </div>

          {/* System Online Status Pill */}
          <div className="hidden lg:inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1.5 rounded-full font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
            <span>Online</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-all hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title={isDark ? "Switch to White Theme" : "Switch to Dark Theme"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Action Buttons */}
          <button
            onClick={triggerRefresh}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-all hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Refresh Data &amp; KPIs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onExportClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-semibold shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

        </div>
      </div>

    </header>
  );
};
