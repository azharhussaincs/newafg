import React, { useEffect, useState, useMemo } from 'react';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Share2, 
  Layers, 
  RotateCcw, 
  MapPin, 
  Navigation, 
  ArrowLeft,
  Search,
  Check,
  Calendar,
  BookMarked,
  Zap,
  Info,
  HelpCircle,
  X,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { BooksPagesData, LedgerPageData, RecordItem } from '../../types';
import { RecordDrawer } from '../common/RecordDrawer';
import { SearchWithAfghanKeyboard } from '../common/SearchWithAfghanKeyboard';
import { 
  getEnglishProvinceName, 
  getEnglishDistrictName, 
  getCleanNativeName 
} from '../../utils/geoTranslation';
import { 
  BOOK_TYPES, 
  BookTypeOption, 
  getBookPatternBadge,
  isBookCopy,
  isBookOriginal,
  isBookPMU
} from '../../utils/bookPattern';

interface BookPageExplorerProps {
  onSelectRecord?: (record: RecordItem) => void;
  onViewFamilyTree?: (recordId: number) => void;
}

interface PatternBookItem {
  book_name: string;
  province?: string;
  records_count: number;
  unique_pages: number;
  percentage: number;
  category?: string;
  is_copy?: boolean;
  is_pmu?: boolean;
}

function normalizePersian(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/[آأإ]/g, 'ا')
    .replace(/\s+/g, '')
    .toLowerCase();
}

function matchesProvince(bookName: string, bookProvince: string | undefined, selectedProvince: string): boolean {
  if (!selectedProvince) return true;
  
  if (bookProvince && (bookProvince === selectedProvince || bookProvince.trim() === selectedProvince.trim())) {
    return true;
  }
  
  const normBook = normalizePersian(bookName);
  const normProv = normalizePersian(selectedProvince);
  
  if (normBook.includes(normProv)) return true;

  if (normProv === 'وردک' && (normBook.includes('وردگ') || normBook.includes('میدان'))) return true;
  if (normProv === 'میدانوردک' && (normBook.includes('وردک') || normBook.includes('وردگ') || normBook.includes('میدان'))) return true;
  if (normProv === 'کندهار' && normBook.includes('قندهار')) return true;
  if (normProv === 'کندز' && normBook.includes('قندوز')) return true;
  if (normProv === 'کنر' && normBook.includes('کنرها')) return true;
  if (normProv === 'کوچی' && (normBook.includes('کوچی') || normBook.includes('عشایر'))) return true;

  return false;
}

function matchesDistrict(bookName: string, selectedDistrict: string, selectedProvince?: string): boolean {
  if (!selectedDistrict) return true;
  
  const cleanSelected = selectedDistrict.trim();
  const centerMatch = cleanSelected.match(/^مرکز\s*\(([^)]+)\)$/);
  const isKabulCity = selectedProvince === 'کابل' && cleanSelected === 'کابل';
  
  if (centerMatch || isKabulCity) {
    const cityName = centerMatch ? centerMatch[1].trim() : 'کابل';
    const normCity = normalizePersian(cityName);
    const normBook = normalizePersian(bookName);
    
    if (
      normBook.includes('ناحیه') || 
      normBook.includes('شاروالی') || 
      normBook.includes('مرکز') ||
      (centerMatch && normBook.includes(normCity))
    ) {
      return true;
    }
    return false;
  }
  
  const cleanDist = cleanSelected.replace(/^ولسوالی\s+/, '').trim();
  const normBook = normalizePersian(bookName);
  const normDist = normalizePersian(cleanDist);
  
  if (normBook.includes(normDist)) return true;

  if (cleanDist.includes('بغلان جدید') && (normBook.includes('بغلانمرکزی') || normBook.includes('بغلانجدید'))) return true;
  if (cleanDist.includes('بهسود') && (normBook.includes('مرکزبهسود') || normBook.includes('بهسود'))) return true;
  if (cleanDist.includes('سرخ') && cleanDist.includes('پارسا') && (normBook.includes('سرخپارسا') || normBook.includes('سرخیپارسا'))) return true;
  if (cleanDist.includes('شیرین') && normBook.includes('شرین')) return true;
  if (cleanDist.includes('کوهستان') && normBook.includes('کوهستان')) return true;

  return false;
}

function extractBookYears(bookName: string): number[] {
  if (!bookName) return [];
  const normalized = bookName
    .replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
    .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
    
  const years: number[] = [];

  // Range match: e.g. 1354 الی 1357, 1354 تا 1357, 1354 - 1357
  const rangeMatch = normalized.match(/\b(1[234]\d{2})\s*(?:الی|تا|-|to)\s*(1[234]\d{2})\b/);
  if (rangeMatch) {
    const y1 = parseInt(rangeMatch[1], 10);
    const y2 = parseInt(rangeMatch[2], 10);
    const start = Math.min(y1, y2);
    const end = Math.max(y1, y2);
    if (start >= 1250 && end <= 1405 && (end - start) <= 30) {
      for (let y = start; y <= end; y++) {
        if (!years.includes(y)) years.push(y);
      }
    }
  }

  const matches = normalized.match(/\b(1[234]\d{2})\b/g);
  if (matches) {
    for (const m of matches) {
      const y = parseInt(m, 10);
      if (y >= 1250 && y <= 1405 && !years.includes(y)) {
        years.push(y);
      }
    }
  }
  return years;
}

function bookMatchesYear(bookName: string, targetYear: number): boolean {
  if (!targetYear) return true;
  return extractBookYears(bookName).includes(targetYear);
}

const WORD_TO_VOL: Record<string, number> = {
  'اول': 1, 'نخست': 1,
  'دوم': 2,
  'سوم': 3,
  'چهارم': 4,
  'پنجم': 5,
  'ششم': 6,
  'هفتم': 7,
  'هشتم': 8,
  'نهم': 9,
  'دهم': 10,
  'یازدهم': 11,
  'دوازدهم': 12,
  'سیزدهم': 13,
  'چهاردهم': 14,
  'پانزدهم': 15,
  'شانزدهم': 16,
  'هفدهم': 17,
  'هژدهم': 18, 'هجدهم': 18,
  'نوزدهم': 19,
  'بیستم': 20
};

function extractBookVolumes(bookName: string): number[] {
  if (!bookName) return [];
  const normalized = bookName
    .replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
    .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);

  const volumes: number[] = [];

  // 1. Matches like 'جلد 2', 'جلد 14', etc.
  const digitRegex = /جلد\s*([0-9]{1,3})\b/g;
  let match: RegExpExecArray | null;
  while ((match = digitRegex.exec(normalized)) !== null) {
    const v = parseInt(match[1], 10);
    if (v >= 1 && v <= 200 && !volumes.includes(v)) {
      volumes.push(v);
    }
  }

  // 2. Matches like 'جلد اول', 'جلد دوم'
  for (const [word, val] of Object.entries(WORD_TO_VOL)) {
    const regex = new RegExp(`جلد\\s*${word}\\b`);
    if (regex.test(normalized) && !volumes.includes(val)) {
      volumes.push(val);
    }
  }

  // 3. Leading digit e.g. '2 قلم انداز'
  const leadMatch = normalized.match(/^\s*([0-9]{1,3})\s*(?:قلم|اصل|اساس|نقل|متفرقه)/);
  if (leadMatch) {
    const v = parseInt(leadMatch[1], 10);
    if (v >= 1 && v <= 200 && !volumes.includes(v)) {
      volumes.push(v);
    }
  }

  return volumes;
}

function bookMatchesVolume(bookName: string, targetVol: number): boolean {
  if (!targetVol) return true;
  return extractBookVolumes(bookName).includes(targetVol);
}

function getVolumeLabel(vol: number): string {
  if (vol === 1) return 'Volume 1 • جلد اول (1)';
  if (vol === 2) return 'Volume 2 • جلد 2 (دوم)';
  if (vol === 3) return 'Volume 3 • جلد 3 (سوم)';
  if (vol === 4) return 'Volume 4 • جلد 4 (چهارم)';
  if (vol === 5) return 'Volume 5 • جلد 5 (پنجم)';
  return `Volume ${vol} • جلد ${vol}`;
}

export const BookPageExplorer: React.FC<BookPageExplorerProps> = ({
  onSelectRecord,
  onViewFamilyTree
}) => {
  const { 
    toQueryParams, 
    refreshKey, 
    filters, 
    setBookName, 
    setProvince, 
    setDistrict, 
    setFiltersBatch, 
    clearFilters, 
    activeFilterCount, 
    filterOptions 
  } = useFilters();

  const [data, setData] = useState<BooksPagesData | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronized Selection State
  const currentProvince = filters.province || '';
  const currentDistrict = filters.district || '';
  const currentBook = filters.book_name || '';
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');

  // Ledger Sheet Data (when a book is opened)
  const [ledgerData, setLedgerData] = useState<LedgerPageData | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState<boolean>(false);

  // Selected Book Type (Defaults to 'all' or matched category)
  const [selectedType, setSelectedType] = useState<string>('all');
  const [typeBooks, setTypeBooks] = useState<PatternBookItem[]>([]);
  const [typeLoading, setTypeLoading] = useState<boolean>(false);

  // Search inside current books
  const [bookSearch, setBookSearch] = useState<string>('');

  // Selected registration year filter (Solar Hijri)
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  // Selected volume number filter (جلد)
  const [selectedVolume, setSelectedVolume] = useState<number | undefined>(undefined);

  // Selected edition filter (All / اصل [Original] / نقل [Copies])
  const [selectedEdition, setSelectedEdition] = useState<'all' | 'asl' | 'naql'>('all');

  // Selected campaign/project filter (All / پروژه پی‌ام‌یو)
  const [selectedCampaign, setSelectedCampaign] = useState<'all' | 'pmu'>('all');

  // Books list pagination
  const [bookListPage, setBookListPage] = useState<number>(1);
  const pageSize = 24;

  // Local record inspection drawer
  const [inspectRecord, setInspectRecord] = useState<RecordItem | null>(null);

  // Classification Guide Modal & Active Category Information Banner
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showCategoryInfo, setShowCategoryInfo] = useState<boolean>(true);
  const [guideLang, setGuideLang] = useState<'en' | 'fa'>('en');

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPageInput('1');
  }, [refreshKey, JSON.stringify(toQueryParams())]);

  // If a book is pre-selected externally, auto-select its specific type
  useEffect(() => {
    if (currentBook) {
      const matched = BOOK_TYPES.find(t => t.id !== 'all' && t.match(currentBook));
      if (matched && matched.id !== selectedType) {
        setSelectedType(matched.id);
      }
    }
  }, [currentBook]);

  // 1. Initial lightweight load for analytics & dropdowns
  useEffect(() => {
    setLoading(true);
    api.getBooksPagesAnalytics()
      .then((res) => {
        setData(res);
      })
      .catch((err) => console.error('Failed to load books analytics', err))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // 2. Fetch books of the chosen type on-demand (< 20ms)
  useEffect(() => {
    if (!selectedType) {
      setTypeBooks([]);
      return;
    }
    setTypeLoading(true);
    fetch(`/data/patterns/${selectedType}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((books: PatternBookItem[]) => {
        setTypeBooks(books);
      })
      .catch((err) => {
        console.error('Failed to load type books', err);
      })
      .finally(() => {
        setTypeLoading(false);
      });
  }, [selectedType]);

  // 3. Fetch ledger page when a book is selected
  useEffect(() => {
    if (!currentBook) {
      setLedgerData(null);
      return;
    }
    setLedgerLoading(true);
    api.getLedgerPage(currentBook, currentPage)
      .then((res) => {
        setLedgerData(res);
        setCurrentPage(res.page_number);
        setPageInput(String(res.page_number));
      })
      .catch((err) => console.error('Failed to load ledger page', err))
      .finally(() => setLedgerLoading(false));
  }, [currentBook, currentPage]);

  // Districts for current province
  const availableDistricts = useMemo(() => {
    if (!filterOptions.districts_with_counts || filterOptions.districts_with_counts.length === 0) {
      return [];
    }
    if (!currentProvince) {
      return filterOptions.districts_with_counts;
    }
    const matching = filterOptions.districts_with_counts.filter(d => !d.province || d.province === currentProvince);
    return matching.length > 0 ? matching : filterOptions.districts_with_counts;
  }, [filterOptions.districts_with_counts, currentProvince]);

  // Available registration years computed from currently scoped books (type, province, district, volume, edition, campaign)
  const availableYears = useMemo(() => {
    if (!typeBooks || typeBooks.length === 0) return [];
    const yearCounts = new Map<number, number>();

    for (const b of typeBooks) {
      if (currentProvince && !matchesProvince(b.book_name, b.province, currentProvince)) {
        continue;
      }
      if (currentDistrict && !matchesDistrict(b.book_name, currentDistrict, currentProvince)) {
        continue;
      }
      if (selectedVolume && !bookMatchesVolume(b.book_name, selectedVolume)) {
        continue;
      }
      if (selectedEdition === 'naql' && !(b.is_copy || isBookCopy(b.book_name))) {
        continue;
      }
      if (selectedEdition === 'asl' && (b.is_copy || isBookCopy(b.book_name))) {
        continue;
      }
      if (selectedCampaign === 'pmu' && !(b.is_pmu || isBookPMU(b.book_name))) {
        continue;
      }
      const years = extractBookYears(b.book_name);
      for (const y of years) {
        yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
      }
    }

    return Array.from(yearCounts.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year);
  }, [typeBooks, currentProvince, currentDistrict, selectedVolume, selectedEdition, selectedCampaign]);

  // If selectedYear is not available in the filtered list, reset it
  useEffect(() => {
    if (selectedYear && availableYears.length > 0 && !availableYears.some(item => item.year === selectedYear)) {
      setSelectedYear(undefined);
    }
  }, [availableYears, selectedYear]);

  // Available book volumes computed from currently scoped books (type, province, district, year, edition, campaign)
  const availableVolumes = useMemo(() => {
    if (!typeBooks || typeBooks.length === 0) return [];
    const volCounts = new Map<number, number>();

    for (const b of typeBooks) {
      if (currentProvince && !matchesProvince(b.book_name, b.province, currentProvince)) {
        continue;
      }
      if (currentDistrict && !matchesDistrict(b.book_name, currentDistrict, currentProvince)) {
        continue;
      }
      if (selectedYear && !bookMatchesYear(b.book_name, selectedYear)) {
        continue;
      }
      if (selectedEdition === 'naql' && !(b.is_copy || isBookCopy(b.book_name))) {
        continue;
      }
      if (selectedEdition === 'asl' && (b.is_copy || isBookCopy(b.book_name))) {
        continue;
      }
      if (selectedCampaign === 'pmu' && !(b.is_pmu || isBookPMU(b.book_name))) {
        continue;
      }
      const vols = extractBookVolumes(b.book_name);
      for (const v of vols) {
        volCounts.set(v, (volCounts.get(v) || 0) + 1);
      }
    }

    return Array.from(volCounts.entries())
      .map(([volume, count]) => ({ volume, count }))
      .sort((a, b) => a.volume - b.volume);
  }, [typeBooks, currentProvince, currentDistrict, selectedYear, selectedEdition, selectedCampaign]);

  // If selectedVolume is not available in the filtered list, reset it
  useEffect(() => {
    if (selectedVolume && availableVolumes.length > 0 && !availableVolumes.some(item => item.volume === selectedVolume)) {
      setSelectedVolume(undefined);
    }
  }, [availableVolumes, selectedVolume]);

  // Available books for selected category
  const filteredBooks = useMemo(() => {
    return typeBooks || [];
  }, [typeBooks]);

  // Filter books by search query
  const searchedBooks = useMemo(() => {
    if (!bookSearch.trim()) return filteredBooks;
    const q = bookSearch.trim().toLowerCase();
    return filteredBooks.filter(b => b.book_name.toLowerCase().includes(q));
  }, [filteredBooks, bookSearch]);

  // Paginated books
  const totalBookPages = Math.max(1, Math.ceil(searchedBooks.length / pageSize));
  const pagedBooks = useMemo(() => {
    const start = (bookListPage - 1) * pageSize;
    return searchedBooks.slice(start, start + pageSize);
  }, [searchedBooks, bookListPage, pageSize]);

  // Handlers
  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setBookListPage(1);
    setBookSearch('');
    setSelectedYear(undefined);
    setSelectedVolume(undefined);
    if (currentBook && typeId !== 'all') {
      const t = BOOK_TYPES.find(x => x.id === typeId);
      if (t && !t.match(currentBook)) {
        setBookName(undefined);
        setLedgerData(null);
      }
    }
  };

  const handleProvinceChange = (prov: string) => {
    setCurrentPage(1);
    setPageInput('1');
    setBookListPage(1);
    setLedgerData(null);
    setFiltersBatch({
      province: prov || undefined,
      district: undefined,
      book_name: undefined
    });
  };

  const handleDistrictChange = (dist: string) => {
    setCurrentPage(1);
    setPageInput('1');
    setBookListPage(1);
    setLedgerData(null);
    if (!dist) {
      setFiltersBatch({
        district: undefined,
        book_name: undefined
      });
      return;
    }

    // Auto-select province if not already selected
    let prov = currentProvince;
    if (!prov && filterOptions.districts_with_counts) {
      const match = filterOptions.districts_with_counts.find(d => d.district === dist);
      if (match && match.province) {
        prov = match.province;
      }
    }

    setFiltersBatch({
      province: prov || undefined,
      district: dist,
      book_name: undefined
    });
  };

  const handleYearChange = (yearVal: string) => {
    const y = yearVal ? parseInt(yearVal, 10) : undefined;
    setCurrentPage(1);
    setPageInput('1');
    setBookListPage(1);
    setLedgerData(null);
    setSelectedYear(y);
  };

  const handleVolumeChange = (volVal: string) => {
    const v = volVal ? parseInt(volVal, 10) : undefined;
    setCurrentPage(1);
    setPageInput('1');
    setBookListPage(1);
    setLedgerData(null);
    setSelectedVolume(v);
  };

  const handleEditionChange = (val: 'all' | 'asl' | 'naql') => {
    setCurrentPage(1);
    setPageInput('1');
    setBookListPage(1);
    setSelectedEdition(val);
  };

  const handleCampaignChange = (val: 'all' | 'pmu') => {
    setCurrentPage(1);
    setPageInput('1');
    setBookListPage(1);
    setSelectedCampaign(val);
  };

  const handleBookSelect = (book: string) => {
    if (!book) {
      setLedgerData(null);
      setCurrentPage(1);
      setPageInput('1');
      setBookName(undefined);
      return;
    }
    setCurrentPage(1);
    setPageInput('1');
    setBookName(book);
  };

  const handlePageChange = (pg: number) => {
    if (!ledgerData) return;
    const clamped = Math.max(ledgerData.min_page, Math.min(ledgerData.max_page, pg));
    setCurrentPage(clamped);
    setPageInput(String(clamped));
  };

  const handlePageJump = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && ledgerData) {
      const clamped = Math.max(ledgerData.min_page, Math.min(ledgerData.max_page, p));
      setCurrentPage(clamped);
      setPageInput(String(clamped));
    }
  };

  const handleResetFilters = () => {
    setCurrentPage(1);
    setPageInput('1');
    setSelectedType('all');
    setSelectedEdition('all');
    setSelectedCampaign('all');
    setBookListPage(1);
    setBookSearch('');
    setSelectedYear(undefined);
    setSelectedVolume(undefined);
    setLedgerData(null);
    clearFilters();
  };

  const handleInspect = (r: RecordItem) => {
    if (onSelectRecord) {
      onSelectRecord(r);
    } else {
      setInspectRecord(r);
    }
  };

  const activeTypeObj = BOOK_TYPES.find(t => t.id === selectedType) || BOOK_TYPES[0];
  const maxPage = ledgerData?.max_page || 1;
  const minPage = ledgerData?.min_page || 1;

  if (loading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-slate-500">Loading book registry system...</p>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 space-y-5 text-slate-900 dark:text-slate-100 max-w-7xl mx-auto">
      
      {/* ========================================================================= */}
      {/* 1. SIMPLE CLEAN HEADER                                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Books & Page Explorer</span>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {(data?.total_books || 51834).toLocaleString()} Books
            </span>
          </h1>
        </div>

        {/* Reset button */}
        {(activeFilterCount > 0 || currentBook || currentProvince || currentDistrict || selectedType !== 'all') && (
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto border border-slate-200 dark:border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. STEP 1: CHOOSE BOOK TYPE - 7 OFFICIAL REGISTRY CATEGORIES              */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-end">

          <span className="text-[11px] text-slate-500 font-mono">
            {currentDistrict
              ? `${filteredBooks.length.toLocaleString()} books in ${getEnglishDistrictName(currentDistrict, currentProvince)} (of ${activeTypeObj.count.toLocaleString()} total)`
              : currentProvince 
                ? `${filteredBooks.length.toLocaleString()} books in ${getEnglishProvinceName(currentProvince)} (of ${activeTypeObj.count.toLocaleString()} total)`
                : `Showing ${filteredBooks.length.toLocaleString()} of ${activeTypeObj.count.toLocaleString()} books`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-2">
          {BOOK_TYPES.map((t) => {
            const isSelected = selectedType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTypeSelect(t.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 relative ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20 ring-2 ring-brand-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-lg">{t.icon}</span>
                  {isSelected && (
                    <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                    {t.name}
                  </div>
                  <div className={`text-[11px] font-mono mt-0.5 font-semibold ${isSelected ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'}`}>
                    {t.count.toLocaleString()} books
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Category Legal & Administrative Definition Banner */}
        {activeTypeObj && showCategoryInfo && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/70 dark:from-slate-900/80 dark:to-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2.5 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeTypeObj.icon}</span>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                    <span className="text-sm">
                      {guideLang === 'en' ? `${activeTypeObj.nameEn} • ${activeTypeObj.name}` : activeTypeObj.name}
                    </span>
                    {guideLang === 'fa' && (
                      <span className="text-xs font-normal text-slate-500 font-mono">({activeTypeObj.nameEn})</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {guideLang === 'en' ? activeTypeObj.subtitleEn : activeTypeObj.subtitle}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* Language Toggle */}
                <div className="flex items-center gap-0.5 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => setGuideLang('en')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      guideLang === 'en'
                        ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setGuideLang('fa')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      guideLang === 'fa'
                        ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    دری
                  </button>
                </div>

                <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300">
                  {activeTypeObj.count.toLocaleString()} Volumes • {activeTypeObj.recordsCount.toLocaleString()} Records
                </span>

                <button
                  onClick={() => setShowCategoryInfo(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="Hide category definition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {guideLang === 'en'
                      ? 'Official Legal & Administrative Definition:'
                      : 'تعریف حقوقی و اداری (Official Legal Definition):'}
                  </span>
                </span>
                <p className={`text-slate-600 dark:text-slate-300 leading-relaxed text-xs ${guideLang === 'fa' ? 'font-persian' : 'font-sans'}`} dir={guideLang === 'fa' ? 'rtl' : 'ltr'}>
                  {guideLang === 'en' ? activeTypeObj.definitionEn : activeTypeObj.definition}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-[11px]">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    {guideLang === 'en'
                      ? 'Why This Name & Classification? (Official Archival Rationale):'
                      : 'چرا این نام برای دسته‌بندی انتخاب شده است؟ (Why This Name?):'}
                  </span>
                </span>
                <p className={`text-slate-600 dark:text-slate-300 leading-relaxed text-xs ${guideLang === 'fa' ? 'font-persian' : 'font-sans'}`} dir={guideLang === 'fa' ? 'rtl' : 'ltr'}>
                  {guideLang === 'en' ? activeTypeObj.whyThisNameEn : activeTypeObj.whyThisName}
                </p>
                <div className="text-[11px] font-mono text-brand-600 dark:text-brand-400 pt-1">
                  🏛️ {guideLang === 'en' ? `Statutory Legal Authority: ${activeTypeObj.legalBasisEn}` : `مبنای قانونی: ${activeTypeObj.legalBasis}`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN VIEW: EITHER THE BOOKS LIST OR THE OPEN BOOK'S PAGES              */}
      {/* ========================================================================= */}
      
      {/* --- SCENARIO A: A BOOK IS OPEN (SHOW PAGES & CITIZENS TABLE) --- */}
      {currentBook ? (
        <div className="space-y-4">
          
          {/* Active Book Top Bar with Back Button */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <button
                onClick={() => setBookName(undefined)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
                title="Back to books list"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white font-persian">
                    {currentBook}
                  </h2>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                  <span>Province: <strong className="text-slate-700 dark:text-slate-300">{getEnglishProvinceName(ledgerData?.province || currentProvince)}</strong></span>
                  {(ledgerData?.district || currentDistrict) && (
                    <span>• District: <strong className="text-slate-700 dark:text-slate-300">{getEnglishDistrictName(ledgerData?.district || currentDistrict, currentProvince)}</strong></span>
                  )}
                  <span>• Total Records: <strong className="text-slate-700 dark:text-slate-300 font-mono">{(ledgerData?.total_records_in_book || 0).toLocaleString()}</strong></span>
                  <span>• Total Pages: <strong className="text-slate-700 dark:text-slate-300 font-mono">{ledgerData?.unique_pages_in_book || 0}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Page Jump Buttons */}
            {ledgerData && ledgerData.available_pages.length > 1 && (
              <div className="flex flex-wrap items-center gap-1 self-start sm:self-auto">
                <span className="text-xs text-slate-400 mr-1">Pages:</span>
                {ledgerData.available_pages.slice(0, 8).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => handlePageChange(pg)}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                      currentPage === pg
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Simple Page Flipping Controller */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= minPage}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <form onSubmit={handlePageJump} className="flex items-center gap-2 text-xs font-bold">
              <span className="text-slate-500">Page</span>
              <input
                type="number"
                min={minPage}
                max={maxPage}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                className="w-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-center text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-brand-500"
              />
              <span className="text-slate-500">of {maxPage}</span>
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold transition-colors cursor-pointer"
              >
                Go
              </button>
            </form>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= maxPage}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Registered Citizens Table */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Citizen Records on Page {currentPage}
              </span>
              <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                {ledgerData?.records.length || 0} Citizens
              </span>
            </div>

            {ledgerLoading ? (
              <div className="py-12 text-center">
                <div className="w-7 h-7 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-400 mt-2 font-mono">Loading page...</p>
              </div>
            ) : !ledgerData || ledgerData.records.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                No records registered on this page.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-mono">
                      <th className="py-2.5 px-3 text-center w-12">#</th>
                      <th className="py-2.5 px-3 text-center w-24">Record ID</th>
                      <th className="py-2.5 px-4 font-bold">Citizen Name (نام)</th>
                      <th className="py-2.5 px-4 font-bold">Father (ولد)</th>
                      <th className="py-2.5 px-4 font-bold">Grandfather (ولدیت)</th>
                      <th className="py-2.5 px-3 text-center">Birth Year</th>
                      <th className="py-2.5 px-3 text-center">Gender</th>
                      <th className="py-2.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {ledgerData.records.map((r, index) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                          {r.record_number || '—'}
                        </td>
                        <td className="py-2.5 px-4 font-persian font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {r.name || '—'}
                        </td>
                        <td className="py-2.5 px-4 font-persian text-slate-700 dark:text-slate-300">
                          {r.fname || '—'}
                        </td>
                        <td className="py-2.5 px-4 font-persian text-slate-500">
                          {r.gname || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
                          {r.dob_year ? `${r.dob_year} SH` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.gender === 1
                              ? 'bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800/40'
                              : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/40'
                          }`}>
                            {r.gender === 1 ? 'Female' : 'Male'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleInspect(r)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 text-slate-600 dark:text-slate-300 hover:text-white transition-all cursor-pointer"
                              title="View Full Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {onViewFamilyTree && (
                              <button
                                onClick={() => onViewFamilyTree(r.id)}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 text-slate-600 dark:text-slate-300 hover:text-white transition-all cursor-pointer"
                                title="View Family Tree"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (

        /* --- SCENARIO B: NO BOOK OPEN YET (SHOW SEARCHABLE LIST OF BOOKS) --- */
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          
          {/* Header & Afghan Keyboard Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{activeTypeObj.icon}</span>
                <span>{activeTypeObj.name} Books</span>
                <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/20 px-2 py-0.5 rounded-md">
                  {searchedBooks.length.toLocaleString()} Books
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Click any book volume to inspect its pages and citizen records:
              </p>
            </div>

            {/* Quick Search */}
            <div className="w-full sm:w-80">
              <SearchWithAfghanKeyboard
                value={bookSearch}
                onChange={(val) => {
                  setBookSearch(val);
                  setBookListPage(1);
                }}
                placeholder="Search book name, district, or year..."
                size="sm"
              />
            </div>
          </div>

          {/* Grid of Books */}
          {typeLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-slate-400 mt-2 font-mono">Loading books...</p>
            </div>
          ) : searchedBooks.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No books found matching this search or province filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pagedBooks.map((b, idx) => (
                <div
                  key={idx}
                  onClick={() => handleBookSelect(b.book_name)}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 group"
                >
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 line-clamp-2 font-persian" dir="rtl">
                      {b.book_name}
                    </h3>
                    
                    {/* Badges: Category, Copy, PMU */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {(() => {
                        const badge = getBookPatternBadge(b.book_name);
                        return (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                      {(b.is_copy || isBookCopy(b.book_name)) && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                          نقل (Copy)
                        </span>
                      )}
                      {(b.is_pmu || isBookPMU(b.book_name)) && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30">
                          ⚡ PMU
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 w-full">
                    <span className="font-medium">{getEnglishProvinceName(b.province || '') || b.province || '—'}</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{b.unique_pages} pages</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{b.records_count.toLocaleString()} records</span>
                    <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 group-hover:underline">
                      Open ➔
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Clean Books Pagination */}
          {searchedBooks.length > pageSize && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="text-slate-500 font-mono">
                Page {bookListPage} of {totalBookPages} ({searchedBooks.length.toLocaleString()} books)
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setBookListPage(p => Math.max(1, p - 1))}
                  disabled={bookListPage <= 1}
                  className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed font-bold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setBookListPage(p => Math.min(totalBookPages, p + 1))}
                  disabled={bookListPage >= totalBookPages}
                  className="px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed font-bold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record Drawer */}
      {inspectRecord && (
        <RecordDrawer
          record={inspectRecord}
          onClose={() => setInspectRecord(null)}
          onViewFamilyTree={onViewFamilyTree}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. OFFICIAL CLASSIFICATION GUIDE & LEGAL DEFINITIONS MODAL                */}
      {/* ========================================================================= */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className={`text-sm sm:text-base font-black text-slate-900 dark:text-white ${guideLang === 'fa' ? 'font-persian' : 'font-sans'}`}>
                    {guideLang === 'en' 
                      ? 'Official Afghan Civil Registration Classification Standards' 
                      : 'راهنمای جامع اداری، حقوقی و بایگانی دفاتر ثبت احوال نفوس'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {guideLang === 'en'
                      ? 'National Statistics and Information Authority (NSIA / ثبت احوال نفوس) Master Archive'
                      : 'معیارهای رسمی طبقه‌بندی اسناد اداره ملی احصائیه و معلومات (NSIA)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Language Toggle */}
                <div className="flex items-center gap-0.5 bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    onClick={() => setGuideLang('en')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      guideLang === 'en'
                        ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setGuideLang('fa')}
                    className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                      guideLang === 'fa'
                        ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    دری
                  </button>
                </div>

                <button
                  onClick={() => setShowGuideModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
              
              {/* Executive Overview Box */}
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-2">
                <h3 className={`font-bold text-blue-900 dark:text-blue-200 text-sm flex items-center gap-1.5 ${guideLang === 'fa' ? 'font-persian' : 'font-sans'}`}>
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>
                    {guideLang === 'en'
                      ? 'Statutory Archival Framework & Administrative Grounding'
                      : 'مبنای طبقه‌بندی اسناد بر اساس قوانین و رویه‌های اداری افغانستان'}
                  </span>
                </h3>
                <p className={`leading-relaxed text-xs ${guideLang === 'fa' ? 'font-persian' : 'font-sans'}`} dir={guideLang === 'fa' ? 'rtl' : 'ltr'}>
                  {guideLang === 'en'
                    ? "In Afghanistan's civil registration system (NSIA), a paper Tazkira (National ID) is not an isolated document; it is a legally certified extract of permanent archival ledgers. All 51,834 physical volumes are classified into 6 primary, mutually exclusive categories based on their authentic institutional functions, printed ledger covers, and statutory definitions under Afghan Civil Law:"
                    : "در سیستم ثبت احوال نفوس افغانستان (اداره ملی احصائیه و معلومات - NSIA)، تذکره کاغذی یک سند مستقل نیست، بلکه رونوشتی رسمی از صفحات دفاتر بایگانی شده است. تمامی ۵۱،۸۳۴ جلد فیزیکی موجود در کشور بر اساس نقش سازمانی و حقوقی آنها به دسته‌بندی‌های زیر تقسیم می‌شوند که دقیقاً بر اساس عناوین چاپی روی جلد و اصطلاحات قانونی درج در متن اسناد تعریف گردیده‌اند:"}
                </p>
              </div>

              {/* Grid of All 6 Categories */}
              <div className="space-y-4">
                {BOOK_TYPES.filter(t => t.id !== 'all').map((t) => (
                  <div key={t.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                        <span className="text-xl">{t.icon}</span>
                        <span className="text-sm">
                          {guideLang === 'en' ? `${t.nameEn} • ${t.name}` : t.name}
                        </span>
                        {guideLang === 'fa' && (
                          <span className="text-xs font-normal text-slate-500 font-mono">({t.nameEn})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          {t.count.toLocaleString()} Volumes ({t.recordsCount.toLocaleString()} Records)
                        </span>
                        <span className="text-[11px] font-mono font-bold text-brand-600 dark:text-brand-400">
                          {((t.count / (data?.total_books || 51834)) * 100).toFixed(1)}% of total
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <strong className={`text-slate-800 dark:text-slate-200 block mb-0.5 ${guideLang === 'fa' ? 'font-persian' : 'font-sans'}`}>
                          {guideLang === 'en' ? 'Official Legal Definition & Purpose:' : 'تعریف قانونی و ماهیت دفتر:'}
                        </strong>
                        <p className={`leading-relaxed text-slate-600 dark:text-slate-300 ${guideLang === 'fa' ? 'font-persian' : 'font-sans'}`} dir={guideLang === 'fa' ? 'rtl' : 'ltr'}>
                          {guideLang === 'en' ? t.definitionEn : t.definition}
                        </p>
                      </div>

                      <div>
                        <strong className={`text-slate-800 dark:text-slate-200 block mb-0.5 ${guideLang === 'fa' ? 'font-persian' : 'font-sans'}`}>
                          {guideLang === 'en' ? 'Why This Name & Category? (Archival Rationale):' : 'چرا این نام و نه نام دیگر؟ (Why this name?):'}
                        </strong>
                        <p className={`leading-relaxed text-slate-600 dark:text-slate-300 ${guideLang === 'fa' ? 'font-persian' : 'font-sans'}`} dir={guideLang === 'fa' ? 'rtl' : 'ltr'}>
                          {guideLang === 'en' ? t.whyThisNameEn : t.whyThisName}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                        <span>🏛️ {guideLang === 'en' ? `Statutory Legal Authority: ${t.legalBasisEn}` : `مبنای حقوقی: ${t.legalBasis}`}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rationale on Naql and PMU */}
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <h4 className={`font-bold text-amber-900 dark:text-amber-200 text-sm ${guideLang === 'fa' ? 'font-persian' : 'font-sans'}`}>
                  {guideLang === 'en'
                    ? "Why are 'Naql' (Official Copies) and 'PMU' (Identity Campaigns) Treated as Step 2 Filters Rather Than Primary Categories?"
                    : "چرا «نقل» و «پی‌ام‌یو (PMU)» به عنوان فیلترهای جداگانه در مرحله ۲ قرار دارند؟"}
                </h4>
                <div className={`leading-relaxed space-y-2 ${guideLang === 'fa' ? 'font-persian' : 'font-sans'}`} dir={guideLang === 'fa' ? 'rtl' : 'ltr'}>
                  {guideLang === 'en' ? (
                    <>
                      <p>
                        <strong>1. «Naql» (نقل) is an Archival Edition Status, NOT a Book Type:</strong> Under Afghan civil registration law, every master Asas ledger was created in triplicate (Original in Kabul Central Archive, Copy 1 in Provincial Directorate, Copy 2 in District Office). A ledger titled <em>"Volume 1 Copy 1 Master Asas"</em> is fundamentally an <strong>Asas</strong> ledger, not a separate genre. Placing Naql as an edition filter in Step 2 allows users to inspect all Asas ledgers or isolate copies with precision, without fragmenting the master ledger count.
                      </p>
                      <p>
                        <strong>2. «PMU» (پی‌ام‌یو) is an Operational Project, NOT a Book Type:</strong> During mobile identity distribution drives funded under the Project Management Unit (PMU), mobile teams completed standard Qalam Andaz or Motafariqa ledgers with an official PMU stamp. Treating PMU as an orthogonal campaign filter in Step 2 preserves category purity while keeping 2,829 Qalam Andaz PMU books and 690 Motafariqa PMU books in their proper archival classifications.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>۱. «نقل» نوع دفتر نیست، بلکه وضعیت نسخه (Edition Status) است:</strong> در سیستم ثبت احوال نفوس، هر دفتر اساس به دستور قانون در ۳ نسخه تهیه می‌شد (اصل در مرکز، نقل اول در ولایت، نقل دوم در ولسوالی). دفتری با نام «جلد اول نقل اصل اساس» ماهیت حقوقی «اساس» دارد نه یک جنس کتاب متفاوت. قراردادن نقل در مرحله ۲ به کاربر اجازه می‌دهد هم کل دفاتر اساس را ببیند و هم در صورت نیاز، فقط نسخه‌های نقل را فیلتر کند.
                      </p>
                      <p>
                        <strong>۲. «پی‌ام‌یو (PMU)» یک کمپاین اجرایی است، نه نوع کتاب:</strong> در جریان کمپاین‌های توزیع تذکره، تیم‌های سیار دفاتر استاندارد قلم‌انداز یا متفرقه را پر می‌کردند و مهر PMU می‌زدند. تفکیک PMU به عنوان فیلتر پروژه‌ای در مرحله ۲، انسجام دسته‌بندی کتاب‌ها را حفظ کرده و ۲،۸۲۹ جلد قلم‌انداز و ۶۹۰ جلد متفرقه PMU را بدون تناقض در جایگاه اصلی خود نگه می‌دارد.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Zero Loss Mathematical Reconciliation */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className={`font-bold text-slate-900 dark:text-white ${guideLang === 'fa' ? 'font-persian' : 'font-sans'}`}>
                  {guideLang === 'en' ? 'Zero-Loss Mathematical Reconciliation Table' : 'جدول تطبیق آماری بدون کسری (Zero Loss Reconciliation)'}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                        <th className="py-1.5 px-2">
                          {guideLang === 'en' ? 'Category Name' : 'دسته‌بندی (Category)'}
                        </th>
                        <th className="py-1.5 px-2 text-right">
                          {guideLang === 'en' ? 'Volumes Count' : 'تعداد جلد (Books)'}
                        </th>
                        <th className="py-1.5 px-2 text-right">
                          {guideLang === 'en' ? 'Citizen Records' : 'تعداد سوابق (Records)'}
                        </th>
                        <th className="py-1.5 px-2 text-right">
                          {guideLang === 'en' ? 'National Share' : 'درصد از کل (Share)'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {BOOK_TYPES.filter(t => t.id !== 'all').map((t) => (
                        <tr key={t.id}>
                          <td className="py-1 px-2 font-bold">
                            {guideLang === 'en' ? `${t.nameEn} • ${t.name}` : t.name}
                          </td>
                          <td className="py-1 px-2 text-right font-bold text-brand-600 dark:text-brand-400">
                            {t.count.toLocaleString()}
                          </td>
                          <td className="py-1 px-2 text-right">
                            {t.recordsCount.toLocaleString()}
                          </td>
                          <td className="py-1 px-2 text-right">
                            {((t.count / (data?.total_books || 51834)) * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-slate-400 dark:border-slate-600 font-bold bg-slate-200/40 dark:bg-slate-800">
                        <td className="py-1.5 px-2">
                          {guideLang === 'en' ? 'Total National Archive (NSIA)' : 'مجموع کل (Total National Archive)'}
                        </td>
                        <td className="py-1.5 px-2 text-right text-brand-600 dark:text-brand-400">
                          {(data?.total_books || 51834).toLocaleString()}
                        </td>
                        <td className="py-1.5 px-2 text-right text-brand-600 dark:text-brand-400">
                          31,164,973
                        </td>
                        <td className="py-1.5 px-2 text-right">100.0%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {guideLang === 'en'
                  ? 'Authority: Civil Registration Law of Afghanistan & Central Digitized Archive of NSIA'
                  : 'مرجع: قانون ثبت احوال نفوس افغانستان و آرشیف ملی دیجیتالی اداره احصائیه (NSIA)'}
              </span>
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {guideLang === 'en' ? 'Close Guide' : 'فهمیدم و بستن (Close)'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
