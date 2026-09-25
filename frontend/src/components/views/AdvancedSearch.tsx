import React, { useState, useEffect } from 'react';
import {
  Search,
  RotateCcw,
  Filter,
  Eye,
  ArrowRight,
  BookOpen,
  MapPin,
  Hash,
  User,
  Calendar,
  Download,
  Keyboard,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Zap,
  X,
  GitBranch,
  Layers,
  ShieldCheck,
  Database,
  Globe2,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
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
  onViewFamilyTree?: (recordId: number) => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSelectRecord,
  onViewFamilyTree
}) => {
  const { filterOptions, filters, setFiltersBatch, clearFilters, setSearchQuery, searchScope } = useFilters();

  // Search Inputs State
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

  // Sorting & Pagination State
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  const [pageSize, setPageSize] = useState<number>(50);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // View & UI State
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(true);
  const [activeFieldKeyboard, setActiveFieldKeyboard] = useState<'name' | 'fname' | 'gname' | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Query Results & Telemetry State
  const [results, setResults] = useState<RecordItem[]>([]);
  const [totalMatches, setTotalMatches] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [queryLatencyMs, setQueryLatencyMs] = useState<number | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Compute Active Filter Count
  const activeCustomFiltersCount = [
    name.trim(),
    fname.trim(),
    gname.trim(),
    province,
    district,
    gender !== undefined
  ].filter(Boolean).length;

  const executeSearch = async (
    targetPage: number = 1,
    overrideFilters?: any,
    targetPageSize: number = pageSize,
    targetSortBy: string = sortBy,
    targetSortOrder: string = sortOrder
  ) => {
    setLoading(true);
    setHasSearched(true);
    const startTime = performance.now();
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
        page_size: targetPageSize,
        sort_by: targetSortBy,
        sort_order: targetSortOrder
      });

      const elapsed = Math.round(performance.now() - startTime);
      setQueryLatencyMs(elapsed);
      setResults(data.records);
      setTotalMatches(data.total_records);
      setPage(data.page);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Universal Search failed', err);
      const elapsed = Math.round(performance.now() - startTime);
      setQueryLatencyMs(elapsed);
    } finally {
      setLoading(false);
    }
  };

  // Sync external filters from FilterContext
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
    setActiveFieldKeyboard(null);
  };

  const applyArchetype = (preset: {
    province?: string;
    district?: string;
    gender?: number;
    yearMin?: number;
    yearMax?: number;
    name?: string;
  }) => {
    const nextProvince = preset.province !== undefined ? preset.province : province;
    const nextDistrict = preset.district !== undefined ? preset.district : district;
    const nextGender = preset.gender !== undefined ? preset.gender : gender;
    const nextYearMin = preset.yearMin !== undefined ? preset.yearMin : yearMin;
    const nextYearMax = preset.yearMax !== undefined ? preset.yearMax : yearMax;
    const nextName = preset.name !== undefined ? preset.name : name;

    setProvince(nextProvince);
    setDistrict(nextDistrict);
    setGender(nextGender);
    setYearMin(nextYearMin);
    setYearMax(nextYearMax);
    setName(nextName);

    const batch = {
      province: nextProvince || undefined,
      district: nextDistrict || undefined,
      gender: nextGender,
      dob_year_min: nextYearMin,
      dob_year_max: nextYearMax,
      search_query: q || undefined
    };

    setFiltersBatch(batch);
    setPage(1);
    executeSearch(1, batch);
  };

  const handleCopyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1800);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* 1. Executive Intelligence Telemetry Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 shadow-xl text-white p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white shadow-lg shadow-brand-600/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Universal Civil Registry & Multi-Parametric Search Hub
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold uppercase tracking-wider">
                    Tier-1 Enterprise Intelligence
                  </span>
                </h1>
                <p className="text-xs text-slate-300 font-persian">
                  سیستم یکپارچه جستجوی احوال نفوس افغانستان در میان ۳۱.۱ میلیون ریکارد رسمی با شاخص‌بندی آنی B-Tree
                </p>
              </div>
            </div>
          </div>

          {/* National Registry Scale Telemetry Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total Records</div>
              <div className="text-sm font-black font-mono text-emerald-400">31,164,973</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Provinces</div>
              <div className="text-sm font-black font-mono text-sky-400">34 Active</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Districts</div>
              <div className="text-sm font-black font-mono text-amber-400">395 Mapped</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Ledger Volumes</div>
              <div className="text-sm font-black font-mono text-purple-400">51,800+ Books</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Search & Granular Filter Console */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        {/* Universal Search Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>Universal Full-Text Master Search</span>
              <span className="text-slate-400 font-normal text-[11px]">(جستجوی هوشمند در نام، ولد، پدرکلان، ولایت، شماره ثبت یا شناسه هش)</span>
            </span>

            {/* Scope Indicator */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400 hidden sm:inline">Lineage Scope:</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium border border-slate-200 dark:border-slate-700">
                {searchScope.name && !searchScope.fname && !searchScope.gname && 'نام (Name Only)'}
                {!searchScope.name && searchScope.fname && !searchScope.gname && 'نام پدر (Father Only)'}
                {!searchScope.name && !searchScope.fname && searchScope.gname && 'نام پدرکلان (Grandfather Only)'}
                {searchScope.name && searchScope.fname && !searchScope.gname && 'نام و ولد (Name & Father)'}
                {searchScope.name && !searchScope.fname && searchScope.gname && 'نام و پدرکلان (Name & Grandfather)'}
                {!searchScope.name && searchScope.fname && searchScope.gname && 'ولد و پدرکلان (Father & Grandfather)'}
                {(!searchScope.name && !searchScope.fname && !searchScope.gname) && 'تمام ۳ ستون نسبی (All 3 Fields)'}
              </span>
            </div>
          </div>

          <SearchWithAfghanKeyboard
            value={q}
            onChange={(val) => {
              setQ(val);
              setSearchQuery(val || undefined);
            }}
            onSearch={() => handleSearch()}
            placeholder="مثال: ظریفه، لالا شیرین، محمد رحیم، کابل، هرات، شماره ثبت ۱۰۰، یا شناسه هش ۳۲ حرفی..."
            size="lg"
            searchScope={searchScope}
          />
        </div>

        {/* Quick Intelligence Archetypes (Clickable Presets) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Quick Intelligence Archetypes (فیلترهای فوری پیش‌فرض):</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(prev => !prev)}
              className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{showAdvancedFilters ? 'Collapse Filters' : 'Expand Advanced Filters'}</span>
              <span className="ml-1 px-1.5 py-0.2 bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-full font-mono text-[10px]">
                {activeCustomFiltersCount} active
              </span>
              {showAdvancedFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyArchetype({ province: 'کابل', district: 'مرکز کابل' })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                province === 'کابل' && district === 'مرکز کابل'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>🏛️ Kabul Center (مرکز کابل)</span>
            </button>

            <button
              type="button"
              onClick={() => applyArchetype({ province: 'هرات', district: 'مرکز هرات' })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                province === 'هرات' && district === 'مرکز هرات'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>🏛️ Herat Center (مرکز هرات)</span>
            </button>

            <button
              type="button"
              onClick={() => applyArchetype({ province: 'بلخ', district: 'مزارشریف' })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                province === 'بلخ' && district === 'مزارشریف'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>🏛️ Balkh / Mazar (بلخ)</span>
            </button>

            <button
              type="button"
              onClick={() => applyArchetype({ province: 'کندهار' })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                province === 'کندهار'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>🏛️ Kandahar (کندهار)</span>
            </button>

            <button
              type="button"
              onClick={() => applyArchetype({ gender: 0 })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                gender === 0
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>👨 Male Demographic (65%)</span>
            </button>

            <button
              type="button"
              onClick={() => applyArchetype({ gender: 1 })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                gender === 1
                  ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-pink-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>👩 Female Demographic (35%)</span>
            </button>

            <button
              type="button"
              onClick={() => applyArchetype({ yearMin: 1340, yearMax: 1370 })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                yearMin === 1340 && yearMax === 1370
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>📜 Era 1340 - 1370 SH</span>
            </button>

            <button
              type="button"
              onClick={() => applyArchetype({ yearMin: 1370, yearMax: 1400 })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                yearMin === 1370 && yearMax === 1400
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>📑 Era 1370 - 1400 SH</span>
            </button>

            {activeCustomFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/40 hover:bg-red-100 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 transition-all cursor-pointer flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Granular Filter Sections */}
        {showAdvancedFilters && (
          <form onSubmit={handleSearch} className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* GROUP 1: Identity & Lineage (هویت و نسب) */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>1. Identity & Lineage (هویت و نسب)</span>
                </div>

                <div className="space-y-2.5">
                  {/* Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Citizen Name (نام شخص)</label>
                      <button
                        type="button"
                        onClick={() => setActiveFieldKeyboard(activeFieldKeyboard === 'name' ? null : 'name')}
                        className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                          activeFieldKeyboard === 'name'
                            ? 'bg-emerald-600 text-white'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Keyboard className="w-3 h-3" />
                        <span>کیبورد</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. ظریفه، حامد، مریم"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 font-persian"
                    />
                  </div>

                  {/* Father's Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Father's Name (نام پدر / ولد)</label>
                      <button
                        type="button"
                        onClick={() => setActiveFieldKeyboard(activeFieldKeyboard === 'fname' ? null : 'fname')}
                        className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                          activeFieldKeyboard === 'fname'
                            ? 'bg-emerald-600 text-white'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Keyboard className="w-3 h-3" />
                        <span>کیبورد</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. لالا شیرین، محمد حسن"
                      value={fname}
                      onChange={(e) => setFname(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 font-persian"
                    />
                  </div>

                  {/* Grandfather's Name */}
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
                      >
                        <Keyboard className="w-3 h-3" />
                        <span>کیبورد</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. در محمد، غلام علی"
                      value={gname}
                      onChange={(e) => setGname(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 font-persian"
                    />
                  </div>

                  {/* Gender Selector */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Gender (جنسیت)</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setGender(undefined);
                          setFiltersBatch({ gender: undefined });
                        }}
                        className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          gender === undefined
                            ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-700'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        All (همه)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGender(0);
                          setFiltersBatch({ gender: 0 });
                        }}
                        className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          gender === 0
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Male (مرد)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGender(1);
                          setFiltersBatch({ gender: 1 });
                        }}
                        className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          gender === 1
                            ? 'bg-pink-600 text-white border-pink-600 shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-pink-700 dark:text-pink-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Female (زن)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* GROUP 2: Administrative Geography (موقعیت اداری و جغرافیایی) */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  <span>2. Administrative Geography (موقعیت جغرافیایی)</span>
                </div>

                <div className="space-y-3">
                  {/* Province */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Province (ولایت)</label>
                      <span className="text-[10px] text-slate-400">۳۴ ولایت فعال</span>
                    </div>
                    <select
                      value={province}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProvince(val);
                        setDistrict('');
                        setFiltersBatch({ province: val || undefined, district: undefined });
                      }}
                      className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                    >
                      <option value="">All 34 Provinces (تمام ولایات کشور)</option>
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

                  {/* District */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400">District (ولسوالی)</label>
                      <span className="text-[10px] text-slate-400">
                        {province ? `${filterOptions.districts.length} ولسوالی` : '۳۹۵ ولسوالی'}
                      </span>
                    </div>
                    <select
                      value={district}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDistrict(val);
                        setFiltersBatch({ district: val || undefined });
                      }}
                      className="w-full px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
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

                  {/* Geographic Scope Helper */}
                  <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 text-[11px] text-sky-800 dark:text-sky-300 flex items-start gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-sky-600" />
                    <span>
                      {province
                        ? `Filtered to jurisdiction: ${getEnglishProvinceName(province)} (${province}). Selecting a district limits to that administrative unit.`
                        : 'Select a province above to automatically populate its verified municipal and rural districts.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Virtual Afghan Keyboard Drawer for Fields */}
            {activeFieldKeyboard && (
              <div className="pt-2 animate-fade-in border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Keyboard className="w-4 h-4 text-emerald-600" />
                    <span>کیبورد مجازی استاندارد افغانی (دری / پشتو) برای:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {activeFieldKeyboard === 'name' ? 'نام شخص (Name)' : activeFieldKeyboard === 'fname' ? "نام پدر (Father's Name)" : "نام پدرکلان (Grandfather's Name)"}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveFieldKeyboard(null)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg text-xs cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>بستن کیبورد</span>
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

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Fields</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-brand-600/25 transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>{loading ? 'Executing Query Across 31.1M...' : 'Execute High-Speed Query'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* 3. Results Header & Controls Bar */}
      {hasSearched && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Matches count & Latency Telemetry */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Found {totalMatches?.toLocaleString()} matching records</span>
                </span>
                {totalMatches && totalMatches > pageSize && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    (Page {page} of {totalPages?.toLocaleString()})
                  </span>
                )}
                {queryLatencyMs !== null && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-semibold">
                    <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                    <span>{queryLatencyMs}ms latency</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Records verified with cryptographic ID, province census ledger, and family lineage keys
              </p>
            </div>

            {/* Right: View Mode, Density, Sorting & Export */}
            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Enterprise Data Grid View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Data Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                  title="Citizen Dossier Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>

              {/* Page Size Selector */}
              <select
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPageSize(newSize);
                  setPage(1);
                  executeSearch(1, undefined, newSize, sortBy, sortOrder);
                }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>

              {/* Sort By Selector */}
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split(':');
                  setSortBy(field);
                  setSortOrder(order);
                  setPage(1);
                  executeSearch(1, undefined, pageSize, field, order);
                }}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
              >
                <option value="id:asc">Sort: ID (Asc)</option>
                <option value="id:desc">Sort: ID (Desc)</option>
                <option value="dob_year:asc">Sort: Year (Oldest First)</option>
                <option value="dob_year:desc">Sort: Year (Youngest First)</option>
                <option value="record_number:asc">Sort: Record # (Asc)</option>
                <option value="name:asc">Sort: Name (A-Z)</option>
              </select>

              {/* Universal Export Button */}
              {results.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm shadow-brand-500/25 transition-all cursor-pointer"
                  title="Export results in CSV, Excel, PDF or JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Results Presentation */}
      {loading ? (
        <div className="p-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-brand-600/10 text-brand-600 flex items-center justify-center mx-auto animate-spin">
            <Zap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Executing Enterprise Query Across 31.1M Records...</p>
            <p className="text-xs text-slate-500">Traversing B-Tree indexes, jurisdictional districts, and registry ledgers</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        viewMode === 'table' ? (
          /* ENTERPRISE HIGH-DENSITY DATA GRID VIEW */
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                    <th className="py-3 px-4">System Key / Hash</th>
                    <th className="py-3 px-4">Citizen Name (نام)</th>
                    <th className="py-3 px-4">Father / Grandfather (نسب)</th>
                    <th className="py-3 px-3 text-center">Gender</th>
                    <th className="py-3 px-3 text-center">Birth Year</th>
                    <th className="py-3 px-4">Jurisdiction (ولایت و ولسوالی)</th>
                    <th className="py-3 px-4">Registry Ledger Coordinates</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {results.map((rec) => {
                    const enProv = getEnglishProvinceName(rec.province || '');
                    const enDist = getEnglishDistrictName(rec.district || '', rec.province || '');
                    const cleanDist = getCleanNativeName(rec.district || '', rec.province || '');

                    return (
                      <tr
                        key={rec.id}
                        onClick={() => onSelectRecord(rec)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      >
                        {/* ID / Hash */}
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-slate-900 dark:text-slate-100">#{rec.id}</span>
                            {rec.hash_key && (
                              <button
                                type="button"
                                onClick={(e) => handleCopyHash(rec.hash_key!, e)}
                                className="text-[10px] text-slate-400 hover:text-brand-500 p-0.5 rounded cursor-pointer transition-colors"
                                title={`Copy Hash: ${rec.hash_key}`}
                              >
                                {copiedHash === rec.hash_key ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                          {rec.hash_key && (
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[100px]" title={rec.hash_key}>
                              {rec.hash_key.substring(0, 10)}...
                            </div>
                          )}
                        </td>

                        {/* Name */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 font-persian">
                            {rec.name || '—'}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase font-mono">
                            Citizen ID: {rec.integer_key || rec.id}
                          </div>
                        </td>

                        {/* Father & Grandfather */}
                        <td className="py-3 px-4">
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-persian">
                            ولد: {rec.fname || '—'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-persian">
                            پدرکلان: {rec.gname || '—'}
                          </div>
                        </td>

                        {/* Gender */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              rec.gender === 0
                                ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60'
                                : rec.gender === 1
                                ? 'bg-pink-50 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {rec.gender === 0 ? 'مرد (Male)' : rec.gender === 1 ? 'زن (Female)' : 'Unspecified'}
                          </span>
                        </td>

                        {/* Birth Year */}
                        <td className="py-3 px-3 text-center font-mono">
                          {rec.dob_year ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                              {rec.dob_year} SH
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5 font-medium text-slate-800 dark:text-slate-200">
                            <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span className="font-semibold">{enProv}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600 dark:text-slate-400 font-persian">{rec.province}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 ml-5 font-persian">
                            {enDist} ({cleanDist})
                          </div>
                        </td>

                        {/* Archival Ledger Coordinates */}
                        <td className="py-3 px-4">
                          {rec.book_name ? (
                            <div className="flex items-center space-x-1 text-slate-700 dark:text-slate-300 font-persian truncate max-w-[200px]" title={rec.book_name}>
                              <BookOpen className="w-3 h-3 text-purple-500 shrink-0" />
                              <span className="truncate">{rec.book_name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Ledger unassigned</span>
                          )}
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            {rec.record_number !== null && (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">ثبت: {rec.record_number}</span>
                            )}
                            {rec.page_number !== null && (
                              <span className="text-slate-400">صفحه: {rec.page_number}</span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {onViewFamilyTree && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onViewFamilyTree(rec.id);
                                }}
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 hover:text-white text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                                title="Reconstruct Family Tree"
                              >
                                <GitBranch className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectRecord(rec);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                              title="Inspect Citizen Dossier"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CITIZEN DOSSIER CARDS VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {results.map((rec) => {
              const enProv = getEnglishProvinceName(rec.province || '');
              const enDist = getEnglishDistrictName(rec.district || '', rec.province || '');
              const cleanDist = getCleanNativeName(rec.district || '', rec.province || '');

              return (
                <div
                  key={rec.id}
                  onClick={() => onSelectRecord(rec)}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50 shadow-sm hover:shadow-md transition-all p-4 space-y-3 cursor-pointer group relative overflow-hidden"
                >
                  {/* Subtle Accent Glow */}
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8 ${
                    rec.gender === 0 ? 'bg-sky-500/10' : rec.gender === 1 ? 'bg-pink-500/10' : 'bg-slate-500/5'
                  }`} />

                  {/* Header Row: Avatar, Name & Gender */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                        rec.gender === 0
                          ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-300'
                          : rec.gender === 1
                          ? 'bg-pink-50 dark:bg-pink-950/70 border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-300'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-base text-slate-900 dark:text-slate-100 font-persian truncate">
                          {rec.name || '—'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          ID: #{rec.id}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        rec.gender === 0
                          ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60'
                          : rec.gender === 1
                          ? 'bg-pink-50 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {rec.gender === 0 ? 'مرد (Male)' : rec.gender === 1 ? 'زن (Female)' : 'Unspecified'}
                    </span>
                  </div>

                  {/* Lineage Info */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Father (نام پدر):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-persian">{rec.fname || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">Grandfather (پدرکلان):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-persian">{rec.gname || '—'}</span>
                    </div>
                  </div>

                  {/* Geographic & Archival Tags */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center space-x-1.5 font-persian">
                      <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">{enProv} ({rec.province}) - {enDist} ({cleanDist})</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{rec.dob_year ? `${rec.dob_year} SH` : 'Year N/A'}</span>
                      </span>

                      {rec.record_number !== null && (
                        <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                          ثبت: {rec.record_number}
                        </span>
                      )}
                    </div>

                    {rec.book_name && (
                      <div className="flex items-center space-x-1 text-[11px] font-persian text-purple-600 dark:text-purple-400 truncate">
                        <BookOpen className="w-3 h-3 shrink-0" />
                        <span className="truncate">{rec.book_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Direct Action Bar */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecord(rec);
                      }}
                      className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Dossier</span>
                    </button>

                    {onViewFamilyTree && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewFamilyTree(rec.id);
                        }}
                        className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>Family Tree</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : hasSearched ? (
        /* Empty Results State */
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No matching civil records found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We couldn't find any registrations matching your exact search parameters. Try broadening your criteria or clicking one of the Quick Archetypes above.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-sm hover:bg-brand-500 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Search Criteria</span>
          </button>
        </div>
      ) : (
        /* 5. Zero-State Welcome / Enterprise Intelligence Overview */
        <div className="space-y-5">
          {/* Quick Intelligence Launchpad */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  <span>Executive Intelligence Launchpad</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-persian">
                  برای شروع، می‌توانید مستقیماً یکی از درگاه‌های تحلیلی زیر را انتخاب کنید یا در نوار بالا نام مورد نظر را جستجو نمایید
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                onClick={() => applyArchetype({ province: 'کابل' })}
                className="p-4 rounded-xl bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-950/60 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer group"
              >
                <div className="text-2xl mb-1.5">🏛️</div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                  Kabul Jurisdiction
                </div>
                <div className="text-[11px] text-slate-500 font-persian">ولایت کابل و مرکز شهر</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-2 font-semibold">
                  3.8M+ Records Mapped →
                </div>
              </div>

              <div
                onClick={() => applyArchetype({ province: 'هرات' })}
                className="p-4 rounded-xl bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-950/60 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer group"
              >
                <div className="text-2xl mb-1.5">🏛️</div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                  Herat Historical Archives
                </div>
                <div className="text-[11px] text-slate-500 font-persian">ولایت هرات و دفاتر غربی</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-2 font-semibold">
                  2.4M+ Records Mapped →
                </div>
              </div>

              <div
                onClick={() => applyArchetype({ province: 'بلخ' })}
                className="p-4 rounded-xl bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-950/60 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer group"
              >
                <div className="text-2xl mb-1.5">🏛️</div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                  Balkh / Mazar Region
                </div>
                <div className="text-[11px] text-slate-500 font-persian">شمال کشور و مزارشریف</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-2 font-semibold">
                  1.6M+ Records Mapped →
                </div>
              </div>

              <div
                onClick={() => applyArchetype({ yearMin: 1340, yearMax: 1370 })}
                className="p-4 rounded-xl bg-slate-50 hover:bg-purple-50/60 dark:bg-slate-950/60 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer group"
              >
                <div className="text-2xl mb-1.5">📜</div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-purple-600 transition-colors">
                  Golden Era Cohort
                </div>
                <div className="text-[11px] text-slate-500 font-persian">نسل تاریخی ۱۳۴۰ - ۱۳۷۰</div>
                <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-2 font-semibold">
                  Historical Generation →
                </div>
              </div>
            </div>
          </div>

          {/* Search Capabilities & Best Practices Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Keyboard className="w-4 h-4 text-emerald-600" />
                <span>Standard Afghan Keyboard</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-persian">
                کیبورد مجازی استاندارد افغانستان با پشتیبانی کامل از حروف پشتو (ټ، څ، ځ، ډ، ړ، ږ، ښ، ګ، ڼ، ۍ، ې) و عبارات احوال نفوس.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <GitBranch className="w-4 h-4 text-brand-600" />
                <span>Full Lineage Reconstruction</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-persian">
                پس از یافتن هر شهروند، با کلیک روی دکمه شجره خانوادگی (Family Tree) ارتباطات نسلی، برادران و اعضای خانواده به طور خودکار استخراج می‌گردد.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Enterprise B-Tree Sub-Second Speed</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Compound B-Tree index structures allow searching across 31,164,973 civil registration rows in less than 0.10 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 6. Enterprise Pagination Controls */}
      {hasSearched && totalPages > 1 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing Page <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{page}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{totalPages?.toLocaleString()}</span>{' '}
            ({totalMatches?.toLocaleString()} total records)
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => executeSearch(1)}
              disabled={page <= 1 || loading}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="First Page"
            >
              First
            </button>

            <button
              type="button"
              onClick={() => executeSearch(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 font-mono font-bold text-xs border border-brand-200 dark:border-brand-800/60">
              {page}
            </span>

            <button
              type="button"
              onClick={() => executeSearch(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => executeSearch(totalPages)}
              disabled={page >= totalPages || loading}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Last Page"
            >
              Last
            </button>
          </div>
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
