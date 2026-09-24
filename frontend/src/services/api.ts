import {
  RecordItem,
  PaginatedRecords,
  OverviewKPIs,
  GeographicAnalyticsData,
  DemographicAnalyticsData,
  BooksPagesData,
  CorrelationMatrixData,
  QualityReportData,
  SmartInsight,
  FilterOptions,
  IngestionReport,
  LedgerPageData
} from '../types';

const API_BASE = '/api';

export interface QueryParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
  province?: string;
  district?: string;
  gender?: number;
  dob_year_min?: number;
  dob_year_max?: number;
  book_name?: string;
  province_code?: string;
  district_code?: string;
  record_number?: number;
  page_number?: number;
  name?: string;
  fname?: string;
  gname?: string;
  hash_key?: string;
  q?: string;
  search_fields?: string;
}

function buildQueryString(params: QueryParams): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, String(val));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  async getHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getIngestionReport(): Promise<IngestionReport> {
    const res = await fetch(`${API_BASE}/ingestion/report`);
    return res.json();
  },

  async getFilterOptions(province?: string): Promise<FilterOptions> {
    const url = province ? `${API_BASE}/filters/options?province=${encodeURIComponent(province)}` : `${API_BASE}/filters/options`;
    const res = await fetch(url);
    return res.json();
  },

  async getOverviewKPIs(params: QueryParams = {}): Promise<OverviewKPIs> {
    const res = await fetch(`${API_BASE}/analytics/kpis${buildQueryString(params)}`);
    return res.json();
  },

  async getGeographicAnalytics(params: QueryParams = {}): Promise<GeographicAnalyticsData> {
    const res = await fetch(`${API_BASE}/analytics/geographic${buildQueryString(params)}`);
    return res.json();
  },

  async getDemographicAnalytics(params: QueryParams = {}): Promise<DemographicAnalyticsData> {
    const res = await fetch(`${API_BASE}/analytics/demographics${buildQueryString(params)}`);
    return res.json();
  },

  async getBooksPagesAnalytics(params: QueryParams = {}): Promise<BooksPagesData> {
    const res = await fetch(`${API_BASE}/analytics/books-pages${buildQueryString(params)}`);
    return res.json();
  },

  async getLedgerPage(bookName: string, pageNumber: number = 1): Promise<LedgerPageData> {
    const res = await fetch(`${API_BASE}/books/ledger-page?book_name=${encodeURIComponent(bookName)}&page_number=${pageNumber}`);
    if (!res.ok) throw new Error('Failed to load ledger page');
    return res.json();
  },

  async getRelationshipAnalytics(params: QueryParams = {}): Promise<CorrelationMatrixData> {
    const res = await fetch(`${API_BASE}/analytics/relationships${buildQueryString(params)}`);
    return res.json();
  },

  async getQualityReport(): Promise<QualityReportData> {
    const res = await fetch(`${API_BASE}/analytics/quality`);
    return res.json();
  },

  async getSmartInsights(): Promise<SmartInsight[]> {
    const res = await fetch(`${API_BASE}/analytics/insights`);
    return res.json();
  },

  async getRecords(params: QueryParams = {}): Promise<PaginatedRecords> {
    const res = await fetch(`${API_BASE}/records${buildQueryString(params)}`);
    return res.json();
  },

  async getRecordById(id: number): Promise<RecordItem> {
    const res = await fetch(`${API_BASE}/records/${id}`);
    if (!res.ok) throw new Error('Record not found');
    return res.json();
  },

  async getFamilyTree(recordId: number): Promise<any> {
    const res = await fetch(`${API_BASE}/records/${recordId}/family-tree`);
    if (!res.ok) throw new Error('Family tree could not be loaded');
    return res.json();
  },

  async searchFamilyPersons(query: string, searchFields?: string): Promise<any[]> {
    const qs = searchFields ? `&search_fields=${encodeURIComponent(searchFields)}` : '';
    const res = await fetch(`${API_BASE}/family-tree/search?q=${encodeURIComponent(query)}${qs}`);
    return res.json();
  },

  getExportUrl(
    format: 'csv' | 'json' | 'pdf' | 'xlsx' | 'excel',
    params: QueryParams = {},
    limit: number = 1000,
    columns?: string[]
  ): string {
    const exportParams: any = { ...params, format, limit };
    if (columns && columns.length > 0) {
      exportParams.columns = columns.join(',');
    }
    return `${API_BASE}/records/export${buildQueryString(exportParams)}`;
  },

  getExecutivePdfReportUrl(params: QueryParams = {}): string {
    return `${API_BASE}/reports/executive-summary-pdf${buildQueryString(params)}`;
  }
};
