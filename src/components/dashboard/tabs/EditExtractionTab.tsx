import React, { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Search, Edit2, Download, Upload, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import { extractDataAPI } from "../../../services/api";
import { UploadedFile } from "../../../types";
import tableData from "../../../data/response_1763405559153.json";

interface TableCell {
  rowIndex: number;
  columnIndex: number;
  content: string;
  rowSpan?: number;
  columnSpan?: number;
  kind?: string;
}

interface Table {
  rowCount: number;
  columnCount: number;
  cells: TableCell[];
}

interface EditExtractionTabProps {
  companyId?: string;
  files?: UploadedFile[];
}

export function EditExtractionTab({ companyId = "company_1", files = [] }: EditExtractionTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, string>>({});
  const [selectedTable, setSelectedTable] = useState(0);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPeriodType, setSelectedPeriodType] = useState("Q");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadedTables, setLoadedTables] = useState<Table[]>(tableData as Table[]);

  // Get parsed files for selection
  const parsedFiles = useMemo(() => {
    return files.filter(f => f.status === "parsed" && f.date && f.period_type);
  }, [files]);

  // Load extraction data when file is selected
  useEffect(() => {
    if (selectedFileIndex !== null && parsedFiles[selectedFileIndex]) {
      const file = parsedFiles[selectedFileIndex];
      if (file.extractedData?.tables) {
        setLoadedTables(file.extractedData.tables);
        setSelectedTable(0);
        setEditedData({});
      }
    }
  }, [selectedFileIndex, parsedFiles]);

  const handleLoadExtraction = async () => {
    if (!selectedDate || !companyId) {
      setError("Please select a period date");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await extractDataAPI.getExtractedData(
        companyId,
        selectedDate,
        selectedPeriodType
      );

      if (result.tables && result.tables.length > 0) {
        setLoadedTables(result.tables);
        setSelectedTable(0);
        setEditedData({});
      } else {
        setError("No tables found in the extracted data");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load extraction data");
      console.error("Failed to load extraction:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedDate || !companyId) {
      setError("Missing required information to save changes");
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Apply edited data to the tables
      const updatedTables = tables.map((table, tableIdx) => {
        if (tableIdx !== selectedTable) return table;

        const updatedCells = table.cells.map(cell => {
          const cellKey = `${cell.rowIndex}-${cell.columnIndex}`;
          if (cellKey in editedData) {
            return { ...cell, content: editedData[cellKey] };
          }
          return cell;
        });

        return { ...table, cells: updatedCells };
      });

      // Save to API
      await extractDataAPI.updateExtractedData(
        companyId,
        selectedDate,
        selectedPeriodType,
        { tables: updatedTables }
      );

      // Update local state
      setLoadedTables(updatedTables);
      setEditedData({});
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const tables = loadedTables;
  const currentTable = tables[selectedTable];

  // Create a 2D grid representation
  const grid = useMemo(() => {
    if (!currentTable) return [];
    
    const { rowCount, columnCount, cells } = currentTable;
    const gridArray: (TableCell | null)[][] = Array.from({ length: rowCount }, () =>
      Array(columnCount).fill(null)
    );

    cells.forEach((cell) => {
      const { rowIndex, columnIndex, rowSpan = 1, columnSpan = 1 } = cell;
      
      // Place the cell and mark spanned cells
      for (let r = rowIndex; r < rowIndex + rowSpan && r < rowCount; r++) {
        for (let c = columnIndex; c < columnIndex + columnSpan && c < columnCount; c++) {
          if (r === rowIndex && c === columnIndex) {
            gridArray[r][c] = cell;
          } else {
            gridArray[r][c] = { ...cell, content: "" }; // Mark as spanned
          }
        }
      }
    });

    return gridArray;
  }, [currentTable]);

  const getCellContent = (cell: TableCell) => {
    const cellKey = `${cell.rowIndex}-${cell.columnIndex}`;
    return editedData[cellKey] ?? cell.content;
  };

  const handleCellEdit = (cell: TableCell, value: string) => {
    const cellKey = `${cell.rowIndex}-${cell.columnIndex}`;
    setEditedData({ ...editedData, [cellKey]: value });
  };

  const isEdited = (cell: TableCell) => {
    const cellKey = `${cell.rowIndex}-${cell.columnIndex}`;
    return cellKey in editedData;
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Document Data Extraction - Edit & Verify</CardTitle>
              <CardDescription>
                Review and edit extracted table data from uploaded documents
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Upload className="h-3 w-3" />
                {tables.length} Tables Extracted
              </Badge>
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Edit2 className="h-4 w-4" />
                {isEditMode ? "Exit Edit Mode" : "Edit Mode"}
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Selection or Manual Load */}
          {parsedFiles.length > 0 ? (
            <div className="space-y-2">
              <Label>Select Parsed File</Label>
              <Select 
                value={selectedFileIndex?.toString() || ""} 
                onValueChange={(val) => setSelectedFileIndex(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a parsed file" />
                </SelectTrigger>
                <SelectContent>
                  {parsedFiles.map((file, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {file.name} - {file.date} ({file.period_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-700">
                No parsed files available. Upload and parse documents first, or load by period date below.
              </p>
            </div>
          )}

          {/* Manual Load by Date */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="load-date">Load by Period Date</Label>
                  <Input
                    id="load-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="w-40 space-y-2">
                  <Label htmlFor="load-period">Period Type</Label>
                  <Select value={selectedPeriodType} onValueChange={setSelectedPeriodType}>
                    <SelectTrigger id="load-period" className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q">Quarterly</SelectItem>
                      <SelectItem value="A">Annual</SelectItem>
                      <SelectItem value="M">Monthly</SelectItem>
                      <SelectItem value="YTD">YTD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleLoadExtraction}
                  disabled={loading || !selectedDate}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Load Data
                    </>
                  )}
                </Button>
              </div>
              {error && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search and Table Selection */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search in table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500">Table:</span>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(Number(e.target.value))}
                className="rounded-md border px-3 py-2 text-sm"
              >
                {tables.map((_, idx) => (
                  <option key={idx} value={idx}>
                    Table {idx + 1} ({tables[idx].rowCount}×{tables[idx].columnCount})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {grid.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b hover:bg-neutral-50">
                      {row.map((cell, colIdx) => {
                        if (!cell) return null;
                        if (cell.content === "" && (cell.rowIndex !== rowIdx || cell.columnIndex !== colIdx)) {
                          return null; // Skip spanned cells
                        }

                        const isHeader = cell.kind === "columnHeader";
                        const content = getCellContent(cell);
                        const edited = isEdited(cell);
                        const highlighted = searchTerm && content.toLowerCase().includes(searchTerm.toLowerCase());

                        const CellTag = isHeader ? "th" : "td";

                        return (
                          <CellTag
                            key={`${rowIdx}-${colIdx}`}
                            rowSpan={cell.rowSpan || 1}
                            colSpan={cell.columnSpan || 1}
                            className={cn(
                              "border px-3 py-2 text-sm relative",
                              isHeader && "bg-neutral-100 font-semibold text-center",
                              highlighted && "bg-yellow-100",
                              edited && "bg-blue-50 border-blue-300",
                              isEditMode && !isHeader && "hover:bg-neutral-50"
                            )}
                          >
                            {isEditMode && !isHeader ? (
                              <Input
                                value={content}
                                onChange={(e) => handleCellEdit(cell, e.target.value)}
                                className="h-8 text-sm border-0 focus-visible:ring-1"
                              />
                            ) : (
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex-1 whitespace-pre-wrap">
                                  {content || <span className="text-neutral-300">—</span>}
                                </span>
                                {edited && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    Edited
                                  </Badge>
                                )}
                              </div>
                            )}
                          </CellTag>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Status Footer */}
      {Object.keys(editedData).length > 0 && (
        <Card className="border-blue-300 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600">
                  {Object.keys(editedData).length} cells modified
                </Badge>
                {saveSuccess ? (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Changes saved successfully
                  </span>
                ) : (
                  <span className="text-sm text-neutral-600">
                    Remember to save your changes
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditedData({})}
                  disabled={saving}
                >
                  Reset All Changes
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 gap-2"
                  onClick={handleSaveChanges}
                  disabled={saving || !selectedDate}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
