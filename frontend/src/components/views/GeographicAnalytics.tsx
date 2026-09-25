import React, { useEffect, useState, useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Globe,
  Map,
  LayoutGrid,
  List,
  Languages,
  Check,
  ChevronRight,
  Filter,
  MapPin,
  ExternalLink,
  X,
  Compass,
  Building2,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';
import { api } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { GeographicAnalyticsData } from '../../types';
import { DynamicAfghanistanMap } from '../gis/DynamicAfghanistanMap';
import {
  formatDistrictDisplay,
  getEnglishProvinceName,
  getCleanNativeName,
  formatCompactNumber,
  DisplayMode
} from '../../utils/geoTranslation';

import { ProvinceGISData, PROVINCES_DATA } from '../../data/provincesData';

export const GeographicAnalytics: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { toQueryParams, refreshKey, setProvince, setDistrict, setFiltersBatch, filters } = useFilters();
  const [data, setData] = useState<GeographicAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // View Mode: 'matrix_cartography' (Reference 34-Province Geocartography) vs 'analytics_charts' (ECharts Treemap & Matrix)
  const [activeTab, setActiveTab] = useState<'matrix_cartography' | 'analytics_charts'>('matrix_cartography');

  // Matrix Filter Controls
  const [selectedProvinceDossier, setSelectedProvinceDossier] = useState<ProvinceGISData | null>(null);

  // Analytics Presentation Controls
  const [displayMode, setDisplayMode] = useState<DisplayMode>('bilingual');
  const [topCount, setTopCount] = useState<number>(30);
  const [viewMode, setViewMode] = useState<'treemap' | 'list'>('treemap');

  // District breakdown hover/click state for dossier modal
  const [showDistrictsList, setShowDistrictsList] = useState<boolean>(false);
  const [districtsHovered, setDistrictsHovered] = useState<boolean>(false);
  const isDistrictsVisible = showDistrictsList || districtsHovered;
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDistrictsMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setDistrictsHovered(true);
  };

  const handleDistrictsMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setDistrictsHovered(false);
    }, 280);
  };

  const handleCloseDossier = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setSelectedProvinceDossier(null);
    setShowDistrictsList(false);
    setDistrictsHovered(false);
  };

  const selectedProvinceStat = useMemo(() => {
    if (!selectedProvinceDossier || !data?.provinces) return null;
    return data.provinces.find(p =>
      p.province_code === selectedProvinceDossier.id ||
      p.province === selectedProvinceDossier.nameDari ||
      p.province.toLowerCase() === selectedProvinceDossier.name.toLowerCase() ||
      getEnglishProvinceName(p.province).toLowerCase() === selectedProvinceDossier.name.toLowerCase()
    );
  }, [selectedProvinceDossier, data]);

  // Districts with populations for the selected province (with Capital prominently highlighted)
  const selectedProvinceDistricts = useMemo(() => {
    if (!selectedProvinceDossier || !data?.districts) return [];
    const provDari = selectedProvinceDossier.nameDari;
    const provEn = selectedProvinceDossier.name.toLowerCase();
    const rawCapital = selectedProvinceDossier.capital.replace(/★/g, '').trim();
    const cleanCap = rawCapital.toLowerCase();

    const matched = data.districts.filter(d => {
      const p = (d.province || '').trim();
      return (
        p === provDari ||
        p.toLowerCase() === provEn ||
        getEnglishProvinceName(p).toLowerCase() === provEn ||
        (selectedProvinceDossier.id === 'DAY' && (p === 'دایکوندی' || p === 'دایکندی')) ||
        (selectedProvinceDossier.id === 'URZ' && (p === 'ارزگان' || p === 'اروزگان'))
      );
    });

    const provTotal = matched.reduce((acc, d) => acc + d.count, 0);

    // Map each district with Capital identification
    const mapped = matched.map((d) => {
      const formatted = formatDistrictDisplay(d.district, d.province, displayMode);
      let en = formatDistrictDisplay(d.district, d.province, 'english').primary;
      const native = getCleanNativeName(d.district, d.province);
      const pct = provTotal > 0 ? ((d.count / provTotal) * 100).toFixed(1) : '0';

      const isCapital = Boolean(
        d.district_code === '01' ||
        (d.district && d.district.includes('مرکز')) ||
        (en && en.toLowerCase().includes('center')) ||
        (cleanCap && en && en.toLowerCase().includes(cleanCap))
      );

      if (isCapital) {
        en = `${rawCapital} (Center)`;
      }

      return {
        ...d,
        isCapital,
        capitalName: rawCapital,
        primaryName: isCapital ? `${rawCapital} (Center)` : formatted.primary,
        secondaryName: formatted.secondary,
        enName: en,
        nativeName: native,
        formattedCount: d.count.toLocaleString(),
        provincePct: pct
      };
    });

    // Sort: Capital district at the top, then remaining districts descending by population
    return mapped.sort((a, b) => {
      if (a.isCapital && !b.isCapital) return -1;
      if (!a.isCapital && b.isCapital) return 1;
      return b.count - a.count;
    }).map((d, idx) => ({
      ...d,
      rank: idx + 1
    }));
  }, [selectedProvinceDossier, data?.districts, displayMode]);

  // Auto-select province dossier when filters.province is set
  useEffect(() => {
    if (filters.province) {
      const match = PROVINCES_DATA.find(p =>
        p.name.toLowerCase() === filters.province!.toLowerCase() ||
        p.nameDari === filters.province ||
        getEnglishProvinceName(filters.province!) === p.name
      );
      if (match) {
        setSelectedProvinceDossier(match);
      }
    }
  }, [filters.province]);

  useEffect(() => {
    setLoading(true);
    api.getGeographicAnalytics(toQueryParams())
      .then(setData)
      .catch((err) => console.error('Failed to load geographic data', err))
      .finally(() => setLoading(false));
  }, [refreshKey, JSON.stringify(toQueryParams())]);

  const totalRegistryRecords = useMemo(() => {
    if (!data?.provinces) return 31164973;
    return data.provinces.reduce((acc, p) => acc + p.count, 0);
  }, [data]);

  // ECharts Treemap Palette
  const treemapPalette = useMemo(() => [
    '#0284c7', '#0ea5e9', '#06b6d4', '#0d9488', '#10b981', '#059669',
    '#6366f1', '#4f46e5', '#8b5cf6', '#7c3aed', '#a855f7', '#d946ef',
    '#ec4899', '#e11d48', '#f59e0b', '#d97706', '#3b82f6', '#2563eb'
  ], []);

  // Top 15 Provinces Bar Chart
  const provinceChartOption = useMemo(() => {
    if (!data?.provinces) return {};
    const top15 = data.provinces.slice(0, 15);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: isDark ? '#090d16' : '#ffffff',
        borderColor: isDark ? '#1e293b' : '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
        formatter: (params: any) => {
          const item = params[0];
          if (!item) return '';
          const prov = top15.find(p => p.province === item.name || getEnglishProvinceName(p.province) === item.name);
          const enName = prov ? getEnglishProvinceName(prov.province) : item.name;
          const nativeName = prov ? prov.province : item.name;
          const count = item.value;
          const pct = ((count / totalRegistryRecords) * 100).toFixed(2);
          return `
            <div style="padding: 4px 6px;">
              <div style="font-weight: bold; font-size: 13px; color: ${isDark ? '#38bdf8' : '#0284c7'};">${enName} (${nativeName})</div>
              <div style="font-size: 12px; color: ${isDark ? '#cbd5e1' : '#334155'}; margin-top: 4px;">
                Volume: <strong>${count.toLocaleString()}</strong> records
              </div>
              <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-top: 2px;">
                Share: <strong>${pct}%</strong> of national registry
              </div>
            </div>
          `;
        }
      },
      grid: { left: '3%', right: '5%', bottom: '3%', top: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#f1f5f9' } },
        axisLabel: {
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 10,
          formatter: (v: number) => formatCompactNumber(v)
        }
      },
      yAxis: {
        type: 'category',
        data: top15.map((p) => {
          const en = getEnglishProvinceName(p.province);
          if (displayMode === 'english') return en;
          if (displayMode === 'dari') return p.province;
          return `${en} (${p.province})`;
        }).reverse(),
        axisLabel: {
          color: isDark ? '#e2e8f0' : '#1e293b',
          fontSize: 11,
          fontFamily: displayMode === 'dari' ? 'Vazirmatn' : 'Inter, Vazirmatn'
        }
      },
      series: [
        {
          type: 'bar',
          data: top15.map((p) => p.count).reverse(),
          itemStyle: {
            color: (params: any) => {
              const colors = ['#0ea5e9', '#0284c7', '#38bdf8', '#06b6d4', '#6366f1'];
              return colors[params.dataIndex % colors.length];
            },
            borderRadius: [0, 4, 4, 0]
          }
        }
      ]
    };
  }, [data, displayMode, totalRegistryRecords, isDark]);

  // Processed Districts
  const processedDistricts = useMemo(() => {
    if (!data?.districts) return [];

    return data.districts.slice(0, topCount).map((d, index) => {
      const formatted = formatDistrictDisplay(d.district, d.province, displayMode);
      const enName = formatDistrictDisplay(d.district, d.province, 'english').primary;
      const cleanNative = getCleanNativeName(d.district, d.province);
      const provEn = getEnglishProvinceName(d.province);
      const provNative = (d.province || '').trim();
      const pct = ((d.count / totalRegistryRecords) * 100).toFixed(2);

      return {
        rank: index + 1,
        rawDistrict: d.district,
        rawProvince: d.province,
        name: formatted.primary,
        enName,
        dariName: cleanNative,
        provEn,
        provNative,
        displayLabel: formatted.primary,
        displaySub: formatted.secondary,
        value: d.count,
        formattedCount: formatCompactNumber(d.count),
        exactCount: d.count.toLocaleString(),
        percentage: pct,
        color: treemapPalette[index % treemapPalette.length]
      };
    });
  }, [data, topCount, displayMode, totalRegistryRecords, treemapPalette]);

  // Top Districts Treemap
  const treemapOption = useMemo(() => {
    return {
      tooltip: {
        backgroundColor: isDark ? '#090d16' : '#ffffff',
        borderColor: isDark ? '#1e293b' : '#e2e8f0',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
        formatter: (info: any) => {
          const d = info.data;
          if (!d) return '';
          return `
            <div style="font-family: Inter, Vazirmatn, sans-serif; min-width: 200px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                <span style="background: ${isDark ? 'rgba(14, 165, 233, 0.2)' : 'rgba(14, 165, 233, 0.1)'}; color: ${isDark ? '#38bdf8' : '#0284c7'}; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid ${isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 165, 233, 0.25)'};">
                  RANK #${d.rank}
                </span>
                <span style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'};">${d.provEn} (${d.provNative})</span>
              </div>
              <div style="font-size: 14px; font-weight: 700; color: ${isDark ? '#ffffff' : '#0f172a'}; margin-bottom: 2px;">
                ${d.enName}
              </div>
              <div style="font-size: 12px; color: ${isDark ? '#cbd5e1' : '#475569'}; font-family: Vazirmatn; margin-bottom: 8px;">
                ${d.dariName}
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; border-top: 1px solid ${isDark ? '#1e293b' : '#e2e8f0'}; padding-top: 6px; margin-bottom: 4px;">
                <span style="color: ${isDark ? '#94a3b8' : '#64748b'};">Total Records:</span>
                <span style="font-weight: 700; color: ${isDark ? '#38bdf8' : '#0284c7'}; font-family: monospace;">${d.exactCount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 6px;">
                <span style="color: ${isDark ? '#94a3b8' : '#64748b'};">National Share:</span>
                <span style="font-weight: 600; color: #a855f7;">${d.percentage}%</span>
              </div>
            </div>
          `;
        }
      },
      series: [
        {
          type: 'treemap',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          leafDepth: 1,
          levels: [
            {
              itemStyle: {
                borderColor: isDark ? '#020617' : '#ffffff',
                borderWidth: 2,
                gapWidth: 2
              }
            }
          ],
          label: {
            show: true,
            position: 'insideTopLeft',
            padding: [6, 8, 6, 8],
            formatter: (params: any) => {
              const d = params.data;
              if (!d) return '';

              if (displayMode === 'english') {
                return `{title|${d.enName}}\n{count|${d.formattedCount}}`;
              }
              if (displayMode === 'dari') {
                return `{title|${d.dariName}}\n{count|${d.formattedCount}}`;
              }
              return `{title|${d.enName}}\n{sub|${d.dariName}}\n{count|${d.formattedCount}}`;
            },
            rich: {
              title: { fontSize: 12, fontWeight: 'bold', color: '#ffffff', lineHeight: 16 },
              sub: { fontSize: 10, fontFamily: 'Vazirmatn', color: '#e2e8f0', lineHeight: 14 },
              count: { fontSize: 11, fontWeight: '600', fontFamily: 'monospace', color: '#bae6fd', lineHeight: 16 }
            }
          },
          data: processedDistricts.map((d) => ({
            ...d,
            itemStyle: { color: d.color, borderColor: isDark ? '#020617' : '#ffffff', borderWidth: 2 }
          }))
        }
      ]
    };
  }, [processedDistricts, displayMode, isDark]);

  const handleTreemapClick = (params: any) => {
    if (params?.data?.rawDistrict) {
      if (params.data.rawProvince) {
        setFiltersBatch({
          province: params.data.rawProvince,
          district: params.data.rawDistrict
        });
      } else {
        setDistrict(params.data.rawDistrict);
      }
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-slate-900 dark:text-slate-100">
      
      {/* Header Banner & Mode Switcher */}
      <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                AFGHANISTAN GEOCARTOGRAPHY GIS MATRIX
              </h2>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Cartography vs Analytics */}
        <div className="flex bg-slate-100 dark:bg-[#12192a] p-1 rounded-xl border border-slate-200 dark:border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('matrix_cartography')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'matrix_cartography'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Province</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics_charts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'analytics_charts'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Districts &amp; Demographics</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          TAB 1: 34-PROVINCE GEOCARTOGRAPHY GIS MATRIX & MAP SHOWCASE
          ========================================================= */}
      {activeTab === 'matrix_cartography' && (
        <div className="space-y-6">
          
          {/* Cartography Map Showcase Card */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
            
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="pulse-dot" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  National Cartography Spatial Frame
                </h3>
              </div>
            </div>

            {/* Dynamic Interactive National Cartography Viewport */}
            <DynamicAfghanistanMap
              provincesCountData={data?.provinces}
              totalRecords={totalRegistryRecords}
              selectedProvinceId={selectedProvinceDossier?.id}
              onSelectProvince={(prov) => {
                setSelectedProvinceDossier(prov);
                setShowDistrictsList(false);
                setDistrictsHovered(false);
              }}
            />

          </div>

        </div>
      )}

      {/* =========================================================
          TAB 2: STATISTICAL TREEMAP & DISTRICT INTELLIGENCE
          ========================================================= */}
      {activeTab === 'analytics_charts' && (
        <div className="space-y-6">
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Province Ranking */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
              <div className="mb-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Province Record Volume Ranking</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Top 15 provinces aggregated by civil registry registrations</p>
              </div>
              <div className="h-80">
                <ReactECharts option={provinceChartOption} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

            {/* District Volume Treemap */}
            <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-200/80 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Cities &amp; Districts Distribution</h3>
                    <span className="badge-glass badge-green font-mono">Top {topCount}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Proportional density across Afghanistan's major administrative centers
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {/* Language Selector */}
                  <div className="flex items-center bg-slate-100 dark:bg-[#090e1a] border border-slate-200 dark:border-white/10 rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setDisplayMode('bilingual')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                        displayMode === 'bilingual' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Bilingual
                    </button>
                    <button
                      onClick={() => setDisplayMode('english')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                        displayMode === 'english' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setDisplayMode('dari')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-all font-persian cursor-pointer ${
                        displayMode === 'dari' ? 'bg-emerald-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      دری
                    </button>
                  </div>

                  {/* Count Selector */}
                  <div className="flex items-center bg-slate-100 dark:bg-[#090e1a] border border-slate-200 dark:border-white/10 rounded-lg p-0.5 text-xs font-mono">
                    {[15, 25, 35].map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => setTopCount(cnt)}
                        className={`px-1.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                          topCount === cnt ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-300 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>

                  {/* View Mode */}
                  <div className="flex items-center bg-slate-100 dark:bg-[#090e1a] border border-slate-200 dark:border-white/10 rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setViewMode('treemap')}
                      className={`p-1.5 rounded transition-all cursor-pointer ${
                        viewMode === 'treemap' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded transition-all cursor-pointer ${
                        viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'treemap' ? (
                <div className="h-80 relative">
                  <ReactECharts
                    option={treemapOption}
                    style={{ height: '100%', width: '100%' }}
                    onEvents={{ click: handleTreemapClick }}
                  />
                </div>
              ) : (
                <div className="h-80 overflow-y-auto pr-1 space-y-2">
                  {processedDistricts.map((d) => (
                    <div
                      key={`${d.rawDistrict}-${d.rawProvince}`}
                      onClick={() => {
                        setFiltersBatch({
                          province: d.rawProvince,
                          district: d.rawDistrict
                        });
                      }}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#090e1a]/80 hover:bg-slate-100 dark:hover:bg-[#12192a] border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-7 h-7 rounded-md font-mono text-xs font-bold flex items-center justify-center shrink-0 border"
                          style={{ backgroundColor: `${d.color}20`, borderColor: `${d.color}60`, color: d.color }}
                        >
                          #{d.rank}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="truncate">{d.enName}</span>
                            <span className="text-slate-400 dark:text-slate-500 font-normal">&bull;</span>
                            <span className="text-slate-700 dark:text-slate-300 font-persian truncate">{d.dariName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Province: {d.provEn} ({d.provNative})
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{d.exactCount}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{d.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>💡 Tip: Click any city or tile to filter the entire dashboard by that district</span>
                <span className="font-mono">{processedDistricts.length} Centers</span>
              </div>
            </div>

          </div>

          {/* Province x Gender Contingency Table */}
          {data && (
            <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-white/10">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Province &times; Gender Distribution Matrix</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Cross-tabulation of civil registration records by province and gender
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090e1a]/90 text-slate-600 dark:text-slate-400 font-mono">
                      <th className="py-3 px-4">Province (ولایت)</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4 text-right text-cyan-600 dark:text-cyan-400">Male (مرد)</th>
                      <th className="py-3 px-4 text-right text-pink-600 dark:text-pink-400">Female (زن)</th>
                      <th className="py-3 px-4 text-right">Total Records</th>
                      <th className="py-3 px-4 text-right">Share</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {data.provinces.map((p) => {
                      const matrix = data.province_gender_matrix[p.province] || {};
                      const c0 = matrix['0'] || 0;
                      const c1 = matrix['1'] || 0;
                      const enProv = getEnglishProvinceName(p.province);
                      return (
                        <tr key={p.province} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                            <div className="flex items-center gap-1.5">
                              <span>{enProv}</span>
                              <span className="text-slate-400 dark:text-slate-500 font-normal">&bull;</span>
                              <span className="font-persian text-emerald-600 dark:text-emerald-400">{p.province}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-slate-400">{p.province_code}</td>
                          <td className="py-2.5 px-4 text-right font-mono text-cyan-600 dark:text-cyan-400 font-medium">
                            {c0.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-pink-600 dark:text-pink-400 font-medium">
                            {c1.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-900 dark:text-white font-bold">
                            {p.count.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                            {p.percentage}%
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button
                              onClick={() => setProvince(p.province)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-emerald-600 text-slate-700 dark:text-slate-300 hover:text-white text-[11px] transition-all cursor-pointer"
                            >
                              Filter
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Provincial Dossier Modal */}
      {selectedProvinceDossier && (
        <div
          onClick={handleCloseDossier}
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card max-w-xl md:max-w-2xl w-full rounded-2xl border border-slate-200 dark:border-white/15 p-6 space-y-4 shadow-2xl bg-white dark:bg-[#0f172a] cursor-default max-h-[92vh] overflow-y-auto transition-all"
          >
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedProvinceDossier.name} Province Dossier
                </h3>
              </div>
              <button
                onClick={handleCloseDossier}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Total Population */}
              <div className="bg-slate-50 dark:bg-[#090e1a]/90 p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">Total Population</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-mono font-bold block mt-0.5">
                  {selectedProvinceStat?.count ? Number(selectedProvinceStat.count).toLocaleString() : 'N/A'}
                </strong>
                {selectedProvinceStat?.percentage ? (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {Number(selectedProvinceStat.percentage).toFixed(2)}% of national
                  </span>
                ) : null}
              </div>

              {/* Province Capital */}
              <div className="bg-slate-50 dark:bg-[#090e1a]/90 p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">Province Capital</span>
                <strong className="text-amber-600 dark:text-amber-400 text-sm block mt-0.5 font-bold">★ {selectedProvinceDossier.capital}</strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Capital center</span>
              </div>

              {/* Total Land */}
              <div className="bg-slate-50 dark:bg-[#090e1a]/90 p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">Total Land</span>
                <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm block mt-0.5">{selectedProvinceDossier.area}</strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Surface area</span>
              </div>

              {/* Total Districts - Interactive on Hover or Click */}
              <div
                onMouseEnter={handleDistrictsMouseEnter}
                onMouseLeave={handleDistrictsMouseLeave}
                onClick={() => setShowDistrictsList((prev) => !prev)}
                className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                  isDistrictsVisible
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#090e1a]/90 border-slate-200/80 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-sm'
                }`}
                title="Hover or click to view all districts with population"
              >
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">Total Districts</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5 group-hover:underline">
                    {showDistrictsList ? (
                      <><span>Pinned</span><ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <><span>View List</span><ChevronDown className="w-3 h-3" /></>
                    )}
                  </span>
                </div>
                <strong className="text-blue-600 dark:text-blue-400 font-mono text-sm block mt-0.5">
                  {selectedProvinceDossier.districts} Districts
                </strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span>Hover or click for breakdown</span>
                </span>
              </div>

              {/* Native Name */}
              <div className="bg-slate-50 dark:bg-[#090e1a]/90 p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">Native Name</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-persian block mt-0.5">{selectedProvinceDossier.nameDari}</strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Code: {selectedProvinceDossier.id}</span>
              </div>

              {/* Geographic Region */}
              <div className="bg-slate-50 dark:bg-[#090e1a]/90 p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">Geographic Region</span>
                <strong className="text-cyan-600 dark:text-cyan-400 text-sm block mt-0.5">{selectedProvinceDossier.region}</strong>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Afghanistan</span>
              </div>
            </div>

            {/* Expandable Districts & Populations Breakdown */}
            {isDistrictsVisible && (
              <div
                onMouseEnter={handleDistrictsMouseEnter}
                onMouseLeave={handleDistrictsMouseLeave}
                className="bg-slate-50 dark:bg-[#090e1a] rounded-xl border border-blue-200 dark:border-blue-500/30 p-4 space-y-3 shadow-lg animate-fadeIn"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{selectedProvinceDossier.name} Districts</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-semibold">
                          {selectedProvinceDistricts.length} Districts Available
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Official registered civil registry population per district &bull; Capital highlighted with ★
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                      setShowDistrictsList(false);
                      setDistrictsHovered(false);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                    title="Close district list"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrollable District Items */}
                <div className="max-h-64 overflow-y-auto pr-1 space-y-1.5">
                  {selectedProvinceDistricts.length > 0 ? (
                    selectedProvinceDistricts.map((dist) => (
                      <div
                        key={dist.district}
                        className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                          dist.isCapital
                            ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-400 dark:border-amber-500/50 shadow-sm ring-1 ring-amber-400/30'
                            : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-white/5 hover:border-blue-300 dark:hover:border-blue-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-5 h-5 rounded font-mono text-[10px] flex items-center justify-center shrink-0 font-bold ${
                            dist.isCapital
                              ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                          }`}>
                            {dist.isCapital ? '★' : `#${dist.rank}`}
                          </span>
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                              <span className={dist.isCapital ? 'text-amber-700 dark:text-amber-300 font-extrabold' : ''}>
                                {dist.enName}
                              </span>
                              <span className="text-slate-400 font-normal">&bull;</span>
                              <span className="font-persian text-emerald-600 dark:text-emerald-400 font-normal">
                                {dist.nativeName}
                              </span>
                              {dist.isCapital && (
                                <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-current" />
                                  <span>Province Capital</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                              <span>Code: {dist.district_code || '01'}</span>
                              {dist.isCapital && (
                                <>
                                  <span>&bull;</span>
                                  <span className="text-amber-600 dark:text-amber-400 font-sans font-medium">
                                    Official Capital of {selectedProvinceDossier.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <strong className={`text-xs font-mono font-bold block ${
                            dist.isCapital ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {dist.formattedCount} records
                          </strong>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {dist.provincePct}% of province
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                      No district breakdown records found for this province.
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-[#090e1a]/90 p-4 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold uppercase mb-1">Regional Summary</span>
              {selectedProvinceDossier.summary}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCloseDossier}
                className="px-5 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
