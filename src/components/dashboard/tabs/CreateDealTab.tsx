import { useState, useEffect, useMemo } from 'react';
import {
  Card, CardContent, Typography, Box, Grid, TextField, Button, Divider,
  Alert, CircularProgress, Chip, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper,
} from '@mui/material';
import { Calculator, Send, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { TreeNode } from '../../../services/tree_service';
import { calculationsAPI, CalculationResponse } from '../../../services/api';
import { formatUSD } from '../../../utils/formatters';
import type { Deal } from '../../../types';

export interface CreateDealTabProps {
  companyId: string;
  clientId: string;
  treeRoots: TreeNode[];
  treePeriods: { period: string; periodType: string }[];
  getAccessToken: () => Promise<string>;
  onDealCreated?: (deal: Deal) => void;
}

/** Normalise a label to a key the calculations service understands */
function normaliseLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/** Parse a text value like "$1,234", "(500)", "1234.56" into a number */
function parseNumericText(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/[$,\s]/g, '');
  // Handle accounting-style negatives: (123) → -123
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    return -parseFloat(cleaned.slice(1, -1)) || 0;
  }
  return parseFloat(cleaned) || 0;
}

/** Flatten tree to { normalisedLabel: numericValue } for a given period */
function treeToNodeValues(roots: TreeNode[], period: string): Record<string, number> {
  const result: Record<string, number> = {};
  const traverse = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      const key = normaliseLabel(node.label);
      if (key) {
        const val = (node.values || []).find(v => v.period === period);
        if (val) {
          result[key] = parseNumericText(val.text);
        }
      }
      traverse(node.children || []);
    }
  };
  traverse(roots);
  return result;
}

export function CreateDealTab({
  companyId,
  clientId,
  treeRoots,
  treePeriods,
  getAccessToken,
  onDealCreated,
}: CreateDealTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [appraisedValue, setAppraisedValue] = useState('');
  const [annualDebtService, setAnnualDebtService] = useState('');
  const [depreciation, setDepreciation] = useState('');
  const [dealPurpose, setDealPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResponse | null>(null);

  // Auto-select the latest period
  useEffect(() => {
    if (treePeriods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(treePeriods[treePeriods.length - 1].period);
    }
  }, [treePeriods]);

  // Build summary table — top-level tree nodes with their values per period
  const summaryRows = useMemo(() => {
    return treeRoots.map(node => {
      const periodValues: Record<string, number> = {};
      for (const p of treePeriods) {
        const val = (node.values || []).find(v => v.period === p.period);
        periodValues[p.period] = val ? parseNumericText(val.text) : 0;
      }
      return { label: node.label, periodValues };
    });
  }, [treeRoots, treePeriods]);

  const handlePreview = async () => {
    if (!selectedPeriod) {
      setError('Please select a period');
      return;
    }

    const nodeValues = treeToNodeValues(treeRoots, selectedPeriod);
    if (Object.keys(nodeValues).length === 0) {
      setError('No node values found for the selected period. Make sure the hierarchy grid has data.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await calculationsAPI.previewCalculations({
        company_id: companyId,
        period: selectedPeriod,
        node_values: nodeValues,
        loan_amount: parseFloat(loanAmount) || 0,
        appraised_value: parseFloat(appraisedValue) || 0,
        annual_debt_service: parseFloat(annualDebtService) || 0,
        depreciation: parseFloat(depreciation) || 0,
      });
      setCalculationResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to compute metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = () => {
    if (!calculationResult) return;

    const deal: Deal = {
      id: `DEAL-${Date.now()}`,
      date: new Date().toISOString(),
      amount: parseFloat(loanAmount) || 0,
      status: 'pending',
      purpose: dealPurpose || 'New Deal',
      dscr: calculationResult.dscr.value || 0,
      ltv: calculationResult.ltv.value || 0,
      revenue2024: calculationResult.gross_revenue,
      revenue2023: 0,
      noi2024: calculationResult.noi.value || 0,
      documents: 0,
    };

    // Try to get prior-period revenue for YoY comparison
    if (treePeriods.length >= 2) {
      const priorPeriod = treePeriods[treePeriods.length - 2].period;
      const priorValues = treeToNodeValues(treeRoots, priorPeriod);
      const priorRevenue = priorValues['gross_revenue'] || priorValues['total_revenue']
        || priorValues['revenue'] || priorValues['lodging_sales'] || 0;
      deal.revenue2023 = priorRevenue;
    }

    onDealCreated?.(deal);
    setError(null);
  };

  const hasTreeData = treeRoots.length > 0;

  if (!hasTreeData) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <AlertCircle style={{ width: 48, height: 48, color: '#d0d0d0', marginBottom: 16 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Hierarchy Data Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete the Hierarchy Grid tab first. Upload documents, extract data, and save the hierarchy structure.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Tree Data Summary */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Financial Data Summary
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Account</TableCell>
                  {treePeriods.map(p => (
                    <TableCell key={p.period} align="right" sx={{ fontWeight: 700 }}>
                      {p.period} ({p.periodType})
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {summaryRows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell>{row.label}</TableCell>
                    {treePeriods.map(p => (
                      <TableCell key={p.period} align="right">
                        {formatUSD(row.periodValues[p.period])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Deal Setup */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Create Deal
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Enter deal parameters and compute underwriting metrics.
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Period Selection */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                select
                fullWidth
                label="Analysis Period"
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                SelectProps={{ native: true }}
                size="small"
              >
                {treePeriods.map(p => (
                  <option key={p.period} value={p.period}>
                    {p.period} ({p.periodType})
                  </option>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                label="Deal Purpose"
                value={dealPurpose}
                onChange={e => setDealPurpose(e.target.value)}
                placeholder="e.g. Refinance, Acquisition"
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                label="Loan Amount ($)"
                type="number"
                value={loanAmount}
                onChange={e => setLoanAmount(e.target.value)}
                placeholder="0"
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                label="Appraised Value ($)"
                type="number"
                value={appraisedValue}
                onChange={e => setAppraisedValue(e.target.value)}
                placeholder="0"
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                label="Annual Debt Service ($)"
                type="number"
                value={annualDebtService}
                onChange={e => setAnnualDebtService(e.target.value)}
                placeholder="0"
                size="small"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                label="Depreciation ($)"
                type="number"
                value={depreciation}
                onChange={e => setDepreciation(e.target.value)}
                placeholder="0"
                size="small"
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} /> : <Calculator style={{ width: 16, height: 16 }} />}
              onClick={handlePreview}
              disabled={loading || !selectedPeriod}
            >
              {loading ? 'Computing…' : 'Preview Calculations'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Computed Metrics */}
      {calculationResult && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Underwriting Metrics — {selectedPeriod}
              </Typography>
              <Button
                variant="contained"
                color="success"
                startIcon={<Send style={{ width: 16, height: 16 }} />}
                onClick={handleCreateDeal}
                disabled={!calculationResult}
              >
                Create Deal
              </Button>
            </Box>

            <Grid container spacing={2}>
              {/* Summary KPIs */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Gross Revenue</Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatUSD(calculationResult.gross_revenue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Total Expenses</Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatUSD(calculationResult.total_expenses)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">Net Income</Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatUSD(calculationResult.net_income)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">NOI</Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {formatUSD(calculationResult.noi.value || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Detailed Metrics */}
            <Grid container spacing={2}>
              {[calculationResult.dscr, calculationResult.noi, calculationResult.ltv,
                calculationResult.cap_rate, calculationResult.break_even_occupancy].map(metric => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={metric.name}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>{metric.name}</Typography>
                        {metric.passed_threshold !== null && metric.passed_threshold !== undefined && (
                          metric.passed_threshold
                            ? <CheckCircle2 style={{ width: 16, height: 16, color: '#16a34a' }} />
                            : <AlertCircle style={{ width: 16, height: 16, color: '#f59e0b' }} />
                        )}
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {metric.value !== null ? (
                          metric.name.includes('LTV') || metric.name.includes('Occupancy') || metric.name.includes('Cap')
                            ? `${(metric.value * 100).toFixed(1)}%`
                            : metric.name.includes('DSCR')
                              ? `${metric.value.toFixed(2)}x`
                              : formatUSD(metric.value)
                        ) : '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {metric.formula}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                        {metric.explanation}
                      </Typography>
                      {metric.threshold !== null && metric.threshold !== undefined && (
                        <Chip
                          label={`Threshold: ${metric.threshold}`}
                          size="small"
                          color={metric.passed_threshold ? 'success' : 'warning'}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
