import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Users,
  MapPin,
  BookOpen,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { OverviewKPIs, GeographicAnalyticsData } from '../../types';
import { ExplainModal } from '../common/ExplainModal';
import { getEnglishProvinceName } from '../../utils/geoTranslation';

export const ExecutiveOverview: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const { toQueryParams, refreshKey, filters, activeFilterCount, clearFilters } = useFilters();
  const { isDark } = useTheme();
  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [geoData, setGeoData] = useState<GeographicAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explainTopic, setExplainTopic] = useState<'gender_semantics' | 'quality_score' | 'solar_hijri' | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = toQueryParams();

    Promise.all([
      api.getOverviewKPIs(params),
      api.getGeographicAnalytics(params)
    ])
      .then(([kpiRes, geoRes]) => {
        setKpis(kpiRes);
        setGeoData(geoRes);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load overview data', err);
        setError('Failed to reach backend API. The service might still be booting or initializing.');
      })
      .finally(() => setLoading(false));
  }, [refreshKey, JSON.stringify(toQueryParams())]);

  if (error && !kpis) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px]">
        <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-6 max-w-md text-center backdrop-blur-md">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-red-200 mb-1">Backend Connection Interrupted</h3>
          <p className="text-xs text-red-300/80 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              const params = toQueryParams();
              Promise.all([
                api.getOverviewKPIs(params),
                api.getGeographicAnalytics(params)
              ])
                .then(([kpiRes, geoRes]) => {
                  setKpis(kpiRes);
                  setGeoData(geoRes);
                  setError(null);
                })
                .catch((err) => {
                  console.error('Retry failed', err);
                  setError('Still unable to connect to backend. Please wait a few seconds and retry.');
                })
                .finally(() => setLoading(false));
            }}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (loading || !kpis) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-mono text-slate-400">Aggregating 31,164,973 registry records...</p>
      </div>
    );
  }

  // Gender Chart Option - Filter out Code -1 (unspecified) cleanly
  const validGenderCounts = (kpis.gender_counts || []).filter(
    (g) => g.value === 0 || g.value === 1
  );

  const genderChartOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: isDark ? '#090d16fa' : '#fffffffa',
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
      formatter: (params: any) => {
        return `<div style="padding: 2px 4px;">
          <div style="font-weight: bold; font-size: 13px; color: ${params.color};">${params.name}</div>
          <div style="font-size: 12px; margin-top: 4px;"><strong>${Number(params.value).toLocaleString()}</strong> records</div>
          <div style="font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; margin-top: 2px;">Share: <strong>${params.percent}%</strong></div>
        </div>`;
      }
    },
    legend: { bottom: '5%', left: 'center', textStyle: { color: isDark ? '#94a3b8' : '#475569', fontSize: 11 } },
    series: [
      {
        name: 'Gender Distribution',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: isDark ? '#020617' : '#ffffff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold', color: isDark ? '#f8fafc' : '#0f172a' } },
        data: validGenderCounts.map((g) => ({
          value: g.count,
          name: g.value === 0 ? 'Male (مرد)' : 'Female (زن)',
          itemStyle: { color: g.value === 0 ? '#0284c7' : '#ec4899' }
        }))
      }
    ]
  };

  // Province Chart Option
  const topProvinces = (geoData?.provinces || []).slice(0, 10);
  const provinceChartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0];
        if (!item) return '';
        return `<strong>${item.name}</strong>: ${item.value.toLocaleString()} records`;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: isDark ? '#1e293b' : '#e2e8f0' } }, axisLabel: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 10 } },
    yAxis: {
      type: 'category',
      data: topProvinces.map((p) => `${getEnglishProvinceName(p.province)} (${p.province})`).reverse(),
      axisLabel: { color: isDark ? '#e2e8f0' : '#1e293b', fontSize: 11 }
    },
    series: [
      {
        type: 'bar',
        data: topProvinces.map((p) => p.count).reverse(),
        itemStyle: {
          color: '#0284c7',
          borderRadius: [0, 4, 4, 0]
        }
      }
    ]
  };


  return (
    <div className="p-6 space-y-6">
      {/* Active Cross-Filter Indicator Banner */}
      {activeFilterCount > 0 && (
        <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500 dark:bg-brand-400 animate-pulse shrink-0"></span>
            <div>
              <div className="text-xs font-bold text-brand-900 dark:text-brand-200 flex items-center gap-2">
                <span>Active Filter Scope Enabled</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-800 dark:text-brand-300 text-[10px] font-mono border border-brand-200 dark:border-brand-500/30">
                  {kpis.total_records.toLocaleString()} Matching Records
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Executive KPIs, volume distributions, and demographic cohorts are actively synchronized with your cross-filters.
              </p>
            </div>
          </div>
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors shrink-0 self-start sm:self-auto font-medium cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Records */}
        <div
          onClick={() => onNavigate('search')}
          className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-md transition-all cursor-pointer group"
          title="Click to search citizen records"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              TOTAL RECORDS
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {kpis.total_records.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">100% Ingestion Verification</p>
            </div>
            <div className="flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 opacity-80 group-hover:opacity-100 transition-opacity">
              <span>Data Explorer</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>

        {/* Geographic Span */}
        <div
          onClick={() => onNavigate('geographic')}
          className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-emerald-400 dark:hover:border-emerald-500/60 hover:shadow-md transition-all cursor-pointer group"
          title="Click to explore 34-Province GIS & Cartography"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              GEOGRAPHY
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {kpis.unique_provinces} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">Provinces</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{kpis.unique_districts} Unique Districts</p>
            </div>
            <div className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity">
              <span>Explore GIS</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>

        {/* Registry Books */}
        <div
          onClick={() => onNavigate('books')}
          className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:shadow-md transition-all cursor-pointer group"
          title="Click to explore Registry Volumes & Page Explorer details"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              REGISTRY VOLUMES
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {kpis.unique_books.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Official Archival Volumes</p>
            </div>
            <div className="flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity">
              <span>View Details</span>
              <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </div>
        </div>
      </div>


      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Geographic Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Top Provinces Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Record density across regional administrative divisions</p>
            </div>
            <button
              onClick={() => onNavigate('geographic')}
              className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <span>Explore Map & Districts</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <ReactECharts option={provinceChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* Gender Breakdown Donut */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Gender Ratio (Male / Female)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Demographic distribution across registry entries</p>
            </div>
            <button
              onClick={() => setExplainTopic('gender_semantics')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="h-64">
            <ReactECharts option={genderChartOption} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>
      </div>


      {/* Explanation Modal */}
      {explainTopic && (
        <ExplainModal
          isOpen={true}
          onClose={() => setExplainTopic(null)}
          title={
            explainTopic === 'gender_semantics'
              ? 'Gender Semantic Mapping Note'
              : explainTopic === 'quality_score'
              ? 'Composite Quality Score Methodology'
              : 'Solar Hijri Calendar Conversion'
          }
          topic={explainTopic}
        />
      )}
    </div>
  );
};
