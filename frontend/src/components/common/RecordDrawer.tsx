import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  User,
  MapPin,
  Calendar,
  FileText,
  GitFork,
  Clock,
  Bookmark,
  Hash
} from 'lucide-react';
import { RecordItem } from '../../types';
import { getEnglishProvinceName, getEnglishDistrictName } from '../../utils/geoTranslation';

interface RecordDrawerProps {
  record: RecordItem | null;
  onClose: () => void;
  onViewFamilyTree?: (recordId: number) => void;
}

export const RecordDrawer: React.FC<RecordDrawerProps> = ({ record, onClose, onViewFamilyTree }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!record) return null;

  // Geographic names
  const provEn = getEnglishProvinceName(record.province || undefined);
  const distEn = getEnglishDistrictName(record.district || undefined, record.province || undefined);

  // Date and age calculation
  const getGregorianYear = (shYear: number | null): number | null => {
    if (!shYear || shYear < 1200 || shYear > 1500) return null;
    return shYear + 621;
  };

  const getCalculatedAge = (shYear: number | null): { age: number; cohort: string } | null => {
    if (!shYear || shYear < 1200 || shYear > 1500) return null;
    const currentShYear = 1404; // 2025/2026 CE
    const age = Math.max(0, currentShYear - shYear);
    let cohort = 'Adult';
    if (age < 18) cohort = 'Minor / Child (< 18)';
    else if (age <= 25) cohort = 'Youth (18–25)';
    else if (age <= 49) cohort = 'Prime Working Age (26–49)';
    else if (age <= 64) cohort = 'Mature Adult (50–64)';
    else cohort = 'Senior / Elder (65+)';
    return { age, cohort };
  };

  const gregYear = getGregorianYear(record.dob_year);
  const ageInfo = getCalculatedAge(record.dob_year);

  // Patronymic lineage
  const childPrefixDari = record.gender === 1 ? 'بنت' : 'ولد';
  const childPrefixEn = record.gender === 1 ? 'daughter of' : 'son of';
  const grandPrefixEn = record.gender === 1 ? 'granddaughter of' : 'grandson of';

  const lineageDari = [
    record.name || '',
    record.fname ? `${childPrefixDari} ${record.fname}` : '',
    record.gname ? `ولدیت ${record.gname}` : ''
  ].filter(Boolean).join(' ');

  const lineageEn = [
    record.name || '',
    record.fname ? `${childPrefixEn} ${record.fname}` : '',
    record.gname ? `${grandPrefixEn} ${record.gname}` : ''
  ].filter(Boolean).join(', ');

  // Archival book parser
  const parseBookDetails = (bookName: string | null) => {
    if (!bookName) return null;
    const volMatch = bookName.match(/جلد\s*(\d+)/i);
    const volNumber = volMatch ? volMatch[1] : null;

    const yearMatch = bookName.match(/سال\s*(\d{4})/);
    const regYear = yearMatch ? parseInt(yearMatch[1], 10) : null;
    const regYearCe = regYear ? regYear + 621 : null;

    let ledgerType = 'Official Civil Register (ثبت احوال)';
    let ledgerTag = 'Standard Archive';

    if (bookName.includes('قلم انداز')) {
      ledgerType = 'Preliminary Field Ledger (قلم انداز)';
      ledgerTag = 'Field Survey';
    } else if (bookName.includes('اصل')) {
      ledgerType = 'Primary Permanent Register (اصل)';
      ledgerTag = 'Central Archive';
    }

    return {
      volNumber,
      regYear,
      regYearCe,
      ledgerType,
      ledgerTag
    };
  };

  const bookDetails = parseBookDetails(record.book_name);

  // Copy helpers
  const copyToClipboard = (text: string | number | null, field: string) => {
    if (text === null || text === undefined) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };



  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-950/80 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                record.gender === 1
                  ? 'bg-pink-50 text-pink-600 border-pink-200 shadow-sm dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/25'
                  : 'bg-cyan-50 text-cyan-600 border-cyan-200 shadow-sm dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/25'
              }`}
            >
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                  {provEn} {distEn !== `${provEn} Provincial` ? `• ${distEn}` : ''}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-0.5 truncate">
                <span className="text-brand-700 dark:text-brand-300 font-bold">{record.name || 'نامشخص'}</span>
                {record.fname && (
                  <span className="text-slate-500 dark:text-slate-400 text-sm font-normal">
                    ولد <span className="text-slate-800 dark:text-slate-200 font-semibold">{record.fname}</span>
                  </span>
                )}
                {record.gname && (
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-normal hidden sm:inline">
                    (ولدیت {record.gname})
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onViewFamilyTree && (
              <button
                onClick={() => {
                  onViewFamilyTree(record.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                title="Explore Family Tree & Lineage"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Family Tree</span>
              </button>
            )}


            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">

          {/* 1. Official 3-Generation Patronymic Lineage Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-950 border border-indigo-200 dark:border-indigo-500/20 shadow-sm dark:shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-end mb-2">
              <button
                onClick={() => copyToClipboard(lineageDari, 'lineage')}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                title="Copy full lineage string"
              >
                {copiedField === 'lineage' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Lineage</span>
                  </>
                )}
              </button>
            </div>

            {/* Three-Tier Generation Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-2">
              {/* Person */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-indigo-200 dark:border-indigo-500/30 flex items-center gap-2.5 shadow-xs">
                <div className="w-7 h-7 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Citizen (شخص)</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{record.name || '—'}</div>
                </div>
              </div>

              {/* Father */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-xs">
                <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Father (ولد / پدر)</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{record.fname || '—'}</div>
                </div>
              </div>

              {/* Grandfather */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shadow-xs">
                <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400">Grandfather (ولدیت / پدرکلان)</div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{record.gname || '—'}</div>
                </div>
              </div>
            </div>

            {/* Formal Patronymic Title String */}
            <div className="mt-3 pt-3 border-t border-indigo-200/60 dark:border-indigo-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <div className="text-brand-700 dark:text-brand-300 font-bold text-sm" dir="rtl">
                {lineageDari || 'معلومات هویت ثبت نشده است'}
              </div>
              <div className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                {lineageEn || 'Three-generation civil identity record'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Gender */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Gender (جنسیت)</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                    {record.gender === 0 ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400"></span>
                        <span>Male (مرد)</span>
                      </>
                    ) : record.gender === 1 ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-pink-500 dark:bg-pink-400"></span>
                        <span>Female (زن)</span>
                      </>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">Unspecified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Birth Year with Gregorian & Age Conversion */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-start justify-between">
              <div className="flex items-start space-x-2.5 min-w-0">
                <div className="mt-0.5 p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Birth Year & Estimated Age</div>
                  {record.dob_year ? (
                    <div className="mt-0.5">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                        <span>{record.dob_year} SH</span>
                        <span className="text-slate-500 dark:text-slate-400 font-normal">
                          (~{gregYear} CE / میلادی)
                        </span>
                      </div>
                      {ageInfo && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
                            <Clock className="w-3 h-3" />
                            Approx. {ageInfo.age} years old
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                            • {ageInfo.cohort}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic text-xs mt-0.5 block">Not recorded</span>
                  )}
                </div>
              </div>

              {record.dob_year && (
                <button
                  onClick={() => copyToClipboard(`${record.dob_year} SH (~${gregYear} CE)`, 'dob')}
                  className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                  title="Copy birth year"
                >
                  {copiedField === 'dob' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* 3. Geographic Origin & Administrative Mapping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Province */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-start justify-between">
              <div className="flex items-start space-x-2.5 min-w-0">
                <div className="mt-0.5 p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Province (ولایت)</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1.5">
                    <span>{provEn}</span>
                    <span className="text-xs text-brand-700 dark:text-brand-300 font-bold" dir="rtl">
                      • {record.province || 'نامشخص'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Code: {record.province_code || 'N/A'}
                  </div>
                </div>
              </div>
              {record.province && (
                <button
                  onClick={() => copyToClipboard(`${provEn} (${record.province})`, 'province')}
                  className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                  title="Copy province"
                >
                  {copiedField === 'province' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* District */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-start justify-between">
              <div className="flex items-start space-x-2.5 min-w-0">
                <div className="mt-0.5 p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">District (ولسوالی)</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1.5">
                    <span>{distEn}</span>
                    <span className="text-xs text-brand-700 dark:text-brand-300 font-bold" dir="rtl">
                      • {record.district || 'نامشخص'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Code: {record.district_code || 'N/A'}
                  </div>
                </div>
              </div>
              {record.district && (
                <button
                  onClick={() => copyToClipboard(`${distEn} (${record.district})`, 'district')}
                  className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                  title="Copy district"
                >
                  {copiedField === 'district' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* 4. Archival Ledger & Document Coordinates */}
          <div className="space-y-2.5">
              {/* Registry Book Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                    <div className="mt-0.5 p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 shrink-0">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Registry Book (جلد دفتر ثبت)</span>
                        {bookDetails?.ledgerTag && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
                            {bookDetails.ledgerTag}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-brand-700 dark:text-brand-300 mt-1" dir="rtl">
                        {record.book_name || 'نام جلد ثبت نشده است'}
                      </div>
                    </div>
                  </div>

                  {record.book_name && (
                    <button
                      onClick={() => copyToClipboard(record.book_name, 'book_name')}
                      className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                      title="Copy book name"
                    >
                      {copiedField === 'book_name' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Physical Archive Coordinates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Page Number */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Page Number (صفحه کتاب)</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                        {record.page_number !== null && record.page_number !== undefined ? (
                          `Page ${record.page_number} (صفحه ${record.page_number})`
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {record.page_number && (
                    <button
                      onClick={() => copyToClipboard(record.page_number, 'page_number')}
                      className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      title="Copy page number"
                    >
                      {copiedField === 'page_number' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Record Number */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Record Entry # (شماره ثبت / مسلسل)</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {record.record_number !== null && record.record_number !== undefined ? (
                          <>
                            <span className="text-sm font-bold font-mono text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded-md">
                              Entry #{record.record_number}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-persian">
                              (شماره ثبت: {record.record_number})
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-sm">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {record.record_number && (
                    <button
                      onClick={() => copyToClipboard(record.record_number, 'record_number')}
                      className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                      title="Copy record number"
                    >
                      {copiedField === 'record_number' ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
            <span>
              {record.dob_year
                ? `Citizen: ${record.name || 'Record'} • ${record.dob_year} SH (~${gregYear} CE, ~${ageInfo?.age} yrs)`
                : `Citizen: ${record.name || 'Record'} • Location: ${provEn}`}
            </span>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {onViewFamilyTree && (
              <button
                onClick={() => {
                  onViewFamilyTree(record.id);
                  onClose();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Family Tree</span>
              </button>
            )}


            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
