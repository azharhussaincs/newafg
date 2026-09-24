import React, { useState } from 'react';
import {
  X, Download, FileText, FileSpreadsheet, Table, Code,
  CheckCircle2, Filter, Sparkles, Check, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { api } from '../../services/api';
import { getEnglishProvinceName, getEnglishDistrictName, getCleanNativeName } from '../../utils/geoTranslation';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'records' | 'summary';
}

const AVAILABLE_COLUMNS = [
  { id: 'name', label: 'Full Name (نام)' },
  { id: 'fname', label: "Father's Name (نام پدر)" },
  { id: 'gname', label: "Grandfather's Name (نام پدر کلان)" },
  { id: 'dob_year', label: 'Birth Year (سال تولد)' },
  { id: 'gender', label: 'Gender (جنسیت)' },
  { id: 'province', label: 'Province (ولایت)' },
  { id: 'district', label: 'District (ولسوالی)' },
  { id: 'book_name', label: 'Registry Book' },
  { id: 'page_number', label: 'Page No' },
  { id: 'record_number', label: 'Record No' }
];

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, defaultTab = 'records' }) => {
  const { filters, toQueryParams, activeFilterCount } = useFilters();
  const [exportType, setExportType] = useState<'records' | 'summary'>(defaultTab);
  const [format, setFormat] = useState<'pdf' | 'xlsx' | 'csv' | 'json'>('xlsx');
  const [limit, setLimit] = useState<number>(1000);
  const [useActiveFilters, setUseActiveFilters] = useState<boolean>(true);
  const [showColumnSelector, setShowColumnSelector] = useState<boolean>(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_COLUMNS.map(c => c.id)
  );
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleColumn = (colId: string) => {
    if (selectedColumns.includes(colId)) {
      if (selectedColumns.length > 1) {
        setSelectedColumns(selectedColumns.filter(id => id !== colId));
      }
    } else {
      setSelectedColumns([...selectedColumns, colId]);
    }
  };

  const selectAllColumns = () => setSelectedColumns(AVAILABLE_COLUMNS.map(c => c.id));
  const selectCoreColumns = () => setSelectedColumns(['name', 'fname', 'dob_year', 'gender', 'province', 'district']);

  const handleDownload = () => {
    setDownloading(true);
    try {
      const queryParams = useActiveFilters ? toQueryParams() : {};
      let downloadUrl = '';

      if (exportType === 'summary') {
        downloadUrl = api.getExecutivePdfReportUrl(queryParams);
      } else {
        downloadUrl = api.getExportUrl(format, queryParams, limit, selectedColumns);
      }

      // Trigger standard browser download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Export download failed', err);
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Enterprise Data Exporter</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-500/20 dark:text-brand-300 dark:border-transparent text-[10px] font-mono">
                  v2.4 Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Export filtered civil registry records or generate official executive intelligence PDF reports
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Active Filter Scope Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Filter className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>EXPORT QUERY SCOPE</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <label className="flex items-center space-x-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                  <input
                    type="radio"
                    name="scopeType"
                    checked={useActiveFilters}
                    onChange={() => setUseActiveFilters(true)}
                    className="accent-brand-600 dark:accent-brand-500 text-xs"
                  />
                  <span>Active Filters ({activeFilterCount})</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-2">
                  <input
                    type="radio"
                    name="scopeType"
                    checked={!useActiveFilters}
                    onChange={() => setUseActiveFilters(false)}
                    className="accent-brand-600 dark:accent-brand-500 text-xs"
                  />
                  <span>Entire Database</span>
                </label>
              </div>
            </div>

            {useActiveFilters && activeFilterCount > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {filters.search_query && (
                  <span className="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-500/40 text-brand-700 dark:text-brand-300 text-xs font-mono">
                    🔍 Search: "{filters.search_query}"
                  </span>
                )}
                {filters.province && (
                  <span className="px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-500/40 text-brand-700 dark:text-brand-300 text-xs">
                    📍 {getEnglishProvinceName(filters.province)} • {filters.province}
                  </span>
                )}
                {filters.district && (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs">
                    🏘️ {getEnglishDistrictName(filters.district, filters.province)}
                  </span>
                )}
                {filters.gender !== undefined && (
                  <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs">
                    ⚧ {filters.gender === 0 ? 'Male (مرد)' : 'Female (زن)'}
                  </span>
                )}
                {(filters.dob_year_min || filters.dob_year_max) && (
                  <span className="px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/40 text-cyan-700 dark:text-cyan-300 text-xs">
                    📅 Year: {filters.dob_year_min || 1250} - {filters.dob_year_max || 1405}
                  </span>
                )}
                {filters.book_name && (
                  <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs truncate max-w-xs">
                    📖 {filters.book_name}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {useActiveFilters
                  ? 'No specific filters active. Exporting cross-section of all 31,164,973 records.'
                  : 'Unfiltered mode active. Exporting full database cross-section.'}
              </p>
            )}
          </div>

          {/* Export Mode Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
              1. CHOOSE EXPORT TYPE
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportType('records')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  exportType === 'records'
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/30 ring-1 ring-brand-500/40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Table className={`w-4 h-4 ${exportType === 'records' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Dataset Records (Rows)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Export individual tabular rows with citizen names, birth year, gender, book, and page.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setExportType('summary')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  exportType === 'summary'
                    ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/30 ring-1 ring-brand-500/40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <FileText className={`w-4 h-4 ${exportType === 'summary' ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Executive Briefing (PDF)</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Generate formal executive briefing report with KPIs, regional distribution & quality scores.
                </p>
              </button>
            </div>
          </div>

          {/* Formats Selection (For Dataset Records) */}
          {exportType === 'records' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                2. SELECT FILE FORMAT
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* Excel (.xlsx) */}
                <button
                  type="button"
                  onClick={() => setFormat('xlsx')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    format === 'xlsx'
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 ring-1 ring-emerald-500/40'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Excel (.xlsx)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Styled headers, auto-fit & audit sheet
                  </p>
                </button>

                {/* PDF Document */}
                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    format === 'pdf'
                      ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 ring-1 ring-rose-500/40'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">PDF (.pdf)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Formal audit table with Afghan calligraphy
                  </p>
                </button>

                {/* Universal CSV */}
                <button
                  type="button"
                  onClick={() => setFormat('csv')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    format === 'csv'
                      ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/30 ring-1 ring-sky-500/40'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Table className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">CSV (.csv)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    UTF-8 BOM encoded, universal compatibility
                  </p>
                </button>

                {/* JSON */}
                <button
                  type="button"
                  onClick={() => setFormat('json')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    format === 'json'
                      ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/30 ring-1 ring-purple-500/40'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <Code className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">JSON (.json)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Machine-readable REST array payload
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Record Limit Selector (For Records) */}
          {exportType === 'records' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  3. RECORD VOLUME LIMIT
                </label>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Selected: {limit.toLocaleString()} rows
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[100, 500, 1000, 5000, 10000, 25000].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setLimit(num)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      limit === num
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {num.toLocaleString()}
                    {num === 1000 && <span className="ml-1 text-[10px] opacity-80">(Recommended)</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Column Customizer (For Records) */}
          {exportType === 'records' && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
              <button
                type="button"
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="w-full p-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <span>Customize Columns ({selectedColumns.length} of {AVAILABLE_COLUMNS.length} selected)</span>
                {showColumnSelector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showColumnSelector && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 space-y-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllColumns}
                      className="px-2 py-1 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={selectCoreColumns}
                      className="px-2 py-1 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      Core Attributes Only
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {AVAILABLE_COLUMNS.map((col) => {
                      const isChecked = selectedColumns.includes(col.id);
                      return (
                        <label
                          key={col.id}
                          className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleColumn(col.id)}
                            className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500/20 bg-white dark:bg-slate-900"
                          />
                          <span className="truncate">{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success Banner */}
          {downloadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Export request initiated successfully! Your download should start immediately.</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {downloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating Export...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>
                  {exportType === 'summary'
                    ? 'Download Executive Briefing (PDF)'
                    : `Download ${format.toUpperCase()} (${limit.toLocaleString()} Rows)`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
