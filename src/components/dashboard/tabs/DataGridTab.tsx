import React from "react";
import { Network } from "lucide-react";
import { Card, CardContent, Alert, Box, Typography } from "@mui/material";
import type { DataGridTabProps } from "../../../types/interfaces";
import { TreeView, TreeViewProps } from "../../tree/TreeView";
import { TreeNode } from "../../../services/tree_service";

interface ExtendedDataGridTabProps extends DataGridTabProps {
  onTreeSaveComplete?: (roots: TreeNode[], periods: { period: string; periodType: string }[]) => void;
}

export function DataGridTab({ companyId, clientId, getAccessToken, onTreeSaveComplete }: ExtendedDataGridTabProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Instruction card */}
      <Card sx={{ borderColor: "info.main", bgcolor: "info.50", borderLeft: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Network style={{ width: 20, height: 20 }} />
            Financial Data Hierarchy Grid
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This is your financial data tree structure. To populate this grid:
          </Typography>
          <Box component="ol" sx={{ pl: 2, "& li": { mb: 1 } }}>
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

      {/* Tree View */}
      {companyId && clientId && getAccessToken ? (
        <TreeView companyId={companyId} clientId={clientId} getAccessToken={getAccessToken} onSaveComplete={onTreeSaveComplete} />
      ) : (
        <Card>
          <CardContent>
            <Alert severity="warning">Please select a company to view the tree structure.</Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

