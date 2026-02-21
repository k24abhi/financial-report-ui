import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  onDrop: (sourceNode: TreeNode, targetNode: TreeNode, position: 'merge' | 'child' | 'before' | 'after') => void;
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
  // Use refs for callbacks to avoid stale closures in useDrag / useDrop
  const onDropRef = useRef(onDrop);
  useEffect(() => { onDropRef.current = onDrop; }, [onDrop]);

  // Tracks which sub-zone of this node is being hovered ('before' | 'child' | 'after')
  const [hoverZone, setHoverZone] = useState<'before' | 'after' | 'child' | null>(null);
  // Keep a ref to the DOM element for bounding-rect measurement during hover
  const elementRef = useRef<HTMLDivElement | null>(null);

  const [{ opacity }, drag] = useDrag(
    () => ({
      type: ItemType,
      item: { node },
      canDrag: () => !deleteMode,
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
    }),
    [node, deleteMode]
  );

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ItemType,
      canDrop: () => !deleteMode,
      drop: (item: { node: TreeNode }, _monitor) => {
        const zone = dragMode === 'merge' ? 'merge' : (hoverZone || 'child');
        onDropRef.current(item.node, node, zone as 'merge' | 'child' | 'before' | 'after');
      },
      hover: (_item, monitor) => {
        if (!monitor.isOver({ shallow: true })) return;
        if (dragMode !== 'reorganize') return;
        const el = elementRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;
        const relY = clientOffset.y - rect.top;
        if (relY < rect.height * 0.28) setHoverZone('before');
        else if (relY > rect.height * 0.72) setHoverZone('after');
        else setHoverZone('child');
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [node, dragMode, deleteMode, hoverZone]
  );

  // Clear hover zone when cursor leaves
  useEffect(() => {
    if (!isOver) setHoverZone(null);
  }, [isOver]);

  // Stable combined ref — only recreated when drag/drop handlers change
  const dragDropRef = useCallback(
    (el: HTMLDivElement | null) => {
      drag(el);
      drop(el);
      elementRef.current = el;
    },
    [drag, drop]
  );

  const hasChildren = node.children && node.children.length > 0;
  const mergeCount = getMergeCount(node);

  const isDropActive = isOver && canDrop && !deleteMode;
  const isBeforeZone  = isDropActive && dragMode === 'reorganize' && hoverZone === 'before';
  const isAfterZone   = isDropActive && dragMode === 'reorganize' && hoverZone === 'after';
  const isChildZone   = isDropActive && dragMode === 'reorganize' && hoverZone === 'child';
  const isMergeZone   = isDropActive && dragMode === 'merge';

  return (
    <Box sx={{ position: 'relative' }}>
      {/* "Before" indicator — thick line + pill label above the row */}
      {isBeforeZone && (
        <Box
          sx={{
            position: 'absolute',
            top: -2,
            left: 0,
            right: 0,
            height: 4,
            bgcolor: 'info.main',
            zIndex: 1100,
            borderRadius: 1,
            boxShadow: '0 0 6px 1px rgba(2,136,209,0.5)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: 12,
              top: -10,
              bgcolor: 'info.main',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 700,
              px: 0.75,
              py: 0.15,
              borderRadius: 1,
              lineHeight: 1.4,
              letterSpacing: 0.3,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            ↑ INSERT BEFORE
          </Box>
        </Box>
      )}

      {/* "After" indicator — thick line + pill label below the row */}
      {isAfterZone && (
        <Box
          sx={{
            position: 'absolute',
            bottom: -2,
            left: 0,
            right: 0,
            height: 4,
            bgcolor: 'info.main',
            zIndex: 1100,
            borderRadius: 1,
            boxShadow: '0 0 6px 1px rgba(2,136,209,0.5)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: 12,
              bottom: -10,
              bgcolor: 'info.main',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 700,
              px: 0.75,
              py: 0.15,
              borderRadius: 1,
              lineHeight: 1.4,
              letterSpacing: 0.3,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            ↓ INSERT AFTER
          </Box>
        </Box>
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
          position: 'relative',
          // Child zone: highlighted background + left accent border
          ...(isChildZone && {
            backgroundColor: 'rgba(2,136,209,0.12)',
            borderLeft: '4px solid',
            borderColor: 'info.main',
            borderRadius: '0 4px 4px 0',
            boxShadow: 'inset 0 0 0 1px rgba(2,136,209,0.3)',
          }),
          // Merge zone: amber background + left accent border
          ...(isMergeZone && {
            backgroundColor: 'rgba(237,108,2,0.12)',
            borderLeft: '4px solid',
            borderColor: 'warning.main',
            borderRadius: '0 4px 4px 0',
            boxShadow: 'inset 0 0 0 1px rgba(237,108,2,0.3)',
          }),
          // Normal hover / delete states (only when no active drop zone)
          ...(!isChildZone && !isMergeZone && {
            backgroundColor: isSelectedForDeletion ? 'error.light' : 'transparent',
          }),
          '&:hover': {
            backgroundColor: isChildZone || isMergeZone
              ? undefined
              : deleteMode
                ? (isSelectedForDeletion ? 'error.light' : 'error.lighter')
                : 'action.hover',
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

        {/* Drop zone label pill (child / merge) */}
        {(isChildZone || isMergeZone) && (
          <Box
            sx={{
              ml: 'auto',
              mr: 1,
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: 0.3,
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              color: 'white',
              bgcolor: isChildZone ? 'info.main' : 'warning.main',
            }}
          >
            {isChildZone ? '→ MOVE AS CHILD' : '⇌ MERGE'}
          </Box>
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

// ── Pending operation types ───────────────────────────────────────────────────
type PendingMerge = { type: 'merge'; nodeIds: string[]; tempMergedId: number };
type PendingReorganize = {
  type: 'reorganize';
  nodeId: string;
  referenceNodeId: string;
  position: 'child' | 'before' | 'after';
};
type PendingOp = PendingMerge | PendingReorganize;

// ── Local tree mutation helpers ───────────────────────────────────────────────
/** Collect all node IDs for initialising the expanded set */
function getAllNodeIds(nodes: TreeNode[]): Set<string> {
  const ids = new Set<string>();
  const traverse = (ns: TreeNode[]) => {
    for (const n of ns) {
      ids.add(String(n.id));
      traverse(n.children || []);
    }
  };
  traverse(nodes);
  return ids;
}

/** Apply a merge locally — removes source nodes, inserts combined temp node */
function applyLocalMerge(roots: TreeNode[], nodeIds: number[], tempId: number): TreeNode[] {
  const idSet = new Set(nodeIds);
  const collected: TreeNode[] = [];
  const collect = (ns: TreeNode[]) => {
    for (const n of ns) {
      if (idSet.has(n.id)) collected.push(n);
      collect(n.children || []);
    }
  };
  collect(roots);
  if (collected.length < 2) return roots;

  const merged: TreeNode = {
    id: tempId,
    label: collected.map(n => n.label).join(' + '),
    values: collected.flatMap(n => n.values || []),
    merged_rows: nodeIds,
    depth: collected[0].depth,
    order: collected[0].order ?? 0,    children: collected.flatMap(n => n.children || []),
  };

  let inserted = false;
  const process = (ns: TreeNode[]): TreeNode[] =>
    ns.reduce<TreeNode[]>((acc, n) => {
      if (idSet.has(n.id)) {
        if (!inserted) { acc.push(merged); inserted = true; }
      } else {
        acc.push({ ...n, children: process(n.children || []) });
      }
      return acc;
    }, []);

  return process(roots);
}

/**
 * Apply a reorganize locally — handles 'child', 'before', 'after' positions.
 * - 'child'  : append as last child of referenceId
 * - 'before' : insert as sibling immediately before referenceId
 * - 'after'  : insert as sibling immediately after referenceId
 */
function applyLocalReorganize(
  roots: TreeNode[],
  nodeId: number,
  referenceId: number,
  position: 'child' | 'before' | 'after'
): TreeNode[] {
  let moved: TreeNode | null = null;

  // Step 1: remove the node from its current location
  const remove = (ns: TreeNode[]): TreeNode[] =>
    ns.reduce<TreeNode[]>((acc, n) => {
      if (n.id === nodeId) { moved = n; }
      else { acc.push({ ...n, children: remove(n.children || []) }); }
      return acc;
    }, []);

  const withoutMoved = remove(roots);
  if (!moved) return roots;
  const movedNode = moved;

  if (position === 'child') {
    // Append as last child of referenceId
    const insertAsChild = (ns: TreeNode[]): TreeNode[] =>
      ns.map(n =>
        n.id === referenceId
          ? { ...n, children: [...(n.children || []), movedNode] }
          : { ...n, children: insertAsChild(n.children || []) }
      );
    return insertAsChild(withoutMoved);
  }

  // 'before' or 'after' — insert as sibling relative to referenceId
  const insertAsSibling = (ns: TreeNode[]): TreeNode[] => {
    const refIdx = ns.findIndex(n => n.id === referenceId);
    if (refIdx !== -1) {
      const insertAt = position === 'before' ? refIdx : refIdx + 1;
      const result = [...ns];
      result.splice(insertAt, 0, movedNode);
      return result;
    }
    return ns.map(n => ({ ...n, children: insertAsSibling(n.children || []) }));
  };

  return insertAsSibling(withoutMoved);
}

/** Recursively build visible nodes, respecting expandedNodes */
function buildVisibleNodes(
  nodes: TreeNode[],
  expandedSet: Set<string>,
  constituentIds: Set<string>,
  level = 0
): Array<TreeNode & { level: number }> {
  const result: Array<TreeNode & { level: number }> = [];
  for (const node of nodes) {
    if (constituentIds.has(String(node.id))) continue;
    result.push({ ...node, level });
    if (expandedSet.has(String(node.id)) && node.children?.length) {
      result.push(...buildVisibleNodes(node.children, expandedSet, constituentIds, level + 1));
    }
  }
  return result;
}

export function TreeView({ companyId, clientId, getAccessToken }: TreeViewProps) {
  // serverTreeData = last-known state from the server (used for discard)
  const [serverTreeData, setServerTreeData] = useState<TreeNode[]>([]);
  // localTreeData = server state + pending local changes (what the UI renders)
  const [localTreeData, setLocalTreeData] = useState<TreeNode[]>([]);
  // Accumulated pending operations — sent to API only on "Save Changes"
  const [pendingOps, setPendingOps] = useState<PendingOp[]>([]);
  const nextTempId = useRef(-1); // negative IDs for locally-merged temp nodes

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
      const response = await treeDataService.getTreeStructure(companyId, clientId);
      const roots = response.roots || response.data?.tree || [];
      setServerTreeData(roots);
      setLocalTreeData(roots);
      setPendingOps([]);
      // Expand all nodes by default
      setExpandedNodes(getAllNodeIds(roots));
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

  // Handle merge operation — applied locally, queued for bulk save
  const handleMerge = () => {
    if (!draggedNode || !dropTargetNode) return;
    if (draggedNode.id === dropTargetNode.id) {
      setError('Cannot merge a node with itself');
      return;
    }

    const tempId = nextTempId.current--;
    const nodeIds = [String(draggedNode.id), String(dropTargetNode.id)];
    setLocalTreeData(prev => applyLocalMerge(prev, [draggedNode.id, dropTargetNode.id], tempId));
    // Expand the temp merged node so its children are visible
    setExpandedNodes(prev => new Set([...prev, String(tempId)]));
    setPendingOps(prev => [...prev, { type: 'merge', nodeIds, tempMergedId: tempId }]);
    setDraggedNode(null);
    setDropTargetNode(null);
  };

  // Apply a reorganize immediately (called directly from drop in reorganize mode)
  const applyReorganize = (sourceNode: TreeNode, targetNode: TreeNode, position: 'child' | 'before' | 'after') => {
    if (sourceNode.id === targetNode.id) return;
    setLocalTreeData(prev => applyLocalReorganize(prev, sourceNode.id, targetNode.id, position));
    setPendingOps(prev => [
      ...prev,
      { type: 'reorganize', nodeId: String(sourceNode.id), referenceNodeId: String(targetNode.id), position },
    ]);
  };

  // Save all pending changes to the API sequentially
  const handleSaveChanges = async () => {
    if (pendingOps.length === 0) return;
    setSaving(true);
    setError(null);

    // Maps temp (negative) IDs → real IDs returned by the API
    const idMap = new Map<string, string>();
    const resolve = (id: string) => idMap.get(id) ?? id;

    try {
      for (const op of pendingOps) {
        if (op.type === 'merge') {
          const resolvedIds = op.nodeIds.map(resolve);
          const response = await treeDataService.mergeNodes(clientId, companyId, resolvedIds);
          if (response.merged_node_id) {
            idMap.set(String(op.tempMergedId), response.merged_node_id);
          }
        } else {
          const resolvedNodeId = resolve(op.nodeId);
          const resolvedRefId = resolve(op.referenceNodeId);
          const newParentId = op.position === 'child' ? resolvedRefId : null;
          await treeDataService.reorganizeNode(
            companyId,
            resolvedNodeId,
            newParentId,
            op.position,
            resolvedRefId,
          );
        }
      }
      // Reload fresh tree from server
      await loadTreeStructure();
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // Discard all pending changes and revert to server state
  const handleDiscardChanges = () => {
    setLocalTreeData(serverTreeData);
    setPendingOps([]);
    setDraggedNode(null);
    setDropTargetNode(null);
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

  // Compute visible nodes respecting collapsed/expanded state
  const constituentIds = getConstituentNodeIds(localTreeData);
  const visibleNodes = buildVisibleNodes(localTreeData, expandedNodes, constituentIds);

  if (loading && localTreeData.length === 0) {
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
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Cell Selection Info */}
              {selectedCells.length > 0 && !deleteMode && (
                <Chip
                  label={`${selectedCells.length} cell${selectedCells.length > 1 ? 's' : ''} selected`}
                  color="success"
                  onDelete={() => setSelectedCells([])}
                />
              )}

              {/* Pending changes badge */}
              {pendingOps.length > 0 && (
                <>
                  <Chip
                    label={`${pendingOps.length} unsaved change${pendingOps.length > 1 ? 's' : ''}`}
                    color="warning"
                    variant="outlined"
                  />
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSaveChanges}
                    disabled={saving || loading}
                    size="small"
                  >
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    onClick={handleDiscardChanges}
                    disabled={saving || loading}
                    size="small"
                  >
                    Discard
                  </Button>
                </>
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
                >
                  Merge Nodes
                </Button>
              )}
              

              
              <IconButton onClick={loadTreeStructure} disabled={loading || saving}>
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

          {draggedNode && dropTargetNode && dragMode === 'merge' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Drag <strong>{draggedNode.label}</strong> onto <strong>{dropTargetNode.label}</strong> to merge.
              Click "Merge Nodes" to confirm.
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
                    onDrop={(sourceNode, targetNode, position) => {
                      if (dragMode === 'merge') {
                        if (sourceNode.id !== targetNode.id) {
                          setDraggedNode(sourceNode);
                          setDropTargetNode(targetNode);
                          setDropPosition('merge');
                        }
                      } else {
                        const pos = (position === 'merge' ? 'child' : position) as 'child' | 'before' | 'after';
                        applyReorganize(sourceNode, targetNode, pos);
                      }
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

          {(loading || saving) && (
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
