export interface RecordItem {
  id: number;
  integer_key: number | null;
  hash_key: string | null;
  name: string | null;
  fname: string | null;
  gname: string | null;
  dob_year: number | null;
  gender: number | null;
  province: string | null;
  district: string | null;
  province_code: string | null;
  district_code: string | null;
  record_number: number | null;
  page_number: number | null;
  book_name: string | null;
  cropped_path: string | null;
}

export interface PaginatedRecords {
  total_records: number;
  page: number;
  page_size: number;
  total_pages: number;
  records: RecordItem[];
}

export interface OverviewKPIs {
  total_records: number;
  unique_provinces: number;
  unique_districts: number;
  code_0_count: number;
  code_1_count: number;
  unknown_gender_count: number;
  unique_books: number;
  unique_years: number;
  quality_score: number;
  gender_counts: {
    value: number;
    label: string;
    count: number;
    percentage: number;
  }[];
}

export interface GeographicAnalyticsData {
  provinces: {
    province: string;
    province_code: string;
    count: number;
    percentage: number;
  }[];
  districts: {
    province: string;
    district: string;
    district_code: string;
    count: number;
    percentage: number;
  }[];
  province_gender_matrix: {
    [province: string]: {
      [gender: string]: number;
    };
  };
}

export interface DemographicAnalyticsData {
  dob_distribution: {
    year: number;
    count: number;
    percentage: number;
  }[];
  dob_gender_distribution: {
    year: number;
    code_0: number;
    code_1: number;
    other: number;
    total: number;
  }[];
}

export interface BooksPagesData {
  total_books?: number;
  books: {
    book_name: string;
    records_count: number;
    unique_pages: number;
    percentage: number;
    province?: string;
  }[];
  pages_distribution: {
    page_number: number;
    records_count: number;
  }[];
}

export interface LedgerPageData {
  book_name: string;
  page_number: number;
  total_records_in_book: number;
  unique_pages_in_book: number;
  min_page: number;
  max_page: number;
  province: string;
  district: string;
  avg_records_per_page: number;
  available_pages: number[];
  records: RecordItem[];
}

export interface CorrelationMatrixData {
  fields: string[];
  pearson: number[][];
  spearman: number[][];
  sample_size: number;
  disclaimer: string;
}

export interface QualityReportData {
  overall_score: number;
  completeness_score: number;
  uniqueness_score: number;
  validity_score: number;
  consistency_score: number;
  duplicate_ids: number;
  duplicate_hashes: number;
  column_metrics: {
    [col: string]: {
      completeness_pct: number;
      non_null_count: number;
      null_count: number;
    };
  };
}

export interface SmartInsight {
  category: string;
  title: string;
  text: string;
  type: 'info' | 'accent' | 'success' | 'warning';
}

export interface FilterOptions {
  provinces: string[];
  districts: string[];
  books: string[];
  genders: { value: number; label: string }[];
  year_min: number;
  year_max: number;
  provinces_with_counts?: { province: string; count: number }[];
  districts_with_counts?: { district: string; count: number; province?: string }[];
}

export interface IngestionReport {
  id?: number;
  source_file: string;
  total_source_rows: number;
  imported_rows: number;
  failed_rows: number;
  skipped_rows: number;
  duplicate_rows: number;
  duration_seconds: number;
  completed_at: string;
}

export interface FamilyMember {
  id: number;
  name: string;
  fname: string;
  gname?: string;
  dob_year?: number;
  gender: number;
  province?: string;
  district?: string;
  book_name?: string;
  page_number?: number;
  record_number?: number;
  relation_type?: string;
  is_full_sibling?: boolean;
  is_same_page?: boolean;
  is_exact_lineage?: boolean;
  confidence?: string;
}

export interface FamilyTreeNode {
  name: string;
  relation?: string;
  gender?: number;
  is_target?: boolean;
  itemStyle?: { color?: string; borderColor?: string; borderWidth?: number };
  children?: FamilyTreeNode[];
}

export interface FamilyTreeData {
  target_person: RecordItem;
  grandfather_name: string;
  father_name: string;
  father_candidates: FamilyMember[];
  siblings: FamilyMember[];
  spouses?: FamilyMember[];
  children: FamilyMember[];
  page_peers: FamilyMember[];
  tree_graph: FamilyTreeNode;
}
