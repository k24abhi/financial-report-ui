import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, TextField, Button, Chip, Box, Typography, Select, MenuItem, FormControl, InputLabel, Alert, Badge } from "@mui/material";
import { Search, Edit2, Download, Upload, Loader2, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { extractDataAPI } from "../../../services/api";
import { UploadedFile } from "../../../types";
import tableData from "../../../data/response_1763405559153.json";

// New data structure: array of tables, each table is array of row objects
// Row object has keys "0", "1", "2" etc for column values
type TableRow = Record<string, string>;
type Table = TableRow[];

import type { EditExtractionTabProps } from "../../../types/interfaces";

export function EditExtractionTab({ companyId = "company_1", files = [], onTabChange, onExportData }: EditExtractionTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, string>>({});
  const [selectedTable, setSelectedTable] = useState(0);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPeriodType, setSelectedPeriodType] = useState("Q");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadedTables, setLoadedTables] = useState<Table[]>(tableData as Table[]);

  // Get parsed files for selection
  const parsedFiles = useMemo(() => {
    return files.filter(f => f.status === "parsed" && f.date && f.period_type);
  }, [files]);

  const handleExport = () => {
    // Export the current table data
    if (loadedTables && loadedTables.length > 0) {
      const currentTable = loadedTables[selectedTable];
      onExportData?.(currentTable);
      onTabChange?.(2); // Switch to Data Grid tab
    }
  };

  // Load extraction data when file is selected
  useEffect(() => {
    if (selectedFileIndex !== null && parsedFiles[selectedFileIndex]) {
      const file = parsedFiles[selectedFileIndex];
      if (file.extractedData?.tables) {
        setLoadedTables(file.extractedData.tables);
        setSelectedTable(0);
        setEditedData({});
      }
    }
  }, [selectedFileIndex, parsedFiles]);

  const handleLoadExtraction = async () => {
    if (!selectedDate || !companyId) {
      setError("Please select a period date");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await extractDataAPI.getExtractedData(
        companyId,
        selectedDate,
        selectedPeriodType
      );

      if (result.tables && result.tables.length > 0) {
        setLoadedTables(result.tables);
        setSelectedTable(0);
        setEditedData({});
      } else {
        setError("No tables found in the extracted data");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load extraction data");
      console.error("Failed to load extraction:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedDate || !companyId) {
      setError("Missing required information to save changes");
      return;
    }

    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Apply edited data to the tables
      const updatedTables = tables.map((table, tableIdx) => {
        if (tableIdx !== selectedTable) return table;

        return table.map((row, rowIdx) => {
          const updatedRow = { ...row };
          Object.keys(row).forEach(colKey => {
            const cellKey = `${rowIdx}-${colKey}`;
            if (cellKey in editedData) {
              updatedRow[colKey] = editedData[cellKey];
            }
          });
          return updatedRow;
        });
      });

      // Save to API
      await extractDataAPI.updateExtractedData(
        companyId,
        selectedDate,
        selectedPeriodType,
        { tables: updatedTables }
      );

      // Update local state
      setLoadedTables(updatedTables);
      setEditedData({});
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save changes");
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const tables = loadedTables;
  const currentTable = tables[selectedTable];

  // Convert table data to grid format for display
  const grid = useMemo(() => {
    if (!currentTable || !currentTable.length) return [];
    
    return currentTable.map(row => {
      // Get all column keys and sort them numerically
      const colKeys = Object.keys(row).sort((a, b) => parseInt(a) - parseInt(b));
      return colKeys.map(key => row[key] || "");
    });
  }, [currentTable]);

  // Get number of columns
  const columnCount = useMemo(() => {
    if (!currentTable || !currentTable.length) return 0;
    const allKeys = currentTable.flatMap(row => Object.keys(row));
    const maxKey = Math.max(...allKeys.map(k => parseInt(k)));
    return maxKey + 1;
  }, [currentTable]);

  const getCellContent = (rowIdx: number, colIdx: string) => {
    const cellKey = `${rowIdx}-${colIdx}`;
    if (cellKey in editedData) return editedData[cellKey];
    return currentTable[rowIdx]?.[colIdx] || "";
  };

  const handleCellEdit = (rowIdx: number, colIdx: string, value: string) => {
    const cellKey = `${rowIdx}-${colIdx}`;
    setEditedData({ ...editedData, [cellKey]: value });
  };

  const isEdited = (rowIdx: number, colIdx: string) => {
    const cellKey = `${rowIdx}-${colIdx}`;
    return cellKey in editedData;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header Controls */}
      <Card>
        <CardHeader
          title="Document Data Extraction - Edit & Verify"
          subheader="Review and edit extracted table data from uploaded documents"
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<Upload style={{ width: 14, height: 14 }} />}
                label={`${tables.length} Tables Extracted`}
                variant="outlined"
                size="small"
              />
              <Button
                variant={isEditMode ? "contained" : "outlined"}
                size="small"
                onClick={() => setIsEditMode(!isEditMode)}
                startIcon={<Edit2 style={{ width: 16, height: 16 }} />}
              >
                {isEditMode ? "Exit Edit Mode" : "Edit Mode"}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleExport}
                disabled={!loadedTables || loadedTables.length === 0}
                startIcon={<Download style={{ width: 16, height: 16 }} />}
              >
                Export
              </Button>
            </Box>
          }
        />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* File Selection or Manual Load */}
          {parsedFiles.length > 0 ? (
            <FormControl fullWidth>
              <InputLabel>Select Parsed File</InputLabel>
              <Select
                value={selectedFileIndex?.toString() || ""}
                onChange={(e) => setSelectedFileIndex(parseInt(e.target.value as string))}
                label="Select Parsed File"
              >
                {parsedFiles.map((file, idx) => (
                  <MenuItem key={idx} value={idx.toString()}>
                    {file.name} - {file.date} ({file.period_type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Alert severity="warning">
              No parsed files available. Upload and parse documents first, or load by period date below.
            </Alert>
          )}

          {/* Manual Load by Date */}
          <Card sx={{ borderColor: 'primary.light', bgcolor: 'primary.50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                <TextField
                  label="Load by Period Date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1, bgcolor: 'white' }}
                />
                <FormControl sx={{ width: 160, bgcolor: 'white' }}>
                  <InputLabel>Period Type</InputLabel>
                  <Select
                    value={selectedPeriodType}
                    onChange={(e) => setSelectedPeriodType(e.target.value)}
                    label="Period Type"
                  >
                    <MenuItem value="Q">Quarterly</MenuItem>
                    <MenuItem value="A">Annual</MenuItem>
                    <MenuItem value="M">Monthly</MenuItem>
                    <MenuItem value="YTD">YTD</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleLoadExtraction}
                  disabled={loading || !selectedDate}
                  startIcon={loading ? <Loader2 style={{ width: 16, height: 16 }} /> : <RefreshCw style={{ width: 16, height: 16 }} />}
                >
                  {loading ? "Loading..." : "Load Data"}
                </Button>
              </Box>
              {error && (
                <Alert severity="error" sx={{ mt: 2 }} icon={<AlertCircle style={{ width: 16, height: 16 }} />}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Search and Table Selection */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              placeholder="Search in table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search style={{ width: 16, height: 16, marginRight: 8, color: '#999' }} />
              }}
              sx={{ flex: 1 }}
              size="small"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Table:</Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(Number(e.target.value))}
                >
                  {tables.map((table, idx) => {
                    const rowCount = table.length;
                    const colCount = table.length > 0 ? Math.max(...table.map(row => Object.keys(row).length)) : 0;
                    return (
                      <MenuItem key={idx} value={idx}>
                        Table {idx + 1} ({rowCount}×{colCount})
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Data Grid */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {currentTable && currentTable.map((row, rowIdx) => {
                    const colKeys = Object.keys(row).sort((a, b) => parseInt(a) - parseInt(b));
                    
                    return (
                      <tr key={rowIdx} style={{ borderBottom: '1px solid #e0e0e0' }}>
                        {colKeys.map((colKey) => {
                          const content = getCellContent(rowIdx, colKey);
                          const edited = isEdited(rowIdx, colKey);
                          const highlighted = searchTerm && content.toLowerCase().includes(searchTerm.toLowerCase());
                          const isHeader = rowIdx === 0; // Treat first row as header

                          const CellTag = isHeader ? "th" : "td";

                          return (
                            <CellTag
                              key={`${rowIdx}-${colKey}`}
                              style={{
                                border: '1px solid #e0e0e0',
                                padding: '8px 12px',
                                fontSize: '14px',
                                position: 'relative',
                                backgroundColor: isHeader ? '#f5f5f5' : highlighted ? '#fff9c4' : edited ? '#e3f2fd' : 'white',
                                fontWeight: isHeader ? 600 : 400,
                                textAlign: isHeader ? 'center' : 'left',
                                borderColor: edited ? '#90caf9' : '#e0e0e0',
                              }}
                            >
                              {isEditMode && !isHeader ? (
                                <TextField
                                  value={content}
                                  onChange={(e) => handleCellEdit(rowIdx, colKey, e.target.value)}
                                  size="small"
                                  fullWidth
                                  variant="standard"
                                  sx={{ '& .MuiInput-root': { fontSize: '14px' } }}
                                />
                              ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                  <span style={{ flex: 1, whiteSpace: 'pre-wrap' }}>
                                    {content || <span style={{ color: '#ccc' }}>—</span>}
                                  </span>
                                  {edited && (
                                    <Chip label="Edited" size="small" color="secondary" sx={{ ml: 1, fontSize: '10px', height: 20 }} />
                                  )}
                                </Box>
                              )}
                            </CellTag>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Status Footer */}
      {Object.keys(editedData).length > 0 && (
        <Card sx={{ borderColor: 'primary.main', bgcolor: 'primary.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Chip
                  label={`${Object.keys(editedData).length} cells modified`}
                  color="primary"
                />
                {saveSuccess ? (
                  <Typography variant="body2" sx={{ color: 'success.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircle2 style={{ width: 16, height: 16 }} />
                    Changes saved successfully
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Remember to save your changes
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setEditedData({})}
                  disabled={saving}
                >
                  Reset All Changes
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveChanges}
                  disabled={saving || !selectedDate}
                  startIcon={saving ? <Loader2 style={{ width: 16, height: 16 }} /> : <Download style={{ width: 16, height: 16 }} />}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
