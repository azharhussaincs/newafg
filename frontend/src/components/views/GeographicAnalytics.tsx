import React, { useEffect, useState, useMemo } from 'react';
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
  Search,
  Building,
  Mountain,
  MapPin,
  ExternalLink,
  X,
  Compass
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

export interface ProvinceGISData {
  id: string;
  name: string;
  nameDari: string;
  capital: string;
  region: 'Central' | 'Northern' | 'Western' | 'Southern' | 'Eastern' | 'Highlands';
  area: string;
  elevation: string;
  districts: string;
  summary: string;
}

export const PROVINCES_DATA: ProvinceGISData[] = [
  { id: "KBL", name: "Kabul", nameDari: "کابل", capital: "Kabul City ★", region: "Central", area: "4,462 km²", elevation: "1,791 m", districts: "15", summary: "Political, cultural, and economic center of Afghanistan, situated in the fertile Kabul River valley." },
  { id: "HRT", name: "Herat", nameDari: "هرات", capital: "Herat City", region: "Western", area: "54,778 km²", elevation: "920 m", districts: "16", summary: "Major historical, cultural, and trade center in western Afghanistan bordering Iran and Turkmenistan." },
  { id: "KDH", name: "Kandahar", nameDari: "کندهار", capital: "Kandahar City", region: "Southern", area: "54,022 km²", elevation: "1,010 m", districts: "18", summary: "Key agricultural, commercial, and historical metropolis of southern Afghanistan along the Arghandab River." },
  { id: "BLK", name: "Balkh", nameDari: "بلخ", capital: "Mazar-i-Sharif", region: "Northern", area: "17,249 km²", elevation: "380 m", districts: "15", summary: "Ancient historic northern hub and trading gateway connecting Central Asian transit routes." },
  { id: "NAN", name: "Nangarhar", nameDari: "ننگرهار", capital: "Jalalabad", region: "Eastern", area: "7,727 km²", elevation: "575 m", districts: "22", summary: "Eastern regional gateway along the Kabul River basin with rich subtropical agriculture." },
  { id: "BDK", name: "Badakhshan", nameDari: "بدخشان", capital: "Faizabad", region: "Northern", area: "44,059 km²", elevation: "1,250 m", districts: "28", summary: "Northeastern mountainous province encompassing the Hindu Kush, Pamir mountains, and Wakhan Corridor." },
  { id: "BAM", name: "Bamyan", nameDari: "بامیان", capital: "Bamyan City", region: "Highlands", area: "14,175 km²", elevation: "2,550 m", districts: "7", summary: "Historic central highlands basin famous for Band-e Amir national lakes and cultural heritage." },
  { id: "HLD", name: "Helmand", nameDari: "هلمند", capital: "Lashkargah", region: "Southern", area: "58,584 km²", elevation: "780 m", districts: "14", summary: "Largest province by land area in Afghanistan, spanning the extensive Helmand River irrigation network." },
  { id: "GZ", name: "Ghazni", nameDari: "غزنی", capital: "Ghazni City", region: "Southern", area: "22,915 km²", elevation: "2,219 m", districts: "19", summary: "Historic high-plateau commercial center situated on the Kabul-Kandahar national highway." },
  { id: "KDZ", name: "Kunduz", nameDari: "کندز", capital: "Kunduz City", region: "Northern", area: "8,040 km²", elevation: "400 m", districts: "7", summary: "Prime northern agricultural hub at the confluence of the Kunduz and Khanabad river systems." },
  { id: "TAK", name: "Takhar", nameDari: "تخار", capital: "Taloqan", region: "Northern", area: "12,333 km²", elevation: "810 m", districts: "17", summary: "Fertile agricultural and mineral-rich province in northeastern Afghanistan bordering Tajikistan." },
  { id: "BAG", name: "Baghlan", nameDari: "بغلان", capital: "Puli Khumri", region: "Northern", area: "18,255 km²", elevation: "650 m", districts: "15", summary: "Vital transit and industrial junction connecting Kabul to the northern provinces via Salang Pass." },
  { id: "SAM", name: "Samangan", nameDari: "سمنگان", capital: "Aybak", region: "Northern", area: "11,218 km²", elevation: "960 m", districts: "7", summary: "Northern province renowned for archaeological landmarks like Takht-e Rustam and coal mining." },
  { id: "JWZ", name: "Jowzjan", nameDari: "جوزجان", capital: "Sheberghan", region: "Northern", area: "11,798 km²", elevation: "350 m", districts: "11", summary: "Northern energy hub containing major natural gas and petroleum reserves." },
  { id: "SAR", name: "Sar-e Pol", nameDari: "سرپل", capital: "Sar-e Pol City", region: "Northern", area: "16,360 km²", elevation: "880 m", districts: "7", summary: "Northern agricultural and mineral province in the northern foothills of the Koh-e Baba range." },
  { id: "FYB", name: "Faryab", nameDari: "فاریاب", capital: "Maymana", region: "Northern", area: "20,293 km²", elevation: "877 m", districts: "14", summary: "Northwestern trade province known for carpets, agriculture, and border crossing at Aqina." },
  { id: "BDG", name: "Badghis", nameDari: "بادغیس", capital: "Qala-e Naw", region: "Western", area: "20,591 km²", elevation: "967 m", districts: "7", summary: "Northwestern province featuring extensive pistachio forests and the Murghab river valley." },
  { id: "GHR", name: "Ghor", nameDari: "غور", capital: "Chaghcharan", region: "Highlands", area: "36,479 km²", elevation: "2,250 m", districts: "10", summary: "High mountain central province along the Harirod river, home of the Minaret of Jam." },
  { id: "DAY", name: "Daikundi", nameDari: "دایکندی", capital: "Nili", region: "Highlands", area: "18,088 km²", elevation: "2,400 m", districts: "9", summary: "Rugged central highlands province with high-altitude almond farming and river canyons." },
  { id: "URZ", name: "Urozgan", nameDari: "اروزگان", capital: "Tarinkot", region: "Southern", area: "12,640 km²", elevation: "1,350 m", districts: "6", summary: "Geographic transition zone between the central mountains and southern river plains." },
  { id: "ZAB", name: "Zabul", nameDari: "زابل", capital: "Qalat", region: "Southern", area: "17,343 km²", elevation: "1,550 m", districts: "11", summary: "Southern province along the Tarnak River on the major ring road corridor." },
  { id: "FRH", name: "Farah", nameDari: "فراه", capital: "Farah City", region: "Western", area: "48,471 km²", elevation: "650 m", districts: "11", summary: "Expansive southwestern province along the Farah River known for greenhouse agriculture." },
  { id: "NMZ", name: "Nimroz", nameDari: "نیمروز", capital: "Zaranj", region: "Western", area: "41,005 km²", elevation: "490 m", districts: "5", summary: "Southwestern desert border province in the Sistan Basin on the border of Iran and Pakistan." },
  { id: "PAR", name: "Parwan", nameDari: "پروان", capital: "Charikar", region: "Central", area: "5,974 km²", elevation: "1,600 m", districts: "10", summary: "Strategic central gateway north of Kabul encompassing the Ghorband valley and Salang approach." },
  { id: "KAP", name: "Kapisa", nameDari: "کاپیسا", capital: "Mahmud-e Raqi", region: "Central", area: "1,842 km²", elevation: "1,450 m", districts: "7", summary: "Compact, densely populated province northeast of Kabul known for grape vineyards." },
  { id: "PAN", name: "Panjshir", nameDari: "پنجشیر", capital: "Bazarak", region: "Central", area: "3,610 km²", elevation: "2,000 m", districts: "7", summary: "Scenic alpine valley along the Panjshir River known for emerald mining." },
  { id: "LAG", name: "Laghman", nameDari: "لغمان", capital: "Mehtarlam", region: "Eastern", area: "3,843 km²", elevation: "772 m", districts: "5", summary: "Eastern valley province watered by the Alingar and Alishing rivers." },
  { id: "KNR", name: "Kunar", nameDari: "کنر", capital: "Asadabad", region: "Eastern", area: "4,942 km²", elevation: "820 m", districts: "15", summary: "Heavily forested mountainous province in eastern Afghanistan along the Kunar River." },
  { id: "NUR", name: "Nuristan", nameDari: "نورستان", capital: "Parun", region: "Eastern", area: "9,225 km²", elevation: "2,600 m", districts: "8", summary: "Dense pine-forested alpine province across southern Hindu Kush slopes." },
  { id: "LOG", name: "Logar", nameDari: "لوگر", capital: "Pul-i-Alam", region: "Central", area: "3,880 km²", elevation: "1,880 m", districts: "7", summary: "Central province south of Kabul containing the vast Mes Aynak copper reserve." },
  { id: "WRD", name: "Wardak", nameDari: "وردک", capital: "Maidan Shahr", region: "Central", area: "9,934 km²", elevation: "2,150 m", districts: "9", summary: "Central highland gateway province renowned for apple orchards and Behsud uplands." },
  { id: "PKT", name: "Paktia", nameDari: "پکتیا", capital: "Gardez", region: "Eastern", area: "6,432 km²", elevation: "2,300 m", districts: "14", summary: "Southeastern highlands province centered around the ancient fortress city of Gardez." },
  { id: "KHS", name: "Khost", nameDari: "خوست", capital: "Khost City", region: "Eastern", area: "4,152 km²", elevation: "1,020 m", districts: "13", summary: "Dynamic southeastern border hub with commercial markets and pine forests." },
  { id: "PKA", name: "Paktika", nameDari: "پکتیکا", capital: "Sharana", region: "Eastern", area: "19,482 km²", elevation: "2,100 m", districts: "19", summary: "Expansive southeastern province featuring rolling hills, river valleys, and pine highlands." }
];

export const GeographicAnalytics: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { toQueryParams, refreshKey, setProvince, setDistrict, setFiltersBatch, filters } = useFilters();
  const [data, setData] = useState<GeographicAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // View Mode: 'matrix_cartography' (Reference 34-Province Geocartography) vs 'analytics_charts' (ECharts Treemap & Matrix)
  const [activeTab, setActiveTab] = useState<'matrix_cartography' | 'analytics_charts'>('matrix_cartography');

  // Matrix Filter Controls
  const [gisSearch, setGisSearch] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedProvinceDossier, setSelectedProvinceDossier] = useState<ProvinceGISData | null>(null);

  // Analytics Presentation Controls
  const [displayMode, setDisplayMode] = useState<DisplayMode>('bilingual');
  const [topCount, setTopCount] = useState<number>(30);
  const [viewMode, setViewMode] = useState<'treemap' | 'list'>('treemap');

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

  const regionsList = ['ALL', 'Central', 'Northern', 'Western', 'Southern', 'Eastern', 'Highlands'];

  const filteredProvinces = useMemo(() => {
    return PROVINCES_DATA.filter(p => {
      const matchRegion = selectedRegion === 'ALL' || p.region === selectedRegion;
      const term = gisSearch.toLowerCase().trim();
      const matchSearch = !term ||
        p.name.toLowerCase().includes(term) ||
        p.nameDari.includes(term) ||
        p.capital.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term);
      return matchRegion && matchSearch;
    });
  }, [gisSearch, selectedRegion]);

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
              <span className="badge-glass badge-cyan">34 PROVINCES &bull; 412 DISTRICTS</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Consolidated spatial intelligence, 34-province GIS dossier matrix, and multi-million civil registration demographics.
            </p>
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
              <div className="flex items-center gap-2">
                <span className="badge-glass badge-gold">&star; KABUL [CAPITAL]</span>
                <span className="badge-glass badge-green">34 PROVINCES ACTIVE</span>
              </div>
            </div>

            {/* Dynamic Interactive National Cartography Viewport */}
            <DynamicAfghanistanMap
              provincesCountData={data?.provinces}
              totalRecords={totalRegistryRecords}
              selectedProvinceId={selectedProvinceDossier?.id}
              onSelectProvince={(prov) => setSelectedProvinceDossier(prov)}
            />

            {/* Quick Province Jump Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
              <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] mr-1">Quick Jump:</span>
              {PROVINCES_DATA.slice(0, 10).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvinceDossier(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    p.id === 'KBL'
                      ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 hover:bg-amber-100 dark:hover:bg-amber-500/30'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5 hover:border-emerald-500/40'
                  }`}
                >
                  {p.id === 'KBL' ? '★ Kabul (Capital)' : p.name}
                </button>
              ))}
            </div>

          </div>

          {/* 34-Province Directory Grid */}
          <div className="glass-card p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">34-Province GIS Directory</span>
                <span className="badge-glass badge-cyan">{filteredProvinces.length} Provinces</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search province, Dari or capital..."
                    value={gisSearch}
                    onChange={(e) => setGisSearch(e.target.value)}
                    className="w-56 bg-slate-50 dark:bg-[#090e1a]/90 border border-slate-200 dark:border-white/10 focus:border-emerald-500 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                  />
                </div>

                <div className="flex bg-slate-100 dark:bg-[#090e1a] p-0.5 rounded-xl border border-slate-200 dark:border-white/10">
                  {regionsList.map(r => (
                    <button
                      key={r}
                      onClick={() => setSelectedRegion(r)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        selectedRegion === r
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Province Card Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredProvinces.map((p) => {
                const isKabul = p.id === 'KBL';
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProvinceDossier(p)}
                    className={`glass-card p-4 rounded-xl border transition-all cursor-pointer hover:translate-y-[-2px] ${
                      isKabul
                        ? 'border-amber-400 dark:border-amber-500/50 bg-amber-50/50 dark:bg-amber-500/[0.04] shadow-md shadow-amber-500/10'
                        : 'border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 bg-white dark:bg-[#0f172a]/70 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
                        {p.id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isKabul
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      }`}>
                        {p.region}
                      </span>
                    </div>

                    <div className="mb-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>{p.name}</span>
                        <span className="font-persian text-xs text-emerald-600 dark:text-emerald-400">{p.nameDari}</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Capital: <strong className="text-slate-800 dark:text-slate-200">{p.capital}</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-1 py-1.5 border-t border-b border-slate-100 dark:border-white/5 text-[10px] font-mono text-center">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[9px]">Districts</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{p.districts}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[9px]">Area</span>
                        <span className="text-slate-800 dark:text-slate-200">{p.area.split(' ')[0]}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 block text-[9px]">Elev</span>
                        <span className="text-cyan-600 dark:text-cyan-400 font-medium">{p.elevation}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {p.summary}
                    </p>
                  </div>
                );
              })}
            </div>

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
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full rounded-2xl border border-slate-200 dark:border-white/15 p-6 space-y-4 shadow-2xl bg-white dark:bg-[#0f172a]">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedProvinceDossier.name} Province Dossier
                </h3>
              </div>
              <button
                onClick={() => setSelectedProvinceDossier(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-[#090e1a]/90 p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Native Script</span>
                <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-persian">{selectedProvinceDossier.nameDari}</strong>
              </div>
              <div className="bg-slate-50 dark:bg-[#090e1a]/90 p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Capital Center</span>
                <strong className="text-slate-900 dark:text-white text-sm">{selectedProvinceDossier.capital}</strong>
              </div>
              <div className="bg-slate-50 dark:bg-[#090e1a]/90 p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Geographic Region</span>
                <strong className="text-cyan-600 dark:text-cyan-400">{selectedProvinceDossier.region} Afghanistan</strong>
              </div>
              <div className="bg-slate-50 dark:bg-[#090e1a]/90 p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Districts Count</span>
                <strong className="text-slate-900 dark:text-white font-mono">{selectedProvinceDossier.districts} Districts</strong>
              </div>
              <div className="bg-slate-50 dark:bg-[#090e1a]/90 p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Surface Land Area</span>
                <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedProvinceDossier.area}</strong>
              </div>
              <div className="bg-slate-50 dark:bg-[#090e1a]/90 p-3 rounded-xl border border-slate-200/80 dark:border-white/10">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Median Elevation</span>
                <strong className="text-amber-600 dark:text-amber-400 font-mono">{selectedProvinceDossier.elevation}</strong>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#090e1a]/90 p-4 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-bold uppercase mb-1">Regional Summary</span>
              {selectedProvinceDossier.summary}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setProvince(selectedProvinceDossier.nameDari);
                  setSelectedProvinceDossier(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Filter Civil Records by {selectedProvinceDossier.name}
              </button>
              <button
                onClick={() => setSelectedProvinceDossier(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold rounded-xl text-xs transition-all cursor-pointer"
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
