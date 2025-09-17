// TypeScript interface for Job
// This matches the Supabase jobs table structure with grades and code prefixes

// Raw database structure from Supabase
export interface JobDatabase {
  id: string;
  name: string; // Updated to match actual database column name
  code_prefix: string;
  grades: string[];
  category: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Application interface (matches database structure)
export interface Job {
  id: string;
  name: string; // Direct mapping from database name column
  code_prefix: string;
  grades: string[];
  category: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Combined job+grade interface for display and selection
export interface JobGradeOption {
  id: string;
  displayName: string; // e.g., "JURURAWAT U6", "Penolong Pegawai Farmasi U5"
  jobName: string; // Original job name
  grade: string; // The grade part
  code_prefix: string;
  category: string;
  notes: string | null;
  is_active: boolean;
}

// Enum for job categories
export enum JobCategory {
  CLINICAL = 'Clinical',
  NON_CLINICAL = 'Non-Clinical'
}

// Type for category information
export interface CategoryInfo {
  category: JobCategory;
  job_count: number;
}

// Type for category change operations
export interface CategoryChange {
  job_id: string;
  new_category: JobCategory;
}

// Type for bulk category change
export interface BulkCategoryChange {
  job_ids: string[];
  new_category: JobCategory;
}

// Enum for code prefixes
export enum CodePrefix {
  UD = 'UD', // Pegawai Perubatan
  UF = 'UF', // Pegawai Farmasi
  UG = 'UG', // Pegawai Pergigian
  U = 'U',   // Allied Health (Clinical)
  N = 'N',   // Non-Clinical (Administrative)
  H = 'H',   // Non-Clinical (General Services)
  JA = 'JA'  // Non-Clinical (Engineering)
}

// Common grade ranges
export const GRADE_RANGES = {
  UD: ['UD9', 'UD10', 'UD12', 'UD13', 'UD14', 'UD15'],
  UF: ['UF9', 'UF10', 'UF12', 'UF13', 'UF14'],
  UG: ['UG9', 'UG10', 'UG12', 'UG13', 'UG14', 'UG15'],
  U_HIGH: ['U5', 'U6', 'U7', 'U9', 'U10', 'U12', 'U13', 'U14'],
  U_MID: ['U5', 'U6', 'U7', 'U8'],
  U_LOW: ['U1', 'U2', 'U3', 'U4'],
  N_HIGH: ['N5', 'N6', 'N7', 'N8'],
  N_LOW: ['N1', 'N2', 'N3', 'N4'],
  H: ['H1', 'H2', 'H3', 'H4'],
  JA: ['JA5', 'JA6', 'JA7', 'JA8']
} as const;

// Type for creating a new job
export interface CreateJob {
  name: string;
  code_prefix: CodePrefix;
  grades: string[];
  category: JobCategory;
  notes?: string;
  is_active?: boolean;
}

// Type for updating a job
export interface UpdateJob {
  name?: string;
  code_prefix?: CodePrefix;
  grades?: string[];
  category?: JobCategory;
  notes?: string;
  is_active?: boolean;
}

// Type for job grade view (from the database view)
export interface JobGradeView {
  id: string;
  name: string;
  code_prefix: string;
  category: string;
  notes: string | null;
  is_active: boolean;
  grade: string;
  created_at: string;
  updated_at: string;
}

// Type for job statistics
export interface JobStats {
  total: number;
  byCategory: Record<string, number>;
  byCodePrefix: Record<string, number>;
  byGrade: Record<string, number>;
}

// Legacy interface for backward compatibility
export interface JobPosition extends Job {}
