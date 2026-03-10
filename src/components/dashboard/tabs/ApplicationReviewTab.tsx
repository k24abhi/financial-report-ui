import React, { useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField, Button, MenuItem,
  Grid, Chip, Alert, CircularProgress, Checkbox, FormControlLabel,
  LinearProgress, List, ListItem, ListItemText, ListItemIcon, Divider,
} from "@mui/material";
import {
  FileCheck, AlertCircle, CheckCircle, XCircle, ClipboardList,
} from "lucide-react";
import type {
  ApplicationReviewTabProps,
  ApplicationReviewRequest,
  ApplicationReviewResult,
  UnderwritingDecisionRequest,
  UnderwritingDecisionResult,
} from "../../../types/interfaces";
import { underwritingAPI } from "../../../services/api";
import { formatUSD } from "../../../utils/formatters";

const DOCUMENT_TYPES: { key: string; label: string }[] = [
  { key: "tax_returns_2_years", label: "2-Year Tax Returns" },
  { key: "bank_statements_3_months", label: "3-Month Bank Statements" },
  { key: "profit_loss_statement", label: "Profit & Loss Statement" },
  { key: "balance_sheet", label: "Balance Sheet" },
  { key: "rent_roll", label: "Rent Roll" },
  { key: "property_appraisal", label: "Property Appraisal" },
  { key: "credit_report", label: "Credit Report Authorization" },
  { key: "identity_verification", label: "Identity Verification (Gov ID)" },
  { key: "entity_documents", label: "Entity / Business Documents" },
];

const DECISION_COLOR: Record<string, "success" | "warning" | "error"> = {
  approve: "success",
  suspend: "warning",
  deny: "error",
};

export function ApplicationReviewTab({ companyId, deals, getAccessToken }: ApplicationReviewTabProps) {
  const [selectedDealId, setSelectedDealId] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("purchase");
  const [loanAmount, setLoanAmount] = useState<number | "">("");
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());
  const [reviewNotes, setReviewNotes] = useState("");

  const [reviewResult, setReviewResult] = useState<ApplicationReviewResult | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Decision form
  const [decision, setDecision] = useState<"approve" | "suspend" | "deny">("approve");
  const [rationale, setRationale] = useState("");
  const [conditions, setConditions] = useState("");
  const [interestRate, setInterestRate] = useState<number | "">("");
  const [termMonths, setTermMonths] = useState<number | "">(360);
  const [decisionResult, setDecisionResult] = useState<UnderwritingDecisionResult | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const dealOptions = deals.map((d) => ({ value: d.id, label: `${d.id} — ${formatUSD(d.amount)}` }));

  const toggleDoc = (key: string) => {
    setCheckedDocs((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleReview = async () => {
    if (!companyId) { setReviewError("No company selected."); return; }
    if (!selectedDealId || !applicantName || !loanAmount) {
      setReviewError("Please fill Deal ID, Applicant Name, and Loan Amount."); return;
    }
    setReviewLoading(true);
    setReviewError(null);
    setReviewResult(null);
    try {
      const payload: ApplicationReviewRequest = {
        company_id: companyId,
        deal_id: selectedDealId,
        documents_received: Array.from(checkedDocs),
        applicant_name: applicantName,
        loan_purpose: loanPurpose,
        loan_amount: Number(loanAmount),
        notes: reviewNotes || undefined,
      };
      const res = await underwritingAPI.reviewApplication(payload);
      setReviewResult(res);
      if (res.status === "returned") {
        setDecision("suspend");
      }
    } catch (e: any) {
      setReviewError(e.message || "Review failed.");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleDecision = async () => {
    if (!companyId || !selectedDealId) { setDecisionError("No company/deal selected."); return; }
    if (!rationale.trim() || rationale.trim().length < 10) {
      setDecisionError("Rationale must be at least 10 characters."); return;
    }
    setDecisionLoading(true);
    setDecisionError(null);
    setDecisionResult(null);
    try {
      const conditionsList = conditions.split("\n").map((c) => c.trim()).filter(Boolean);
      const payload: UnderwritingDecisionRequest = {
        company_id: companyId,
        deal_id: selectedDealId,
        decision,
        loan_amount: Number(loanAmount) || undefined,
        interest_rate: interestRate !== "" ? Number(interestRate) : undefined,
        loan_term_months: termMonths !== "" ? Number(termMonths) : undefined,
        conditions: conditionsList,
        rationale,
      };
      const res = await underwritingAPI.recordDecision(payload);
      setDecisionResult(res);
    } catch (e: any) {
      setDecisionError(e.message || "Failed to record decision.");
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Card sx={{ borderLeft: 4, borderColor: "secondary.main" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <ClipboardList size={22} />
            <Typography variant="h6" fontWeight={600}>Application Review & Decision Making</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Verify document completeness, check application eligibility, and record the formal
            underwriting decision with conditions, rationale, and loan terms.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Document checklist */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Document Verification Checklist</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    label="Deal"
                    size="small"
                    fullWidth
                    value={selectedDealId}
                    onChange={(e) => setSelectedDealId(e.target.value)}
                  >
                    {dealOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Applicant Name"
                    size="small"
                    fullWidth
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    label="Loan Purpose"
                    size="small"
                    fullWidth
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                  >
                    <MenuItem value="purchase">Purchase</MenuItem>
                    <MenuItem value="refinance">Refinance</MenuItem>
                    <MenuItem value="cash_out_refi">Cash-Out Refinance</MenuItem>
                    <MenuItem value="construction">Construction</MenuItem>
                    <MenuItem value="bridge">Bridge Loan</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Loan Amount (USD)"
                    type="number"
                    size="small"
                    fullWidth
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(parseFloat(e.target.value))}
                  />
                </Grid>
              </Grid>

              <Typography variant="body2" fontWeight={500} gutterBottom>Documents Received</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5, mb: 2 }}>
                {DOCUMENT_TYPES.map((doc) => (
                  <FormControlLabel
                    key={doc.key}
                    control={
                      <Checkbox
                        size="small"
                        checked={checkedDocs.has(doc.key)}
                        onChange={() => toggleDoc(doc.key)}
                      />
                    }
                    label={<Typography variant="body2">{doc.label}</Typography>}
                  />
                ))}
              </Box>

              <TextField
                label="Reviewer Notes (optional)"
                multiline rows={2} size="small" fullWidth
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                sx={{ mb: 2 }}
              />

              {reviewError && <Alert severity="error" sx={{ mb: 2 }}>{reviewError}</Alert>}
              <Button
                variant="contained"
                onClick={handleReview}
                disabled={reviewLoading || !companyId}
                startIcon={reviewLoading ? <CircularProgress size={16} /> : <FileCheck size={16} />}
                fullWidth
              >
                {reviewLoading ? "Reviewing…" : "Verify Application"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Review result + decision */}
        <Grid size={{ xs: 12, md: 6 }}>
          {reviewResult && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>Completeness Score</Typography>
                    <Chip
                      label={reviewResult.status === "complete" ? "Complete" : reviewResult.status === "returned" ? "Returned" : "Incomplete"}
                      color={reviewResult.status === "complete" ? "success" : reviewResult.status === "returned" ? "error" : "warning"}
                      size="small"
                    />
                  </Box>
                  <Typography variant="h4" fontWeight={700}>{reviewResult.completeness_score.toFixed(0)}%</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={reviewResult.completeness_score}
                    color={reviewResult.completeness_score === 100 ? "success" : reviewResult.completeness_score >= 50 ? "warning" : "error"}
                    sx={{ height: 8, borderRadius: 1, my: 1 }}
                  />
                  {reviewResult.missing_documents.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      <Typography variant="body2" fontWeight={600} gutterBottom>Missing Documents</Typography>
                      {reviewResult.missing_documents.map((d, i) => (
                        <Chip key={i} label={d.replace(/_/g, " ")} size="small" sx={{ m: 0.25 }} />
                      ))}
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Decision form */}
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>Underwriting Decision</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField
                      select
                      label="Decision"
                      size="small"
                      fullWidth
                      value={decision}
                      onChange={(e) => setDecision(e.target.value as any)}
                    >
                      <MenuItem value="approve">Approve</MenuItem>
                      <MenuItem value="suspend">Suspend — Awaiting Information</MenuItem>
                      <MenuItem value="deny">Deny</MenuItem>
                    </TextField>

                    <Grid container spacing={1}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="Interest Rate (%)"
                          type="number"
                          size="small"
                          fullWidth
                          value={interestRate}
                          onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                          inputProps={{ min: 0, max: 30, step: 0.125 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          label="Loan Term (months)"
                          type="number"
                          size="small"
                          fullWidth
                          value={termMonths}
                          onChange={(e) => setTermMonths(parseInt(e.target.value))}
                        />
                      </Grid>
                    </Grid>

                    <TextField
                      label="Conditions (one per line)"
                      multiline rows={3} size="small" fullWidth
                      placeholder="e.g. Requires co-signer&#10;Minimum 20% down payment"
                      value={conditions}
                      onChange={(e) => setConditions(e.target.value)}
                    />

                    <TextField
                      label="Rationale *"
                      multiline rows={3} size="small" fullWidth
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      helperText="Documented reasoning for the decision (required for audit trail)"
                    />

                    {decisionError && <Alert severity="error">{decisionError}</Alert>}

                    <Button
                      variant="contained"
                      color={DECISION_COLOR[decision]}
                      onClick={handleDecision}
                      disabled={decisionLoading}
                      startIcon={decisionLoading ? <CircularProgress size={16} /> : undefined}
                      fullWidth
                    >
                      {decisionLoading ? "Recording…" : `Record Decision: ${decision.toUpperCase()}`}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {decisionResult && (
            <Alert
              severity={decisionResult.decision === "approve" ? "success" : decisionResult.decision === "deny" ? "error" : "warning"}
              sx={{ mt: 2 }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                Decision Recorded — {decisionResult.decision.toUpperCase()}
              </Typography>
              <Typography variant="body2">
                Decision ID: {decisionResult.decision_id.slice(0, 8)}… | By: {decisionResult.decided_by}
              </Typography>
              {decisionResult.conditions.length > 0 && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Conditions: {decisionResult.conditions.join(" | ")}
                </Typography>
              )}
            </Alert>
          )}

          {!reviewResult && (
            <Card sx={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CardContent sx={{ textAlign: "center" }}>
                <ClipboardList size={40} color="#ccc" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Complete the document checklist to begin application review.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
