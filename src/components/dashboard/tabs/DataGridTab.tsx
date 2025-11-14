import React from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { cn } from "../../../lib/utils";
import { formatUSD } from "../../../utils/formatters";
import { GridSection, CellKey } from "../../../types";

interface DataGridTabProps {
  gridData: GridSection[];
  expandedRows: Set<string>;
  selectedCells: Set<CellKey>;
  onToggleRow: (id: string) => void;
  onToggleCell: (cellKey: CellKey) => void;
  onClearSelection: () => void;
  selectedSum: number;
}

export function DataGridTab({
  gridData,
  expandedRows,
  selectedCells,
  onToggleRow,
  onToggleCell,
  onClearSelection,
  selectedSum
}: DataGridTabProps) {
  return (
    <div className="space-y-4">
      {/* Selection Summary */}
      {selectedCells.size > 0 && (
        <Card className="border-black bg-black text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-80">{selectedCells.size} cells selected</div>
                <div className="text-2xl font-semibold">{formatUSD(selectedSum)}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={onClearSelection}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Financial Data Grid</CardTitle>
          <CardDescription>
            Click rows to expand/collapse. Click cells to select multiple for sum calculation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-neutral-50">
                  <th className="p-4 text-left font-medium">Account</th>
                  <th className="p-4 text-right font-medium">2023</th>
                  <th className="p-4 text-right font-medium">2024</th>
                  <th className="p-4 text-right font-medium">YTD 2025</th>
                </tr>
              </thead>
              <tbody>
                {gridData.map((section) => (
                  <React.Fragment key={section.id}>
                    {/* Parent Row */}
                    <tr
                      className="cursor-pointer border-b bg-neutral-50 hover:bg-neutral-100"
                      onClick={() => onToggleRow(section.id)}
                    >
                      <td className="p-4 font-semibold">
                        <div className="flex items-center gap-2">
                          {expandedRows.has(section.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          {section.category}
                        </div>
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {formatUSD(section.children.reduce((sum, r) => sum + r.y2023, 0))}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {formatUSD(section.children.reduce((sum, r) => sum + r.y2024, 0))}
                      </td>
                      <td className="p-4 text-right font-semibold">
                        {formatUSD(section.children.reduce((sum, r) => sum + r.ytd2025, 0))}
                      </td>
                    </tr>

                    {/* Child Rows */}
                    {expandedRows.has(section.id) &&
                      section.children.map((row) => (
                        <tr key={row.id} className="border-b hover:bg-neutral-50">
                          <td className="p-4 pl-12 text-sm text-neutral-700">{row.account}</td>
                          <td
                            className={cn(
                              "cursor-pointer p-4 text-right text-sm transition-colors",
                              selectedCells.has(`${row.id}:y2023`)
                                ? "bg-black text-white"
                                : "hover:bg-neutral-100"
                            )}
                            onClick={() => onToggleCell(`${row.id}:y2023`)}
                          >
                            {formatUSD(row.y2023)}
                          </td>
                          <td
                            className={cn(
                              "cursor-pointer p-4 text-right text-sm transition-colors",
                              selectedCells.has(`${row.id}:y2024`)
                                ? "bg-black text-white"
                                : "hover:bg-neutral-100"
                            )}
                            onClick={() => onToggleCell(`${row.id}:y2024`)}
                          >
                            {formatUSD(row.y2024)}
                          </td>
                          <td
                            className={cn(
                              "cursor-pointer p-4 text-right text-sm transition-colors",
                              selectedCells.has(`${row.id}:ytd2025`)
                                ? "bg-black text-white"
                                : "hover:bg-neutral-100"
                            )}
                            onClick={() => onToggleCell(`${row.id}:ytd2025`)}
                          >
                            {formatUSD(row.ytd2025)}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
