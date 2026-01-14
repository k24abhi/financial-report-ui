import React, { useState, useMemo } from "react";
import { Building2, LogOut } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { CompanyList } from "./components/dashboard/CompanyList";
import { CompanyHeader } from "./components/dashboard/CompanyHeader";
import { KeyMetrics } from "./components/dashboard/KeyMetrics";
import { DashboardTabs } from "./components/dashboard/DashboardTabs";
import { InitializeUser } from "./components/auth/InitializeUser";
import { companies as initialCompanies, mockGridData } from "./data/mockData";
import { Company, UploadedFile, CellKey, NewCompanyForm, FinancialStatementType, GridSection } from "./types";

export default function App() {
  const { isLoading, isAuthenticated, loginWithRedirect, logout, user, getAccessTokenSilently } = useAuth0();
  const [userInitialized, setUserInitialized] = useState(false);
  
  // All state declarations MUST be before any conditional returns
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [companiesList, setCompaniesList] = useState<Company[]>(initialCompanies);
  const [gridData, setGridData] = useState<GridSection[]>(mockGridData);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["rev", "opex", "addback"]));
  const [selectedCells, setSelectedCells] = useState<Set<CellKey>>(new Set());
  const [files, setFiles] = useState<UploadedFile[]>([
    { name: "P&L_2024.pdf", size: 1024*1024*2.1, type:"application/pdf", status: "parsed", statementType: "Annual" },
    { name: "STR_Report_Q3_2025.pdf", size: 1024*640, type:"application/pdf", status: "parsed", statementType: "Q3" },
  ]);

  // All useMemo MUST come before any conditional returns
  const selectedCompany = useMemo(() => {
    return companiesList.find(c => c.id === selectedCompanyId);
  }, [selectedCompanyId, companiesList]);

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
    setFiles(prev => [...newFiles, ...prev]);
  };

  const handleRemoveFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateFileStatementType = (idx: number, statementType: FinancialStatementType) => {
    setFiles(prev => prev.map((file, i) => 
      i === idx ? { ...file, statementType } : file
    ));
  };

  const handleUpdateGridData = (newData: GridSection[]) => {
    setGridData(newData);
    // Clear selected cells when grid data changes to avoid invalid selections
    setSelectedCells(new Set());
  };

  // Add company function
  const handleAddCompany = (companyData: NewCompanyForm) => {
    const newId = Math.max(...companiesList.map(c => c.id)) + 1;
    const companyToAdd: Company = {
      id: newId,
      ...companyData,
      deals: []
    };

    setCompaniesList([...companiesList, companyToAdd]);
    setSelectedCompanyId(newId);
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
              companies={companiesList}
              selectedCompanyId={selectedCompanyId}
              onSelectCompany={setSelectedCompanyId}
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
                companyId={selectedCompany.id.toString()}
                onToggleRow={toggleRow}
                onToggleCell={toggleCell}
                onClearSelection={clearCellSelection}
                onAddFiles={handleAddFiles}
                onRemoveFile={handleRemoveFile}
                onUpdateFileStatementType={handleUpdateFileStatementType}
                onUpdateGridData={handleUpdateGridData}
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