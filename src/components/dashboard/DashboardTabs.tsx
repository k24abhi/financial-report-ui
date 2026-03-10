import { useState, useCallback } from "react";
import {
  FileText, TrendingUp, Grid3x3, Upload, Calculator, FileEdit,
  ShieldCheck, ClipboardList, Scale, Activity, PlusCircle,
} from "lucide-react";
import { Tabs, Tab, Box } from "@mui/material";
import { Deal, GridSection, UploadedFile, CellKey, FinancialStatementType } from "../../types";
import { TreeNode } from "../../services/tree_service";
import { DealsTab } from "./tabs/DealsTab";
import { FinancialsTab } from "./tabs/FinancialsTab";
import { DataGridTab } from "./tabs/DataGridTab";
import { UploadTab } from "./tabs/UploadTab";
import { EditExtractionTab } from "./tabs/EditExtractionTab";
import { AnalysisTab } from "./tabs/AnalysisTab";
import { RiskAssessmentTab } from "./tabs/RiskAssessmentTab";
import { ApplicationReviewTab } from "./tabs/ApplicationReviewTab";
import { ComplianceTab } from "./tabs/ComplianceTab";
import { ReportsTab } from "./tabs/ReportsTab";
import { CreateDealTab } from "./tabs/CreateDealTab";
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

  // Tree data state — populated when TreeView loads or saves
  const [treeRoots, setTreeRoots] = useState<TreeNode[]>([]);
  const [treePeriods, setTreePeriods] = useState<{ period: string; periodType: string }[]>([]);
  // Locally created deals (supplement the deals prop from the company record)
  const [localDeals, setLocalDeals] = useState<Deal[]>([]);

  const allDeals = [...deals, ...localDeals];

  const handleTreeSaveComplete = useCallback((roots: TreeNode[], periods: { period: string; periodType: string }[]) => {
    setTreeRoots(roots);
    setTreePeriods(periods);
  }, []);

  const handleDealCreated = useCallback((deal: Deal) => {
    setLocalDeals(prev => [...prev, deal]);
    // Switch to Deals tab to show the new deal
    setActiveTab(0);
  }, []);

  return (
    <Box sx={{ mt: 2 }}>
      <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto">
        <Tab icon={<FileText style={{ width: 16, height: 16 }} />} label="Deal History" iconPosition="start" />
        <Tab icon={<TrendingUp style={{ width: 16, height: 16 }} />} label="Financial Trends" iconPosition="start" />
        <Tab icon={<Grid3x3 style={{ width: 16, height: 16 }} />} label="Hierarchy Grid" iconPosition="start" />
        <Tab icon={<Upload style={{ width: 16, height: 16 }} />} label="Documents" iconPosition="start" />
        <Tab icon={<FileEdit style={{ width: 16, height: 16 }} />} label="Edit Extraction" iconPosition="start" />
        <Tab icon={<PlusCircle style={{ width: 16, height: 16 }} />} label="Create Deal" iconPosition="start" />
        <Tab icon={<Calculator style={{ width: 16, height: 16 }} />} label="Analysis" iconPosition="start" />
        <Tab icon={<ShieldCheck style={{ width: 16, height: 16 }} />} label="Risk Assessment" iconPosition="start" />
        {/* <Tab icon={<ClipboardList style={{ width: 16, height: 16 }} />} label="App Review" iconPosition="start" />
        <Tab icon={<Scale style={{ width: 16, height: 16 }} />} label="Compliance" iconPosition="start" />
        <Tab icon={<Activity style={{ width: 16, height: 16 }} />} label="Reports" iconPosition="start" /> */}
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {activeTab === 0 && <DealsTab deals={allDeals} />}
        {activeTab === 1 && <FinancialsTab deals={allDeals} />}
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
            onTreeSaveComplete={handleTreeSaveComplete}
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
        {activeTab === 4 && (
          <EditExtractionTab
            companyId={companyId}
            clientId={clientId}
            files={files}
            onTabChange={setActiveTab}
            onExportData={onExportData}
          />
        )}
        {activeTab === 5 && companyId && clientId && getAccessToken && (
          <CreateDealTab
            companyId={companyId}
            clientId={clientId}
            treeRoots={treeRoots}
            treePeriods={treePeriods}
            getAccessToken={getAccessToken}
            onDealCreated={handleDealCreated}
          />
        )}
        {activeTab === 6 && (
          <AnalysisTab
            gridData={gridData}
            treeRoots={treeRoots}
            treePeriods={treePeriods}
          />
        )}
        {activeTab === 7 && (
          <RiskAssessmentTab
            companyId={companyId}
            deals={allDeals}
            getAccessToken={getAccessToken}
          />
        )}
        {activeTab === 8 && (
          <ApplicationReviewTab
            companyId={companyId}
            deals={allDeals}
            getAccessToken={getAccessToken}
          />
        )}
        {activeTab === 9 && (
          <ComplianceTab
            companyId={companyId}
            deals={allDeals}
            getAccessToken={getAccessToken}
          />
        )}
        {activeTab === 10 && (
          <ReportsTab
            companyId={companyId}
            clientId={clientId}
            deals={allDeals}
            gridData={gridData}
            getAccessToken={getAccessToken}
          />
        )}
      </Box>
    </Box>
  );
}
