import React, { useMemo, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  MapPin,
  Flame,
  Info,
  Building,
  Image as ImageIcon
} from 'lucide-react';
import afghanistanGeoJSON from './afghanistanMapGeo.json';
import { ProvinceGISData, PROVINCES_DATA } from '../views/GeographicAnalytics';
import { getEnglishProvinceName } from '../../utils/geoTranslation';
import { useTheme } from '../../context/ThemeContext';

// Register Afghanistan GeoJSON in ECharts once
if (!echarts.getMap('afghanistan')) {
  echarts.registerMap('afghanistan', afghanistanGeoJSON as any);
}

// 34 Provincial Capitals [longitude, latitude] coordinates
const CAPITALS_GEO: Record<string, { capital: string; coord: [number, number]; isCapital?: boolean }> = {
  KBL: { capital: 'Kabul City ★ [Capital]', coord: [69.2075, 34.5553], isCapital: true },
  HRT: { capital: 'Herat City', coord: [62.204, 34.3529] },
  KDH: { capital: 'Kandahar City', coord: [65.7372, 31.6289] },
  BLK: { capital: 'Mazar-i-Sharif', coord: [67.1123, 36.7061] },
  NAN: { capital: 'Jalalabad', coord: [70.4586, 34.4254] },
  BDK: { capital: 'Faizabad', coord: [70.58, 37.1166] },
  BAM: { capital: 'Bamyan City', coord: [67.8212, 34.81] },
  HLD: { capital: 'Lashkargah', coord: [64.3716, 31.5938] },
  GZ:  { capital: 'Ghazni City', coord: [68.4174, 33.5451] },
  KDZ: { capital: 'Kunduz City', coord: [68.8681, 36.7286] },
  TAK: { capital: 'Taloqan', coord: [69.5345, 36.7361] },
  BAG: { capital: 'Puli Khumri', coord: [68.7083, 35.9446] },
  SAM: { capital: 'Aybak', coord: [68.015, 36.2647] },
  JWZ: { capital: 'Sheberghan', coord: [65.7529, 36.6676] },
  SAR: { capital: 'Sar-e Pol City', coord: [65.9325, 36.2154] },
  FYB: { capital: 'Maymana', coord: [64.7836, 35.9214] },
  BDG: { capital: 'Qala-e Naw', coord: [63.1289, 34.9874] },
  GHR: { capital: 'Chaghcharan', coord: [65.2509, 34.5261] },
  DAY: { capital: 'Nili', coord: [66.1302, 33.7218] },
  URZ: { capital: 'Tarinkot', coord: [65.8767, 32.6268] },
  ZAB: { capital: 'Qalat', coord: [66.9083, 32.1058] },
  FRH: { capital: 'Farah City', coord: [62.1164, 32.3745] },
  NMZ: { capital: 'Zaranj', coord: [61.8604, 30.9603] },
  PAR: { capital: 'Charikar', coord: [69.1714, 35.0136] },
  KAP: { capital: 'Mahmud-e Raqi', coord: [69.3344, 35.0164] },
  PAN: { capital: 'Bazarak', coord: [69.5152, 35.3129] },
  LAG: { capital: 'Mehtarlam', coord: [70.2078, 34.6542] },
  KNR: { capital: 'Asadabad', coord: [71.147, 34.8741] },
  NUR: { capital: 'Parun', coord: [70.9225, 35.4206] },
  LOG: { capital: 'Pul-i-Alam', coord: [69.0227, 33.9953] },
  WRD: { capital: 'Maidan Shahr', coord: [68.8662, 34.3956] },
  PKT: { capital: 'Gardez', coord: [69.2259, 33.5975] },
  KHS: { capital: 'Khost City', coord: [69.9204, 33.3395] },
  PAK: { capital: 'Sharana', coord: [68.7842, 33.1277] }
};

// 6 Geographic Regions Color Schema
const REGION_COLORS: Record<string, string> = {
  Central: '#10b981',
  Northern: '#0284c7',
  Western: '#f59e0b',
  Southern: '#ef4444',
  Eastern: '#8b5cf6',
  Highlands: '#06b6d4'
};

interface DynamicAfghanistanMapProps {
  provincesCountData?: Array<{ province: string; count: number; percentage: number }>;
  totalRecords?: number;
  selectedProvinceId?: string | null;
  onSelectProvince: (province: ProvinceGISData) => void;
}

export const DynamicAfghanistanMap: React.FC<DynamicAfghanistanMapProps> = ({
  provincesCountData = [],
  totalRecords = 31164973,
  selectedProvinceId,
  onSelectProvince
}) => {
  const { isDark } = useTheme();
  const echartsRef = useRef<any>(null);
  const [mapMode, setMapMode] = useState<'choropleth' | 'regional' | 'capitals' | 'archival'>('choropleth');
  const [hoveredProvince, setHoveredProvince] = useState<ProvinceGISData | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(1.2);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Map province counts by English name and 3-letter ID
  const countLookup = useMemo(() => {
    const map = new Map<string, { count: number; percentage: number }>();
    provincesCountData.forEach((p) => {
      const en = getEnglishProvinceName(p.province);
      map.set(en.toLowerCase(), { count: p.count, percentage: p.percentage });
      map.set(p.province, { count: p.count, percentage: p.percentage });
    });
    return map;
  }, [provincesCountData]);

  // Merge spatial metadata with live records
  const provinceMapData = useMemo(() => {
    return PROVINCES_DATA.map((p) => {
      const stat = countLookup.get(p.name.toLowerCase()) || countLookup.get(p.nameDari) || {
        count: Math.round(totalRecords / 34),
        percentage: 100 / 34
      };
      return {
        id: p.id,
        name: p.name,
        value: stat.count,
        percentage: stat.percentage,
        gis: p
      };
    });
  }, [countLookup, totalRecords]);

  // Max value for choropleth scaling
  const maxRecordCount = useMemo(() => {
    const max = Math.max(...provinceMapData.map((d) => d.value), 100000);
    return max;
  }, [provinceMapData]);

  // Generate ECharts Options
  const chartOption = useMemo(() => {
    if (mapMode === 'archival') return null;

    // Capital pins scatter data
    const scatterData = PROVINCES_DATA.map((p) => {
      const cap = CAPITALS_GEO[p.id];
      if (!cap) return null;
      const stat = countLookup.get(p.name.toLowerCase());
      return {
        name: `${p.capital} (${p.name})`,
        value: [cap.coord[0], cap.coord[1], stat?.count || 0],
        provinceId: p.id,
        gis: p,
        itemStyle: {
          color: p.id === 'KBL' ? '#fbbf24' : '#38bdf8',
          shadowBlur: p.id === 'KBL' ? 15 : 6,
          shadowColor: p.id === 'KBL' ? 'rgba(251, 191, 36, 0.8)' : 'rgba(56, 189, 248, 0.6)'
        }
      };
    }).filter(Boolean);

    // Kabul Ripple Beacon
    const kabulCoord = CAPITALS_GEO['KBL']?.coord || [69.2075, 34.5553];
    const kabulScatter = [
      {
        name: 'Kabul ★ National Capital',
        value: [kabulCoord[0], kabulCoord[1], countLookup.get('kabul')?.count || 1723719],
        provinceId: 'KBL',
        gis: PROVINCES_DATA.find((p) => p.id === 'KBL')
      }
    ];

    // Data for Map Series
    const mapDataSeries = provinceMapData.map((item) => {
      const isSelected = selectedProvinceId === item.id;
      let areaColor = '#0b1329';
      if (mapMode === 'regional') {
        areaColor = REGION_COLORS[item.gis.region] || '#0284c7';
      }

      return {
        name: item.name,
        value: item.value,
        id: item.id,
        percentage: item.percentage,
        gis: item.gis,
        selected: isSelected,
        itemStyle: mapMode === 'regional' ? {
          areaColor: areaColor,
          opacity: 0.85,
          borderColor: '#1e293b',
          borderWidth: 1.2
        } : isSelected ? {
          areaColor: '#059669',
          borderColor: '#34d399',
          borderWidth: 2.5,
          shadowColor: 'rgba(52, 211, 153, 0.8)',
          shadowBlur: 15
        } : undefined
      };
    });

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? '#090d16fa' : '#fffffffa',
        borderColor: isDark ? '#1e2d4d' : '#cbd5e1',
        borderWidth: 1.5,
        padding: [12, 14],
        textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
        extraCssText: isDark
          ? 'box-shadow: 0 10px 25px -5px rgba(0,0,0,0.8), 0 0 15px rgba(16,185,129,0.2); border-radius: 12px; backdrop-filter: blur(12px);'
          : 'box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15), 0 0 15px rgba(16,185,129,0.15); border-radius: 12px; backdrop-filter: blur(12px);',
        formatter: (params: any) => {
          const gis = params.data?.gis as ProvinceGISData;
          if (!gis) return params.name;

          const recCount = params.data?.value ? (typeof params.data.value === 'number' ? params.data.value : params.data.value[2]) : 0;
          const recFormatted = recCount ? Number(recCount).toLocaleString() : 'N/A';
          const pct = params.data?.percentage ? Number(params.data.percentage).toFixed(2) : '0';

          return `
            <div style="min-width: 220px; font-family: ui-sans-serif, system-ui, sans-serif;">
              <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}; padding-bottom: 6px; margin-bottom: 8px;">
                <div>
                  <span style="font-size: 14px; font-weight: 800; color: ${isDark ? '#ffffff' : '#0f172a'};">${gis.name}</span>
                  <span style="font-size: 13px; font-weight: 700; color: ${isDark ? '#34d399' : '#059669'}; margin-left: 6px;">${gis.nameDari}</span>
                </div>
                <span style="background: ${isDark ? 'rgba(16,185,129,0.2)' : '#dcfce7'}; color: ${isDark ? '#34d399' : '#15803d'}; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${gis.id}</span>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; margin-bottom: 8px;">
                <div><span style="color: ${isDark ? '#94a3b8' : '#64748b'};">Capital:</span> <span style="color: ${isDark ? '#e2e8f0' : '#1e293b'}; font-weight: 600;">${gis.capital}</span></div>
                <div><span style="color: ${isDark ? '#94a3b8' : '#64748b'};">Region:</span> <span style="color: #0284c7; font-weight: 600;">${gis.region}</span></div>
                <div><span style="color: ${isDark ? '#94a3b8' : '#64748b'};">Area:</span> <span style="color: ${isDark ? '#cbd5e1' : '#334155'};">${gis.area}</span></div>
                <div><span style="color: ${isDark ? '#94a3b8' : '#64748b'};">Elevation:</span> <span style="color: ${isDark ? '#fbbf24' : '#d97706'};">${gis.elevation}</span></div>
              </div>
              <div style="background: ${isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc'}; padding: 6px 8px; border-radius: 6px; border: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
                  <span style="color: ${isDark ? '#94a3b8' : '#64748b'};">Registered Records:</span>
                  <span style="color: ${isDark ? '#10b981' : '#059669'}; font-weight: 800; font-family: monospace;">${recFormatted}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 10px; color: ${isDark ? '#64748b' : '#94a3b8'};">
                  <span>National Share:</span>
                  <span style="color: #0284c7; font-family: monospace;">${pct}%</span>
                </div>
              </div>
              <div style="font-size: 10px; color: ${isDark ? '#34d399' : '#059669'}; text-align: center; font-style: italic;">
                ⚡ Click to open Province Dossier
              </div>
            </div>
          `;
        }
      },
      visualMap: mapMode === 'choropleth' ? {
        min: 0,
        max: maxRecordCount,
        text: ['High Volume', 'Low Volume'],
        realtime: false,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 15,
        inRange: {
          color: isDark
            ? ['#061a33', '#0369a1', '#0284c7', '#0d9488', '#10b981', '#34d399']
            : ['#e0f2fe', '#bae6fd', '#38bdf8', '#0284c7', '#059669', '#10b981']
        },
        textStyle: {
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 10,
          fontFamily: 'monospace'
        }
      } : undefined,
      geo: {
        map: 'afghanistan',
        roam: true,
        zoom: currentZoom,
        center: [66.5, 34.0],
        scaleLimit: { min: 0.8, max: 7 },
        label: {
          show: true,
          color: isDark ? '#cbd5e1' : '#1e293b',
          fontSize: 9,
          fontFamily: 'sans-serif'
        },
        itemStyle: {
          areaColor: isDark ? '#091024' : '#f8fafc',
          borderColor: isDark ? '#1e293b' : '#cbd5e1',
          borderWidth: 1.2
        },
        emphasis: {
          label: {
            show: true,
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: 12
          },
          itemStyle: {
            areaColor: '#059669',
            borderColor: '#34d399',
            borderWidth: 2,
            shadowColor: 'rgba(52, 211, 153, 0.6)',
            shadowBlur: 14
          }
        },
        select: {
          label: {
            show: true,
            color: '#ffffff',
            fontWeight: 'bold'
          },
          itemStyle: {
            areaColor: '#047857',
            borderColor: '#10b981',
            borderWidth: 2.5
          }
        }
      },
      series: [
        {
          name: 'Afghanistan 34-Province GIS Matrix',
          type: 'map',
          geoIndex: 0,
          data: mapDataSeries
        },
        // Provincial Capitals Pins (shown in 'capitals' mode or as supplementary landmarks)
        ...(mapMode === 'capitals' || mapMode === 'choropleth' ? [
          {
            name: 'Provincial Capitals',
            type: 'scatter',
            coordinateSystem: 'geo',
            data: scatterData,
            symbolSize: (val: any, params: any) => {
              return params.data?.provinceId === 'KBL' ? 12 : 7;
            },
            label: {
              show: mapMode === 'capitals',
              position: 'top',
              formatter: '{b}',
              fontSize: 9,
              color: '#cbd5e1',
              textBorderColor: '#05070d',
              textBorderWidth: 2
            },
            zlevel: 2
          },
          // Glowing Pulse Beacon for Kabul Capital
          {
            name: 'National Capital Beacon',
            type: 'effectScatter',
            coordinateSystem: 'geo',
            data: kabulScatter,
            symbolSize: 14,
            showEffectOn: 'render',
            rippleEffect: {
              brushType: 'stroke',
              scale: 4.5,
              period: 3
            },
            itemStyle: {
              color: '#f59e0b',
              shadowBlur: 15,
              shadowColor: '#f59e0b'
            },
            zlevel: 3
          }
        ] : [])
      ]
    };
  }, [mapMode, provinceMapData, selectedProvinceId, currentZoom, maxRecordCount, countLookup, isDark]);

  // Click & hover events
  const onEvents = useMemo(() => ({
    click: (params: any) => {
      const gis = params.data?.gis as ProvinceGISData;
      if (gis) {
        onSelectProvince(gis);
      } else if (params.name) {
        const found = PROVINCES_DATA.find((p) => p.name === params.name);
        if (found) onSelectProvince(found);
      }
    },
    mouseover: (params: any) => {
      const gis = params.data?.gis as ProvinceGISData;
      if (gis) {
        setHoveredProvince(gis);
      }
    },
    mouseout: () => {
      setHoveredProvince(null);
    }
  }), [onSelectProvince]);

  const handleZoom = (delta: number) => {
    const inst = echartsRef.current?.getEchartsInstance();
    if (!inst) return;
    const newZoom = Math.min(Math.max(currentZoom + delta, 0.8), 6);
    setCurrentZoom(newZoom);
    inst.setOption({
      geo: { zoom: newZoom }
    });
  };

  const handleReset = () => {
    const inst = echartsRef.current?.getEchartsInstance();
    if (!inst) return;
    setCurrentZoom(1.2);
    inst.setOption({
      geo: {
        zoom: 1.2,
        center: [66.5, 34.0]
      }
    });
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-white dark:bg-[#070b16] border border-slate-200 dark:border-white/10 transition-all ${
      isFullscreen ? 'fixed inset-4 z-50 flex flex-col bg-white/98 dark:bg-[#070b16]/98 backdrop-blur-3xl shadow-2xl' : 'shadow-sm'
    }`}>
      {/* Dynamic Map HUD Header Bar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050811]/90 flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide uppercase">
              {mapMode === 'archival' ? 'Archival Cartography Scan' : 'Dynamic Afghanistan Vector Cartography'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-white/10 pl-3">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">34 ADM1 Provinces</span>
            <span>&bull;</span>
            <span className="text-amber-600 dark:text-amber-400">Live Spatial Sync</span>
          </div>
        </div>

        {/* Layer Mode Switchers & Interaction Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-[#0d1424] p-1 rounded-xl border border-slate-200 dark:border-white/10 text-xs">
            <button
              onClick={() => setMapMode('choropleth')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mapMode === 'choropleth'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Choropleth Civil Registration Density"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Record Heat</span>
            </button>

            <button
              onClick={() => setMapMode('regional')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mapMode === 'regional'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="6-Region Strategic Boundaries"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Regions</span>
            </button>

            <button
              onClick={() => setMapMode('capitals')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mapMode === 'capitals'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="34 Provincial Capitals & Kabul Hub"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Capitals</span>
            </button>

            <button
              onClick={() => setMapMode('archival')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mapMode === 'archival'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Historical High-Res Scanned Plate"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Scan Plate</span>
            </button>
          </div>

          {/* Navigation Zoom / Reset Controls */}
          {mapMode !== 'archival' && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0d1424] p-1 rounded-xl border border-slate-200 dark:border-white/10">
              <button
                onClick={() => handleZoom(0.3)}
                className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleZoom(-0.3)}
                className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleReset}
                className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Reset View"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Fullscreen Expand Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#0d1424] dark:hover:bg-white/10 rounded-xl border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Map Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Map Canvas / Viewport */}
      <div className={`relative w-full ${isFullscreen ? 'flex-1 min-h-0' : 'h-[520px]'}`}>
        {mapMode === 'archival' ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-black/80 overflow-auto">
            <img
              src="/afghanistan-map.png"
              alt="Afghanistan National Cartography Map"
              className="max-h-[460px] w-auto object-contain rounded-lg filter contrast-105 shadow-2xl border border-slate-200 dark:border-white/10"
            />
            <p className="mt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Archival High-Resolution Military Cartography Reference Frame &bull; Registered Cartographic Projection
            </p>
          </div>
        ) : (
          chartOption && (
            <ReactECharts
              ref={echartsRef}
              option={chartOption}
              onEvents={onEvents}
              style={{ width: '100%', height: '100%' }}
            />
          )
        )}

        {/* Hovered Province Instant Telemetry Pill (Floating Overlay) */}
        {hoveredProvince && mapMode !== 'archival' && (
          <div className="absolute top-4 left-4 pointer-events-none bg-white/95 dark:bg-[#090e1a]/90 backdrop-blur-md border border-emerald-500/40 rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-3 animate-fadeIn">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping shrink-0" />
            <div>
              <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{hoveredProvince.name}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-persian">{hoveredProvince.nameDari}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({hoveredProvince.id})</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Capital: <strong className="text-slate-800 dark:text-slate-200">{hoveredProvince.capital}</strong></span>
                <span>&bull;</span>
                <span>Region: <strong className="text-blue-600 dark:text-cyan-400">{hoveredProvince.region}</strong></span>
                <span>&bull;</span>
                <span>Districts: <strong className="text-amber-600 dark:text-amber-400 font-mono">{hoveredProvince.districts}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Map Instructions Badge */}
        {mapMode !== 'archival' && (
          <div className="absolute bottom-4 right-4 pointer-events-none hidden sm:flex items-center gap-2 bg-white/90 dark:bg-[#090e1a]/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-slate-600 dark:text-slate-400 shadow-sm">
            <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Click any province to view dossier &bull; Drag to pan &bull; Scroll to zoom</span>
          </div>
        )}

        {/* Region Legend (Shown in Regional Mode) */}
        {mapMode === 'regional' && (
          <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-[#090e1a]/90 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-xl p-2.5 shadow-lg text-xs space-y-1">
            <span className="font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1">
              Geographic Regions
            </span>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              {Object.entries(REGION_COLORS).map(([region, color]) => (
                <div key={region} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-slate-700 dark:text-slate-300">{region}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
