import React, { useCallback, useState } from "react";
import { Upload, FolderOpen, FileText, Eye, Trash, Calendar, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, TextField, Button, Chip, Box, Typography, Select, MenuItem, FormControl, InputLabel, Alert, Badge } from "@mui/material";
import { UploadedFile, FinancialStatementType } from "../../../types";
import { extractDataAPI } from "../../../services/api";

interface UploadTabProps {
  files: UploadedFile[];
  onAddFiles: (files: UploadedFile[]) => void;
  onRemoveFile: (index: number) => void;
  onUpdateFileStatementType: (index: number, statementType: FinancialStatementType) => void;
  companyId?: string;
}

export function UploadTab({ files, onAddFiles, onRemoveFile, onUpdateFileStatementType, companyId = "company_1" }: UploadTabProps) {
  const [isDragging, setDragging] = useState(false);
  const [selectedStatementType, setSelectedStatementType] = useState<FinancialStatementType>('Q1');
  const [uploadDate, setUploadDate] = useState("");
  const [periodType, setPeriodType] = useState<string>("Q");
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});

  const onDrop = useCallback((evt: React.DragEvent) => {
    evt.preventDefault();
    setDragging(false);
    const dropped = Array.from(evt.dataTransfer.files).map((f: File) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      status: "pending",
      statementType: selectedStatementType,
      file: f,
      company_id: companyId,
    }));
    if (dropped.length) {
      onAddFiles(dropped);
    }
  }, [onAddFiles, selectedStatementType, companyId]);

  const onSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files ? Array.from(e.target.files) : [];
    if (!fl.length) return;
    const added = fl.map((f: File) => ({ 
      name: f.name, 
      size: f.size, 
      type: f.type, 
      status: "pending",
      statementType: selectedStatementType,
      file: f,
      company_id: companyId,
    }));
    onAddFiles(added);
  }, [onAddFiles, selectedStatementType, companyId]);

  const handleUploadToAPI = async (fileIndex: number) => {
    const file = files[fileIndex];
    
    if (!file.file) {
      setUploadErrors({ ...uploadErrors, [fileIndex]: "No file found" });
      return;
    }

    if (!uploadDate) {
      setUploadErrors({ ...uploadErrors, [fileIndex]: "Please select a period date" });
      return;
    }

    setUploading({ ...uploading, [fileIndex]: true });
    setUploadErrors({ ...uploadErrors, [fileIndex]: "" });

    try {
      const result = await extractDataAPI.extractData({
        file: file.file,
        company_id: companyId,
        date: uploadDate,
        period_type: periodType,
        extract_again: false,
      });

      // Update file status to parsed
      const updatedFiles = [...files];
      updatedFiles[fileIndex] = {
        ...updatedFiles[fileIndex],
        status: "parsed",
        date: uploadDate,
        period_type: periodType,
        extractedData: result,
      };
      onAddFiles(updatedFiles);
      
      setUploading({ ...uploading, [fileIndex]: false });
    } catch (error: any) {
      console.error("Upload failed:", error);
      setUploadErrors({ 
        ...uploadErrors, 
        [fileIndex]: error.message || "Upload failed" 
      });
      setUploading({ ...uploading, [fileIndex]: false });
    }
  };

  return (
    <Card>
      <CardHeader
        title="Document Upload & Management"
        subheader="Upload and manage documents for this company"
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Period Configuration */}
        <Card sx={{ borderColor: 'primary.light', bgcolor: 'primary.50' }}>
          <CardContent>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <Box>
                <Typography variant="body2" fontWeight={500} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Calendar style={{ width: 16, height: 16 }} />
                  Period Date
                </Typography>
                <TextField
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  fullWidth
                  sx={{ bgcolor: 'white' }}
                  InputLabelProps={{ shrink: true }}
                  helperText="Select the period end date (e.g., 2024-12-31 for Q4 2024)"
                />
              </Box>
              <Box>
                <FormControl fullWidth sx={{ bgcolor: 'white' }}>
                  <InputLabel>Period Type</InputLabel>
                  <Select
                    value={periodType}
                    onChange={(e) => setPeriodType(e.target.value)}
                    label="Period Type"
                  >
                    <MenuItem value="Q">Quarterly (Q)</MenuItem>
                    <MenuItem value="A">Annual (A)</MenuItem>
                    <MenuItem value="M">Monthly (M)</MenuItem>
                    <MenuItem value="YTD">Year-to-Date (YTD)</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Select the reporting period type
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        <Box
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          sx={{
            position: 'relative',
            display: 'grid',
            placeItems: 'center',
            borderRadius: 4,
            border: '2px dashed',
            borderColor: isDragging ? 'black' : 'grey.400',
            bgcolor: isDragging ? 'grey.100' : 'transparent',
            p: 5,
            textAlign: 'center',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'grey.600',
              bgcolor: 'grey.50',
            }
          }}
        >
          <Upload style={{ width: 40, height: 40, opacity: 0.7, marginBottom: 12 }} />
          <Typography variant="body1" fontWeight={500}>Drop files here</Typography>
          <Typography variant="body2" color="text.secondary">or</Typography>
          <Box sx={{ mt: 1.5 }}>
            <Button
              component="label"
              variant="outlined"
              size="small"
              startIcon={<FolderOpen style={{ width: 16, height: 16 }} />}
            >
              Browse files
              <input
                type="file"
                multiple
                onChange={onSelect}
                style={{ display: 'none' }}
              />
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5 }}>
            Supported: PDF, XLS/XLSX, CSV, PNG, JPG
          </Typography>
        </Box>

        {/* Financial Statement Type Selector */}
        <Box>
          <Typography variant="body2" fontWeight={500} gutterBottom>Financial Statement Type</Typography>
          
          {/* Quarterly Statements */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 1.5 }}>Quarterly</Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {[
                { value: 'Q1', label: 'Quarter-1' },
                { value: 'Q2', label: 'Quarter-2' },
                { value: 'Q3', label: 'Quarter-3' },
                { value: 'Q4', label: 'Quarter-4' }
              ].map((quarter) => (
                <Button
                  key={quarter.value}
                  onClick={() => setSelectedStatementType(quarter.value as FinancialStatementType)}
                  variant={selectedStatementType === quarter.value ? "contained" : "outlined"}
                  sx={{
                    flex: 1,
                    bgcolor: selectedStatementType === quarter.value ? 'black' : 'white',
                    color: selectedStatementType === quarter.value ? 'white' : 'text.primary',
                    '&:hover': {
                      bgcolor: selectedStatementType === quarter.value ? 'black' : 'grey.50',
                    }
                  }}
                >
                  {quarter.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Half Yearly Statements */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 1.5 }}>Half Yearly</Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {[
                { value: 'H1', label: 'Half Yearly-1' },
                { value: 'H2', label: 'Half Yearly-2' }
              ].map((half) => (
                <Button
                  key={half.value}
                  onClick={() => setSelectedStatementType(half.value as FinancialStatementType)}
                  variant={selectedStatementType === half.value ? "contained" : "outlined"}
                  sx={{
                    flex: 1,
                    bgcolor: selectedStatementType === half.value ? 'black' : 'white',
                    color: selectedStatementType === half.value ? 'white' : 'text.primary',
                    '&:hover': {
                      bgcolor: selectedStatementType === half.value ? 'black' : 'grey.50',
                    }
                  }}
                >
                  {half.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Annual Statement */}
          <Box>
            <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ mb: 1.5 }}>Yearly</Typography>
            <Button
              onClick={() => setSelectedStatementType('Annual')}
              variant={selectedStatementType === 'Annual' ? "contained" : "outlined"}
              fullWidth
              sx={{
                bgcolor: selectedStatementType === 'Annual' ? 'black' : 'white',
                color: selectedStatementType === 'Annual' ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: selectedStatementType === 'Annual' ? 'black' : 'grey.50',
                }
              }}
            >
              Annual
            </Button>
          </Box>
        </Box>

        {/* File List */}
        <Box>
          <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight={500}>Uploaded Files ({files.length})</Typography>
            {!uploadDate && files.some(f => f.status === "pending") && (
              <Chip
                icon={<AlertCircle style={{ width: 12, height: 12 }} />}
                label="Set period date to upload"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
          <Box sx={{ height: 320, borderRadius: 3, border: 1, borderColor: 'divider', overflow: 'auto' }}>
            {files.map((f, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  px: 2,
                  py: 1.5,
                  borderBottom: idx < files.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', minWidth: 0, flex: 1, alignItems: 'center', gap: 2 }}>
                  <FileText style={{ width: 20, height: 20, color: '#999', flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>{f.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary">
                        {(f.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                      {f.statementType && (
                        <>
                          <Typography variant="caption" color="text.secondary">•</Typography>
                          <Chip
                            label={
                              f.statementType === 'H1' ? 'First Half' :
                              f.statementType === 'H2' ? 'Second Half' :
                              f.statementType === 'Annual' ? 'Annual' : f.statementType
                            }
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.7rem' }}
                          />
                        </>
                      )}
                      {f.date && f.period_type && (
                        <>
                          <Typography variant="caption" color="text.secondary">•</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {f.date} ({f.period_type})
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                  {f.status === "parsed" && (
                    <Chip
                      icon={<CheckCircle2 style={{ width: 12, height: 12 }} />}
                      label="Parsed"
                      size="small"
                      sx={{ bgcolor: '#d1fae5', color: '#065f46' }}
                    />
                  )}
                  {f.status === "pending" && (
                    <Chip label="Pending" size="small" />
                  )}
                  {uploading[idx] && (
                    <Chip
                      icon={<Loader2 style={{ width: 12, height: 12 }} />}
                      label="Uploading..."
                      size="small"
                    />
                  )}
                  {uploadErrors[idx] && (
                    <Chip
                      icon={<AlertCircle style={{ width: 12, height: 12 }} />}
                      label="Error"
                      size="small"
                      color="error"
                    />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {f.status === "pending" && !uploading[idx] && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleUploadToAPI(idx)}
                      disabled={!uploadDate}
                      startIcon={<Send style={{ width: 12, height: 12 }} />}
                    >
                      Upload
                    </Button>
                  )}
                  <Button variant="text" size="small" sx={{ minWidth: 'auto', p: 1 }}>
                    <Eye style={{ width: 16, height: 16 }} />
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => onRemoveFile(idx)}
                    disabled={uploading[idx]}
                    sx={{ minWidth: 'auto', p: 1 }}
                  >
                    <Trash style={{ width: 16, height: 16 }} />
                  </Button>
                </Box>
              </Box>
            ))}
            {uploadErrors && Object.entries(uploadErrors).map(([idx, error]) => error && (
              <Box
                key={`error-${idx}`}
                sx={{ bgcolor: '#fef2f2', px: 2, py: 1, fontSize: '0.75rem', color: '#dc2626' }}
              >
                File {parseInt(idx) + 1}: {error}
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
