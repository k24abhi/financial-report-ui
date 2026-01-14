import { FileText, TrendingUp, Grid3x3, Upload, Calculator, FileEdit } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Deal, GridSection, UploadedFile, CellKey, FinancialStatementType } from "../../types";
import { DealsTab } from "./tabs/DealsTab";
import { FinancialsTab } from "./tabs/FinancialsTab";
import { DataGridTab } from "./tabs/DataGridTab";
import { UploadTab } from "./tabs/UploadTab";
import { EditExtractionTab } from "./tabs/EditExtractionTab";
import { AnalysisTab } from "./tabs/AnalysisTab";

interface DashboardTabsProps {
  deals: Deal[];
  gridData: GridSection[];
  expandedRows: Set<string>;
  selectedCells: Set<CellKey>;
  files: UploadedFile[];
  selectedSum: number;
  companyId?: string;
  onToggleRow: (id: string) => void;
  onToggleCell: (cellKey: CellKey) => void;
  onClearSelection: () => void;
  onAddFiles: (files: UploadedFile[]) => void;
  onRemoveFile: (index: number) => void;
  onUpdateFileStatementType: (index: number, statementType: FinancialStatementType) => void;
  onUpdateGridData: (newData: GridSection[]) => void;
}

export function DashboardTabs({
  deals,
  gridData,
  expandedRows,
  selectedCells,
  files,
  selectedSum,
  companyId,
  onToggleRow,
  onToggleCell,
  onClearSelection,
  onAddFiles,
  onRemoveFile,
  onUpdateFileStatementType,
  onUpdateGridData
}: DashboardTabsProps) {
  return (
    <Tabs defaultValue="deals" className="space-y-4">
      <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-full overflow-x-auto">
        <TabsTrigger value="deals" className="gap-2">
          <FileText className="h-4 w-4" />
          Deal History
        </TabsTrigger>
        <TabsTrigger value="financials" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Financial Trends
        </TabsTrigger>
        <TabsTrigger value="grid" className="gap-2">
          <Grid3x3 className="h-4 w-4" />
          Data Grid
        </TabsTrigger>
        <TabsTrigger value="upload" className="gap-2">
          <Upload className="h-4 w-4" />
          Documents
        </TabsTrigger>
        <TabsTrigger value="extraction" className="gap-2">
          <FileEdit className="h-4 w-4" />
          Edit Extraction
        </TabsTrigger>
        <TabsTrigger value="analysis" className="gap-2">
          <Calculator className="h-4 w-4" />
          Analysis
        </TabsTrigger>
      </TabsList>

      <TabsContent value="deals">
        <DealsTab deals={deals} />
      </TabsContent>

      <TabsContent value="financials">
        <FinancialsTab deals={deals} />
      </TabsContent>

      <TabsContent value="grid">
        <DataGridTab
          gridData={gridData}
          expandedRows={expandedRows}
          selectedCells={selectedCells}
          onToggleRow={onToggleRow}
          onToggleCell={onToggleCell}
          onClearSelection={onClearSelection}
          selectedSum={selectedSum}
          onUpdateGridData={onUpdateGridData}
        />
      </TabsContent>

      <TabsContent value="upload">
        <UploadTab
          files={files}
          onAddFiles={onAddFiles}
          onRemoveFile={onRemoveFile}
          onUpdateFileStatementType={onUpdateFileStatementType}
          companyId={companyId}
        />
      </TabsContent>

      <TabsContent value="extraction">
        <EditExtractionTab companyId={companyId} files={files} />
      </TabsContent>

      <TabsContent value="analysis">
        <AnalysisTab gridData={gridData} />
      </TabsContent>
    </Tabs>
  );
}
