import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Upload as UploadIcon, CalendarToday } from '@mui/icons-material';
import { extractDataAPI } from '../../services/api';

export interface PeriodManagementProps {
  companyId: string;
  clientId: string;
  onPeriodAdded?: () => void;
}

export function PeriodManagement({ companyId, clientId, onPeriodAdded }: PeriodManagementProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [periodType, setPeriodType] = useState<string>('Q');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [quarter, setQuarter] = useState<string>('1');
  const [month, setMonth] = useState<string>('01');

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedFile(null);
    setError(null);
    setSuccess(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select a PDF file');
        setSelectedFile(null);
      }
    }
  };

  const generatePeriod = (): string => {
    // Format: YYYY-MM-DD_QX or YYYY-MM-DD_MXX
    const date = `${year}-12-31`; // Use end of year by default
    
    if (periodType === 'Q') {
      return `${date}_Q${quarter}`;
    } else if (periodType === 'M') {
      return `${date}_M${month}`;
    } else {
      return `${date}_Annual`;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const period = generatePeriod();
      
      // Extract data from PDF
      await extractDataAPI.extractData({
        file: selectedFile,
        company_id: companyId,
        date: period,
        period_type: periodType,
        extract_again: false,
      });

      setSuccess(`Successfully extracted ${period} data. Refresh the tree to see new nodes.`);
      
      // Close dialog after short delay
      setTimeout(() => {
        handleCloseDialog();
        if (onPeriodAdded) {
          onPeriodAdded();
        }
      }, 2000);
      
    } catch (err: any) {
      console.error('❌ Failed to upload period data:', err);
      setError(err.message || 'Failed to upload period data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Period Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add new quarterly, monthly, or annual financial data
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CalendarToday />}
              onClick={handleOpenDialog}
            >
              Add New Period
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Period Data</DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Period Type Selection */}
            <FormControl fullWidth>
              <InputLabel>Period Type</InputLabel>
              <Select
                value={periodType}
                label="Period Type"
                onChange={(e) => setPeriodType(e.target.value)}
              >
                <MenuItem value="Q">Quarterly</MenuItem>
                <MenuItem value="M">Monthly</MenuItem>
                <MenuItem value="A">Annual</MenuItem>
              </Select>
            </FormControl>

            {/* Year Selection */}
            <TextField
              label="Year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              fullWidth
              inputProps={{ min: 2000, max: 2100 }}
            />

            {/* Quarter Selection (only for quarterly) */}
            {periodType === 'Q' && (
              <FormControl fullWidth>
                <InputLabel>Quarter</InputLabel>
                <Select
                  value={quarter}
                  label="Quarter"
                  onChange={(e) => setQuarter(e.target.value)}
                >
                  <MenuItem value="1">Q1 (Jan-Mar)</MenuItem>
                  <MenuItem value="2">Q2 (Apr-Jun)</MenuItem>
                  <MenuItem value="3">Q3 (Jul-Sep)</MenuItem>
                  <MenuItem value="4">Q4 (Oct-Dec)</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Month Selection (only for monthly) */}
            {periodType === 'M' && (
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={month}
                  label="Month"
                  onChange={(e) => setMonth(e.target.value)}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <MenuItem key={m} value={m.toString().padStart(2, '0')}>
                      {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* File Upload */}
            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
              >
                {selectedFile ? selectedFile.name : 'Select PDF File'}
                <input
                  type="file"
                  hidden
                  accept="application/pdf"
                  onChange={handleFileSelect}
                />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Upload the financial report PDF for {generatePeriod()}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success">
                {success}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            color="primary"
            disabled={!selectedFile || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {loading ? 'Uploading...' : 'Upload & Process'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
