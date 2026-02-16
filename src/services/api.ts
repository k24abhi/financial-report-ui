import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type { ExtractDataParams, ExtractedData, ClientDetails, CompanyDetails } from '../types/interfaces';

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

  // Get available periods for a company
  async getAvailablePeriods(
    company_id: string,
    client_id: string
  ): Promise<{ status: string; data: Array<{period: string, period_type: string}> }> {
    const queryParams = new URLSearchParams({
      company_id,
      client_id,
    });

    return apiCall(
      `${API_ENDPOINTS.getAvailablePeriods}?${queryParams}`,
      {
        method: 'GET',
      }
    );
  },

  // Get extracted data for a specific period
  async getExtractedDataByPeriod(
    company_id: string,
    client_id: string,
    period?: string
  ): Promise<any> {
    const queryParams = new URLSearchParams({
      company_id,
      client_id,
    });
    
    if (period) {
      queryParams.append('period', period);
    }

    return apiCall(
      `${API_ENDPOINTS.getExtractedDataByPeriod}?${queryParams}`,
      {
        method: 'GET',
      }
    );
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

  async getAllClients() {
    return apiCall(API_ENDPOINTS.getAllClients, {
      method: 'GET',
    });
  },
};

// Company Services
export const companyAPI = {
  async getClientCompanies(client_id: string) {
    const queryParams = new URLSearchParams({ client_id });
    return apiCall(`${API_ENDPOINTS.getClientCompanies}?${queryParams}`, {
      method: 'GET',
    });
  },

  async addClientCompany(client_id: string, companyData: Omit<CompanyDetails, 'client_id'>) {
    const queryParams = new URLSearchParams({ client_id });
    return apiCall(`${API_ENDPOINTS.addClientCompany}?${queryParams}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyData),
    });
  },

  async getCompanyDetails(client_id: string, company_id: string) {
    const queryParams = new URLSearchParams({ client_id, company_id });
    return apiCall(`${API_ENDPOINTS.getCompanyDetails}?${queryParams}`, {
      method: 'GET',
    });
  },

  async updateCompanyDetails(
    client_id: string,
    company_id: string,
    companyData: Omit<CompanyDetails, 'client_id'>
  ) {
    const queryParams = new URLSearchParams({ client_id, company_id });
    return apiCall(`${API_ENDPOINTS.updateCompanyDetails}?${queryParams}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyData),
    });
  },
};

// Hierarchy Grid Services
export const dataGridAPI = {
  async fetchAllPeriodData(client_id: string, company_id: string) {
    const queryParams = new URLSearchParams({ client_id, company_id });
    return apiCall(`${API_ENDPOINTS.fetchAllPeriodData}?${queryParams}`, {
      method: 'GET',
    });
  },

  async updateGridData(client_id: string, company_id: string, payload: any) {
    const queryParams = new URLSearchParams({ client_id, company_id });
    return apiCall(`${API_ENDPOINTS.updateGridData}?${queryParams}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },
};
