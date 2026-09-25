import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Filter, Eye, ArrowRight, BookOpen, MapPin, Hash, User, Calendar, Download, Keyboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { RecordItem } from '../../types';
import { useFilters } from '../../context/FilterContext';
import { ExportModal } from '../common/ExportModal';
import { SearchWithAfghanKeyboard } from '../common/SearchWithAfghanKeyboard';
import { AfghanVirtualKeyboard } from '../common/AfghanVirtualKeyboard';
import {
  getEnglishProvinceName,
  getEnglishDistrictName,
  getCleanNativeName
} from '../../utils/geoTranslation';

interface AdvancedSearchProps {
  onSelectRecord: (record: RecordItem) => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onSelectRecord }) => {
  const { filterOptions, filters, setFiltersBatch, clearFilters, setSearchQuery, searchScope } = useFilters();
  const [q, setQ] = useState(filters.search_query || '');
  const [name, setName] = useState('');
  const [fname, setFname] = useState('');
  const [gname, setGname] = useState('');
  const [province, setProvince] = useState(filters.province || '');
  const [district, setDistrict] = useState(filters.district || '');
  const [gender, setGender] = useState<number | undefined>(filters.gender);
  const [yearMin, setYearMin] = useState<number | undefined>(filters.dob_year_min);
  const [yearMax, setYearMax] = useState<number | undefined>(filters.dob_year_max);
  const [bookName, setBookName] = useState(filters.book_name || '');
  const [recordNum, setRecordNum] = useState<number | undefined>(undefined);
  const [pageNum, setPageNum] = useState<number | undefined>(undefined);
  const [activeFieldKeyboard, setActiveFieldKeyboard] = useState<'name' | 'fname' | 'gname' | null>(null);

  const [results, setResults] = useState<RecordItem[]>([]);
  const [totalMatches, setTotalMatches] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const executeSearch = async (targetPage: number = 1, overrideFilters?: any) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const activeQ = overrideFilters && 'search_query' in overrideFilters ? overrideFilters.search_query : (q.trim() || filters.search_query || undefined);
      const activeProvince = overrideFilters && 'province' in overrideFilters ? overrideFilters.province : (province || filters.province || undefined);
      const activeDistrict = overrideFilters && 'district' in overrideFilters ? overrideFilters.district : (district || filters.district || undefined);
      const activeGender = overrideFilters && 'gender' in overrideFilters ? overrideFilters.gender : (gender !== undefined ? gender : filters.gender);
      const activeYearMin = overrideFilters && 'dob_year_min' in overrideFilters ? overrideFilters.dob_year_min : (yearMin !== undefined ? yearMin : filters.dob_year_min);
      const activeYearMax = overrideFilters && 'dob_year_max' in overrideFilters ? overrideFilters.dob_year_max : (yearMax !== undefined ? yearMax : filters.dob_year_max);
      const activeBookName = overrideFilters && 'book_name' in overrideFilters ? overrideFilters.book_name : (bookName || filters.book_name || undefined);

      const data = await api.getRecords({
        q: activeQ,
        name: name.trim() || undefined,
        fname: fname.trim() || undefined,
        gname: gname.trim() || undefined,
        province: activeProvince,
        district: activeDistrict,
        gender: activeGender,
        dob_year_min: activeYearMin,
        dob_year_max: activeYearMax,
        book_name: activeBookName,
        record_number: recordNum,
        page_number: pageNum,
        page: targetPage,
        page_size: 50
      });
      setResults(data.records);
      setTotalMatches(data.total_records);
      setPage(data.page);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQ(filters.search_query || '');
    setProvince(filters.province || '');
    setDistrict(filters.district || '');
    setGender(filters.gender);
    setYearMin(filters.dob_year_min);
    setYearMax(filters.dob_year_max);
    setBookName(filters.book_name || '');

    const hasFilter = !!(
      filters.search_query ||
      filters.province ||
      filters.district ||
      filters.gender !== undefined ||
      filters.dob_year_min !== undefined ||
      filters.dob_year_max !== undefined ||
      filters.book_name
    );

    if (hasFilter) {
      executeSearch(1, filters);
    } else if (!name && !fname && !gname && !recordNum && !pageNum) {
      setResults([]);
      setTotalMatches(null);
      setHasSearched(false);
      setPage(1);
      setTotalPages(1);
    }
  }, [
    filters.search_query,
    filters.province,
    filters.district,
    filters.gender,
    filters.dob_year_min,
    filters.dob_year_max,
    filters.book_name
  ]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const batch = {
      search_query: q.trim() || undefined,
      province: province || undefined,
      district: district || undefined,
      gender: gender,
      dob_year_min: yearMin,
      dob_year_max: yearMax,
      book_name: bookName || undefined
    };
    setFiltersBatch(batch);
    setPage(1);
    executeSearch(1, batch);
  };

  const handleReset = () => {
    clearFilters();
    setQ('');
    setName('');
    setFname('');
    setGname('');
    setProvince('');
    setDistrict('');
    setGender(undefined);
    setYearMin(undefined);
    setYearMax(undefined);
    setBookName('');
    setRecordNum(undefined);
    setPageNum(undefined);
    setResults([]);
    setTotalMatches(null);
    setHasSearched(false);
    setPage(1);
    setTotalPages(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Search Header Banner */}
      {/* Search Header Banner */}
      <div className="p-5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Universal Multi-Parametric Search Hub</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unified master search across 31.1M civil registrations with granular demographic filters
              </p>
            </div>
          </div>

          {/* Master Scope Badge */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">ستون جستجوی سراسری:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 font-semibold text-[11px]">
              {searchScope.name && !searchScope.fname && !searchScope.gname && 'نام شخص (Name Only)'}
              {!searchScope.name && searchScope.fname && !searchScope.gname && 'نام پدر (Father Only)'}
              {!searchScope.name && !searchScope.fname && searchScope.gname && 'نام پدرکلان (Grandfather Only)'}
              {searchScope.name && searchScope.fname && !searchScope.gname && 'نام و ولد (Name & Father)'}
              {searchScope.name && !searchScope.fname && searchScope.gname && 'نام و پدرکلان (Name & Grandfather)'}
              {!searchScope.name && searchScope.fname && searchScope.gname && 'ولد و پدرکلان (Father & Grandfather)'}
              {(!searchScope.name && !searchScope.fname && !searchScope.gname) && 'تمام ۳ ستون (All 3 Columns)'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          {/* Universal Query Bar with Afghan Keyboard & Smart Suggestions */}
          <div>
            <SearchWithAfghanKeyboard
              value={q}
              onChange={(val) => {
                setQ(val);
                setSearchQuery(val || undefined);
              }}
              onSearch={() => handleSearch()}
              placeholder="جستجوی همگانی (نام، ولد، شماره ثبت، کابل، هرات، بلخ...)"
              size="md"
              searchScope={searchScope}
            />
          </div>

          {/* Granular Field Search Controls with Afghan Keyboard Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
            {/* 1. Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Name (نام)</label>
                <button
                  type="button"
                  onClick={() => setActiveFieldKeyboard(activeFieldKeyboard === 'name' ? null : 'name')}
                  className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                    activeFieldKeyboard === 'name'
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
                  }`}
                  title="کیبورد افغانی برای نام"
                >
                  <Keyboard className="w-3 h-3" />
                  <span>کیبورد</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. ظریفه"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 font-persian"
              />
            </div>

            {/* 2. Father's Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Father's Name (نام پدر)</label>
                <button
                  type="button"
                  onClick={() => setActiveFieldKeyboard(activeFieldKeyboard === 'fname' ? null : 'fname')}
                  className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                    activeFieldKeyboard === 'fname'
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
                  }`}
                  title="کیبورد افغانی برای نام پدر"
                >
                  <Keyboard className="w-3 h-3" />
                  <span>کیبورد</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. لالا شیرین"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 font-persian"
              />
            </div>

            {/* 3. Grandfather's Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Grandfather (نام پدرکلان)</label>
                <button
                  type="button"
                  onClick={() => setActiveFieldKeyboard(activeFieldKeyboard === 'gname' ? null : 'gname')}
                  className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                    activeFieldKeyboard === 'gname'
                      ? 'bg-emerald-600 text-white'
                      : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
                  }`}
                  title="کیبورد افغانی برای نام پدرکلان"
                >
                  <Keyboard className="w-3 h-3" />
                  <span>کیبورد</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. در محمد"
                value={gname}
                onChange={(e) => setGname(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 font-persian"
              />
            </div>

            {/* 4. Province */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Province (ولایت)</label>
              <select
                value={province}
                onChange={(e) => {
                  const val = e.target.value;
                  setProvince(val);
                  setDistrict('');
                  setFiltersBatch({ province: val || undefined, district: undefined });
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="">All Provinces ({filterOptions.provinces.length})</option>
                {filterOptions.provinces.map((p) => {
                  const en = getEnglishProvinceName(p);
                  return (
                    <option key={p} value={p}>
                      {en} • {p}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 5. District */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">District (ولسوالی)</label>
              <select
                value={district}
                onChange={(e) => {
                  const val = e.target.value;
                  setDistrict(val);
                  setFiltersBatch({ district: val || undefined });
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="">
                  {province ? `All Districts in ${getEnglishProvinceName(province)} (${filterOptions.districts.length})` : `All Districts (${filterOptions.districts.length})`}
                </option>
                {filterOptions.districts.map((d) => {
                  const en = getEnglishDistrictName(d, province);
                  const clean = getCleanNativeName(d, province);
                  return (
                    <option key={d} value={d}>
                      {en} • {clean}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 6. Gender */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Gender (جنسیت)</label>
              <select
                value={gender !== undefined ? gender : ''}
                onChange={(e) => {
                  const val = e.target.value !== '' ? Number(e.target.value) : undefined;
                  setGender(val);
                  setFiltersBatch({ gender: val });
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                <option value="">All Genders (همه)</option>
                {filterOptions.genders.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. Book Name */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Registry Book (کتاب ثبت) ({filterOptions.books.length})
              </label>
              <select
                value={bookName}
                onChange={(e) => {
                  const val = e.target.value;
                  setBookName(val);
                  setFiltersBatch({ book_name: val || undefined });
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 truncate cursor-pointer"
              >
                <option value="">All Registry Books ({filterOptions.books.length})</option>
                {filterOptions.books.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* 8. Birth Year Range */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Birth Year (سال تولد شمسی)
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  placeholder="از (1300)"
                  value={yearMin !== undefined ? yearMin : ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    setYearMin(val);
                    setFiltersBatch({ dob_year_min: val });
                  }}
                  className="w-1/2 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 font-mono text-center"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="تا (1405)"
                  value={yearMax !== undefined ? yearMax : ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    setYearMax(val);
                    setFiltersBatch({ dob_year_max: val });
                  }}
                  className="w-1/2 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 font-mono text-center"
                />
              </div>
            </div>

            {/* 9. Record Number */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Record Number (شماره ثبت)
              </label>
              <input
                type="number"
                placeholder="e.g. 100"
                value={recordNum !== undefined ? recordNum : ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setRecordNum(val);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            {/* 10. Page Number */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Page Number (شماره صفحه)
              </label>
              <input
                type="number"
                placeholder="e.g. 10"
                value={pageNum !== undefined ? pageNum : ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setPageNum(val);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          {/* Active Field Afghan Virtual Keyboard */}
          {activeFieldKeyboard && (
            <div className="pt-2 animate-fade-in border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                <span>
                  کیبورد مجازی افغانی برای فیلد:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {activeFieldKeyboard === 'name' ? 'نام شخص (Name)' : activeFieldKeyboard === 'fname' ? "نام پدر (Father's Name)" : "نام پدرکلان (Grandfather's Name)"}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveFieldKeyboard(null)}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-md text-xs cursor-pointer"
                >
                  بستن کیبورد ✕
                </button>
              </div>
              <AfghanVirtualKeyboard
                isOpen={true}
                onClose={() => setActiveFieldKeyboard(null)}
                onInsertChar={(char) => {
                  if (activeFieldKeyboard === 'name') setName(prev => prev + char);
                  else if (activeFieldKeyboard === 'fname') setFname(prev => prev + char);
                  else if (activeFieldKeyboard === 'gname') setGname(prev => prev + char);
                }}
                onBackspace={() => {
                  if (activeFieldKeyboard === 'name') setName(prev => prev.slice(0, -1));
                  else if (activeFieldKeyboard === 'fname') setFname(prev => prev.slice(0, -1));
                  else if (activeFieldKeyboard === 'gname') setGname(prev => prev.slice(0, -1));
                }}
                onClear={() => {
                  if (activeFieldKeyboard === 'name') setName('');
                  else if (activeFieldKeyboard === 'fname') setFname('');
                  else if (activeFieldKeyboard === 'gname') setGname('');
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Search Fields</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-brand-600/25 transition-all cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Executing Query...' : 'Execute Search'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Header */}
      {hasSearched && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Found <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{totalMatches?.toLocaleString()}</span> matching records
            {totalMatches && totalMatches > 50 ? ` (Showing page ${page} of ${totalPages})` : ''}
          </div>

          {results.length > 0 && (
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm shadow-brand-500/20 transition-all cursor-pointer"
              title="Export search results in PDF, Excel, CSV, or JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Search Results</span>
            </button>
          )}
        </div>
      )}

      {/* Results List */}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((rec) => (
            <div
              key={rec.id}
              onClick={() => onSelectRecord(rec)}
              className="p-4 rounded-xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/50 shadow-sm transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center space-x-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 font-persian">
                      {rec.name || '—'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-persian">
                      ولد: {rec.fname || '—'} (پدرکلان: {rec.gname || '—'})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-persian">
                      <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      {rec.province} - {rec.district} ({rec.province_code || '-'})
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      {rec.dob_year ? `${rec.dob_year} SH` : 'N/A'}
                    </span>
                    {rec.record_number && (
                      <span className="flex items-center gap-1 font-mono">
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">شماره ثبت: {rec.record_number}</span>
                      </span>
                    )}
                    {rec.book_name && (
                      <span className="flex items-center gap-1 font-persian truncate max-w-[200px]">
                        <BookOpen className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{rec.book_name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 ml-4">
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  rec.gender === 0
                    ? 'bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300'
                    : rec.gender === 1
                    ? 'bg-pink-50 dark:bg-pink-950/70 border border-pink-200 dark:border-pink-500/30 text-pink-700 dark:text-pink-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {rec.gender === 0 ? 'Male (مرد)' : rec.gender === 1 ? 'Female (زن)' : 'Unspecified'}
                </span>
                <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-brand-600 dark:bg-slate-800 dark:group-hover:bg-brand-600 text-slate-500 group-hover:text-white dark:text-slate-400 dark:group-hover:text-white transition-all">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {hasSearched && totalPages > 1 && (
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Page <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{page}</span> of <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{totalPages.toLocaleString()}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => executeSearch(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>

            <button
              type="button"
              onClick={() => executeSearch(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Next Page</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {hasSearched && results.length === 0 && !loading && (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 shadow-sm">
          <Search className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-300">No matching records found</p>
          <p className="text-xs text-slate-500 mt-1">Try broadening your search criteria or resetting filters</p>
        </div>
      )}

      {/* Universal Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};
