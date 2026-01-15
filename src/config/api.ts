// API Configuration
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Data Extraction
  extractData: '/extractor/extract_data',
  getExtractedData: '/extractor/get_extracted_data',
  updateExtractedData: '/extractor/update_extracted_data',
  
  // Client Details
  checkAndInit: '/client/check_and_init',
  getClientProfile: '/client/get_client_profile',
  updateClientDetails: '/client/update_client_details',
  addNewClient: '/client/add_new_client',
  getAllClients: '/client/get_all_clients',
  
  // Client Company
  getClientCompanies: '/client_company/get_client_companies',
  addClientCompany: '/client_company/add_client_company',
  removeClientCompany: '/client_company/remove_client_company',
  getCompanyDetails: '/client_company/get_company_details',
  updateCompanyDetails: '/client_company/update_company_details',
  
  // Data Grid
  fetchAllPeriodData: '/data_grid/fetch_all_period_data',
  updateGridData: '/data_grid/update_grid_data',
};
