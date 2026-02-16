import { useState } from "react";
import { FileText, TrendingUp, Grid3x3, Upload, Calculator, FileEdit } from "lucide-react";
import { Tabs, Tab, Box } from "@mui/material";
import { Deal, GridSection, UploadedFile, CellKey, FinancialStatementType } from "../../types";
import { DealsTab } from "./tabs/DealsTab";
import { FinancialsTab } from "./tabs/FinancialsTab";
import { DataGridTab } from "./tabs/DataGridTab";
import { UploadTab } from "./tabs/UploadTab";
import { EditExtractionTab } from "./tabs/EditExtractionTab";
import { AnalysisTab } from "./tabs/AnalysisTab";
import type { DashboardTabsProps } from "../../types/interfaces";

export function DashboardTabs({
  deals,
  gridData,
  expandedRows,
  selectedCells,
  files,
  selectedSum,
  companyId,
  clientId,
  getAccessToken,
  onToggleRow,
  onToggleCell,
  onClearSelection,
  onAddFiles,
  onRemoveFile,
  onUpdateFileStatementType,
  onUpdateGridData,
  onExportData
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ mt: 2 }}>
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto">
        <Tab icon={<FileText style={{ width: 16, height: 16 }} />} label="Deal History" iconPosition="start" />
        <Tab icon={<TrendingUp style={{ width: 16, height: 16 }} />} label="Financial Trends" iconPosition="start" />
        <Tab icon={<Grid3x3 style={{ width: 16, height: 16 }} />} label="Hierarchy Grid" iconPosition="start" />
        <Tab icon={<Upload style={{ width: 16, height: 16 }} />} label="Documents" iconPosition="start" />
        <Tab icon={<FileEdit style={{ width: 16, height: 16 }} />} label="Edit Extraction" iconPosition="start" />
        <Tab icon={<Calculator style={{ width: 16, height: 16 }} />} label="Analysis" iconPosition="start" />
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && <DealsTab deals={deals} />}
        {activeTab === 1 && <FinancialsTab deals={deals} />}
        {activeTab === 2 && (
          <DataGridTab
            gridData={gridData}
            expandedRows={expandedRows}
            selectedCells={selectedCells}
            onToggleRow={onToggleRow}
            onToggleCell={onToggleCell}
            onClearSelection={onClearSelection}
            selectedSum={selectedSum}
            onUpdateGridData={onUpdateGridData}
            companyId={companyId}
            clientId={clientId}
            getAccessToken={getAccessToken}
          />
        )}
        {activeTab === 3 && (
          <UploadTab
            files={files}
            onAddFiles={onAddFiles}
            onRemoveFile={onRemoveFile}
            onUpdateFileStatementType={onUpdateFileStatementType}
            companyId={companyId}
          />
        )}
        {activeTab === 4 && <EditExtractionTab companyId={companyId} clientId={clientId} files={files} onTabChange={setActiveTab} onExportData={onExportData} />}
        {activeTab === 5 && <AnalysisTab gridData={gridData} />}
      </Box>
    </Box>
  );
}
