import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, X, Merge, Network, Undo2 } from "lucide-react";
import { Card, CardContent, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Box, Alert, IconButton, Divider } from "@mui/material";
import { formatUSD } from "../../../utils/formatters";
import { GridSection, CellKey, GridRow } from "../../../types";
import type { DataGridTabProps } from "../../../types/interfaces";

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Selection Summary */}
      {selectedCells.size > 0 && (
        <Card sx={{ borderColor: 'black', bgcolor: 'black', color: 'white' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>{selectedCells.size} cells selected</Typography>
                <Typography variant="h5" fontWeight={600}>{formatUSD(selectedSum)}</Typography>
              </Box>
              <IconButton
                sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                onClick={onClearSelection}
              >
                <X style={{ width: 20, height: 20 }} />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={600}>Financial Data Grid</Typography>
              <Typography variant="body2" color="text.secondary">
                Click rows to expand/collapse. Click cells to select multiple for sum calculation.
                {(mergeMode || childMode) && " Drag rows to " + (mergeMode ? "merge" : "create hierarchy") + "."}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleModeToggle('merge')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  ...(mergeMode && {
                    bgcolor: 'black',
                    color: 'white',
                    borderColor: 'black',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.9)', borderColor: 'black' }
                  })
                }}
              >
                <Merge style={{ width: 16, height: 16 }} />
                Merge Cells
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleModeToggle('child')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  ...(childMode && {
                    bgcolor: 'black',
                    color: 'white',
                    borderColor: 'black',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.9)', borderColor: 'black' }
                  })
                }}
              >
                <Network style={{ width: 16, height: 16 }} />
                Create Children
              </Button>
              {(mergeMode || childMode) && (
                <>
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleUndo}
                    disabled={undoHistory.length === 0}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      ...(undoHistory.length === 0 && { opacity: 0.5, cursor: 'not-allowed' })
                    }}
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 style={{ width: 16, height: 16 }} />
                    Undo
                  </Button>
                </>
              )}
            </Box>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%' }}>
              <Box component="thead">
                <Box component="tr" sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                  <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 500 }}>Account</Box>
                  <Box component="th" sx={{ p: 2, textAlign: 'right', fontWeight: 500 }}>2023</Box>
                  <Box component="th" sx={{ p: 2, textAlign: 'right', fontWeight: 500 }}>2024</Box>
                  <Box component="th" sx={{ p: 2, textAlign: 'right', fontWeight: 500 }}>YTD 2025</Box>
                </Box>
              </Box>
              <Box component="tbody">
                {gridData.map((section) => (
                  <React.Fragment key={section.id}>
                    {/* Parent Row */}
                    <Box
                      component="tr"
                      sx={{
                        cursor: 'pointer',
                        borderBottom: 1,
                        borderColor: 'divider',
                        bgcolor: 'grey.50',
                        '&:hover': { bgcolor: 'grey.100' }
                      }}
                      onClick={() => onToggleRow(section.id)}
                    >
                      <Box component="td" sx={{ p: 2, fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {expandedRows.has(section.id) ? (
                            <ChevronDown style={{ width: 16, height: 16 }} />
                          ) : (
                            <ChevronRight style={{ width: 16, height: 16 }} />
                          )}
                          {section.category}
                        </Box>
                      </Box>
                      <Box component="td" sx={{ p: 2, textAlign: 'right', fontWeight: 600 }}>
                        {formatUSD(section.children.reduce((sum, r) => sum + r.y2023, 0))}
                      </Box>
                      <Box component="td" sx={{ p: 2, textAlign: 'right', fontWeight: 600 }}>
                        {formatUSD(section.children.reduce((sum, r) => sum + r.y2024, 0))}
                      </Box>
                      <Box component="td" sx={{ p: 2, textAlign: 'right', fontWeight: 600 }}>
                        {formatUSD(section.children.reduce((sum, r) => sum + r.ytd2025, 0))}
                      </Box>
                    </Box>

                    {/* Child Rows */}
                    {expandedRows.has(section.id) &&
                      section.children.map((row) => (
                        <Box
                          component="tr"
                          key={row.id}
                          sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            cursor: (mergeMode || childMode) ? 'move' : 'default',
                            '&:hover': { bgcolor: 'grey.50' }
                          }}
                          draggable={mergeMode || childMode}
                          onDragStart={(e) => handleDragStart(e, row, section.id)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, row, section.id)}
                        >
                          <Box component="td" sx={{ p: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
                            {row.account.startsWith('  ├─') || row.account.startsWith('  └─') ? (
                              <Box sx={{ pl: 6 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', ml: 4 }}>
                                  <Box sx={{ width: 24, height: 16, borderLeft: 2, borderBottom: 2, borderColor: 'grey.300', mr: 1 }}></Box>
                                  <Box component="span" sx={{ color: 'grey.400' }}>└─</Box>
                                  <Box component="span" sx={{ ml: 2 }}>{row.account.replace(/^\s*[├└]─\s*/, '')}</Box>
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ pl: 6 }}>
                                <Box component="span">{row.account}</Box>
                              </Box>
                            )}
                          </Box>
                          <Box
                            component="td"
                            sx={{
                              cursor: 'pointer',
                              p: 2,
                              textAlign: 'right',
                              fontSize: '0.875rem',
                              transition: 'all 0.15s',
                              ...(selectedCells.has(`${row.id}:y2023`) ? {
                                bgcolor: 'black',
                                color: 'white'
                              } : {
                                '&:hover': { bgcolor: 'grey.100' }
                              })
                            }}
                            onClick={() => onToggleCell(`${row.id}:y2023`)}
                          >
                            {formatUSD(row.y2023)}
                          </Box>
                          <Box
                            component="td"
                            sx={{
                              cursor: 'pointer',
                              p: 2,
                              textAlign: 'right',
                              fontSize: '0.875rem',
                              transition: 'all 0.15s',
                              ...(selectedCells.has(`${row.id}:y2024`) ? {
                                bgcolor: 'black',
                                color: 'white'
                              } : {
                                '&:hover': { bgcolor: 'grey.100' }
                              })
                            }}
                            onClick={() => onToggleCell(`${row.id}:y2024`)}
                          >
                            {formatUSD(row.y2024)}
                          </Box>
                          <Box
                            component="td"
                            sx={{
                              cursor: 'pointer',
                              p: 2,
                              textAlign: 'right',
                              fontSize: '0.875rem',
                              transition: 'all 0.15s',
                              ...(selectedCells.has(`${row.id}:ytd2025`) ? {
                                bgcolor: 'black',
                                color: 'white'
                              } : {
                                '&:hover': { bgcolor: 'grey.100' }
                              })
                            }}
                            onClick={() => onToggleCell(`${row.id}:ytd2025`)}
                          >
                            {formatUSD(row.ytd2025)}
                          </Box>
                        </Box>
                      ))}
                  </React.Fragment>
                ))}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog?.open || false} onClose={() => setConfirmDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {confirmDialog?.type === 'merge' ? 'Confirm Merge Operation' : 'Confirm Create Child'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
            {confirmDialog?.type === 'merge' ? (
              <>
                <Typography>Merge "{confirmDialog.source.account}" into "{confirmDialog.target.account}"?</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography fontWeight={500}>Result will be:</Typography>
                  <Box component="ul" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, fontSize: '0.875rem', pl: 2 }}>
                    <li>• Name: "{confirmDialog.target.account}"</li>
                    <li>• 2023: {formatUSD(confirmDialog.previewData?.y2023)} ({formatUSD(confirmDialog.source.y2023)} + {formatUSD(confirmDialog.target.y2023)})</li>
                    <li>• 2024: {formatUSD(confirmDialog.previewData?.y2024)} ({formatUSD(confirmDialog.source.y2024)} + {formatUSD(confirmDialog.target.y2024)})</li>
                    <li>• YTD 2025: {formatUSD(confirmDialog.previewData?.ytd2025)} ({formatUSD(confirmDialog.source.ytd2025)} + {formatUSD(confirmDialog.target.ytd2025)})</li>
                  </Box>
                  <Typography fontSize="0.875rem" color="error.main">"{confirmDialog.source.account}" row will be deleted</Typography>
                </Box>
              </>
            ) : (
              <>
                <Typography>Move "{confirmDialog?.source.account.replace(/^\s*└─\s*/, '').replace(/^\s*├─\s*/, '')}" under "{confirmDialog?.target.account}"?</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography fontWeight={500}>Result will be:</Typography>
                  <Box sx={{ fontSize: '0.875rem', bgcolor: 'grey.50', p: 1.5, borderRadius: 1, border: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', fontWeight: 500, mb: 0.5 }}>
                      <ChevronDown style={{ width: 16, height: 16, marginRight: 4 }} />
                      {confirmDialog?.target.account}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 4, color: 'text.secondary' }}>
                      <Box sx={{ width: 16, height: 12, borderLeft: 2, borderBottom: 2, borderColor: 'grey.400', mr: 1.5 }}></Box>
                      {confirmDialog?.source.account.replace(/^\s*└─\s*/, '').replace(/^\s*├─\s*/, '')}
                    </Box>
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)}>No</Button>
          <Button 
            onClick={confirmAction} 
            variant="contained"
            sx={{ 
              bgcolor: 'black', 
              '&:hover': { bgcolor: 'rgba(0,0,0,0.9)' }
            }}
          >
            {confirmDialog?.type === 'merge' ? 'Yes, Merge' : 'Yes, Move'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
