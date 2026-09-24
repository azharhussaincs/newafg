import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Keyboard, ArrowRight, User, MapPin, Sparkles, Database, ChevronRight } from 'lucide-react';
import { AfghanVirtualKeyboard } from './AfghanVirtualKeyboard';
import { PROVINCE_EN_MAP, DISTRICT_EN_MAP } from '../../utils/geoTranslation';
import { api } from '../../services/api';
import { SearchScope } from '../../context/FilterContext';

export interface SearchSuggestionItem {
  id?: number | string;
  type: 'citizen' | 'name' | 'geo' | 'province' | 'district';
  title: string;
  subtitle?: string;
  value: string;
  category?: string;
}

interface SearchWithAfghanKeyboardProps {
  value: string;
  onChange: (val: string) => void;
  onSearch?: (val: string) => void;
  onSelectRecordId?: (recordId: number) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  showKeyboardByDefault?: boolean;
  dropdownAlign?: 'left' | 'right' | 'full';
  searchScope?: SearchScope;
}

export const SearchWithAfghanKeyboard: React.FC<SearchWithAfghanKeyboardProps> = ({
  value,
  onChange,
  onSearch,
  onSelectRecordId,
  placeholder = 'جستجو بر اساس نام، ولد، ولایت، شناسنامه... (Search...)',
  className = '',
  inputClassName = '',
  size = 'md',
  showKeyboardByDefault = false,
  dropdownAlign = 'right',
  searchScope,
}) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(showKeyboardByDefault);
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Close suggestions and keyboard when clicking outside container
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSuggestOpen(false);
        setIsKeyboardOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real-time suggestions based on current search input
  useEffect(() => {
    const q = value.trim();
    if (!q || q.length < 1) {
      setSuggestions([]);
      setIsSuggestOpen(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      const results: SearchSuggestionItem[] = [];
      const seen = new Set<string>();

      const scope = searchScope || { name: false, fname: false, gname: false };
      const anyChecked = scope.name || scope.fname || scope.gname;
      const allChecked = scope.name && scope.fname && scope.gname;
      const isTargeted = anyChecked && !allChecked;

      const activeFields: string[] = [];
      if (scope.name) activeFields.push('name');
      if (scope.fname) activeFields.push('fname');
      if (scope.gname) activeFields.push('gname');
      const searchFieldsParam = isTargeted ? activeFields.join(',') : undefined;

      // 1. Instant Client-side Geographic Matching (Only when not targeting specific name fields)
      if (!isTargeted) {
        const qLower = q.toLowerCase();

        // Check Provinces
        for (const [dariProv, enProv] of Object.entries(PROVINCE_EN_MAP)) {
          if (dariProv.includes(q) || enProv.toLowerCase().includes(qLower)) {
            const key = `prov-${dariProv}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                type: 'province',
                title: `ولایت ${dariProv}`,
                subtitle: `${enProv} Province • ولایت افغانستان`,
                value: dariProv,
                category: 'ولایات (Provinces)'
              });
            }
          }
          if (results.length >= 3) break;
        }

        // Check Districts
        for (const [dariDist, enDist] of Object.entries(DISTRICT_EN_MAP)) {
          if (dariDist.includes(q) || enDist.toLowerCase().includes(qLower)) {
            const key = `dist-${dariDist}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                type: 'district',
                title: `ولسوالی ${dariDist}`,
                subtitle: `${enDist} District • ولسوالی`,
                value: dariDist,
                category: 'ولسوالی‌ها (Districts)'
              });
            }
          }
          if (results.length >= 5) break;
        }
      }

      // 2. Query Live Database Citizens via API
      try {
        const dbMatches = await api.searchFamilyPersons(q, searchFieldsParam);
        if (Array.isArray(dbMatches)) {
          // Distinct names completion
          for (const item of dbMatches) {
            let targetNameVal = (item.name || '').trim();
            let label = 'نام شخص (Citizen Name Completion)';
            let cat = 'اسامی اشخاص (Citizen Names)';

            if (scope.fname && !scope.name && !scope.gname) {
              targetNameVal = (item.fname || '').trim();
              label = "نام پدر / ولد (Father's Name)";
              cat = 'نام پدر (Father Names)';
            } else if (scope.gname && !scope.name && !scope.fname) {
              targetNameVal = (item.gname || '').trim();
              label = "نام پدرکلان (Grandfather's Name)";
              cat = 'نام پدرکلان (Grandfather Names)';
            }

            if (targetNameVal && !seen.has(`name-${targetNameVal}`)) {
              seen.add(`name-${targetNameVal}`);
              results.push({
                type: 'name',
                title: targetNameVal,
                subtitle: label,
                value: targetNameVal,
                category: cat
              });
            }
            if (results.filter(r => r.type === 'name').length >= 3) break;
          }

          // Citizen Records with 3-generation lineage
          for (const item of dbMatches) {
            const name = (item.name || '').trim();
            const fname = (item.fname || '').trim();
            const gname = (item.gname || '').trim();
            const prov = item.province || '';
            const dist = item.district || '';

            // Filter out records that don't match targeted criteria
            if (isTargeted) {
              const qTrimmed = q.trim();
              const matchName = scope.name && name.startsWith(qTrimmed);
              const matchFname = scope.fname && fname.startsWith(qTrimmed);
              const matchGname = scope.gname && gname.startsWith(qTrimmed);
              if (!matchName && !matchFname && !matchGname) {
                continue;
              }
            }

            let lineage = name;
            if (fname) lineage += ` ولد ${fname}`;
            if (gname) lineage += ` (ولدیت ${gname})`;

            const subParts: string[] = [];
            if (item.record_number) subParts.push(`شماره ثبت: ${item.record_number}`);
            if (prov) subParts.push(dist ? `${prov} - ${dist}` : prov);
            if (item.dob_year) subParts.push(`${item.dob_year} SH`);

            const key = `citizen-${item.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                id: item.id,
                type: 'citizen',
                title: lineage,
                subtitle: subParts.join(' • '),
                value: name || String(item.id),
                category: 'سوابق مدنی شهروندان (Civil Registry Profiles)'
              });
            }
            if (results.length >= 10) break;
          }
        }
      } catch (err) {
        // Soft fallback
      }

      setSuggestions(results);
      setIsSuggestOpen(results.length > 0);
      setLoadingSuggestions(false);
      setHighlightedIndex(-1);
    }, 120);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [value, JSON.stringify(searchScope)]);

  // Insert character from virtual keyboard
  const handleInsertChar = (char: string) => {
    const input = inputRef.current;
    if (!input) {
      onChange(value + char);
      return;
    }

    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const nextVal = value.substring(0, start) + char + value.substring(end);
    onChange(nextVal);

    // Maintain focus and restore cursor right after inserted character
    setTimeout(() => {
      input.focus();
      const nextPos = start + char.length;
      input.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  // Backspace from virtual keyboard
  const handleBackspace = () => {
    const input = inputRef.current;
    if (!input || value.length === 0) {
      if (value.length > 0) onChange(value.slice(0, -1));
      return;
    }

    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;

    let nextVal = '';
    let nextPos = 0;

    if (start === end) {
      if (start > 0) {
        nextVal = value.substring(0, start - 1) + value.substring(end);
        nextPos = start - 1;
      } else {
        return;
      }
    } else {
      nextVal = value.substring(0, start) + value.substring(end);
      nextPos = start;
    }

    onChange(nextVal);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  // Clear all
  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setIsSuggestOpen(false);
    if (inputRef.current) inputRef.current.focus();
  };

  // Select suggestion
  const handleSelectSuggestion = (item: SearchSuggestionItem) => {
    onChange(item.value);
    setIsSuggestOpen(false);
    if (item.type === 'citizen' && item.id && onSelectRecordId) {
      onSelectRecordId(Number(item.id));
    }
    if (onSearch) {
      onSearch(item.value);
    }
  };

  // Keyboard navigation on input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsSuggestOpen(false);
      setIsKeyboardOpen(false);
      return;
    }

    if (isSuggestOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[highlightedIndex]);
          return;
        }
      }
    }

    if (e.key === 'Enter' && onSearch) {
      e.preventDefault();
      setIsSuggestOpen(false);
      onSearch(value.trim());
    }
  };

  // Size styling
  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs',
    md: 'py-2 px-3.5 text-sm',
    lg: 'py-2.5 px-4 text-base'
  }[size];

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-3 mr-1" />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0 || value.trim().length > 0) setIsSuggestOpen(true);
          }}
          placeholder={placeholder}
          dir="auto"
          className={`flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none min-w-0 font-sans ${sizeClasses} ${inputClassName}`}
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mr-1 cursor-pointer shrink-0"
            title="پاک کردن متن (Clear)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Afghan Virtual Keyboard Toggle Button */}
        <button
          type="button"
          onClick={() => setIsKeyboardOpen(!isKeyboardOpen)}
          className={`p-1.5 mx-1 rounded-lg border transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
            isKeyboardOpen
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700'
          }`}
          title={isKeyboardOpen ? 'بستن کیبورد افغانی (Hide Keyboard)' : 'باز کردن کیبورد دری و پښتو (Afghan Keyboard)'}
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold font-persian hidden sm:inline">
            دری / پښتو
          </span>
        </button>

        {/* Search Submit Action Button */}
        {onSearch && (
          <button
            type="button"
            onClick={() => {
              setIsSuggestOpen(false);
              onSearch(value.trim());
            }}
            className="flex items-center gap-1 px-3 py-1.5 mr-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
            title="جستجو (Search)"
          >
            <span className="hidden sm:inline">جستجو</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Auto-Suggestions Dropdown */}
      {isSuggestOpen && (suggestions.length > 0 || value.trim().length > 0) && (
        <div
          className={`absolute top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in max-h-96 overflow-y-auto custom-scrollbar ${
            dropdownAlign === 'right'
              ? 'right-0 w-[420px] sm:w-[500px] md:w-[560px] max-w-[92vw]'
              : dropdownAlign === 'left'
              ? 'left-0 w-[420px] sm:w-[500px] md:w-[560px] max-w-[92vw]'
              : 'left-0 right-0'
          }`}
          dir="rtl"
        >
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>پیشنهادات هوشمند ({suggestions.length})</span>
              {loadingSuggestions && (
                <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-1 inline-block" />
              )}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              کلید ↑↓ برای حرکت، Enter برای انتخاب
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {suggestions.map((item, idx) => {
              const isSelected = idx === highlightedIndex;
              return (
                <div
                  key={`${item.type}-${item.id || item.value}-${idx}`}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100 border border-emerald-200 dark:border-emerald-500/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        item.type === 'citizen'
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : item.type === 'province' || item.type === 'district'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {item.type === 'citizen' ? (
                        <User className="w-4 h-4" />
                      ) : item.type === 'province' || item.type === 'district' ? (
                        <MapPin className="w-4 h-4" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 text-right">
                      <div className="text-xs sm:text-sm font-bold truncate font-persian">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {item.category?.split('(')[0] || item.type}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-180" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action to search all records */}
          {value.trim() && (
            <div
              onClick={() => {
                setIsSuggestOpen(false);
                setIsKeyboardOpen(false);
                if (onSearch) onSearch(value.trim());
              }}
              className="p-3 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-950/90 dark:hover:bg-emerald-950/40 border-t border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-bold truncate">
                  {(() => {
                    const scope = searchScope || { name: false, fname: false, gname: false };
                    if (scope.name && !scope.fname && !scope.gname) {
                      return `جستجو برای «${value.trim()}» فقط در ستون نام شخص (Name only)`;
                    }
                    if (!scope.name && scope.fname && !scope.gname) {
                      return `جستجو برای «${value.trim()}» فقط در ستون نام پدر (Father only)`;
                    }
                    if (!scope.name && !scope.fname && scope.gname) {
                      return `جستجو برای «${value.trim()}» فقط در ستون نام پدرکلان (Grandfather only)`;
                    }
                    if (scope.name && scope.fname && !scope.gname) {
                      return `جستجو برای «${value.trim()}» در ستون‌های نام و نام پدر`;
                    }
                    if (scope.name && !scope.fname && scope.gname) {
                      return `جستجو برای «${value.trim()}» در ستون‌های نام و پدرکلان`;
                    }
                    if (!scope.name && scope.fname && scope.gname) {
                      return `جستجو برای «${value.trim()}» در ستون‌های پدر و پدرکلان`;
                    }
                    return `جستجوی کامل برای «${value.trim()}» در تمام ۳ ستون (نام، ولد، پدرکلان)`;
                  })()}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 shrink-0">
                Enter ↵
              </span>
            </div>
          )}
        </div>
      )}

      {/* Pop-out Virtual Afghan Keyboard */}
      {isKeyboardOpen && (
        <div
          className={`absolute top-full mt-2 z-50 ${
            dropdownAlign === 'right'
              ? 'right-0 w-[540px] sm:w-[600px] max-w-[94vw]'
              : dropdownAlign === 'left'
              ? 'left-0 w-[540px] sm:w-[600px] max-w-[94vw]'
              : 'left-0 right-0'
          }`}
        >
          <AfghanVirtualKeyboard
            isOpen={isKeyboardOpen}
            onClose={() => setIsKeyboardOpen(false)}
            onInsertChar={handleInsertChar}
            onBackspace={handleBackspace}
            onClear={handleClear}
            onSubmit={onSearch ? () => {
              setIsKeyboardOpen(false);
              setIsSuggestOpen(false);
              onSearch(value.trim());
            } : undefined}
          />
        </div>
      )}
    </div>
  );
};
