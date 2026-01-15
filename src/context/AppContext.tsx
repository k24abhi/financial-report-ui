import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { clientCompanyService, CompanyId } from '../services/client_company_service';
import { authService } from '../services/auth_service';
import { dataGridAPI } from '../services/api';
import type { Company, GridSection, UploadedFile } from '../types';

interface AppContextType {
  // Client Data
  clientId: string | null;
  companies: Company[];
  selectedCompanyId: string | null;
  isLoadingCompanies: boolean;
  
  // Grid Data
  gridData: GridSection[];
  isLoadingGrid: boolean;
  
  // Files
  files: UploadedFile[];
  
  // Actions
  loadCompanies: () => Promise<void>;
  selectCompany: (id: string | null) => void;
  addCompany: (companyData: any) => Promise<Company>;
  removeCompany: (companyId: string) => Promise<void>;
  updateCompanyDetails: (companyId: string, data: any) => Promise<void>;
  loadGridData: (companyId: string) => Promise<void>;
  updateGridData: (companyId: string, data: GridSection[]) => Promise<void>;
  addFiles: (newFiles: UploadedFile[]) => void;
  removeFile: (index: number) => void;
  updateFileStatus: (index: number, status: string, extractedData?: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  
  const [clientId, setClientId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  
  const [gridData, setGridData] = useState<GridSection[]>([]);
  const [isLoadingGrid, setIsLoadingGrid] = useState(false);
  
  const [files, setFiles] = useState<UploadedFile[]>([]);

  // Load client profile and get clientId
  useEffect(() => {
    const loadClientProfile = async () => {
      if (!isAuthenticated) return;
      
      try {
        const token = await getAccessTokenSilently();
        const profile = await authService.fetchClientProfile(token);
        if (profile?.client_id) {
          setClientId(profile.client_id);
        }
      } catch (error) {
        console.error('Failed to load client profile:', error);
      }
    };

    loadClientProfile();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Load companies when clientId is available
  useEffect(() => {
    if (clientId) {
      loadCompanies();
    }
  }, [clientId]);

  // Load grid data when company is selected
  useEffect(() => {
    if (clientId && selectedCompanyId) {
      loadGridData(selectedCompanyId);
    } else {
      setGridData([]);
    }
  }, [clientId, selectedCompanyId]);

  const loadCompanies = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingCompanies(true);
    try {
      const token = await getAccessTokenSilently();
      const companyIds = await clientCompanyService.getClientCompanies(token);
      
      // Load details for each company
      const companyDetailsPromises = companyIds.map(id =>
        clientCompanyService.getCompanyDetails(token, id)
      );
      
      const loadedCompanies = await Promise.all(companyDetailsPromises);
      setCompanies(loadedCompanies);
      
      // Select first company if none selected
      if (!selectedCompanyId && loadedCompanies.length > 0) {
        setSelectedCompanyId(loadedCompanies[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setIsLoadingCompanies(false);
    }
  }, [isAuthenticated, getAccessTokenSilently, selectedCompanyId]);

  const selectCompany = useCallback((id: string | null) => {
    setSelectedCompanyId(id);
    setFiles([]); // Clear files when switching companies
  }, []);

  const addCompany = useCallback(async (companyData: any): Promise<Company> => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    
    const token = await getAccessTokenSilently();
    const newCompany = await clientCompanyService.addClientCompany(token, companyData);
    
    setCompanies(prev => [...prev, newCompany]);
    setSelectedCompanyId(newCompany.id.toString());
    
    return newCompany;
  }, [isAuthenticated, getAccessTokenSilently]);

  const removeCompany = useCallback(async (companyId: string) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    
    const token = await getAccessTokenSilently();
    await clientCompanyService.removeClientCompany(token, companyId);
    
    setCompanies(prev => prev.filter(c => c.id.toString() !== companyId));
    
    if (selectedCompanyId === companyId) {
      const remaining = companies.filter(c => c.id.toString() !== companyId);
      setSelectedCompanyId(remaining.length > 0 ? remaining[0].id.toString() : null);
    }
  }, [isAuthenticated, getAccessTokenSilently, companies, selectedCompanyId]);

  const updateCompanyDetails = useCallback(async (companyId: string, data: any) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    
    const token = await getAccessTokenSilently();
    const updated = await clientCompanyService.updateCompanyDetails(token, companyId, data);
    
    setCompanies(prev => prev.map(c => 
      c.id.toString() === companyId ? updated : c
    ));
  }, [isAuthenticated, getAccessTokenSilently]);

  const loadGridData = useCallback(async (companyId: string) => {
    if (!isAuthenticated || !clientId) return;
    
    setIsLoadingGrid(true);
    try {
      const response: any = await dataGridAPI.fetchAllPeriodData(clientId, companyId);
      
      if (response.status === 'success' && response.data) {
        // Transform API response to GridSection format if needed
        const gridSections = transformGridData(response.data);
        setGridData(gridSections);
      } else {
        setGridData([]);
      }
    } catch (error) {
      console.error('Failed to load grid data:', error);
      setGridData([]);
    } finally {
      setIsLoadingGrid(false);
    }
  }, [isAuthenticated, clientId]);

  const updateGridData = useCallback(async (companyId: string, data: GridSection[]) => {
    if (!isAuthenticated || !clientId) return;
    
    try {
      // Update local state immediately
      setGridData(data);
      
      // Transform and send to API
      const payload = transformGridDataForAPI(data);
      await dataGridAPI.updateGridData(clientId, companyId, payload);
    } catch (error) {
      console.error('Failed to update grid data:', error);
      // Optionally reload data on error
      await loadGridData(companyId);
    }
  }, [isAuthenticated, clientId, loadGridData]);

  const addFiles = useCallback((newFiles: UploadedFile[]) => {
    setFiles(prev => [...newFiles, ...prev]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateFileStatus = useCallback((index: number, status: string, extractedData?: any) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, status, extractedData } : file
    ));
  }, []);

  const value: AppContextType = {
    clientId,
    companies,
    selectedCompanyId,
    isLoadingCompanies,
    gridData,
    isLoadingGrid,
    files,
    loadCompanies,
    selectCompany,
    addCompany,
    removeCompany,
    updateCompanyDetails,
    loadGridData,
    updateGridData,
    addFiles,
    removeFile,
    updateFileStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Helper function to transform API grid data to UI format
function transformGridData(apiData: any): GridSection[] {
  if (!apiData.grid_data || !Array.isArray(apiData.grid_data)) {
    return [];
  }

  // Group rows by category
  const categoriesMap = new Map<string, GridRow[]>();
  
  apiData.grid_data.forEach((row: any) => {
    const category = row['0'] || 'Other'; // Column 0 is the category/label
    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, []);
    }
    
    // Convert row data to GridRow format
    const gridRow: GridRow = {
      id: `row_${row.id || Math.random()}`,
      account: category,
      y2023: parseFloat(row['1'] || 0),
      y2024: parseFloat(row['2'] || 0),
      ytd2025: parseFloat(row['3'] || 0),
    };
    
    categoriesMap.get(category)!.push(gridRow);
  });

  // Convert to GridSection array
  return Array.from(categoriesMap.entries()).map(([category, rows], index) => ({
    id: `section_${index}`,
    category,
    isParent: true as const,
    children: rows,
  }));
}

// Helper function to transform UI grid data to API format
function transformGridDataForAPI(gridSections: GridSection[]): any {
  const grid_data: any[] = [];
  const col_period_mapping: any = {
    '1': { date: '2023-12-31', period_type: 'A', length: 12 },
    '2': { date: '2024-12-31', period_type: 'A', length: 12 },
    '3': { date: '2025-06-30', period_type: 'YTD', length: 6 },
  };

  let rowIndex = 0;
  gridSections.forEach(section => {
    section.children.forEach(row => {
      grid_data.push({
        id: rowIndex++,
        '0': row.account,
        '1': row.y2023.toString(),
        '2': row.y2024.toString(),
        '3': row.ytd2025.toString(),
      });
    });
  });

  return {
    grid_data,
    header_columns: ['0'],
    col_period_mapping,
  };
}

interface GridRow {
  id: string;
  account: string;
  y2023: number;
  y2024: number;
  ytd2025: number;
}
