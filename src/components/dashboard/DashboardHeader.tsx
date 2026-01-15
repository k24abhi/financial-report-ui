import { Building2, Filter, Download } from "lucide-react";
import { Button, Select, MenuItem, FormControl, InputLabel, AppBar, Toolbar, Box, Typography } from "@mui/material";
import type { DashboardHeaderProps } from "../../types/interfaces";

export function DashboardHeader({ statusFilter, onStatusFilterChange }: DashboardHeaderProps) {
  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'white' }}>
      <Toolbar sx={{ maxWidth: '1600px', width: '100%', mx: 'auto', px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: 1, 
            bgcolor: 'black', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Building2 style={{ color: 'white', width: 20, height: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>Underwriter Dashboard</Typography>
            <Typography variant="caption" color="text.secondary">Deal & Company Analysis</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filter by status</InputLabel>
            <Select
              value={statusFilter}
              label="Filter by status"
              onChange={(e) => onStatusFilterChange(e.target.value)}
              startAdornment={<Filter style={{ marginRight: 8, width: 16, height: 16 }} />}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="funded">Funded</MenuItem>
              <MenuItem value="under review">Under Review</MenuItem>
              <MenuItem value="declined">Declined</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Download style={{ width: 16, height: 16 }} />}>
            Export
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
