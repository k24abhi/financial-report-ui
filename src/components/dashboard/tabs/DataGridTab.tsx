import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, X, Merge, Network, Undo2 } from "lucide-react";
import { Card, CardContent, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography, Box, Alert, IconButton, Divider } from "@mui/material";
import { formatUSD } from "../../../utils/formatters";
import { GridSection, CellKey, GridRow } from "../../../types";
import type { DataGridTabProps } from "../../../types/interfaces";
import { TreeView } from "../../tree/TreeView";

export function DataGridTab({
  gridData,
  expandedRows,
  selectedCells,
  onToggleRow,
  onToggleCell,
  onClearSelection,
  selectedSum,
  onUpdateGridData,
  companyId,
  clientId,
  getAccessToken
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
      {/* Info Card explaining the correct workflow */}
      <Card sx={{ borderColor: 'info.main', bgcolor: 'info.50', borderLeft: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Network style={{ width: 20, height: 20 }} />
            Financial Data Hierarchy Grid
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This is your financial data tree structure. To populate this grid:
          </Typography>
          <Box component="ol" sx={{ pl: 2, '& li': { mb: 1 } }}>
            <li>
              <Typography variant="body2">
                <strong>Step 1:</strong> Upload your PDF financial documents in the "Documents" tab
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Step 2:</strong> Review and edit the extracted data in the "Edit Extraction" tab
              </Typography>
            </li>
            <li>
              <Typography variant="body2">
                <strong>Step 3:</strong> View the hierarchical tree structure below, organized by periods
              </Typography>
            </li>
          </Box>
        </CardContent>
      </Card>

      {/* Tree View Section */}
      {companyId && clientId && getAccessToken ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Tree Structure */}
          <TreeView
            companyId={companyId}
            clientId={clientId}
            getAccessToken={getAccessToken}
          />
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Alert severity="warning">
              Please select a company to view the tree structure.
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
