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
  clientId?: string;
  getAccessToken?: () => Promise<string>;
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
  companyId?: string;
  clientId?: string;
  getAccessToken?: () => Promise<string>;
}

export interface EditExtractionTabProps {
  companyId?: string;
  clientId?: string;
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
// Underwriting Domain Types
// ============================================================================

export type RiskLevel = "low" | "moderate" | "high" | "unacceptable";
export type EmploymentStatus = "employed" | "self_employed" | "retired" | "other";
export type UnderwritingDecisionType = "approve" | "suspend" | "deny";
export type MonitoringFlagType = "past_due" | "risk_increase" | "covenant_breach" | "renewal_due" | "other";
export type FlagSeverity = "low" | "medium" | "high" | "critical";
export type InvestorType = "fannie_mae" | "freddie_mac" | "fha" | "va" | "usda";
export type ComplianceOutcome = "pass" | "fail" | "conditional";

export interface RiskAssessmentRequest {
  company_id: string;
  deal_id: string;
  annual_income: number;
  total_debt_payments: number;
  credit_score: number;
  loan_amount: number;
  property_value: number;
  employment_status: EmploymentStatus;
  employment_years: number;
  notes?: string;
}

export interface RiskAssessmentResult {
  assessment_id: string;
  company_id: string;
  deal_id: string;
  dti_ratio: number;
  ltv_ratio: number;
  risk_level: RiskLevel;
  risk_score: number;
  credit_score: number;
  recommendations: string[];
  flags: string[];
  assessed_by: string;
  assessed_at: string;
}

export interface ApplicationReviewRequest {
  company_id: string;
  deal_id: string;
  documents_received: string[];
  applicant_name: string;
  loan_purpose: string;
  loan_amount: number;
  notes?: string;
}

export interface ApplicationReviewResult {
  review_id: string;
  company_id: string;
  deal_id: string;
  applicant_name: string;
  completeness_score: number;
  missing_documents: string[];
  status: "complete" | "incomplete" | "returned";
  reviewed_by: string;
  reviewed_at: string;
  notes?: string;
}

export interface UnderwritingDecisionRequest {
  company_id: string;
  deal_id: string;
  decision: UnderwritingDecisionType;
  loan_amount?: number;
  interest_rate?: number;
  loan_term_months?: number;
  conditions: string[];
  rationale: string;
}

export interface UnderwritingDecisionResult {
  decision_id: string;
  company_id: string;
  deal_id: string;
  decision: UnderwritingDecisionType;
  loan_amount?: number;
  interest_rate?: number;
  loan_term_months?: number;
  conditions: string[];
  rationale: string;
  decided_by: string;
  decided_at: string;
}

export interface MonitoringFlagRequest {
  company_id: string;
  deal_id: string;
  flag_type: MonitoringFlagType;
  description: string;
  severity: FlagSeverity;
}

export interface MonitoringFlagResult {
  flag_id: string;
  company_id: string;
  deal_id: string;
  flag_type: MonitoringFlagType;
  description: string;
  severity: FlagSeverity;
  status: "open" | "resolved";
  flagged_by: string;
  flagged_at: string;
}

export interface ComplianceCheckRequest {
  company_id: string;
  deal_id: string;
  investor_type: InvestorType;
  loan_type: "conventional" | "fha" | "va" | "usda" | "jumbo";
  loan_amount: number;
  property_type: "single_family" | "multi_family" | "commercial" | "condo" | "townhouse";
  occupancy_type: "primary" | "secondary" | "investment";
  credit_score: number;
  dti_ratio: number;
  ltv_ratio: number;
  regulatory_frameworks: string[];
}

export interface ComplianceCheckResult {
  check_id: string;
  company_id: string;
  deal_id: string;
  investor_type: InvestorType;
  passed: boolean;
  violations: string[];
  warnings: string[];
  regulatory_findings: Record<string, string[]>;
  checked_by: string;
  checked_at: string;
}

export interface ComplianceNoteRequest {
  company_id: string;
  deal_id: string;
  note_type: "underwriting" | "condition_clearing" | "review" | "general";
  note_text: string;
  referenced_guideline?: string;
}

export interface ComplianceNoteResult {
  note_id: string;
  company_id: string;
  deal_id: string;
  note_type: string;
  note_text: string;
  referenced_guideline?: string;
  created_by: string;
  created_at: string;
}

export interface ComplianceReviewRequest {
  company_id: string;
  deal_id: string;
  review_type: "pre_approval" | "closing" | "post_closing" | "audit";
  findings: string;
  outcome: ComplianceOutcome;
  conditions: string[];
}

export interface ComplianceReviewResult {
  review_id: string;
  company_id: string;
  deal_id: string;
  review_type: string;
  findings: string;
  outcome: ComplianceOutcome;
  conditions: string[];
  reviewed_by: string;
  reviewed_at: string;
}

// ============================================================================
// Tab Props for new Underwriting tabs
// ============================================================================

export interface RiskAssessmentTabProps {
  companyId?: string;
  deals: Deal[];
  getAccessToken?: () => Promise<string>;
}

export interface ApplicationReviewTabProps {
  companyId?: string;
  deals: Deal[];
  getAccessToken?: () => Promise<string>;
}

export interface ComplianceTabProps {
  companyId?: string;
  deals: Deal[];
  getAccessToken?: () => Promise<string>;
}

export interface ReportsTabProps {
  companyId?: string;
  clientId?: string;
  deals: Deal[];
  gridData: GridSection[];
  getAccessToken?: () => Promise<string>;
}

// ============================================================================
// Utility Types
// ============================================================================

export type CellKey = string;
