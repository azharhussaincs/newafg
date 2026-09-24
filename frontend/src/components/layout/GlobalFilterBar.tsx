import React from 'react';
import { Filter, X, Calendar, RotateCcw, Download } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import {
  getEnglishProvinceName,
  getEnglishDistrictName,
  getCleanNativeName
} from '../../utils/geoTranslation';

interface GlobalFilterBarProps {
  onExportClick?: () => void;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({ onExportClick }) => {
  const {
    filters,
    filterOptions,
    setProvince,
    setDistrict,
    setGender,
    setYearRange,
    setBookName,
    setSearchQuery,
    setFiltersBatch,
    clearFilters,
    activeFilterCount,
    searchScope
  } = useFilters();

  const formatCount = (count?: number) => {
    if (!count) return '';
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(2)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
    return count.toLocaleString();
  };

  return (
    <div className="bg-white/95 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/80 px-6 py-2.5 backdrop-blur-sm shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center text-xs font-bold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 p-2 rounded-md" title="Filters">
              <Filter className="w-3.5 h-3.5" />
            </div>

            {/* Dynamic Province Filter */}
            <div className="relative">
              <select
                value={filters.province || ''}
                onChange={(e) => setProvince(e.target.value)}
                className={`text-xs bg-white dark:bg-slate-950 border rounded-md px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all font-medium cursor-pointer ${
                  filters.province ? 'border-brand-500/60 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30' : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <option value="">
                  All Provinces ({filterOptions.provinces_with_counts?.length || filterOptions.provinces.length})
                </option>
                {filterOptions.provinces_with_counts && filterOptions.provinces_with_counts.length > 0
                  ? filterOptions.provinces_with_counts.map((p) => {
                      const en = getEnglishProvinceName(p.province);
                      return (
                        <option key={p.province} value={p.province}>
                          {en} • {p.province} ({formatCount(p.count)})
                        </option>
                      );
                    })
                  : filterOptions.provinces.map((p) => {
                      const en = getEnglishProvinceName(p);
                      return (
                        <option key={p} value={p}>
                          {en} • {p}
                        </option>
                      );
                    })}
              </select>
            </div>

            {/* Dynamic Cascading District Filter */}
            <div className="relative">
              <select
                value={filters.district || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setDistrict(undefined);
                  } else {
                    if (!filters.province) {
                      const match = filterOptions.districts_with_counts?.find(d => d.district === val);
                      if (match && match.province) {
                        setFiltersBatch({ province: match.province, district: val });
                        return;
                      }
                    }
                    setDistrict(val);
                  }
                }}
                className={`text-xs bg-white dark:bg-slate-950 border rounded-md px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all font-medium cursor-pointer ${
                  filters.district ? 'border-brand-500/60 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30' : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <option value="">
                  {filters.province 
                    ? `All Districts in ${getEnglishProvinceName(filters.province)} (${filterOptions.districts_with_counts?.length || filterOptions.districts.length})` 
                    : `All Districts (${filterOptions.districts_with_counts?.length || filterOptions.districts.length})`}
                </option>
                {filterOptions.districts_with_counts && filterOptions.districts_with_counts.length > 0
                  ? filterOptions.districts_with_counts.map((d) => {
                      const cleanNative = getCleanNativeName(d.district, filters.province || d.province);
                      const en = getEnglishDistrictName(d.district, filters.province || d.province);
                      const provNote = !filters.province && d.province ? ` [${getEnglishProvinceName(d.province)}]` : '';
                      return (
                        <option key={`${d.province || ''}-${d.district}`} value={d.district}>
                          {en} • {cleanNative}{provNote} ({formatCount(d.count)})
                        </option>
                      );
                    })
                  : filterOptions.districts.map((d) => (
                      <option key={d} value={d}>
                        {getEnglishDistrictName(d, filters.province)} • {d}
                      </option>
                    ))}
              </select>
            </div>

            {/* Dynamic Gender Filter */}
            <div className="relative">
              <select
                value={filters.gender !== undefined ? filters.gender : ''}
                onChange={(e) => setGender(e.target.value !== '' ? Number(e.target.value) : undefined)}
                className={`text-xs bg-white dark:bg-slate-950 border rounded-md px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all font-medium cursor-pointer ${
                  filters.gender !== undefined ? 'border-brand-500/60 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300 ring-1 ring-brand-500/30' : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <option value="">All Genders (همه)</option>
                <option value="0">Male • مرد (15.5M • 65%)</option>
                <option value="1">Female • زن (8.3M • 35%)</option>
              </select>
            </div>

            {/* Dynamic Solar Hijri Year Range Filter */}
            <div className={`flex items-center space-x-1.5 bg-white dark:bg-slate-950 border rounded-md px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 transition-all ${
              filters.dob_year_min || filters.dob_year_max ? 'border-brand-500/60 bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300' : 'border-slate-300 dark:border-slate-800'
            }`}>
              <Calendar className="w-3 h-3 text-slate-400" />
              <span className="text-slate-500 dark:text-slate-400">Year:</span>
              <input
                type="number"
                placeholder={String(filterOptions.year_min || 1250)}
                value={filters.dob_year_min || ''}
                onChange={(e) => setYearRange(e.target.value ? Number(e.target.value) : undefined, filters.dob_year_max)}
                className="w-14 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-1.5 py-0.5 text-center text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
              />
              <span className="text-slate-400 dark:text-slate-500">-</span>
              <input
                type="number"
                placeholder={String(filterOptions.year_max || 1405)}
                value={filters.dob_year_max || ''}
                onChange={(e) => setYearRange(filters.dob_year_min, e.target.value ? Number(e.target.value) : undefined)}
                className="w-14 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded px-1.5 py-0.5 text-center text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 text-xs"
              />
            </div>
          </div>

          {/* Action Buttons: Export & Reset */}
          {activeFilterCount > 0 && (
            <div className="flex items-center space-x-2">
              {onExportClick && (
                <button
                  onClick={onExportClick}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm shadow-brand-500/20 transition-all cursor-pointer"
                  title="Export records matching current active filter constraints"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Scope</span>
                </button>
              )}
              <button
                onClick={clearFilters}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 transition-all shadow-sm cursor-pointer"
                title="Reset all active cross-filters"
              >
                <RotateCcw className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                <span>Reset All ({activeFilterCount})</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Filter Pills Bar */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200 dark:border-slate-800/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mr-1">Active Filter Constraints:</span>

            {filters.search_query && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-500/50 text-brand-700 dark:text-brand-300 text-xs shadow-sm">
                <span>
                  🔍 Search: "{filters.search_query}"
                  {searchScope.name && !searchScope.fname && !searchScope.gname && ' [Name Only / فقط نام]'}
                  {!searchScope.name && searchScope.fname && !searchScope.gname && ' [Father Only / فقط نام پدر]'}
                  {!searchScope.name && !searchScope.fname && searchScope.gname && ' [Grandfather Only / فقط پدرکلان]'}
                  {searchScope.name && searchScope.fname && !searchScope.gname && ' [Name & Father]'}
                  {searchScope.name && !searchScope.fname && searchScope.gname && ' [Name & Grandfather]'}
                  {!searchScope.name && searchScope.fname && searchScope.gname && ' [Father & Grandfather]'}
                  {(!searchScope.name && !searchScope.fname && !searchScope.gname) && ' [All 3 Columns]'}
                </span>
                <button
                  onClick={() => setSearchQuery(undefined)}
                  className="hover:text-brand-900 dark:hover:text-white p-0.5 rounded-full hover:bg-brand-100 dark:hover:bg-brand-800/50 cursor-pointer"
                  title="Remove search query"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.province && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-500/40 text-brand-700 dark:text-brand-300 text-xs shadow-sm">
                <span>📍 Province: {getEnglishProvinceName(filters.province)} • {filters.province}</span>
                <button
                  onClick={() => setProvince(undefined)}
                  className="hover:text-brand-900 dark:hover:text-white p-0.5 rounded-full hover:bg-brand-100 dark:hover:bg-brand-800/50"
                  title="Remove province filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.district && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs shadow-sm">
                <span>🏘️ District: {getEnglishDistrictName(filters.district, filters.province)} • {getCleanNativeName(filters.district, filters.province)}</span>
                <button
                  onClick={() => setDistrict(undefined)}
                  className="hover:text-emerald-900 dark:hover:text-white p-0.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800/50"
                  title="Remove district filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.gender !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs shadow-sm">
                <span>⚧ Gender: {filters.gender === 0 ? 'Male (مرد)' : 'Female (زن)'}</span>
                <button
                  onClick={() => setGender(undefined)}
                  className="hover:text-purple-900 dark:hover:text-white p-0.5 rounded-full hover:bg-purple-100 dark:hover:bg-purple-800/50"
                  title="Remove gender filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(filters.dob_year_min || filters.dob_year_max) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 text-xs shadow-sm">
                <span>📅 SH Year: {filters.dob_year_min || '1250'} - {filters.dob_year_max || '1405'}</span>
                <button
                  onClick={() => setYearRange(undefined, undefined)}
                  className="hover:text-cyan-900 dark:hover:text-white p-0.5 rounded-full hover:bg-cyan-100 dark:hover:bg-cyan-800/50"
                  title="Remove year range filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.book_name && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs max-w-sm truncate shadow-sm">
                <span className="truncate">📖 Book: {filters.book_name}</span>
                <button
                  onClick={() => setBookName(undefined)}
                  className="hover:text-amber-900 dark:hover:text-white p-0.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-800/50 shrink-0"
                  title="Remove book filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
