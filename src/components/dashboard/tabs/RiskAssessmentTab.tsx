import React, { useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField, Button, MenuItem,
  Grid, Chip, Alert, CircularProgress, Divider, LinearProgress,
  Accordion, AccordionSummary, AccordionDetails, List, ListItem,
  ListItemIcon, ListItemText, Tooltip,
} from "@mui/material";
import {
  ShieldCheck, AlertTriangle, TrendingUp, ChevronDown,
  CheckCircle, XCircle, AlertCircle, Banknote,
} from "lucide-react";
import type { RiskAssessmentTabProps, RiskAssessmentRequest, RiskAssessmentResult } from "../../../types/interfaces";
import { underwritingAPI } from "../../../services/api";
import { formatUSD } from "../../../utils/formatters";

const RISK_COLOR: Record<string, "success" | "warning" | "error" | "default"> = {
  low: "success",
  moderate: "warning",
  high: "error",
  unacceptable: "error",
};

const RISK_LABEL: Record<string, string> = {
  low: "Low Risk",
  moderate: "Moderate Risk",
  high: "High Risk",
  unacceptable: "Unacceptable Risk",
};

export function RiskAssessmentTab({ companyId, deals, getAccessToken }: RiskAssessmentTabProps) {
  const [form, setForm] = useState<Partial<RiskAssessmentRequest>>({
    employment_status: "employed",
    employment_years: 2,
    notes: "",
  });
  const [result, setResult] = useState<RiskAssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dealOptions = deals.map((d) => ({ value: d.id, label: `${d.id} — ${formatUSD(d.amount)}` }));

  const handleChange = (field: keyof RiskAssessmentRequest, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!companyId) { setError("No company selected."); return; }
    const required: (keyof RiskAssessmentRequest)[] = [
      "deal_id", "annual_income", "total_debt_payments",
      "credit_score", "loan_amount", "property_value",
      "employment_status", "employment_years",
    ];
    const missing = required.filter((k) => form[k] === undefined || form[k] === "");
    if (missing.length) { setError(`Please fill in: ${missing.join(", ")}`); return; }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload: RiskAssessmentRequest = {
        ...(form as RiskAssessmentRequest),
        company_id: companyId,
      };
      const res = await underwritingAPI.performRiskAssessment(payload);
      setResult(res);
    } catch (e: any) {
      setError(e.message || "Risk assessment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Card sx={{ borderLeft: 4, borderColor: "primary.main" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <ShieldCheck size={22} />
            <Typography variant="h6" fontWeight={600}>Risk Assessment & Analysis</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Evaluate credit history, debt-to-income ratio, LTV, employment stability, and collateral to
            produce an automated risk score and recommendations for underwriting decisions.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Input form */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Applicant & Loan Details</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  select
                  label="Deal ID"
                  size="small"
                  fullWidth
                  value={form.deal_id || ""}
                  onChange={(e) => handleChange("deal_id", e.target.value)}
                >
                  {dealOptions.length ? dealOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  )) : <MenuItem value="">No deals available</MenuItem>}
                </TextField>

                <TextField
                  label="Annual Income (USD)"
                  type="number"
                  size="small"
                  fullWidth
                  value={form.annual_income ?? ""}
                  onChange={(e) => handleChange("annual_income", parseFloat(e.target.value))}
                  inputProps={{ min: 0 }}
                />

                <TextField
                  label="Monthly Debt Obligations (USD)"
                  type="number"
                  size="small"
                  fullWidth
                  value={form.total_debt_payments ?? ""}
                  onChange={(e) => handleChange("total_debt_payments", parseFloat(e.target.value))}
                  inputProps={{ min: 0 }}
                  helperText="Sum of all monthly debt payments (mortgage, car, credit cards, etc.)"
                />

                <TextField
                  label="Credit Score"
                  type="number"
                  size="small"
                  fullWidth
                  value={form.credit_score ?? ""}
                  onChange={(e) => handleChange("credit_score", parseInt(e.target.value))}
                  inputProps={{ min: 300, max: 850 }}
                />

                <TextField
                  label="Loan Amount (USD)"
                  type="number"
                  size="small"
                  fullWidth
                  value={form.loan_amount ?? ""}
                  onChange={(e) => handleChange("loan_amount", parseFloat(e.target.value))}
                  inputProps={{ min: 0 }}
                />

                <TextField
                  label="Appraised Property Value (USD)"
                  type="number"
                  size="small"
                  fullWidth
                  value={form.property_value ?? ""}
                  onChange={(e) => handleChange("property_value", parseFloat(e.target.value))}
                  inputProps={{ min: 0 }}
                />

                <TextField
                  select
                  label="Employment Status"
                  size="small"
                  fullWidth
                  value={form.employment_status || "employed"}
                  onChange={(e) => handleChange("employment_status", e.target.value)}
                >
                  <MenuItem value="employed">Employed (W-2)</MenuItem>
                  <MenuItem value="self_employed">Self-Employed</MenuItem>
                  <MenuItem value="retired">Retired</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>

                <TextField
                  label="Years at Current Employer"
                  type="number"
                  size="small"
                  fullWidth
                  value={form.employment_years ?? ""}
                  onChange={(e) => handleChange("employment_years", parseFloat(e.target.value))}
                  inputProps={{ min: 0, step: 0.5 }}
                />

                <TextField
                  label="Notes (optional)"
                  multiline
                  rows={2}
                  size="small"
                  fullWidth
                  value={form.notes || ""}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />

                {error && <Alert severity="error">{error}</Alert>}

                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !companyId}
                  startIcon={loading ? <CircularProgress size={16} /> : <ShieldCheck size={16} />}
                >
                  {loading ? "Analyzing…" : "Run Risk Assessment"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        <Grid size={{ xs: 12, md: 6 }}>
          {result ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Score card */}
              <Card sx={{ bgcolor: "grey.900", color: "white" }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>Risk Score</Typography>
                    <Chip
                      label={RISK_LABEL[result.risk_level]}
                      color={RISK_COLOR[result.risk_level]}
                      size="small"
                    />
                  </Box>
                  <Typography variant="h2" fontWeight={700} sx={{ mb: 1 }}>{result.risk_score}/100</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={result.risk_score}
                    color={RISK_COLOR[result.risk_level] === "default" ? "primary" : RISK_COLOR[result.risk_level]}
                    sx={{ height: 8, borderRadius: 1, bgcolor: "grey.700" }}
                  />
                </CardContent>
              </Card>

              {/* Key ratios */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Key Financial Ratios</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">Debt-to-Income (DTI)</Typography>
                        <Typography variant="h6" fontWeight={700}>{(result.dti_ratio * 100).toFixed(1)}%</Typography>
                        <Chip
                          label={result.dti_ratio <= 0.36 ? "Excellent" : result.dti_ratio <= 0.43 ? "Acceptable" : "High"}
                          color={result.dti_ratio <= 0.36 ? "success" : result.dti_ratio <= 0.43 ? "warning" : "error"}
                          size="small" variant="outlined" sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">Loan-to-Value (LTV)</Typography>
                        <Typography variant="h6" fontWeight={700}>{(result.ltv_ratio * 100).toFixed(1)}%</Typography>
                        <Chip
                          label={result.ltv_ratio <= 0.75 ? "Conservative" : result.ltv_ratio <= 0.80 ? "Standard" : "Elevated"}
                          color={result.ltv_ratio <= 0.75 ? "success" : result.ltv_ratio <= 0.80 ? "warning" : "error"}
                          size="small" variant="outlined" sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">Credit Score</Typography>
                        <Typography variant="h6" fontWeight={700}>{result.credit_score}</Typography>
                        <Chip
                          label={result.credit_score >= 750 ? "Excellent" : result.credit_score >= 700 ? "Good" : result.credit_score >= 650 ? "Fair" : "Poor"}
                          color={result.credit_score >= 700 ? "success" : result.credit_score >= 650 ? "warning" : "error"}
                          size="small" variant="outlined" sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">Assessment ID</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: "monospace", fontSize: "0.7rem", mt: 0.5 }}>
                          {result.assessment_id.slice(0, 8)}…
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Flags */}
              {result.flags.length > 0 && (
                <Alert severity="error" icon={<AlertTriangle size={18} />}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>Risk Flags</Typography>
                  <List dense disablePadding>
                    {result.flags.map((f, i) => (
                      <ListItem key={i} disablePadding sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 24 }}><XCircle size={14} color="currentColor" /></ListItemIcon>
                        <ListItemText primary={f} primaryTypographyProps={{ variant: "body2" }} />
                      </ListItem>
                    ))}
                  </List>
                </Alert>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Underwriter Recommendations
                    </Typography>
                    <List dense disablePadding>
                      {result.recommendations.map((r, i) => (
                        <ListItem key={i} disablePadding sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle size={14} color="#2e7d32" /></ListItemIcon>
                          <ListItemText primary={r} primaryTypographyProps={{ variant: "body2" }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}
            </Box>
          ) : (
            <Card sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CardContent sx={{ textAlign: "center" }}>
                <ShieldCheck size={48} color="#ccc" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Fill in the applicant details and click "Run Risk Assessment" to view results.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
