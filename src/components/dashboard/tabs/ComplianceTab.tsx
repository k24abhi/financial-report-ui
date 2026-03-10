import React, { useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField, Button, MenuItem,
  Grid, Chip, Alert, CircularProgress, Checkbox, FormControlLabel,
  FormGroup, Divider, List, ListItem, ListItemText, Accordion,
  AccordionSummary, AccordionDetails, Tab, Tabs,
} from "@mui/material";
import { Scale, CheckCircle, XCircle, AlertTriangle, ChevronDown, StickyNote, FileSearch } from "lucide-react";
import type {
  ComplianceTabProps,
  ComplianceCheckRequest,
  ComplianceCheckResult,
  ComplianceNoteRequest,
  ComplianceNoteResult,
  ComplianceReviewRequest,
  ComplianceReviewResult,
} from "../../../types/interfaces";
import { complianceAPI } from "../../../services/api";
import { formatUSD } from "../../../utils/formatters";

const REGULATORY_FRAMEWORKS = [
  { key: "trid", label: "TRID" },
  { key: "respa", label: "RESPA" },
  { key: "hmda", label: "HMDA" },
  { key: "atr_qm", label: "ATR/QM Rule" },
];

export function ComplianceTab({ companyId, deals, getAccessToken }: ComplianceTabProps) {
  const [subTab, setSubTab] = useState(0);

  // — Compliance Check state
  const [checkForm, setCheckForm] = useState<Partial<ComplianceCheckRequest>>({
    investor_type: "fannie_mae",
    loan_type: "conventional",
    property_type: "single_family",
    occupancy_type: "primary",
    regulatory_frameworks: [],
  });
  const [checkResult, setCheckResult] = useState<ComplianceCheckResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  // — Compliance Note state
  const [noteForm, setNoteForm] = useState<Partial<ComplianceNoteRequest>>({ note_type: "underwriting" });
  const [noteResult, setNoteResult] = useState<ComplianceNoteResult | null>(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // — Compliance Review state
  const [reviewForm, setReviewForm] = useState<Partial<ComplianceReviewRequest>>({
    review_type: "pre_approval",
    outcome: "pass",
    conditions: [],
  });
  const [reviewConditionsText, setReviewConditionsText] = useState("");
  const [reviewResult, setReviewResult] = useState<ComplianceReviewResult | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const dealOptions = deals.map((d) => ({ value: d.id, label: d.id }));

  const toggleFramework = (key: string) => {
    setCheckForm((prev) => {
      const current = prev.regulatory_frameworks || [];
      return {
        ...prev,
        regulatory_frameworks: current.includes(key)
          ? current.filter((f) => f !== key)
          : [...current, key],
      };
    });
  };

  const handleCheck = async () => {
    if (!companyId) { setCheckError("No company selected."); return; }
    if (!checkForm.deal_id || !checkForm.loan_amount || !checkForm.credit_score || !checkForm.dti_ratio || !checkForm.ltv_ratio) {
      setCheckError("Please fill all required fields."); return;
    }
    setCheckLoading(true); setCheckError(null); setCheckResult(null);
    try {
      const res = await complianceAPI.runComplianceCheck({ ...(checkForm as ComplianceCheckRequest), company_id: companyId });
      setCheckResult(res);
    } catch (e: any) {
      setCheckError(e.message || "Compliance check failed.");
    } finally {
      setCheckLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!companyId) { setNoteError("No company selected."); return; }
    if (!noteForm.deal_id || !noteForm.note_text?.trim()) {
      setNoteError("Deal and note text are required."); return;
    }
    setNoteLoading(true); setNoteError(null); setNoteResult(null);
    try {
      const res = await complianceAPI.addNote({ ...(noteForm as ComplianceNoteRequest), company_id: companyId });
      setNoteResult(res);
      setNoteForm({ note_type: "underwriting" });
    } catch (e: any) {
      setNoteError(e.message || "Failed to add note.");
    } finally {
      setNoteLoading(false);
    }
  };

  const handleReview = async () => {
    if (!companyId) { setReviewError("No company selected."); return; }
    if (!reviewForm.deal_id || !reviewForm.findings?.trim()) {
      setReviewError("Deal and findings are required."); return;
    }
    setReviewLoading(true); setReviewError(null); setReviewResult(null);
    try {
      const res = await complianceAPI.submitReview({
        ...(reviewForm as ComplianceReviewRequest),
        conditions: reviewConditionsText.split("\n").map((c) => c.trim()).filter(Boolean),
        company_id: companyId,
      });
      setReviewResult(res);
    } catch (e: any) {
      setReviewError(e.message || "Failed to submit review.");
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Card sx={{ borderLeft: 4, borderColor: "warning.main" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Scale size={22} />
            <Typography variant="h6" fontWeight={600}>Compliance & Regulatory Adherence</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Apply Fannie Mae, Freddie Mac, FHA, VA, and USDA investor guidelines. Ensure compliance with
            TRID, RESPA, HMDA, and the ATR/QM rule. Maintain audit-ready LOS notes.
          </Typography>
        </CardContent>
      </Card>

      <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Investor Guidelines Check" />
        <Tab label="LOS Underwriting Notes" />
        <Tab label="Compliance Review" />
      </Tabs>

      {/* Sub-tab 0: Compliance Check */}
      {subTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Loan Parameters</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField select label="Deal" size="small" fullWidth value={checkForm.deal_id || ""}
                    onChange={(e) => setCheckForm((p) => ({ ...p, deal_id: e.target.value }))}>
                    {dealOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>

                  <TextField select label="Investor / Agency" size="small" fullWidth
                    value={checkForm.investor_type || "fannie_mae"}
                    onChange={(e) => setCheckForm((p) => ({ ...p, investor_type: e.target.value as any }))}>
                    <MenuItem value="fannie_mae">Fannie Mae (FNMA)</MenuItem>
                    <MenuItem value="freddie_mac">Freddie Mac (FHLMC)</MenuItem>
                    <MenuItem value="fha">FHA</MenuItem>
                    <MenuItem value="va">VA</MenuItem>
                    <MenuItem value="usda">USDA</MenuItem>
                  </TextField>

                  <TextField select label="Loan Type" size="small" fullWidth
                    value={checkForm.loan_type || "conventional"}
                    onChange={(e) => setCheckForm((p) => ({ ...p, loan_type: e.target.value as any }))}>
                    <MenuItem value="conventional">Conventional</MenuItem>
                    <MenuItem value="fha">FHA</MenuItem>
                    <MenuItem value="va">VA</MenuItem>
                    <MenuItem value="usda">USDA</MenuItem>
                    <MenuItem value="jumbo">Jumbo</MenuItem>
                  </TextField>

                  <Grid container spacing={1}>
                    <Grid size={{ xs: 6 }}>
                      <TextField label="Loan Amount ($)" type="number" size="small" fullWidth
                        value={checkForm.loan_amount ?? ""}
                        onChange={(e) => setCheckForm((p) => ({ ...p, loan_amount: parseFloat(e.target.value) }))} />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField label="Credit Score" type="number" size="small" fullWidth
                        value={checkForm.credit_score ?? ""}
                        onChange={(e) => setCheckForm((p) => ({ ...p, credit_score: parseInt(e.target.value) }))}
                        inputProps={{ min: 300, max: 850 }} />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField label="DTI Ratio (0-1)" type="number" size="small" fullWidth
                        value={checkForm.dti_ratio ?? ""}
                        onChange={(e) => setCheckForm((p) => ({ ...p, dti_ratio: parseFloat(e.target.value) }))}
                        inputProps={{ min: 0, max: 1, step: 0.01 }} helperText="e.g. 0.43 = 43%" />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField label="LTV Ratio (0-2)" type="number" size="small" fullWidth
                        value={checkForm.ltv_ratio ?? ""}
                        onChange={(e) => setCheckForm((p) => ({ ...p, ltv_ratio: parseFloat(e.target.value) }))}
                        inputProps={{ min: 0, max: 2, step: 0.01 }} helperText="e.g. 0.80 = 80%" />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField select label="Property Type" size="small" fullWidth
                        value={checkForm.property_type || "single_family"}
                        onChange={(e) => setCheckForm((p) => ({ ...p, property_type: e.target.value as any }))}>
                        <MenuItem value="single_family">Single Family</MenuItem>
                        <MenuItem value="multi_family">Multi-Family</MenuItem>
                        <MenuItem value="commercial">Commercial</MenuItem>
                        <MenuItem value="condo">Condo</MenuItem>
                        <MenuItem value="townhouse">Townhouse</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <TextField select label="Occupancy" size="small" fullWidth
                        value={checkForm.occupancy_type || "primary"}
                        onChange={(e) => setCheckForm((p) => ({ ...p, occupancy_type: e.target.value as any }))}>
                        <MenuItem value="primary">Primary Residence</MenuItem>
                        <MenuItem value="secondary">Secondary / Vacation</MenuItem>
                        <MenuItem value="investment">Investment Property</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>

                  <Box>
                    <Typography variant="body2" fontWeight={500} gutterBottom>Regulatory Frameworks</Typography>
                    <FormGroup row>
                      {REGULATORY_FRAMEWORKS.map((fw) => (
                        <FormControlLabel key={fw.key}
                          control={
                            <Checkbox size="small"
                              checked={checkForm.regulatory_frameworks?.includes(fw.key) || false}
                              onChange={() => toggleFramework(fw.key)} />
                          }
                          label={<Typography variant="body2">{fw.label}</Typography>} />
                      ))}
                    </FormGroup>
                  </Box>

                  {checkError && <Alert severity="error">{checkError}</Alert>}
                  <Button variant="contained" onClick={handleCheck} disabled={checkLoading || !companyId}
                    startIcon={checkLoading ? <CircularProgress size={16} /> : <Scale size={16} />} fullWidth>
                    {checkLoading ? "Checking…" : "Run Compliance Check"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {checkResult ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Alert severity={checkResult.passed ? "success" : "error"} icon={checkResult.passed ? <CheckCircle size={18} /> : <XCircle size={18} />}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {checkResult.passed ? "All investor guidelines passed" : "Guideline violations found"}
                  </Typography>
                  <Typography variant="body2">{checkResult.investor_type.replace(/_/g, " ").toUpperCase()} — {new Date(checkResult.checked_at).toLocaleString()}</Typography>
                </Alert>

                {checkResult.violations.length > 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={600} color="error" gutterBottom>Violations</Typography>
                      {checkResult.violations.map((v, i) => (
                        <Alert key={i} severity="error" sx={{ mb: 1 }} icon={<XCircle size={14} />}>
                          <Typography variant="body2">{v}</Typography>
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {checkResult.warnings.length > 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={600} color="warning.main" gutterBottom>Warnings</Typography>
                      {checkResult.warnings.map((w, i) => (
                        <Alert key={i} severity="warning" sx={{ mb: 1 }} icon={<AlertTriangle size={14} />}>
                          <Typography variant="body2">{w}</Typography>
                        </Alert>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {Object.keys(checkResult.regulatory_findings).length > 0 && (
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>Regulatory Framework Findings</Typography>
                      {Object.entries(checkResult.regulatory_findings).map(([fw, findings]) => (
                        <Accordion key={fw} disableGutters elevation={0} sx={{ border: 1, borderColor: "divider", mb: 1 }}>
                          <AccordionSummary expandIcon={<ChevronDown size={16} />}>
                            <Typography variant="body2" fontWeight={600}>{fw}</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {findings.map((f, i) => (
                              <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>• {f}</Typography>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </Box>
            ) : (
              <Card sx={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <Scale size={40} color="#ccc" />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Fill in loan parameters and run the compliance check.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* Sub-tab 1: LOS Notes */}
      {subTab === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <StickyNote size={18} />
                  <Typography variant="subtitle1" fontWeight={600}>Add Underwriting Note (LOS)</Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField select label="Deal" size="small" fullWidth value={noteForm.deal_id || ""}
                    onChange={(e) => setNoteForm((p) => ({ ...p, deal_id: e.target.value }))}>
                    {dealOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                  <TextField select label="Note Type" size="small" fullWidth value={noteForm.note_type || "underwriting"}
                    onChange={(e) => setNoteForm((p) => ({ ...p, note_type: e.target.value as any }))}>
                    <MenuItem value="underwriting">Underwriting Analysis</MenuItem>
                    <MenuItem value="condition_clearing">Condition Clearing</MenuItem>
                    <MenuItem value="review">Review / QC</MenuItem>
                    <MenuItem value="general">General</MenuItem>
                  </TextField>
                  <TextField label="Referenced Guideline (optional)" size="small" fullWidth
                    placeholder="e.g. Fannie Mae B3-3.1-01"
                    value={noteForm.referenced_guideline || ""}
                    onChange={(e) => setNoteForm((p) => ({ ...p, referenced_guideline: e.target.value }))} />
                  <TextField label="Note Text *" multiline rows={5} size="small" fullWidth
                    value={noteForm.note_text || ""}
                    onChange={(e) => setNoteForm((p) => ({ ...p, note_text: e.target.value }))}
                    helperText="This note will be permanently stored as part of the audit trail." />
                  {noteError && <Alert severity="error">{noteError}</Alert>}
                  {noteResult && (
                    <Alert severity="success">
                      Note saved. ID: {noteResult.note_id.slice(0, 8)}… | {new Date(noteResult.created_at).toLocaleString()}
                    </Alert>
                  )}
                  <Button variant="contained" onClick={handleAddNote} disabled={noteLoading || !companyId}
                    startIcon={noteLoading ? <CircularProgress size={16} /> : <StickyNote size={16} />} fullWidth>
                    {noteLoading ? "Saving…" : "Save Note to LOS"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: "100%", bgcolor: "grey.50" }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>What Are LOS Notes?</Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Loan Origination System (LOS) notes provide the official audit trail for every underwriting
                  decision. They document:
                </Typography>
                <List dense>
                  {[
                    "Detailed analysis of borrower financials",
                    "Risk factors and compensating factors",
                    "Conditions required and how they were cleared",
                    "Regulatory guideline references (e.g. Fannie Mae B3-x)",
                    "QC review findings and outcomes",
                  ].map((item, i) => (
                    <ListItem key={i} disablePadding sx={{ py: 0.5 }}>
                      <ListItemText primary={`• ${item}`} primaryTypographyProps={{ variant: "body2" }} />
                    </ListItem>
                  ))}
                </List>
                <Alert severity="info" sx={{ mt: 1 }}>
                  Notes are immutable once saved and are available for regulatory audit review.
                </Alert>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Sub-tab 2: Compliance Review */}
      {subTab === 2 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <FileSearch size={18} />
                  <Typography variant="subtitle1" fontWeight={600}>Submit Compliance Review</Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField select label="Deal" size="small" fullWidth value={reviewForm.deal_id || ""}
                    onChange={(e) => setReviewForm((p) => ({ ...p, deal_id: e.target.value }))}>
                    {dealOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                  <TextField select label="Review Type" size="small" fullWidth value={reviewForm.review_type || "pre_approval"}
                    onChange={(e) => setReviewForm((p) => ({ ...p, review_type: e.target.value as any }))}>
                    <MenuItem value="pre_approval">Pre-Approval Review</MenuItem>
                    <MenuItem value="closing">Closing Review</MenuItem>
                    <MenuItem value="post_closing">Post-Closing Review</MenuItem>
                    <MenuItem value="audit">Internal Audit</MenuItem>
                  </TextField>
                  <TextField select label="Outcome" size="small" fullWidth value={reviewForm.outcome || "pass"}
                    onChange={(e) => setReviewForm((p) => ({ ...p, outcome: e.target.value as any }))}>
                    <MenuItem value="pass">Pass</MenuItem>
                    <MenuItem value="conditional">Conditional Pass</MenuItem>
                    <MenuItem value="fail">Fail</MenuItem>
                  </TextField>
                  <TextField label="Findings *" multiline rows={4} size="small" fullWidth
                    value={reviewForm.findings || ""}
                    onChange={(e) => setReviewForm((p) => ({ ...p, findings: e.target.value }))}
                    helperText="Summarize the compliance findings for this review." />
                  <TextField label="Conditions (one per line)" multiline rows={3} size="small" fullWidth
                    value={reviewConditionsText}
                    onChange={(e) => setReviewConditionsText(e.target.value)} />
                  {reviewError && <Alert severity="error">{reviewError}</Alert>}
                  {reviewResult && (
                    <Alert severity={reviewResult.outcome === "pass" ? "success" : reviewResult.outcome === "fail" ? "error" : "warning"}>
                      Review saved — {reviewResult.outcome.toUpperCase()} | ID: {reviewResult.review_id.slice(0, 8)}…
                    </Alert>
                  )}
                  <Button variant="contained" onClick={handleReview} disabled={reviewLoading || !companyId}
                    startIcon={reviewLoading ? <CircularProgress size={16} /> : <FileSearch size={16} />} fullWidth>
                    {reviewLoading ? "Submitting…" : "Submit Compliance Review"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ bgcolor: "grey.50" }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Review Types Explained</Typography>
                {[
                  { type: "Pre-Approval Review", desc: "Confirm all conditions are met before issuing loan commitment letter." },
                  { type: "Closing Review", desc: "Final check that all closing docs, title, and disbursement conditions are satisfied." },
                  { type: "Post-Closing Review", desc: "Quality control audit after loan has funded; verify file is saleable." },
                  { type: "Internal Audit", desc: "Scheduled compliance audit to ensure consistency with current investor guidelines and regulatory changes." },
                ].map((item, i) => (
                  <Box key={i} sx={{ mb: 1.5 }}>
                    <Typography variant="body2" fontWeight={600}>{item.type}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                    {i < 3 && <Divider sx={{ mt: 1.5 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
