import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import type { Company, NewCompanyForm } from '../types';

export type CompanyId = string | number;

function toCompany(detail: any): Company {
  console.log('🔍 Backend company detail response:', detail);
  
  // Map backend details to UI Company type
  const companyId = detail?.company_id ?? detail?.id;
  console.log('  - Extracted company_id:', companyId);
  
  return {
    id: companyId || `temp-${Date.now()}`,
    name: detail?.company_name ?? detail?.name ?? 'Unknown Company',
    type: detail?.type ?? 'Unknown',
    location: detail?.address ?? detail?.location ?? 'Unknown',
    industry: detail?.industry ?? 'Unknown',
    borrower: detail?.borrower ?? 'Unknown',
    deals: Array.isArray(detail?.deals) ? detail.deals : [],
  } as Company;
}

export const clientCompanyService = {
  async getClientCompanies(accessToken: string): Promise<CompanyId[]> {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.getClientCompanies}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(accessToken, res)
    if (!res.ok) throw new Error('Failed to fetch client companies');
    const data = await res.json();
    return data?.company_ids ?? [];
  },

  async getCompanyDetails(accessToken: string, companyId: CompanyId): Promise<Company> {
    const url = `${API_BASE_URL}${API_ENDPOINTS.getCompanyDetails}?company_id=${companyId}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error('Failed to fetch company details');
    const data = await res.json();
    const detail = data?.company_details ?? data?.company ?? data;
    return toCompany(detail);
  },

  async addClientCompany(accessToken: string, payload: Record<string, any>): Promise<Company> {
    // Map UI fields to API expected fields
    const apiPayload = {
      company_name: payload.name || payload.company_name,
      address: payload.location || payload.address,
      industry: payload.industry
    };
    
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.addClientCompany}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });
    if (!res.ok) {
      try {
        const errBody = await res.text();
        console.error('Add company failed:', res.status, errBody);
      } catch (_) {}
      throw new Error('Failed to add client company');
    }
    const data = await res.json();
    const newId = data?.company_id ?? data?.id ?? undefined;
    if (newId === undefined) {
      // If backend returns the full company in response
      const detail = data?.company ?? data;
      return toCompany(detail);
    }
    // Fetch details by id
    return await this.getCompanyDetails(accessToken, newId);
  },

  async removeClientCompany(accessToken: string, companyId: CompanyId): Promise<void> {
    // Try query string first
    const url = `${API_BASE_URL}${API_ENDPOINTS.removeClientCompany}?company_id=${companyId}`;
    const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
    if (res.ok) return;
    // Fallback: send JSON body
    const res2 = await fetch(`${API_BASE_URL}${API_ENDPOINTS.removeClientCompany}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ company_id: companyId }),
    });
    if (!res2.ok) throw new Error('Failed to remove client company');
  },

  async updateCompanyDetails(accessToken: string, companyId: CompanyId, payload: Partial<NewCompanyForm>): Promise<Company> {
    // Map UI fields to API expected fields
    const apiPayload = {
      company_name: payload.name,
      address: payload.location,
      industry: payload.industry
    };
    
    const url = `${API_BASE_URL}${API_ENDPOINTS.updateCompanyDetails}?company_id=${companyId}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });
    if (!res.ok) throw new Error('Failed to update company');
    const data = await res.json();
    const detail = data?.company ?? data;
    return toCompany(detail);
  },
};
