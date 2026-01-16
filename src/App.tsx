import React, { useState, useMemo, useEffect } from "react";
import { Building2, LogOut } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { CompanyList } from "./components/dashboard/CompanyList";
import { CompanyHeader } from "./components/dashboard/CompanyHeader";
import { KeyMetrics } from "./components/dashboard/KeyMetrics";
import { DashboardTabs } from "./components/dashboard/DashboardTabs";
import { InitializeUser } from "./components/auth/InitializeUser";
import { AppProvider, useAppContext } from "./context/AppContext";
import { setTokenGetter } from "./services/api";
import { CellKey, FinancialStatementType, GridSection, UploadedFile } from "./types";

function AppContent() {
  const { isLoading, isAuthenticated, loginWithRedirect, logout, user, getAccessTokenSilently } = useAuth0();
  const [userInitialized, setUserInitialized] = useState(false);
  
  // Setup token getter for API calls and log token
  useEffect(() => {
    if (isAuthenticated) {
      setTokenGetter(getAccessTokenSilently);
      
      // Log the token for testing
      getAccessTokenSilently().then(token => {
        console.log('='.repeat(80));
        console.log('AUTH TOKEN FOR BACKEND TESTING:');
        console.log('='.repeat(80));
        console.log(token);
        console.log('='.repeat(80));
        console.log('Copy the token above to test your backend API');
        console.log('='.repeat(80));
      }).catch(err => {
        console.error('Failed to get token:', err);
      });
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  // Use context for state management
  const {
    companies,
    selectedCompanyId,
    gridData,
    files,
    selectCompany,
    addCompany,
    updateGridData,
    addFiles,
    removeFile,
  } = useAppContext();
  
  // Local UI state
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["rev", "opex", "addback"]));
  const [selectedCells, setSelectedCells] = useState<Set<CellKey>>(new Set());

  // Computed values
  const selectedCompany = useMemo(() => {
    const company = companies.find(c => c.id === selectedCompanyId);
    console.log('🏢 Selected Company Debug:');
    console.log('  - selectedCompanyId:', selectedCompanyId);
    console.log('  - companies:', companies);
    console.log('  - found company:', company);
    console.log('  - company.id:', company?.id);
    return company;
  }, [selectedCompanyId, companies]);

  const filteredDeals = useMemo(() => {
    if (!selectedCompany) return [];
    if (statusFilter === "all") return selectedCompany.deals;
    return selectedCompany.deals.filter(d => d.status.toLowerCase() === statusFilter.toLowerCase());
  }, [selectedCompany, statusFilter]);

  const selectedSum = useMemo(() => {
    let sum = 0;
    selectedCells.forEach(key => {
      const [rowId, period] = key.split(":");
      gridData.forEach(section => {
        if (section.children) {
          const row = section.children.find(r => r.id === rowId);
          if (row && period in row) {
            sum += (row as any)[period];
          }
        }
      });
    });
    return sum;
  }, [selectedCells, gridData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#fafafa' }}>
        <div className="text-center space-y-6" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          <Building2 className="h-16 w-16 text-blue-600 mx-auto" style={{ width: '64px', height: '64px' }} />
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2" style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#171717', marginBottom: '0.5rem' }}>Financial Report UI</h1>
            <p className="text-neutral-600 text-lg" style={{ fontSize: '1.125rem', color: '#525252' }}>Please sign in to continue</p>
          </div>
          <button
            onClick={() => loginWithRedirect()}
            className="mt-4 px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition cursor-pointer"
            style={{ 
              marginTop: '1rem',
              padding: '0.75rem 2rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '1.125rem',
              fontWeight: '600',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!userInitialized) {
    return <InitializeUser onUserReady={() => setUserInitialized(true)} />;
  }

  // Grid functions
  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleCell = (cellKey: CellKey) => {
    setSelectedCells(prev => {
      const next = new Set(prev);
      if (next.has(cellKey)) {
        next.delete(cellKey);
      } else {
        next.add(cellKey);
      }
      return next;
    });
  };

  const clearCellSelection = () => {
    setSelectedCells(new Set());
  };

  // File management functions
  const handleAddFiles = (newFiles: UploadedFile[]) => {
    addFiles(newFiles);
  };

  const handleRemoveFile = (idx: number) => {
    removeFile(idx);
  };

  const handleUpdateFileStatementType = (idx: number, statementType: FinancialStatementType) => {
    // This is handled locally, no need to update context for this simple change
    // The files state is managed in context but this just updates the UI
  };

  const handleUpdateGridData = (newData: GridSection[]) => {
    if (selectedCompanyId) {
      updateGridData(selectedCompanyId, newData);
    }
    // Clear selected cells when grid data changes to avoid invalid selections
    setSelectedCells(new Set());
  };

  const handleExportData = (exportedData: any) => {
    console.log('📤 Exported data from Edit Extraction:', exportedData);
    
    if (!exportedData || !Array.isArray(exportedData)) return;

    // Transform table data into grid format
    const transformedData: GridSection[] = [];
    const revenueChildren: any[] = [];
    const opexChildren: any[] = [];
    const addbackChildren: any[] = [];

    exportedData.forEach((row: any) => {
      const col0 = row['0'] || '';
      const col1 = row['1'] || '';
      const col2 = row['2'] || '';
      
      // Parse account name and value
      const accountName = col1.trim() || col0.trim();
      const valueStr = col2.replace(/,/g, '').trim();
      const value = valueStr && !isNaN(parseFloat(valueStr)) ? parseFloat(valueStr) : 0;

      // Skip empty rows, headers, and subtotals
      if (!accountName || 
          accountName.includes('Profit & Loss') || 
          accountName.includes('Accrual Basis') ||
          accountName.includes('Income/Expense') ||
          accountName.includes('Hotels') ||
          accountName === 'Income' ||
          accountName === 'Expense' ||
          accountName === 'Other Expense' ||
          accountName.startsWith('Total ') ||
          accountName.startsWith('Net ') ||
          accountName.startsWith('Gross ')) {
        return;
      }

      // Categorize items
      if (accountName.toLowerCase().includes('sales') || 
          accountName.toLowerCase().includes('revenue') ||
          accountName.toLowerCase().includes('income')) {
        revenueChildren.push({
          id: accountName.toLowerCase().replace(/\s+/g, '-'),
          account: accountName,
          y2023: 0,
          y2024: value,
          ytd2025: 0
        });
      } else if (accountName.toLowerCase().includes('depreciation') ||
                 accountName.toLowerCase().includes('amortization') ||
                 accountName.toLowerCase().includes('interest expense')) {
        addbackChildren.push({
          id: accountName.toLowerCase().replace(/\s+/g, '-'),
          account: accountName,
          y2023: 0,
          y2024: value,
          ytd2025: 0
        });
      } else if (value > 0) {
        opexChildren.push({
          id: accountName.toLowerCase().replace(/\s+/g, '-'),
          account: accountName,
          y2023: 0,
          y2024: value,
          ytd2025: 0
        });
      }
    });

    // Build sections
    if (revenueChildren.length > 0) {
      transformedData.push({
        id: 'rev',
        category: 'Revenue',
        isParent: true,
        children: revenueChildren
      });
    }

    if (opexChildren.length > 0) {
      transformedData.push({
        id: 'opex',
        category: 'Operating Expenses',
        isParent: true,
        children: opexChildren
      });
    }

    if (addbackChildren.length > 0) {
      transformedData.push({
        id: 'addback',
        category: 'Add-backs',
        isParent: true,
        children: addbackChildren
      });
    }

    console.log('📊 Transformed grid data:', transformedData);
    
    // Update the grid data
    if (transformedData.length > 0 && selectedCompanyId) {
      updateGridData(selectedCompanyId, transformedData);
    }
  };

  // Add company function
  const handleAddCompany = async (companyData: any) => {
    try {
      await addCompany(companyData);
    } catch (error) {
      console.error('Failed to add company:', error);
      alert('Failed to add company. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <DashboardHeader 
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* User Info Bar */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <div className="text-sm">
          <span className="text-neutral-600">Logged in as </span>
          <span className="font-semibold text-neutral-900">{user?.email}</span>
        </div>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="flex items-center gap-2 px-3 py-1 text-sm text-neutral-600 hover:text-neutral-900 transition"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left Sidebar - Company List */}
          <div className="space-y-4">
            <CompanyList
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              onSelectCompany={(id) => selectCompany(id)}
              onAddCompany={handleAddCompany}
            />
          </div>

          {/* Main Content */}
          {selectedCompany ? (
            <div className="space-y-6">
              <CompanyHeader company={selectedCompany} />
              
              <KeyMetrics deals={selectedCompany.deals} />

              <DashboardTabs
                deals={filteredDeals}
                gridData={gridData}
                expandedRows={expandedRows}
                selectedCells={selectedCells}
                files={files}
                selectedSum={selectedSum}
                companyId={selectedCompany.id || "company_1"}
                onToggleRow={toggleRow}
                onToggleCell={toggleCell}
                onClearSelection={clearCellSelection}
                onAddFiles={handleAddFiles}
                onRemoveFile={handleRemoveFile}
                onUpdateFileStatementType={handleUpdateFileStatementType}
                onUpdateGridData={handleUpdateGridData}
                onExportData={handleExportData}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12">
              <Building2 className="mb-4 h-12 w-12 text-neutral-300" />
              <div className="text-neutral-500">Select a company to view details</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
