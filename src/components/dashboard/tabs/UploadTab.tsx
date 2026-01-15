import React, { useCallback, useState } from "react";
import { Upload, FolderOpen, FileText, Eye, Trash, Calendar, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, TextField, Button, Chip, Box, Typography, Select, MenuItem, FormControl, InputLabel, Alert, Badge, CircularProgress, LinearProgress } from "@mui/material";
import { UploadedFile, FinancialStatementType } from "../../../types";
import { extractDataAPI } from "../../../services/api";
import type { UploadTabProps } from "../../../types/interfaces";

export function UploadTab({ files, onAddFiles, onRemoveFile, onUpdateFileStatementType, companyId = "company_1" }: UploadTabProps) {
  const [isDragging, setDragging] = useState(false);
  const [selectedStatementType, setSelectedStatementType] = useState<FinancialStatementType>('Q1');
  const [uploadDate, setUploadDate] = useState("");
  const [periodType, setPeriodType] = useState<string>("Quarterly");
  const [quarterSelection, setQuarterSelection] = useState<string>("Q1");
  const [halfYearSelection, setHalfYearSelection] = useState<string>("H1");
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

    // Map periodType to API format
    let apiPeriodType = "";
    if (periodType === "Quarterly") apiPeriodType = "Q";
    else if (periodType === "Half Yearly") apiPeriodType = "H";
    else if (periodType === "Yearly") apiPeriodType = "A";

    setUploading({ ...uploading, [fileIndex]: true });
    setUploadErrors({ ...uploadErrors, [fileIndex]: "" });

    try {
      const result = await extractDataAPI.extractData({
        file: file.file,
        company_id: companyId,
        date: uploadDate,
        period_type: apiPeriodType,
        extract_again: false,
      });

      // Update file status to parsed
      const updatedFiles = [...files];
      updatedFiles[fileIndex] = {
        ...updatedFiles[fileIndex],
        status: "parsed",
        date: uploadDate,
        period_type: apiPeriodType,
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
    <Card sx={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', borderRadius: 2 }}>
      <CardHeader
        title={
          <Typography variant="h6" fontWeight={600} sx={{ color: 'grey.900' }}>
            Document Upload & Management
          </Typography>
        }
        subheader={
          <Typography variant="body2" sx={{ color: 'grey.600', mt: 0.5 }}>
            Upload and manage financial documents for analysis
          </Typography>
        }
        sx={{ pb: 2 }}
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Modern Period Configuration */}
        <Card 
          variant="outlined" 
          sx={{ 
            borderColor: 'grey.200',
            bgcolor: 'grey.50',
            borderRadius: 2,
            boxShadow: 'none'
          }}
        >
          <CardContent>
            <Typography 
              variant="subtitle2" 
              fontWeight={600} 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 2.5,
                color: 'grey.800'
              }}
            >
              <Calendar style={{ width: 18, height: 18 }} />
              Period Configuration
            </Typography>
            <Box sx={{ 
              display: 'grid', 
              gap: 2, 
              gridTemplateColumns: periodType === 'Yearly' 
                ? { xs: '1fr', sm: '1fr 1fr' } 
                : { xs: '1fr', sm: '1fr 1fr 1fr' },
              alignItems: 'start'
            }}>
              {/* Period Date */}
              <FormControl fullWidth>
                <Typography variant="caption" fontWeight={600} sx={{ mb: 1, color: 'grey.700' }}>
                  Period Date
                </Typography>
                <TextField
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  fullWidth
                  size="small"
                  sx={{ 
                    bgcolor: 'white',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                    }
                  }}
                  InputLabelProps={{ shrink: true }}
                  placeholder="Select date"
                />
              </FormControl>

              {/* Period Type */}
              <FormControl fullWidth>
                <Typography variant="caption" fontWeight={600} sx={{ mb: 1, color: 'grey.700' }}>
                  Period Type
                </Typography>
                <Select
                  value={periodType}
                  onChange={(e) => {
                    setPeriodType(e.target.value);
                    // Reset selections when changing period type
                    if (e.target.value === 'Quarterly') {
                      setSelectedStatementType('Q1');
                      setQuarterSelection('Q1');
                    } else if (e.target.value === 'Half Yearly') {
                      setSelectedStatementType('H1');
                      setHalfYearSelection('H1');
                    } else if (e.target.value === 'Yearly') {
                      setSelectedStatementType('Annual');
                    }
                  }}
                  size="small"
                  sx={{ 
                    bgcolor: 'white',
                    borderRadius: 1.5,
                  }}
                >
                  <MenuItem value="Quarterly">Quarterly</MenuItem>
                  <MenuItem value="Half Yearly">Half Yearly</MenuItem>
                  <MenuItem value="Yearly">Yearly</MenuItem>
                </Select>
              </FormControl>

              {/* Dynamic Quarter/Half Year Selection */}
              {periodType === 'Quarterly' && (
                <FormControl fullWidth>
                  <Typography variant="caption" fontWeight={600} sx={{ mb: 1, color: 'grey.700' }}>
                    Quarter
                  </Typography>
                  <Select
                    value={quarterSelection}
                    onChange={(e) => {
                      setQuarterSelection(e.target.value);
                      setSelectedStatementType(e.target.value as FinancialStatementType);
                    }}
                    size="small"
                    sx={{ 
                      bgcolor: 'white',
                      borderRadius: 1.5,
                    }}
                  >
                    <MenuItem value="Q1">Q1 - First Quarter</MenuItem>
                    <MenuItem value="Q2">Q2 - Second Quarter</MenuItem>
                    <MenuItem value="Q3">Q3 - Third Quarter</MenuItem>
                    <MenuItem value="Q4">Q4 - Fourth Quarter</MenuItem>
                  </Select>
                </FormControl>
              )}

              {periodType === 'Half Yearly' && (
                <FormControl fullWidth>
                  <Typography variant="caption" fontWeight={600} sx={{ mb: 1, color: 'grey.700' }}>
                    Half Year
                  </Typography>
                  <Select
                    value={halfYearSelection}
                    onChange={(e) => {
                      setHalfYearSelection(e.target.value);
                      setSelectedStatementType(e.target.value as FinancialStatementType);
                    }}
                    size="small"
                    sx={{ 
                      bgcolor: 'white',
                      borderRadius: 1.5,
                    }}
                  >
                    <MenuItem value="H1">H1 - First Half</MenuItem>
                    <MenuItem value="H2">H2 - Second Half</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Modern Drop Zone */}
        <Box
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          sx={{
            position: 'relative',
            display: 'grid',
            placeItems: 'center',
            borderRadius: 2,
            border: '2px dashed',
            borderColor: isDragging ? 'primary.main' : 'grey.300',
            bgcolor: isDragging ? 'primary.50' : 'grey.50',
            p: 6,
            textAlign: 'center',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
              '& .upload-icon': {
                transform: 'scale(1.1)',
              }
            }
          }}
        >
          <Box 
            className="upload-icon"
            sx={{
              transition: 'transform 0.3s ease',
              mb: 2,
              p: 2,
              borderRadius: '50%',
              bgcolor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Upload style={{ width: 32, height: 32, color: '#666' }} />
          </Box>
          <Typography variant="body1" fontWeight={600} sx={{ mb: 0.5, color: 'grey.900' }}>
            Drag and drop your files here
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            or click to browse
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Button
              component="label"
              variant="outlined"
              size="medium"
              startIcon={<FolderOpen style={{ width: 18, height: 18 }} />}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 500,
                px: 3
              }}
            >
              Browse Files
              <input
                type="file"
                multiple
                onChange={onSelect}
                style={{ display: 'none' }}
              />
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2.5 }}>
            Supported formats: PDF, Excel (XLS/XLSX), CSV, Images (PNG/JPG)
          </Typography>
        </Box>

        {/* Modern File List */}
        <Box>
          <Box sx={{ 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            pb: 1.5,
            borderBottom: '2px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: 'grey.800' }}>
              Uploaded Files
              <Chip 
                label={files.length} 
                size="small" 
                sx={{ 
                  ml: 1.5, 
                  height: 20,
                  fontWeight: 600,
                  bgcolor: 'grey.200',
                  color: 'grey.800'
                }} 
              />
            </Typography>
            {!uploadDate && files.some(f => f.status === "pending") && (
              <Chip
                icon={<AlertCircle style={{ width: 14, height: 14 }} />}
                label="Set period date to upload"
                size="small"
                color="warning"
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            )}
          </Box>
          <Box sx={{ 
            minHeight: 300,
            maxHeight: 400, 
            borderRadius: 2, 
            border: 1, 
            borderColor: 'grey.200', 
            overflow: 'auto',
            bgcolor: 'white'
          }}>
            {files.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: 300,
                color: 'grey.400'
              }}>
                <FileText style={{ width: 48, height: 48, marginBottom: 12, opacity: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  No files uploaded yet
                </Typography>
              </Box>
            ) : (
              <>
                {files.map((f, idx) => (
                  <React.Fragment key={idx}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        px: 2.5,
                        py: 2,
                        borderBottom: uploading[idx] ? 0 : (idx < files.length - 1 ? 1 : 0),
                        borderColor: 'grey.100',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          bgcolor: 'grey.50',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', minWidth: 0, flex: 1, alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          bgcolor: 'primary.50',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <FileText style={{ width: 20, height: 20, color: '#1976d2' }} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight={500} noWrap sx={{ mb: 0.5 }}>
                          {f.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            {(f.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                          {f.statementType && (
                            <>
                              <Typography variant="caption" color="text.secondary">•</Typography>
                              <Chip
                                label={
                                  f.statementType === 'H1' ? 'H1 - First Half' :
                                  f.statementType === 'H2' ? 'H2 - Second Half' :
                                  f.statementType === 'Annual' ? 'Annual' : 
                                  f.statementType
                                }
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  height: 20, 
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  borderColor: 'grey.300'
                                }}
                              />
                            </>
                          )}
                          {f.date && f.period_type && (
                            <>
                              <Typography variant="caption" color="text.secondary">•</Typography>
                              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                {f.date}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                      {f.status === "parsed" && (
                        <Chip
                          icon={<CheckCircle2 style={{ width: 14, height: 14 }} />}
                          label="Parsed"
                          size="small"
                          sx={{ 
                            bgcolor: '#d1fae5', 
                            color: '#065f46',
                            fontWeight: 600,
                            border: '1px solid #a7f3d0'
                          }}
                        />
                      )}
                      {f.status === "pending" && !uploading[idx] && (
                        <Chip 
                          label="Pending" 
                          size="small"
                          sx={{
                            bgcolor: 'grey.100',
                            color: 'grey.700',
                            fontWeight: 600
                          }}
                        />
                      )}
                      {uploading[idx] && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CircularProgress 
                            size={20} 
                            thickness={4}
                            sx={{ color: 'primary.main' }}
                          />
                          <Typography variant="caption" fontWeight={600} sx={{ color: 'primary.main' }}>
                            Uploading...
                          </Typography>
                        </Box>
                      )}
                      {uploadErrors[idx] && (
                        <Chip
                          icon={<AlertCircle style={{ width: 14, height: 14 }} />}
                          label="Error"
                          size="small"
                          color="error"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {f.status === "pending" && !uploading[idx] && (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleUploadToAPI(idx)}
                          disabled={!uploadDate}
                          startIcon={<Send style={{ width: 14, height: 14 }} />}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 1.5,
                            px: 2
                          }}
                        >
                          Upload
                        </Button>
                      )}
                      <Button 
                        variant="text" 
                        size="small" 
                        sx={{ 
                          minWidth: 'auto', 
                          p: 1,
                          color: 'grey.600',
                          '&:hover': {
                            bgcolor: 'grey.100',
                            color: 'grey.900'
                          }
                        }}
                      >
                        <Eye style={{ width: 18, height: 18 }} />
                      </Button>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => onRemoveFile(idx)}
                        disabled={uploading[idx]}
                        sx={{ 
                          minWidth: 'auto', 
                          p: 1,
                          color: 'grey.600',
                          '&:hover': {
                            bgcolor: 'error.50',
                            color: 'error.main'
                          }
                        }}
                      >
                        <Trash style={{ width: 18, height: 18 }} />
                      </Button>
                    </Box>
                  </Box>
                  
                  {/* Upload Progress Bar */}
                  {uploading[idx] && (
                    <Box sx={{ 
                      px: 2.5, 
                      pb: 2,
                      pt: 0,
                      borderBottom: idx < files.length - 1 ? 1 : 0,
                      borderColor: 'grey.100',
                    }}>
                      <LinearProgress 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            bgcolor: 'primary.main',
                          }
                        }} 
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          mt: 1, 
                          color: 'grey.600',
                          fontWeight: 500 
                        }}
                      >
                        Processing file and extracting data...
                      </Typography>
                    </Box>
                  )}
                  </React.Fragment>
                ))}
                {uploadErrors && Object.entries(uploadErrors).map(([idx, error]) => error && (
                  <Box
                    key={`error-${idx}`}
                    sx={{ 
                      bgcolor: '#fef2f2', 
                      px: 2.5, 
                      py: 1.5, 
                      fontSize: '0.8rem', 
                      color: '#dc2626',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <AlertCircle style={{ width: 16, height: 16 }} />
                    File {parseInt(idx) + 1}: {error}
                  </Box>
                ))}
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
