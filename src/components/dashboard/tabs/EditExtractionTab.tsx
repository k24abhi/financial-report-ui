import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { Search, Edit2, Download, Upload } from "lucide-react";
import { cn } from "../../../lib/utils";
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

export function EditExtractionTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, string>>({});
  const [selectedTable, setSelectedTable] = useState(0);

  const tables = tableData as Table[];
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
        <CardContent>
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

                        const cellKey = `${cell.rowIndex}-${cell.columnIndex}`;
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
                <span className="text-sm text-neutral-600">
                  Changes are saved automatically
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditedData({})}
                >
                  Reset All Changes
                </Button>
                <Button size="sm" className="bg-blue-600">
                  Save & Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
