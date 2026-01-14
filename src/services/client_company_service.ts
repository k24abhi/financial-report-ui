const API_BASE_URL = 'http://127.0.0.1:8000';

import type { Company, NewCompanyForm } from '../types';

export type CompanyId = string | number;

function toCompany(detail: any): Company {
  // Map backend details to UI Company type
  return {
    id: Number(detail?.company_id ?? detail?.id ?? Math.floor(Math.random()*100000)),
    name: detail?.name ?? 'Unknown Company',
    type: detail?.type ?? 'Unknown',
    location: detail?.location ?? 'Unknown',
    industry: detail?.industry ?? 'Unknown',
    borrower: detail?.borrower ?? 'Unknown',
    deals: Array.isArray(detail?.deals) ? detail.deals : [],
  } as Company;
}

export const clientCompanyService = {
  async getClientCompanies(accessToken: string): Promise<CompanyId[]> {
    const res = await fetch(`${API_BASE_URL}/client_company/get_client_companies`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(accessToken, res)
    if (!res.ok) throw new Error('Failed to fetch client companies');
    const data = await res.json();
    return data?.company_ids ?? [];
  },

  async getCompanyDetails(accessToken: string, companyId: CompanyId): Promise<Company> {
    const url = `${API_BASE_URL}/client_company/get_company_details?company_id=${companyId}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error('Failed to fetch company details');
    const data = await res.json();
    const detail = data?.company ?? data; // try both shapes
    return toCompany(detail);
  },

  async addClientCompany(accessToken: string, payload: Record<string, any>): Promise<Company> {
    const res = await fetch(`${API_BASE_URL}/client_company/add_client_company`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
    const url = `${API_BASE_URL}/client_company/remove_client_company?company_id=${companyId}`;
    const res = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
    if (res.ok) return;
    // Fallback: send JSON body
    const res2 = await fetch(`${API_BASE_URL}/client_company/remove_client_company`, {
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
    const res = await fetch(`${API_BASE_URL}/client_company/update_company_details`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ company_id: companyId, ...payload }),
    });
    if (!res.ok) throw new Error('Failed to update company');
    const data = await res.json();
    const detail = data?.company ?? data;
    return toCompany(detail);
  },
};
