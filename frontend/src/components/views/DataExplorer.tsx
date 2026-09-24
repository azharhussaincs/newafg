import React, { useState, useEffect } from 'react';
import {
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Download,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { api } from '../../services/api';
import { RecordItem, PaginatedRecords } from '../../types';
import { useFilters } from '../../context/FilterContext';
import { ExportModal } from '../common/ExportModal';

interface DataExplorerProps {
  onSelectRecord: (record: RecordItem) => void;
}

export const DataExplorer: React.FC<DataExplorerProps> = ({ onSelectRecord }) => {
  const { toQueryParams, refreshKey, filters, setSearchQuery, searchScope } = useFilters();
  const [data, setData] = useState<PaginatedRecords | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showColSettings, setShowColSettings] = useState(false);

  // User-facing civil registry columns visibility state
  const [colVisibility, setColVisibility] = useState({
    name: true,
    fname: true,
    gname: true,
    dob_year: true,
    gender: true,
    province: true,
    district: true,
    province_code: true,
    district_code: false,
    record_number: true,
    page_number: true,
    book_name: true
  });

  const columns = [
    { key: 'name', label: 'Name (نام)', rtl: true },
    { key: 'fname', label: "Father's Name (ولد)", rtl: true },
    { key: 'gname', label: "Grandfather (نام پدرکلان)", rtl: true },
    { key: 'dob_year', label: 'DoB Year (SH)', numeric: true },
    { key: 'gender', label: 'Gender (جنسیت)' },
    { key: 'province', label: 'Province (ولایت)', rtl: true },
    { key: 'district', label: 'District (ولسوالی)', rtl: true },
    { key: 'province_code', label: 'Prov Code' },
    { key: 'district_code', label: 'Dist Code' },
    { key: 'record_number', label: 'Record #', numeric: true },
    { key: 'page_number', label: 'Page #', numeric: true },
    { key: 'book_name', label: 'Registry Book (جلد)', rtl: true }
  ];

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.getRecords({
        ...toQueryParams(),
        page,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setData(res);
    } catch (err) {
      console.error('Failed to fetch records', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 whenever global filters or search query change
  useEffect(() => {
    setPage(1);
  }, [refreshKey, JSON.stringify(toQueryParams())]);

  useEffect(() => {
    fetchRecords();
  }, [page, pageSize, sortBy, sortOrder, refreshKey, JSON.stringify(toQueryParams())]);

  const handleSort = (colKey: string) => {
    if (sortBy === colKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(colKey);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const toggleColumn = (key: string) => {
    setColVisibility(prev => ({ ...prev, [key]: !(prev as any)[key] }));
  };

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf' | 'json') => {
    const url = api.getExportUrl(format, toQueryParams(), 1000);
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <TableIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Enterprise Data Explorer</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paginated database browsing with dynamic sort, filter reactivity, and column controls
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Columns Visibility Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowColSettings(!showColSettings)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Visible Columns</span>
            </button>

            {showColSettings && (
              <div className="absolute right-0 mt-2 w-56 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-30 space-y-1">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 py-1 border-b border-slate-200 dark:border-slate-800">
                  TOGGLE COLUMNS
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                  {columns.map((c) => (
                    <label
                      key={c.key}
                      className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer text-xs text-slate-700 dark:text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={(colVisibility as any)[c.key]}
                        onChange={() => toggleColumn(c.key)}
                        className="rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500/20 bg-white dark:bg-slate-950"
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Exports & Modal Opener */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => handleExport('xlsx')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
              title="Quick export to Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title="Quick export to PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
              title="Quick export to CSV (UTF-8 BOM)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors cursor-pointer border-l border-slate-300 dark:border-slate-800 pl-2"
              title="Open full export center with custom limits and columns"
            >
              <span>More...</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Search Query Notification Banner */}
      {filters.search_query && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fade-in">
          <div className="flex items-center space-x-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2 flex-wrap">
                <span>فیلتر سرتاسری پایگاه داده برای:</span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-300 dark:border-emerald-500/40">
                  "{filters.search_query}"
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[11px] font-bold border border-emerald-300 dark:border-emerald-700/60">
                  {(() => {
                    const scope = searchScope || { name: false, fname: false, gname: false };
                    if (scope.name && !scope.fname && !scope.gname) return "محدود به: فقط ستون نام شخص (Name Only)";
                    if (!scope.name && scope.fname && !scope.gname) return "محدود به: فقط ستون نام پدر / ولد (Father Only)";
                    if (!scope.name && !scope.fname && scope.gname) return "محدود به: فقط ستون نام پدرکلان (Grandfather Only)";
                    if (scope.name && scope.fname && !scope.gname) return "محدود به: نام شخص و نام پدر (Name & Father)";
                    if (scope.name && !scope.fname && scope.gname) return "محدود به: نام شخص و نام پدرکلان (Name & Grandfather)";
                    if (!scope.name && scope.fname && scope.gname) return "محدود به: نام پدر و نام پدرکلان (Father & Grandfather)";
                    return "محدود به: تمام ۳ ستون (نام، ولد، پدرکلان)";
                  })()}
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  ({data?.total_records.toLocaleString() || 0} مورد یافت شد)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                {(() => {
                  const scope = searchScope || { name: false, fname: false, gname: false };
                  if (scope.name && !scope.fname && !scope.gname) return "نتایج منحصراً شامل اشخاصی است که نام خود شخص با عبارت جستجو مطابقت دارد.";
                  if (!scope.name && scope.fname && !scope.gname) return "نتایج منحصراً شامل اشخاصی است که نام پدر (ولد) با عبارت جستجو مطابقت دارد.";
                  if (!scope.name && !scope.fname && scope.gname) return "نتایج منحصراً شامل اشخاصی است که نام پدرکلان با عبارت جستجو مطابقت دارد.";
                  return "نتایج بر اساس ۳ ستون هویتی (نام شخص، نام پدر و نام پدرکلان). برای باز کردن پرونده کامل روی سطر کلیک نمایید.";
                })()}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSearchQuery(undefined)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-medium cursor-pointer transition-colors shrink-0 font-persian"
          >
            پاک کردن جستجو ✕
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 select-none">
                <th className="py-3 px-3 font-semibold text-slate-500 dark:text-slate-400 w-12 text-center">#</th>
                {columns.map((col) => {
                  if (!(colVisibility as any)[col.key]) return null;
                  const isSorted = sortBy === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{col.label}</span>
                        {isSorted ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-brand-500" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-brand-500" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-600 opacity-40 hover:opacity-100" />
                        )}
                      </div>
                    </th>
                  );
                })}
                <th className="py-3 px-3 font-semibold text-slate-500 dark:text-slate-400 text-right w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={14} className="py-16 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Streaming server records...</span>
                  </td>
                </tr>
              ) : data?.records.length ? (
                data.records.map((rec, idx) => (
                  <tr
                    key={rec.id}
                    onClick={() => onSelectRecord(rec)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 dark:text-slate-500 text-center">
                      {(page - 1) * pageSize + idx + 1}
                    </td>

                    {colVisibility.name && (
                      <td className="py-2.5 px-3 font-persian font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {rec.name || '—'}
                      </td>
                    )}
                    {colVisibility.fname && (
                      <td className="py-2.5 px-3 font-persian text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {rec.fname || '—'}
                      </td>
                    )}
                    {colVisibility.gname && (
                      <td className="py-2.5 px-3 font-persian text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {rec.gname || '—'}
                      </td>
                    )}
                    {colVisibility.dob_year && (
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {rec.dob_year || '—'}
                      </td>
                    )}
                    {colVisibility.gender && (
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          rec.gender === 0
                            ? 'bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-300'
                            : rec.gender === 1
                            ? 'bg-pink-50 dark:bg-pink-950/70 border border-pink-200 dark:border-pink-500/30 text-pink-700 dark:text-pink-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {rec.gender === 0 ? 'Male (مرد)' : rec.gender === 1 ? 'Female (زن)' : '—'}
                        </span>
                      </td>
                    )}
                    {colVisibility.province && (
                      <td className="py-2.5 px-3 font-persian text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {rec.province || '—'}
                      </td>
                    )}
                    {colVisibility.district && (
                      <td className="py-2.5 px-3 font-persian text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {rec.district || '—'}
                      </td>
                    )}
                    {colVisibility.province_code && (
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {rec.province_code || '—'}
                      </td>
                    )}
                    {colVisibility.district_code && (
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {rec.district_code || '—'}
                      </td>
                    )}
                    {colVisibility.record_number && (
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {rec.record_number || '—'}
                      </td>
                    )}
                    {colVisibility.page_number && (
                      <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {rec.page_number || '—'}
                      </td>
                    )}
                    {colVisibility.book_name && (
                      <td className="py-2.5 px-3 font-persian text-slate-600 dark:text-slate-400 truncate max-w-xs">
                        {rec.book_name || '—'}
                      </td>
                    )}

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRecord(rec);
                        }}
                        className="p-1 rounded bg-slate-100 group-hover:bg-brand-600 dark:bg-slate-800 dark:group-hover:bg-brand-600 text-slate-500 group-hover:text-white dark:text-slate-400 dark:group-hover:text-white transition-all cursor-pointer"
                        title="View Record Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No matching records found for active filter criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Showing</span>
              <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">
                {((page - 1) * pageSize + 1).toLocaleString()}
              </span>
              <span>to</span>
              <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">
                {Math.min(page * pageSize, data.total_records).toLocaleString()}
              </span>
              <span>of</span>
              <span className="font-mono text-slate-900 dark:text-slate-200 font-bold">
                {data.total_records.toLocaleString()}
              </span>
              <span>entries</span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Page Nav Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-3 py-1 text-xs font-mono text-slate-800 dark:text-slate-300 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded">
                  {page} / {data.total_pages.toLocaleString()}
                </span>

                <button
                  onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                  disabled={page >= data.total_pages}
                  className="p-1.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage(data.total_pages)}
                  disabled={page >= data.total_pages}
                  className="p-1.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Universal Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
};
