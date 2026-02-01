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

  const handleExportData = (exportedData: any, metadata?: { date?: string; periodType?: string }) => {
    console.log('📤 Exported data from Edit Extraction:', exportedData);
    console.log('📅 Metadata:', metadata);
    
    if (!exportedData || !Array.isArray(exportedData)) return;

    // Require period date from the exported file/metadata — do not assume a default year
    const periodDate = metadata?.date;
    if (!periodDate) {
      console.warn('Export aborted: missing period date in metadata.');
      // Inform the user to set the period date in Edit Extraction before exporting
      alert('Please set a period date in Edit Extraction (or select a parsed file) before exporting to the Data Grid.');
      return;
    }

    const targetYear = new Date(periodDate).getFullYear();
    console.log('📊 Target year:', targetYear);

    // Transform and MERGE table data into existing grid format (preserve other years)
    const mapCategory = (accountName: string) => {
      const lower = accountName.toLowerCase();
      if (lower.includes('sales') || lower.includes('revenue') || lower.includes('income')) return 'Revenue';
      if (lower.includes('depreciation') || lower.includes('amortization') || lower.includes('interest expense')) return 'Add-backs';
      return 'Operating Expenses';
    };

    // Helper to sanitize account and value
    const parseRow = (row: any) => {
      const keys = Object.keys(row).filter(k => k !== undefined).sort((a, b) => parseInt(a) - parseInt(b));

      // Account name: first non-empty left-most text-like cell
      let accountName = '';
      for (let i = 0; i < Math.min(2, keys.length); i++) {
        const v = row[keys[i]];
        if (v !== undefined && v !== null && v.toString().trim() !== '') {
          accountName = v.toString().trim();
          break;
        }
      }

      // Value: find the right-most cell that looks numeric
      let value = 0;
      for (let i = keys.length - 1; i >= 0; i--) {
        const raw = row[keys[i]];
        if (raw === undefined || raw === null) continue;
        const s = raw.toString().trim();
        if (!s) continue;

        // Detect digits or parentheses indicating a number
        if (/[0-9]/.test(s)) {
          // Remove non-number characters except . and - and parentheses
          const cleaned = s.replace(/[^0-9.\-()]/g, '');
          // Handle parentheses as negative numbers
          const negative = cleaned.includes('(') && cleaned.includes(')');
          const numericStr = cleaned.replace(/[()]/g, '');
          const parsed = parseFloat(numericStr);
          if (!isNaN(parsed)) {
            value = negative ? -parsed : parsed;
            break;
          }
        }
      }

      return { accountName, value };
    };

    // Start from existing grid data (clone)
    const baseGrid = JSON.parse(JSON.stringify(gridData || [])) as GridSection[];

    // Ensure standard sections exist
    const getSectionByCategory = (category: string) => baseGrid.find(s => s.category === category);
    const ensureSection = (category: string) => {
      let s = getSectionByCategory(category);
      if (!s) {
        s = { id: category.toLowerCase().slice(0,6), category, isParent: true, children: [] } as GridSection;
        baseGrid.push(s);
      }
      return s;
    };

    exportedData.forEach((row: any) => {
      const { accountName, value } = parseRow(row);

      if (!accountName) return;
      // Skip obvious header/total rows
      const skipIf = ['profit & loss','accrual basis','income/expense','hotels','income','expense','other expense'];
      if (skipIf.some(p => accountName.toLowerCase().includes(p))) return;
      if (accountName.startsWith('Total ') || accountName.startsWith('Net ') || accountName.startsWith('Gross ')) return;

      const category = mapCategory(accountName);
      const section = ensureSection(category);

      const id = accountName.toLowerCase().replace(/\s+/g, '-');

      // Find existing row by id (use index to avoid "possibly undefined" narrow)
      let existingIndex = section.children.findIndex((c: any) => c.id === id || c.account === accountName);
      if (existingIndex === -1) {
        const newRow = { id, account: accountName, y2023: 0, y2024: 0, ytd2025: 0 } as any;
        section.children.push(newRow);
        existingIndex = section.children.length - 1;
      }

      const existing = section.children[existingIndex] as any;

      // Set the value for the target year (replace existing value for that year)
      if (targetYear === 2023) existing.y2023 = value;
      if (targetYear === 2024) existing.y2024 = value;
      if (targetYear === 2025) existing.ytd2025 = value;
    });

    // Sort children within sections by account name for determinism
    baseGrid.forEach(s => {
      s.children.sort((a: any, b: any) => a.account.localeCompare(b.account));
    });

    console.log('📊 Merged transformed grid data:', baseGrid);

    if (baseGrid.length > 0 && selectedCompanyId) {
      updateGridData(selectedCompanyId, baseGrid);
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
