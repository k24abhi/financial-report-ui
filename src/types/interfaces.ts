// ============================================================================
// Domain Entities
// ============================================================================

export interface Deal {
  id: string;
  date: string;
  amount: number;
  status: string;
  purpose: string;
  dscr: number;
  ltv: number;
  revenue2024: number;
  revenue2023: number;
  noi2024: number;
  documents: number;
}

export interface Company {
  id: string;
  name: string;
  type: string;
  location: string;
  industry: string;
  borrower: string;
  deals: Deal[];
}

// ============================================================================
// Grid Data Types
// ============================================================================

export interface GridRow {
  id: string;
  account: string;
  y2023: number;
  y2024: number;
  ytd2025: number;
}

export interface GridSection {
  id: string;
  category: string;
  isParent: true;
  children: GridRow[];
}

// ============================================================================
// File Upload Types
// ============================================================================

export type FinancialStatementType =
  | 'Q1' | 'Q2' | 'Q3' | 'Q4'  // Quarterly
  | 'H1' | 'H2'                // Half-yearly 
  | 'Annual';                  // Annual

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: string;
  statementType?: FinancialStatementType;
  period?: string;
  date?: string;
  period_type?: string;
  file?: File;
  company_id?: string;
  extractedData?: any;
}

// ============================================================================
// Form Types
// ============================================================================

export interface NewCompanyForm {
  name: string;
  type: string;
  location: string;
  industry: string;
  borrower: string;
}

// ============================================================================
// API Service Types
// ============================================================================

export interface ExtractDataParams {
  file: File;
  company_id: string;
  date: string;
  period_type: string;
  extract_again?: boolean;
}

export interface ExtractedData {
  tables?: any[];
  [key: string]: any;
}

export interface ClientDetails {
  client_id?: string;
  name: string;
  mobile_number: string;
  email: string;
  zip_code: string;
  address: string;
  company_ids?: string[];
}

export interface CompanyDetails {
  client_id: string;
  company_name: string;
  address: string;
  industry: string;
}

export interface UserProfile {
  name: string;
  mobile_number: string;
  email: string;
  zip_code: string;
  address: string;
}

// ============================================================================
// Component Props
// ============================================================================

export interface DashboardTabsProps {
  deals: Deal[];
  gridData: GridSection[];
  expandedRows: Set<string>;
  selectedCells: Set<CellKey>;
  files: UploadedFile[];
  selectedSum: number;
  companyId?: string;
  onToggleRow: (id: string) => void;
  onToggleCell: (cellKey: CellKey) => void;
  onClearSelection: () => void;
  onAddFiles: (files: UploadedFile[]) => void;
  onRemoveFile: (index: number) => void;
  onUpdateFileStatementType: (index: number, statementType: FinancialStatementType) => void;
  onUpdateGridData: (newData: GridSection[]) => void;
  onExportData?: (data: any) => void;
}

export interface KeyMetricsProps {
  deals: Deal[];
}

export interface AnalysisTabProps {
  gridData: GridSection[];
}

export interface DealsTabProps {
  deals: Deal[];
}

export interface DataGridTabProps {
  gridData: GridSection[];
  expandedRows: Set<string>;
  selectedCells: Set<CellKey>;
  onToggleRow: (id: string) => void;
  onToggleCell: (cellKey: CellKey) => void;
  onClearSelection: () => void;
  selectedSum: number;
  onUpdateGridData: (newData: GridSection[]) => void;
}

export interface EditExtractionTabProps {
  companyId?: string;
  files?: UploadedFile[];
  onTabChange?: (tabIndex: number) => void;
  onExportData?: (data: any) => void;
}

export interface UploadTabProps {
  files: UploadedFile[];
  onAddFiles: (files: UploadedFile[]) => void;
  onRemoveFile: (index: number) => void;
  onUpdateFileStatementType: (index: number, statementType: FinancialStatementType) => void;
  companyId?: string;
}

export interface CompanyListProps {
  companies: Company[];
  selectedCompanyId: string | null;
  onSelectCompany: (id: string) => void;
  onAddCompany: (company: Omit<Company, "id" | "deals">) => void;
}

export interface FinancialsTabProps {
  deals: Deal[];
}

export interface DashboardHeaderProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export interface CompanyHeaderProps {
  company: Company;
}

export interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCompany: (company: NewCompanyForm) => void;
}

export interface InitializeUserProps {
  onUserReady: () => void;
}

export interface StatusBadgeProps {
  status: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type CellKey = string;
