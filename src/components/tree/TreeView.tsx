import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  ChevronRight,
  ExpandMore,
  Merge as MergeIcon,
  CallSplit as UnmergeIcon,
  Refresh,
  Delete as DeleteIcon,
  CheckBox,
  CheckBoxOutlineBlank,
} from '@mui/icons-material';
import {
  treeDataService,
  TreeNode,
  TreeNodeValue,
  setTreeTokenGetter,
  flattenTree,
  getMergeCount,
  isMergedNode,
  getConstituentNodeIds,
} from '../../services/tree_service';
import PartialUnmergeDialog from './PartialUnmergeDialog.tsx';

const ItemType = 'TREE_NODE';

interface CellSelection {
  nodeId: number;
  valueId: number;
  value: string;
}

interface ValueCellProps {
  nodeId: number;
  value: TreeNodeValue;
  isSelected: boolean;
  onSelect: (nodeId: number, valueId: number, value: string) => void;
}

function ValueCell({ nodeId, value, isSelected, onSelect }: ValueCellProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Multi-select with Ctrl/Cmd
      onSelect(nodeId, value.id, value.text);
    } else if (e.shiftKey) {
      // TODO: Range select with Shift
      onSelect(nodeId, value.id, value.text);
    } else {
      // Single select
      onSelect(nodeId, value.id, value.text);
    }
  };

  // Try to parse as number for validation
  const numericValue = value.text.replace(/[$,()]/g, '').replace('-', '');
  const isNumeric = !isNaN(parseFloat(numericValue));
  const isNegative = value.text.includes('(') || (value.text.includes('-') && isNumeric);

  return (
    <Box
      onClick={handleClick}
      sx={{
        minWidth: 150,
        flex: '0 0 150px',
        textAlign: 'right',
        px: 2,
        py: 0.5,
        borderRight: '1px solid #e0e0e0',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'primary.light' : 'transparent',
        color: isNegative ? 'error.main' : 'inherit',
        '&:hover': {
          backgroundColor: isSelected ? 'primary.main' : 'action.hover',
        },
        userSelect: 'none',
      }}
    >
      <Typography sx={{ fontSize: '0.875rem' }}>{value.text}</Typography>
    </Box>
  );
}

interface TreeNodeItemProps {
  node: TreeNode & { level: number };
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
  onDragStart: (node: TreeNode) => void;
  onDrop: (targetNode: TreeNode, position: 'merge' | 'child' | 'before' | 'after') => void;
  isDragging: boolean;
  canDrop: boolean;
  dragMode: 'merge' | 'reorganize';
  selectedCells: CellSelection[];
  onCellSelect: (nodeId: number, valueId: number, value: string) => void;
  deleteMode?: boolean;
  isSelectedForDeletion?: boolean;
  onToggleSelection?: (nodeId: string) => void;
}

function TreeNodeItem({
  node,
  isExpanded,
  onToggle,
  onDragStart,
  onDrop,
  isDragging,
  canDrop,
  dragMode,
  selectedCells,
  onCellSelect,
  deleteMode = false,
  isSelectedForDeletion = false,
  onToggleSelection,
}: TreeNodeItemProps) {
  const [dropZone, setDropZone] = useState<'merge' | 'child' | 'before' | 'after' | null>(null);

  const [{ opacity }, drag] = useDrag(
    () => ({
      type: ItemType,
      item: { node },
      canDrag: () => !deleteMode,
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
      end: (item, monitor) => {
        if (monitor.didDrop()) {
          onDragStart(node);
        }
      },
    }),
    [node, deleteMode]
  );

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ItemType,
      canDrop: () => !deleteMode,
      drop: (item, monitor) => {
        const position = dropZone || (dragMode === 'merge' ? 'merge' : 'child');
        onDrop(node, position);
      },
      hover: (item, monitor) => {
        if (dragMode === 'reorganize' && monitor.isOver({ shallow: true })) {
          const clientOffset = monitor.getClientOffset();
          if (clientOffset) {
            const hoverBoundingRect = (monitor.getTargetMonitor() as any)?.targetId;
            // Simple position detection based on hover area
            setDropZone('child');
          }
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [node, dragMode, dropZone]
  );

  // Combine drag and drop refs
  const dragDropRef = (el: HTMLDivElement | null) => {
    drag(el);
    drop(el);
  };

  const hasChildren = node.children && node.children.length > 0;
  const mergeCount = getMergeCount(node);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Drop zone indicator for before */}
      {dragMode === 'reorganize' && canDrop && isOver && (
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: 'primary.main',
            zIndex: 1000,
            opacity: 0.7,
          }}
        />
      )}

      <Box
        ref={dragDropRef}
        sx={{
          display: 'flex',
          alignItems: 'center',
          py: 0.5,
          px: 1,
          cursor: deleteMode ? 'pointer' : 'move',
          opacity,
          backgroundColor: isSelectedForDeletion ? 'error.light' : (isOver && canDrop ? (dragMode === 'merge' ? 'warning.light' : 'info.light') : 'transparent'),
          ...(dragMode === 'merge' && isOver && canDrop && {
            borderLeft: '3px solid',
            borderColor: 'primary.main',
          }),
          ...(dragMode === 'reorganize' && isOver && canDrop && {
            border: '2px dashed',
            borderColor: 'info.main',
          }),
          '&:hover': {
            backgroundColor: deleteMode ? (isSelectedForDeletion ? 'error.light' : 'error.lighter') : 'action.hover',
          },
        }}
        onClick={() => deleteMode && onToggleSelection && onToggleSelection(String(node.id))}
      >
        {/* Delete mode checkbox */}
        {deleteMode && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection && onToggleSelection(String(node.id));
            }}
            sx={{ mr: 1 }}
          >
            {isSelectedForDeletion ? <CheckBox color="error" /> : <CheckBoxOutlineBlank />}
          </IconButton>
        )}

        {/* Expand/Collapse Icon with indentation */}
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 40 + node.level * 24, pl: node.level * 3 }}>
          {hasChildren ? (
            <IconButton
              size="small"
              onClick={() => onToggle(String(node.id))}
              sx={{ mr: 1 }}
            >
              {isExpanded ? <ExpandMore /> : <ChevronRight />}
            </IconButton>
          ) : (
            <Box sx={{ width: 32, mr: 1 }} />
          )}
        </Box>

        {/* Label Column */}
        <Box sx={{ minWidth: 300, flex: '0 0 300px', borderRight: '1px solid #e0e0e0', pr: 2 }}>
          <Typography>{node.label}</Typography>
        </Box>

        {/* Values Columns */}
        {node.values && node.values.length > 0 ? (
          <>
            {node.values.map((value, idx) => {
              const isSelected = selectedCells.some(
                cell => cell.nodeId === node.id && cell.valueId === value.id
              );
              return (
                <ValueCell
                  key={value.id || idx}
                  nodeId={node.id}
                  value={value}
                  isSelected={isSelected}
                  onSelect={onCellSelect}
                />
              );
            })}
          </>
        ) : (
          <Box sx={{ minWidth: 150, flex: '0 0 150px', px: 2, borderRight: '1px solid #e0e0e0' }} />
        )}

        {/* Merge Count Badge */}
        {mergeCount && (
          <Chip
            label={mergeCount}
            size="small"
            color="primary"
            sx={{ ml: 1, minWidth: 32 }}
          />
        )}
      </Box>
    </Box>
  );
}

export interface TreeViewProps {
  companyId: string;
  clientId: string;
  getAccessToken: () => Promise<string>;
}

export function TreeView({ companyId, clientId, getAccessToken }: TreeViewProps) {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<TreeNode | null>(null);
  const [dropTargetNode, setDropTargetNode] = useState<TreeNode | null>(null);
  const [dropPosition, setDropPosition] = useState<'merge' | 'child' | 'before' | 'after'>('merge');
  const [dragMode, setDragMode] = useState<'merge' | 'reorganize'>('merge');
  const [selectedCells, setSelectedCells] = useState<CellSelection[]>([]);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedNodesForDeletion, setSelectedNodesForDeletion] = useState<Set<string>>(new Set());
  
  // Partial unmerge dialog state
  const [unmergeDialog, setUnmergeDialog] = useState<{
    open: boolean;
    node: TreeNode | null;
    constituentNodes: string[];
  }>({
    open: false,
    node: null,
    constituentNodes: [],
  });

  // Set up token getter
  useEffect(() => {
    setTreeTokenGetter(getAccessToken);
  }, [getAccessToken]);

  // Load tree structure
  const loadTreeStructure = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await treeDataService.getTreeStructure(
        companyId,
        clientId
      );
      // Use roots from the new response format
      setTreeData(response.roots || response.data?.tree || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tree structure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId && clientId) {
      loadTreeStructure();
    }
  }, [companyId, clientId]);

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Handle cell selection
  const handleCellSelect = (nodeId: number, valueId: number, value: string) => {
    setSelectedCells((prev) => {
      const exists = prev.some(cell => cell.nodeId === nodeId && cell.valueId === valueId);
      if (exists) {
        // Deselect
        return prev.filter(cell => !(cell.nodeId === nodeId && cell.valueId === valueId));
      } else {
        // Select
        return [...prev, { nodeId, valueId, value }];
      }
    });
  };

  // Calculate sum of selected cells
  const calculateSum = () => {
    let sum = 0;
    selectedCells.forEach(cell => {
      const numericValue = cell.value.replace(/[$,()]/g, '').replace('-', '');
      const parsedValue = parseFloat(numericValue);
      if (!isNaN(parsedValue)) {
        const isNegative = cell.value.includes('(') || (cell.value.includes('-') && !isNaN(parsedValue));
        sum += isNegative ? -parsedValue : parsedValue;
      }
    });
    return sum;
  };

  // Validate selected cells
  const validateCells = () => {
    const validations: string[] = [];
    const values = selectedCells.map(cell => {
      const numericValue = cell.value.replace(/[$,()]/g, '').replace('-', '');
      const parsedValue = parseFloat(numericValue);
      const isNegative = cell.value.includes('(') || (cell.value.includes('-') && !isNaN(parsedValue));
      return isNegative ? -parsedValue : parsedValue;
    });

    // Check for negative values
    const negatives = values.filter(v => v < 0);
    if (negatives.length > 0) {
      validations.push(`${negatives.length} negative value(s)`);
    }

    // Check for zeros
    const zeros = values.filter(v => v === 0);
    if (zeros.length > 0) {
      validations.push(`${zeros.length} zero value(s)`);
    }

    return validations;
  };

  // Handle merge operation
  const handleMerge = async () => {
    if (!draggedNode || !dropTargetNode) return;

    // Prevent merging a node with itself
    if (draggedNode.id === dropTargetNode.id) {
      setError('Cannot merge a node with itself');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await treeDataService.mergeNodes(
        clientId,
        companyId,
        [String(draggedNode.id), String(dropTargetNode.id)]
      );

      // Reload tree structure
      await loadTreeStructure();

      // Clear drag state
      setDraggedNode(null);
      setDropTargetNode(null);
    } catch (err: any) {
      setError(err.message || 'Failed to merge nodes');
    } finally {
      setLoading(false);
    }
  };

  // Handle reorganize operation
  const handleReorganize = async () => {
    if (!draggedNode || !dropTargetNode) return;

    if (draggedNode.id === dropTargetNode.id) {
      setError('Cannot move a node to itself');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // TODO: Implement API call for reorganizing nodes
      // This would move draggedNode as a child/sibling of dropTargetNode
      console.log(`Reorganize: Move node ${draggedNode.id} as ${dropPosition} of ${dropTargetNode.id}`);

      // Reload tree structure
      await loadTreeStructure();

      // Clear drag state
      setDraggedNode(null);
      setDropTargetNode(null);
    } catch (err: any) {
      setError(err.message || 'Failed to reorganize nodes');
    } finally {
      setLoading(false);
    }
  };

  // Handle unmerge operation (first call)
  const handleUnmerge = async (node: TreeNode) => {
    if (!isMergedNode(node)) {
      setError('This node is not merged');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First call without selected_ids to check if partial unmerge is needed
      const response = await treeDataService.unmergeNode(
        clientId,
        companyId,
        [String(node.id)]
      );

      if (response.status === 'partial_unmerge_required' && response.constituent_nodes) {
        // Show dialog for partial unmerge
        setUnmergeDialog({
          open: true,
          node,
          constituentNodes: response.constituent_nodes,
        });
      } else {
        // Full unmerge completed
        await loadTreeStructure();
      }
    } catch (err: any) {
      console.error('❌ Unmerge failed:', err);
      setError(err.message || 'Failed to unmerge node');
    } finally {
      setLoading(false);
    }
  };

  // Handle partial unmerge with selected nodes
  const handlePartialUnmerge = async (selectedIds: string[]) => {
    if (!unmergeDialog.node) return;

    try {
      setLoading(true);
      setError(null);

      await treeDataService.unmergeNode(
        clientId,
        companyId,
        [String(unmergeDialog.node.id), ...selectedIds]
      );

      // Close dialog and reload tree
      setUnmergeDialog({ open: false, node: null, constituentNodes: [] });
      await loadTreeStructure();
    } catch (err: any) {
      console.error('❌ Partial unmerge failed:', err);
      setError(err.message || 'Failed to unmerge selected nodes');
    } finally {
      setLoading(false);
    }
  };

  // Toggle delete mode
  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setSelectedNodesForDeletion(new Set());
    // Clear drag states when entering delete mode
    if (!deleteMode) {
      setDraggedNode(null);
      setDropTargetNode(null);
    }
  };

  // Toggle node selection for deletion
  const toggleNodeSelection = (nodeId: string) => {
    setSelectedNodesForDeletion((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Handle delete operation
  const handleDelete = async () => {
    if (selectedNodesForDeletion.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedNodesForDeletion.size} node(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError(null);

      await treeDataService.deleteNodes(
        clientId,
        companyId,
        Array.from(selectedNodesForDeletion)
      );

      // Clear selection and reload tree
      setSelectedNodesForDeletion(new Set());
      setDeleteMode(false);
      await loadTreeStructure();
    } catch (err: any) {
      console.error('❌ Delete failed:', err);
      setError(err.message || 'Failed to delete nodes');
    } finally {
      setLoading(false);
    }
  };

  // Flatten tree for rendering, excluding constituent nodes that were merged into another node
  const constituentIds = getConstituentNodeIds(treeData);
  const flattenedTree = flattenTree(treeData, 0, constituentIds);

  // Filter to show only expanded branches
  const visibleNodes = flattenedTree.filter((node) => {
    if (node.level === 0) return true;
    // Check if all parents are expanded
    let currentLevel = node.level - 1;
    const parentPath: string[] = [];
    
    // This is a simplified check - in production, you'd need proper parent tracking
    return true; // For now, show all nodes
  });

  if (loading && treeData.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Financial Data Tree Structure</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {/* Cell Selection Info */}
              {selectedCells.length > 0 && !deleteMode && (
                <Chip
                  label={`${selectedCells.length} cell${selectedCells.length > 1 ? 's' : ''} selected`}
                  color="success"
                  onDelete={() => setSelectedCells([])}
                  sx={{ mr: 1 }}
                />
              )}

              {/* Delete Mode Toggle */}
              <Chip
                label={deleteMode ? 'Delete Mode' : 'Edit Mode'}
                color={deleteMode ? 'error' : 'default'}
                onClick={toggleDeleteMode}
                clickable
                icon={deleteMode ? <DeleteIcon /> : undefined}
                sx={{ cursor: 'pointer' }}
              />

              {/* Delete Nodes Button */}
              {deleteMode && selectedNodesForDeletion.size > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDelete}
                  disabled={loading}
                >
                  Delete {selectedNodesForDeletion.size} Node{selectedNodesForDeletion.size > 1 ? 's' : ''}
                </Button>
              )}

              {/* Mode Toggle (only show when not in delete mode) */}
              {!deleteMode && (
                <Chip
                  label={dragMode === 'merge' ? 'Merge Mode' : 'Reorganize Mode'}
                  color={dragMode === 'merge' ? 'warning' : 'info'}
                  onClick={() => setDragMode(dragMode === 'merge' ? 'reorganize' : 'merge')}
                  clickable
                  sx={{ cursor: 'pointer' }}
                />
              )}
              
              {draggedNode && dropTargetNode && dragMode === 'merge' && !deleteMode && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<MergeIcon />}
                  onClick={handleMerge}
                  sx={{ mr: 1 }}
                  disabled={loading}
                >
                  Merge Nodes
                </Button>
              )}
              
              {draggedNode && dropTargetNode && dragMode === 'reorganize' && !deleteMode && (
                <Button
                  variant="contained"
                  color="info"
                  onClick={handleReorganize}
                  sx={{ mr: 1 }}
                  disabled={loading}
                >
                  Move as {dropPosition === 'child' ? 'Child' : dropPosition === 'before' ? 'Before' : 'After'}
                </Button>
              )}
              
              <IconButton onClick={loadTreeStructure} disabled={loading}>
                <Refresh />
              </IconButton>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Cell Selection Summary */}
          {selectedCells.length > 0 && (
            <Card sx={{ mb: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Selected Cells: {selectedCells.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sum: ${calculateSum().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    {validateCells().length > 0 && (
                      <Typography variant="caption" color="warning.main">
                        ⚠ {validateCells().join(', ')}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={`Avg: $${(calculateSum() / selectedCells.length).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      size="small"
                      variant="outlined"
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setSelectedCells([])}
                    >
                      Clear Selection
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {draggedNode && dropTargetNode && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {dragMode === 'merge' ? (
                <>
                  Drag <strong>{draggedNode.label}</strong> onto <strong>{dropTargetNode.label}</strong> to merge. 
                  Click "Merge Nodes" to confirm.
                </>
              ) : (
                <>
                  Move <strong>{draggedNode.label}</strong> as {dropPosition} of <strong>{dropTargetNode.label}</strong>.
                  Click button to confirm.
                </>
              )}
            </Alert>
          )}

          <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
            {visibleNodes.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No tree structure available. Upload financial data to create nodes.
              </Typography>
            ) : (
              visibleNodes.map((node) => (
                <Box key={node.id} sx={{ position: 'relative' }}>
                  <TreeNodeItem
                    node={node}
                    isExpanded={expandedNodes.has(String(node.id))}
                    onToggle={toggleNode}
                    onDragStart={setDraggedNode}
                    onDrop={(targetNode, position) => {
                      setDropTargetNode(targetNode);
                      setDropPosition(position);
                    }}
                    isDragging={draggedNode?.id === node.id}
                    canDrop={draggedNode !== null && draggedNode.id !== node.id}
                    dragMode={dragMode}
                    selectedCells={selectedCells}
                    onCellSelect={handleCellSelect}
                    deleteMode={deleteMode}
                    isSelectedForDeletion={selectedNodesForDeletion.has(String(node.id))}
                    onToggleSelection={toggleNodeSelection}
                  />
                  {isMergedNode(node) && !deleteMode && (
                    <Tooltip title="Unmerge this node">
                      <IconButton
                        size="small"
                        onClick={() => handleUnmerge(node)}
                        disabled={loading}
                        sx={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                        }}
                      >
                        <UnmergeIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              ))
            )}
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Partial Unmerge Dialog */}
      <PartialUnmergeDialog
        open={unmergeDialog.open}
        node={unmergeDialog.node}
        constituentNodes={unmergeDialog.constituentNodes}
        onConfirm={handlePartialUnmerge}
        onCancel={() => setUnmergeDialog({ open: false, node: null, constituentNodes: [] })}
      />
    </DndProvider>
  );
}
