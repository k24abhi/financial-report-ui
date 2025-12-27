import React, { useState, useMemo } from "react";
import { Building2 } from "lucide-react";
import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { CompanyList } from "./components/dashboard/CompanyList";
import { CompanyHeader } from "./components/dashboard/CompanyHeader";
import { KeyMetrics } from "./components/dashboard/KeyMetrics";
import { DashboardTabs } from "./components/dashboard/DashboardTabs";
import { companies as initialCompanies, mockGridData } from "./data/mockData";
import { Company, UploadedFile, CellKey, NewCompanyForm } from "./types";

export default function App() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [companiesList, setCompaniesList] = useState<Company[]>(initialCompanies);
  
  // Grid features
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["rev", "opex", "addback"]));
  const [selectedCells, setSelectedCells] = useState<Set<CellKey>>(new Set());
  
  // Upload features
  const [files, setFiles] = useState<UploadedFile[]>([
    { name: "P&L_2024.pdf", size: 1024*1024*2.1, type:"application/pdf", status: "parsed" },
    { name: "STR_Report_Q3_2025.pdf", size: 1024*640, type:"application/pdf", status: "parsed" },
  ]);

  const selectedCompany = useMemo(() => {
    return companiesList.find(c => c.id === selectedCompanyId);
  }, [selectedCompanyId, companiesList]);

  const filteredDeals = useMemo(() => {
    if (!selectedCompany) return [];
    if (statusFilter === "all") return selectedCompany.deals;
    return selectedCompany.deals.filter(d => d.status.toLowerCase() === statusFilter.toLowerCase());
  }, [selectedCompany, statusFilter]);

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

  const selectedSum = useMemo(() => {
    let sum = 0;
    selectedCells.forEach(key => {
      const [rowId, period] = key.split(":");
      mockGridData.forEach(section => {
        if (section.children) {
          const row = section.children.find(r => r.id === rowId);
          if (row && period in row) {
            sum += (row as any)[period];
          }
        }
      });
    });
    return sum;
  }, [selectedCells]);

  // File management functions
  const handleAddFiles = (newFiles: UploadedFile[]) => {
    setFiles(prev => [...newFiles, ...prev]);
  };

  const handleRemoveFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
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
                gridData={mockGridData}
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