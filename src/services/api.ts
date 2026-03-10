import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type {
  ExtractDataParams,
  ExtractedData,
  ClientDetails,
  CompanyDetails,
  RiskAssessmentRequest,
  RiskAssessmentResult,
  ApplicationReviewRequest,
  ApplicationReviewResult,
  UnderwritingDecisionRequest,
  UnderwritingDecisionResult,
  MonitoringFlagRequest,
  MonitoringFlagResult,
  ComplianceCheckRequest,
  ComplianceCheckResult,
  ComplianceNoteRequest,
  ComplianceNoteResult,
  ComplianceReviewRequest,
  ComplianceReviewResult,
} from '../types/interfaces';

// Token getter function - to be set by the app
let getTokenFunction: (() => Promise<string>) | null = null;

export const setTokenGetter = (fn: () => Promise<string>) => {
  getTokenFunction = fn;
};

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token if available
  let token: string | null = null;
  if (getTokenFunction) {
    try {
      token = await getTokenFunction();
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.detail || `API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Data Extraction Services
export const extractDataAPI = {
  async extractData(params: ExtractDataParams): Promise<ExtractedData> {
    const formData = new FormData();
    formData.append('file', params.file);
    
    const queryParams = new URLSearchParams({
      company_id: params.company_id,
      date: params.date,
      period_type: params.period_type,
      extract_again: params.extract_again ? 'true' : 'false',
    });

    return apiCall<ExtractedData>(
      `${API_ENDPOINTS.extractData}?${queryParams}`,
      {
        method: 'POST',
        body: formData,
      }
    );
  },

  async getExtractedData(
    company_id: string,
    date: string,
    period_type: string
  ): Promise<ExtractedData> {
    const queryParams = new URLSearchParams({
      company_id,
      date,
      period_type,
    });

    const result = await apiCall<any>(
      `${API_ENDPOINTS.getExtractedData}?${queryParams}`,
      {
        method: 'GET',
      }
    );

    // Handle both response formats: direct array or object with tables property
    if (Array.isArray(result)) {
      return { tables: result };
    }
    return result;
  },

  async updateExtractedData(
    company_id: string,
    date: string,
    period_type: string,
    data: any
  ): Promise<{ status: string; message: string }> {
    const queryParams = new URLSearchParams({
      company_id,
      date,
      period_type,
    });

    return apiCall(
      `${API_ENDPOINTS.updateExtractedData}?${queryParams}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
  },

  // Get available periods for a company.
  // Transforms the backend col_period_mapping into a flat { period, period_type }[]
  async getAvailablePeriods(company_id: string): Promise<{ data: { period: string; period_type: string }[] }> {
    const queryParams = new URLSearchParams({ company_id });
    const raw = await apiCall<{
      status: string;
      data: { col_period_mapping: Record<string, { date: string; period_type: string }> };
    }>(`${API_ENDPOINTS.fetchAllPeriodData}?${queryParams}`, { method: 'GET' });

    const mapping = raw?.data?.col_period_mapping ?? {};
    // Sort column keys numerically (col "1" is earliest) to keep chronological order
    const periods = Object.keys(mapping)
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => ({
        period: mapping[key].date,
        period_type: mapping[key].period_type,
      }));

    return { data: periods };
  },
};

// Client Services
export const clientAPI = {
  async addNewClient(details: ClientDetails) {
    return apiCall(API_ENDPOINTS.addNewClient, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(details),
    });
  },
};

// Company Services
export const companyAPI = {
  async getClientCompanies() {
    return apiCall(API_ENDPOINTS.getClientCompanies, {
      method: 'GET',
    });
  },

  async addClientCompany(companyData: Omit<CompanyDetails, 'client_id'>) {
    return apiCall(API_ENDPOINTS.addClientCompany, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyData),
    });
  },

  async getCompanyDetails(company_id: string) {
    const queryParams = new URLSearchParams({ company_id });
    return apiCall(`${API_ENDPOINTS.getCompanyDetails}?${queryParams}`, {
      method: 'GET',
    });
  },

  async updateCompanyDetails(
    company_id: string,
    companyData: Omit<CompanyDetails, 'client_id'>
  ) {
    const queryParams = new URLSearchParams({ company_id });
    return apiCall(`${API_ENDPOINTS.updateCompanyDetails}?${queryParams}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyData),
    });
  },

  async removeClientCompany(company_id: string) {
    const queryParams = new URLSearchParams({ company_id });
    return apiCall(`${API_ENDPOINTS.removeClientCompany}?${queryParams}`, {
      method: 'DELETE',
    });
  },
};

// Hierarchy Grid Services – returns the raw col_period_mapping from the backend.
// Use this to understand which periods have been uploaded for a company.
export const dataGridAPI = {
  async fetchAllPeriodData(company_id: string): Promise<{
    status: string;
    data: { col_period_mapping: Record<string, { date: string; period_type: string }> };
  }> {
    const queryParams = new URLSearchParams({ company_id });
    return apiCall(`${API_ENDPOINTS.fetchAllPeriodData}?${queryParams}`, {
      method: 'GET',
    });
  },
};

// ─── Reports & Exports ──────────────────────────────────────────────────────

export interface ExportRequest {
  company_id: string;
  format: 'xlsx' | 'pdf';
  periods: string[];
  tree_nodes: { label: string; depth: number; values: number[] }[];
  company_name: string;
}

export interface ExportResponse {
  download_url: string;
  format: string;
  expires_in_seconds: number;
}

export const reportsAPI = {
  async exportFinancialStatement(payload: ExportRequest): Promise<ExportResponse> {
    return apiCall<ExportResponse>(API_ENDPOINTS.exportFinancialStatement, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
};

// ─── Underwriting Calculations ────────────────────────────────────────────────

export interface CalculationRequest {
  company_id: string;
  period: string;
  node_values: Record<string, number>;
  loan_amount?: number;
  appraised_value?: number;
  annual_debt_service?: number;
  depreciation?: number;
  total_rooms?: number;
  avg_daily_rate?: number;
  cap_rate_override?: number | null;
}

export interface MetricResult {
  name: string;
  value: number | null;
  formula: string;
  inputs: Record<string, number>;
  explanation: string;
  passed_threshold?: boolean | null;
  threshold?: number | null;
}

export interface CalculationResponse {
  company_id: string;
  period: string;
  dscr: MetricResult;
  noi: MetricResult;
  ltv: MetricResult;
  cap_rate: MetricResult;
  break_even_occupancy: MetricResult;
  gross_revenue: number;
  total_expenses: number;
  net_income: number;
}

export const calculationsAPI = {
  async previewCalculations(payload: CalculationRequest): Promise<CalculationResponse> {
    return apiCall<CalculationResponse>(API_ENDPOINTS.previewCalculations, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
};

// ─── Collaboration ────────────────────────────────────────────────────────────

export interface InviteCollaboratorPayload {
  company_id: string;
  invitee_email: string;
  role?: 'viewer' | 'editor';
}

export interface CollaboratorRecord {
  collaborator_id: string;
  user_id: string;
  email: string;
  role: string;
  invited_by: string;
  invited_at: string;
}

export interface AddCommentPayload {
  company_id: string;
  node_id: string;
  comment_text: string;
}

export interface CommentRecord {
  comment_id: string;
  node_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
}

export const collaborationAPI = {
  async inviteCollaborator(
    payload: InviteCollaboratorPayload
  ): Promise<{ message: string; collaborator_id: string; invitee_email: string }> {
    return apiCall(API_ENDPOINTS.inviteCollaborator, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async listCollaborators(company_id: string): Promise<{ collaborators: CollaboratorRecord[] }> {
    const queryParams = new URLSearchParams({ company_id });
    return apiCall(`${API_ENDPOINTS.listCollaborators}?${queryParams}`, { method: 'GET' });
  },

  async removeCollaborator(company_id: string, collaborator_id: string): Promise<{ status: string }> {
    const queryParams = new URLSearchParams({ company_id, collaborator_id });
    return apiCall(`${API_ENDPOINTS.removeCollaborator}?${queryParams}`, { method: 'DELETE' });
  },

  async addComment(payload: AddCommentPayload): Promise<CommentRecord> {
    return apiCall(API_ENDPOINTS.addComment, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async listComments(company_id: string, node_id?: string): Promise<{ comments: CommentRecord[] }> {
    const queryParams = new URLSearchParams({ company_id });
    if (node_id) queryParams.set('node_id', node_id);
    return apiCall(`${API_ENDPOINTS.listComments}?${queryParams}`, { method: 'GET' });
  },
};

// ─── Deal Approvals ────────────────────────────────────────────────────────────

export interface DealRecord {
  deal_id: string;
  company_id: string;
  status: string;
  prepared_by: string;
  reviewed_by?: string | null;
  decision_by?: string | null;
  submitted_at?: string | null;
  decided_at?: string | null;
  notes?: string | null;
  comments?: string | null;
  history: Record<string, string>[];
}

export const approvalsAPI = {
  async submitForReview(params: {
    company_id: string;
    deal_id: string;
    notes?: string;
  }): Promise<DealRecord> {
    return apiCall<DealRecord>(API_ENDPOINTS.submitForReview, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  },

  async decideDeal(params: {
    deal_id: string;
    decision: 'approve' | 'reject';
    comments?: string;
  }): Promise<DealRecord> {
    return apiCall<DealRecord>(API_ENDPOINTS.decideDeal, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  },

  async getDeal(deal_id: string): Promise<DealRecord> {
    return apiCall<DealRecord>(`${API_ENDPOINTS.getDeal}/${deal_id}`, { method: 'GET' });
  },
};

// ─── Underwriting ─────────────────────────────────────────────────────────────

export const underwritingAPI = {
  async performRiskAssessment(payload: RiskAssessmentRequest): Promise<RiskAssessmentResult> {
    return apiCall<RiskAssessmentResult>(API_ENDPOINTS.riskAssessment, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async listRiskAssessments(company_id: string, deal_id: string): Promise<RiskAssessmentResult[]> {
    return apiCall<RiskAssessmentResult[]>(
      `${API_ENDPOINTS.listRiskAssessments}/${company_id}/${deal_id}`,
      { method: 'GET' }
    );
  },

  async reviewApplication(payload: ApplicationReviewRequest): Promise<ApplicationReviewResult> {
    return apiCall<ApplicationReviewResult>(API_ENDPOINTS.applicationReview, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async recordDecision(payload: UnderwritingDecisionRequest): Promise<UnderwritingDecisionResult> {
    return apiCall<UnderwritingDecisionResult>(API_ENDPOINTS.underwritingDecision, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async listDecisions(company_id: string, deal_id: string): Promise<UnderwritingDecisionResult[]> {
    return apiCall<UnderwritingDecisionResult[]>(
      `${API_ENDPOINTS.listUnderwritingDecisions}/${company_id}/${deal_id}`,
      { method: 'GET' }
    );
  },

  async flagForMonitoring(payload: MonitoringFlagRequest): Promise<MonitoringFlagResult> {
    return apiCall<MonitoringFlagResult>(API_ENDPOINTS.monitoringFlag, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async listMonitoringFlags(company_id: string): Promise<MonitoringFlagResult[]> {
    return apiCall<MonitoringFlagResult[]>(
      `${API_ENDPOINTS.listMonitoringFlags}/${company_id}`,
      { method: 'GET' }
    );
  },

  async resolveFlag(flag_id: string): Promise<MonitoringFlagResult> {
    return apiCall<MonitoringFlagResult>(
      `${API_ENDPOINTS.resolveMonitoringFlag}/${flag_id}/resolve`,
      { method: 'PATCH' }
    );
  },
};

// ─── Compliance ───────────────────────────────────────────────────────────────

export const complianceAPI = {
  async runComplianceCheck(payload: ComplianceCheckRequest): Promise<ComplianceCheckResult> {
    return apiCall<ComplianceCheckResult>(API_ENDPOINTS.complianceCheck, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async listComplianceChecks(company_id: string, deal_id: string): Promise<ComplianceCheckResult[]> {
    return apiCall<ComplianceCheckResult[]>(
      `${API_ENDPOINTS.listComplianceChecks}/${company_id}/${deal_id}`,
      { method: 'GET' }
    );
  },

  async addNote(payload: ComplianceNoteRequest): Promise<ComplianceNoteResult> {
    return apiCall<ComplianceNoteResult>(API_ENDPOINTS.addComplianceNote, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async listNotes(company_id: string, deal_id: string): Promise<ComplianceNoteResult[]> {
    return apiCall<ComplianceNoteResult[]>(
      `${API_ENDPOINTS.listComplianceNotes}/${company_id}/${deal_id}`,
      { method: 'GET' }
    );
  },

  async submitReview(payload: ComplianceReviewRequest): Promise<ComplianceReviewResult> {
    return apiCall<ComplianceReviewResult>(API_ENDPOINTS.submitComplianceReview, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
};
