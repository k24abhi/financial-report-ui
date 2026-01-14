import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, X, Merge, Network, Undo2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../ui/alert-dialog";
import { cn } from "../../../lib/utils";
import { formatUSD } from "../../../utils/formatters";
import { GridSection, CellKey, GridRow } from "../../../types";

interface DataGridTabProps {
  gridData: GridSection[];
  expandedRows: Set<string>;
  selectedCells: Set<CellKey>;
  onToggleRow: (id: string) => void;
  onToggleCell: (cellKey: CellKey) => void;
  onClearSelection: () => void;
  selectedSum: number;
  onUpdateGridData: (newData: GridSection[]) => void;
}

export function DataGridTab({
  gridData,
  expandedRows,
  selectedCells,
  onToggleRow,
  onToggleCell,
  onClearSelection,
  selectedSum,
  onUpdateGridData
}: DataGridTabProps) {
  const [mergeMode, setMergeMode] = useState(false);
  const [childMode, setChildMode] = useState(false);
  const [draggedRow, setDraggedRow] = useState<{row: GridRow, sectionId: string} | null>(null);
  const [undoHistory, setUndoHistory] = useState<GridSection[][]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'merge' | 'child';
    source: GridRow;
    target: GridRow;
    sourceSectionId: string;
    targetSectionId: string;
    previewData?: any;
  } | null>(null);

  // Add keyboard event listener for Ctrl+Z (only when toggles are active)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && (mergeMode || childMode) && undoHistory.length > 0) {
        event.preventDefault();
        handleUndo();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mergeMode, childMode, undoHistory]);

  // Save current state before making changes
  const saveToHistory = () => {
    setUndoHistory(prev => [...prev, JSON.parse(JSON.stringify(gridData))].slice(-10)); // Keep last 10 operations
  };

  // Undo last operation
  const handleUndo = () => {
    if (undoHistory.length > 0) {
      const lastState = undoHistory[undoHistory.length - 1];
      setUndoHistory(prev => prev.slice(0, -1));
      onUpdateGridData(lastState);
    }
  };

  const handleModeToggle = (mode: 'merge' | 'child') => {
    if (mode === 'merge') {
      setMergeMode(!mergeMode);
      if (!mergeMode) {
        setChildMode(false);
        setUndoHistory([]); // Clear history when enabling merge mode
      } else {
        setUndoHistory([]); // Clear history when disabling merge mode
      }
    } else {
      setChildMode(!childMode);
      if (!childMode) {
        setMergeMode(false);
        setUndoHistory([]); // Clear history when enabling child mode
      } else {
        setUndoHistory([]); // Clear history when disabling child mode
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, row: GridRow, sectionId: string) => {
    if (!mergeMode && !childMode) return;
    setDraggedRow({ row, sectionId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (draggedRow) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent, targetRow: GridRow, targetSectionId: string) => {
    e.preventDefault();
    if (!draggedRow || draggedRow.row.id === targetRow.id) return;

    // Prevent dropping on child rows (rows that are already indented)
    if (childMode && targetRow.account.startsWith('  ')) {
      return;
    }

    if (mergeMode) {
      const previewData = {
        name: targetRow.account,
        y2023: draggedRow.row.y2023 + targetRow.y2023,
        y2024: draggedRow.row.y2024 + targetRow.y2024,
        ytd2025: draggedRow.row.ytd2025 + targetRow.ytd2025
      };
      
      setConfirmDialog({
        open: true,
        type: 'merge',
        source: draggedRow.row,
        target: targetRow,
        sourceSectionId: draggedRow.sectionId,
        targetSectionId,
        previewData
      });
    } else if (childMode) {
      setConfirmDialog({
        open: true,
        type: 'child',
        source: draggedRow.row,
        target: targetRow,
        sourceSectionId: draggedRow.sectionId,
        targetSectionId
      });
    }
    
    setDraggedRow(null);
  };

  const confirmAction = () => {
    if (!confirmDialog) return;

    // Save current state to undo history before making changes
    saveToHistory();

    const newData = [...gridData];

    if (confirmDialog.type === 'merge') {
      // Find sections
      const targetSectionIndex = newData.findIndex(s => s.id === confirmDialog.targetSectionId);
      const sourceSectionIndex = newData.findIndex(s => s.id === confirmDialog.sourceSectionId);
      
      if (targetSectionIndex !== -1 && sourceSectionIndex !== -1) {
        // Update target row with merged values
        const targetRowIndex = newData[targetSectionIndex].children.findIndex(r => r.id === confirmDialog.target.id);
        if (targetRowIndex !== -1) {
          newData[targetSectionIndex].children[targetRowIndex] = {
            ...confirmDialog.target,
            y2023: confirmDialog.previewData.y2023,
            y2024: confirmDialog.previewData.y2024,
            ytd2025: confirmDialog.previewData.ytd2025
          };
        }
        
        // Remove source row
        newData[sourceSectionIndex].children = newData[sourceSectionIndex].children.filter(
          r => r.id !== confirmDialog.source.id
        );
      }
    } else if (confirmDialog.type === 'child') {
      // For child mode, we'll add indentation to show hierarchy
      const targetSectionIndex = newData.findIndex(s => s.id === confirmDialog.targetSectionId);
      const sourceSectionIndex = newData.findIndex(s => s.id === confirmDialog.sourceSectionId);
      
      if (targetSectionIndex !== -1 && sourceSectionIndex !== -1) {
        const targetRowIndex = newData[targetSectionIndex].children.findIndex(r => r.id === confirmDialog.target.id);
        
        // Clean the source account name (remove any existing indentation)
        let cleanSourceAccount = confirmDialog.source.account
          .replace(/^\s*└─\s*/, '')
          .replace(/^\s*├─\s*/, '')
          .replace(/^\s*\u2514\u2500\s*/, '')
          .replace(/^\s*\u251c\u2500\s*/, '')
          .trim();
        
        // Check if there are other children after the target to determine connector type
        const hasChildrenAfter = newData[targetSectionIndex].children
          .slice(targetRowIndex + 1)
          .some(r => r.account.startsWith('  ├─') || r.account.startsWith('  └─'));
        
        // Create source row with proper tree connector
        const connector = hasChildrenAfter ? '├─' : '└─';
        const sourceRow = { 
          ...confirmDialog.source, 
          account: `  ${connector} ${cleanSourceAccount}`,
          id: `${confirmDialog.source.id}_child` // Ensure unique ID
        };
        
        // Remove from source
        newData[sourceSectionIndex].children = newData[sourceSectionIndex].children.filter(
          r => r.id !== confirmDialog.source.id
        );
        
        // Add to target section after target row
        newData[targetSectionIndex].children.splice(targetRowIndex + 1, 0, sourceRow);
      }
    }

    onUpdateGridData(newData);
    setConfirmDialog(null);
  };
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Financial Data Grid</CardTitle>
              <CardDescription>
                Click rows to expand/collapse. Click cells to select multiple for sum calculation.
                {(mergeMode || childMode) && " Drag rows to " + (mergeMode ? "merge" : "create hierarchy") + "."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleModeToggle('merge')}
                className={cn(
                  "flex items-center gap-2 transition-colors",
                  mergeMode 
                    ? "bg-black text-white border-black hover:bg-black/90 hover:text-white" 
                    : "border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900"
                )}
              >
                <Merge className="h-4 w-4" />
                Merge Cells
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleModeToggle('child')}
                className={cn(
                  "flex items-center gap-2 transition-colors",
                  childMode 
                    ? "bg-black text-white border-black hover:bg-black/90 hover:text-white" 
                    : "border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900"
                )}
              >
                <Network className="h-4 w-4" />
                Create Children
              </Button>
              {(mergeMode || childMode) && (
                <>
                  <div className="w-px h-6 bg-neutral-200 mx-1" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUndo}
                    disabled={undoHistory.length === 0}
                    className={cn(
                      "flex items-center gap-2 transition-colors",
                      undoHistory.length === 0 && "opacity-50 cursor-not-allowed"
                    )}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="h-4 w-4" />
                    Undo
                  </Button>
                </>
              )}
            </div>
          </div>
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
                        <tr
                          key={row.id}
                          className={cn(
                            "border-b hover:bg-neutral-50",
                            (mergeMode || childMode) && "cursor-move"
                          )}
                          draggable={mergeMode || childMode}
                          onDragStart={(e) => handleDragStart(e, row, section.id)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, row, section.id)}
                        >
                          <td className="p-4 text-sm text-neutral-700">
                            {row.account.startsWith('  ├─') || row.account.startsWith('  └─') ? (
                              <div className="pl-12">
                                <div className="flex items-center ml-8">
                                  <div className="w-6 h-4 border-l-2 border-b-2 border-neutral-300 mr-2"></div>
                                  <span className="text-neutral-400">└─</span>
                                  <span className="ml-4">{row.account.replace(/^\s*[├└]─\s*/, '')}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="pl-12">
                                <span>{row.account}</span>
                              </div>
                            )}
                          </td>
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

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog?.open || false} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.type === 'merge' ? 'Confirm Merge Operation' : 'Confirm Create Child'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {confirmDialog?.type === 'merge' ? (
                  <>
                    <p>Merge "{confirmDialog.source.account}" into "{confirmDialog.target.account}"?</p>
                    <div className="space-y-2">
                      <p className="font-medium">Result will be:</p>
                      <ul className="space-y-1 text-sm">
                        <li>• Name: "{confirmDialog.target.account}"</li>
                        <li>• 2023: {formatUSD(confirmDialog.previewData?.y2023)} ({formatUSD(confirmDialog.source.y2023)} + {formatUSD(confirmDialog.target.y2023)})</li>
                        <li>• 2024: {formatUSD(confirmDialog.previewData?.y2024)} ({formatUSD(confirmDialog.source.y2024)} + {formatUSD(confirmDialog.target.y2024)})</li>
                        <li>• YTD 2025: {formatUSD(confirmDialog.previewData?.ytd2025)} ({formatUSD(confirmDialog.source.ytd2025)} + {formatUSD(confirmDialog.target.ytd2025)})</li>
                      </ul>
                      <p className="text-sm text-red-600">"{confirmDialog.source.account}" row will be deleted</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p>Move "{confirmDialog?.source.account.replace(/^\s*└─\s*/, '').replace(/^\s*├─\s*/, '')}" under "{confirmDialog?.target.account}"?</p>
                    <div className="space-y-2">
                      <p className="font-medium">Result will be:</p>
                      <div className="text-sm bg-neutral-50 p-3 rounded border">
                        <div className="flex items-center font-medium mb-1">
                          <ChevronDown className="h-4 w-4 mr-1" />
                          {confirmDialog?.target.account}
                        </div>
                        <div className="flex items-center ml-8 text-neutral-600">
                          <div className="w-4 h-3 border-l-2 border-b-2 border-neutral-400 mr-3"></div>
                          {confirmDialog?.source.account.replace(/^\s*└─\s*/, '').replace(/^\s*├─\s*/, '')}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} className="bg-black hover:bg-black/90">
              {confirmDialog?.type === 'merge' ? 'Yes, Merge' : 'Yes, Move'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
