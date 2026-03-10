import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Typography,
  Alert,
  Box,
} from '@mui/material';
import { TreeNode } from '../../services/tree_service';

export interface PartialUnmergeDialogProps {
  open: boolean;
  node: TreeNode | null;
  constituentNodes: string[];
  constituentLabels?: Record<string, string>;
  onConfirm: (selectedIds: string[]) => void;
  onCancel: () => void;
}

export function PartialUnmergeDialog({
  open,
  node,
  constituentNodes,
  constituentLabels,
  onConfirm,
  onCancel,
}: PartialUnmergeDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
    }
  }, [open]);

  const handleToggle = (nodeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedIds.size === 0) {
      return; // Prevent submitting with no selection
    }
    onConfirm(Array.from(selectedIds));
  };

  const canConfirm = selectedIds.size > 0 && selectedIds.size < constituentNodes.length;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        Partial Unmerge
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          This node is merged from {constituentNodes.length} constituent nodes.
          Select which nodes you want to separate from <strong>{node?.label}</strong>:
        </Typography>

        <Box sx={{ mt: 2 }}>
          <FormControl component="fieldset" variant="standard">
            <FormGroup>
              {constituentNodes.map((nodeId) => (
                <FormControlLabel
                  key={nodeId}
                  control={
                    <Checkbox
                      checked={selectedIds.has(nodeId)}
                      onChange={() => handleToggle(nodeId)}
                    />
                  }
                  label={constituentLabels?.[nodeId] || `Node ${nodeId}`}
                />
              ))}
            </FormGroup>
          </FormControl>
        </Box>

        {selectedIds.size === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Please select at least one node to unmerge.
          </Alert>
        )}

        {selectedIds.size === constituentNodes.length && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            You cannot unmerge all constituent nodes. At least one must remain.
          </Alert>
        )}

        {canConfirm && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>{selectedIds.size}</strong> node(s) will be separated.
              <br />
              <strong>{constituentNodes.length - selectedIds.size}</strong> node(s) will remain merged.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={!canConfirm}
        >
          Confirm Unmerge
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PartialUnmergeDialog;
