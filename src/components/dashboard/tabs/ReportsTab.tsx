import React, { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Typography, TextField, Button, MenuItem,
  Grid, Chip, Alert, CircularProgress, Divider, List, ListItem,
  ListItemText, ListItemSecondaryAction, IconButton, Tab, Tabs,
} from "@mui/material";
import {
  Activity, AlertTriangle, CheckCircle, TrendingDown, Bell,
  FileBarChart, BarChart3, RefreshCw,
} from "lucide-react";
import type {
  ReportsTabProps,
  MonitoringFlagRequest,
  MonitoringFlagResult,
} from "../../../types/interfaces";
import { underwritingAPI } from "../../../services/api";
import { formatUSD, formatDate } from "../../../utils/formatters";

const SEVERITY_COLOR: Record<string, "default" | "success" | "warning" | "error"> = {
  low: "default",
  medium: "warning",
  high: "error",
  critical: "error",
};

const FLAG_TYPE_LABELS: Record<string, string> = {
  past_due: "Past Due",
  risk_increase: "Risk Increase",
  covenant_breach: "Covenant Breach",
  renewal_due: "Renewal Due",
  other: "Other",
};

export function ReportsTab({ companyId, clientId, deals, gridData, getAccessToken }: ReportsTabProps) {
  const [subTab, setSubTab] = useState(0);

  // — Monitoring Flags
  const [flagForm, setFlagForm] = useState<Partial<MonitoringFlagRequest>>({
    flag_type: "past_due",
    severity: "medium",
  });
  const [flags, setFlags] = useState<MonitoringFlagResult[]>([]);
  const [flagLoading, setFlagLoading] = useState(false);
  const [flagError, setFlagError] = useState<string | null>(null);
  const [addFlagLoading, setAddFlagLoading] = useState(false);
  const [addFlagError, setAddFlagError] = useState<string | null>(null);

  const dealOptions = deals.map((d) => ({ value: d.id, label: `${d.id} — ${formatUSD(d.amount)}` }));

  const loadFlags = async () => {
    if (!companyId) return;
    setFlagLoading(true);
    try {
      const res = await underwritingAPI.listMonitoringFlags(companyId);
      setFlags(res);
    } catch {
      // silent
    } finally {
      setFlagLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 0) loadFlags();
  }, [subTab, companyId]);

  const handleAddFlag = async () => {
    if (!companyId) { setAddFlagError("No company selected."); return; }
    if (!flagForm.deal_id || !flagForm.description?.trim()) {
      setAddFlagError("Deal and description are required."); return;
    }
    setAddFlagLoading(true);
    setAddFlagError(null);
    try {
      const res = await underwritingAPI.flagForMonitoring({ ...(flagForm as MonitoringFlagRequest), company_id: companyId });
      setFlags((prev) => [res, ...prev]);
      setFlagForm({ flag_type: "past_due", severity: "medium" });
    } catch (e: any) {
      setAddFlagError(e.message || "Failed to add flag.");
    } finally {
      setAddFlagLoading(false);
    }
  };

  const handleResolveFlag = async (flag_id: string) => {
    try {
      const res = await underwritingAPI.resolveFlag(flag_id);
      setFlags((prev) => prev.map((f) => f.flag_id === flag_id ? res : f));
    } catch {
      // silent
    }
  };

  // — Portfolio summary
  const openFlags = flags.filter((f) => f.status === "open");
  const criticalFlags = flags.filter((f) => f.severity === "critical" && f.status === "open");
  const totalDealValue = deals.reduce((sum, d) => sum + d.amount, 0);
  const avgDscr = deals.length ? deals.reduce((sum, d) => sum + d.dscr, 0) / deals.length : 0;
  const avgLtv = deals.length ? deals.reduce((sum, d) => sum + d.ltv, 0) / deals.length : 0;
  const dealsAbove125Dscr = deals.filter((d) => d.dscr >= 1.25).length;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Card sx={{ borderLeft: 4, borderColor: "info.main" }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <FileBarChart size={22} />
            <Typography variant="h6" fontWeight={600}>Monitoring, Reporting & Portfolio Analytics</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Monitor accounts for past-due activity, flag risk changes at renewal, track open conditions,
            and produce management reporting on portfolio health and underwriting performance.
          </Typography>
        </CardContent>
      </Card>

      {/* KPI row */}
      <Grid container spacing={2}>
        {[
          { label: "Total Portfolio Value", value: formatUSD(totalDealValue), icon: <BarChart3 size={20} />, color: "primary.main" },
          { label: "Avg. DSCR", value: `${avgDscr.toFixed(2)}x`, icon: <TrendingDown size={20} />, color: avgDscr >= 1.25 ? "success.main" : "warning.main" },
          { label: "Avg. LTV", value: `${avgLtv.toFixed(1)}%`, icon: <Activity size={20} />, color: avgLtv <= 75 ? "success.main" : avgLtv <= 85 ? "warning.main" : "error.main" },
          { label: "Open Monitoring Flags", value: openFlags.length.toString(), icon: <Bell size={20} />, color: criticalFlags.length > 0 ? "error.main" : "warning.main" },
          { label: "Deals Passing DSCR ≥1.25", value: `${dealsAbove125Dscr} / ${deals.length}`, icon: <CheckCircle size={20} />, color: "success.main" },
        ].map((kpi, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={i}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Box sx={{ color: kpi.color, mb: 1 }}>{kpi.icon}</Box>
                <Typography variant="h6" fontWeight={700}>{kpi.value}</Typography>
                <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Tabs value={subTab} onChange={(_, v) => setSubTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Monitoring Flags" />
        <Tab label="Portfolio Risk Report" />
        <Tab label="Deal Summary" />
      </Tabs>

      {/* Sub-tab 0: Monitoring Flags */}
      {subTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>Add Monitoring Flag</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <TextField select label="Deal" size="small" fullWidth value={flagForm.deal_id || ""}
                    onChange={(e) => setFlagForm((p) => ({ ...p, deal_id: e.target.value }))}>
                    {dealOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                  <TextField select label="Flag Type" size="small" fullWidth value={flagForm.flag_type || "past_due"}
                    onChange={(e) => setFlagForm((p) => ({ ...p, flag_type: e.target.value as any }))}>
                    <MenuItem value="past_due">Past Due Activity</MenuItem>
                    <MenuItem value="risk_increase">Risk Increase</MenuItem>
                    <MenuItem value="covenant_breach">Covenant Breach</MenuItem>
                    <MenuItem value="renewal_due">Renewal Due</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                  <TextField select label="Severity" size="small" fullWidth value={flagForm.severity || "medium"}
                    onChange={(e) => setFlagForm((p) => ({ ...p, severity: e.target.value as any }))}>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </TextField>
                  <TextField label="Description" multiline rows={3} size="small" fullWidth
                    value={flagForm.description || ""}
                    onChange={(e) => setFlagForm((p) => ({ ...p, description: e.target.value }))} />
                  {addFlagError && <Alert severity="error">{addFlagError}</Alert>}
                  <Button variant="contained" onClick={handleAddFlag} disabled={addFlagLoading || !companyId}
                    startIcon={addFlagLoading ? <CircularProgress size={16} /> : <Bell size={16} />} fullWidth>
                    {addFlagLoading ? "Adding…" : "Add Monitoring Flag"}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Active Flags {openFlags.length > 0 && <Chip label={openFlags.length} color="error" size="small" sx={{ ml: 1 }} />}
                  </Typography>
                  <IconButton size="small" onClick={loadFlags} disabled={flagLoading}>
                    {flagLoading ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
                  </IconButton>
                </Box>

                {flags.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Bell size={36} color="#ccc" />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>No monitoring flags.</Typography>
                  </Box>
                ) : (
                  <List dense disablePadding>
                    {flags.map((flag, i) => (
                      <React.Fragment key={flag.flag_id}>
                        {i > 0 && <Divider />}
                        <ListItem
                          sx={{ py: 1.5, opacity: flag.status === "resolved" ? 0.5 : 1 }}
                          secondaryAction={
                            flag.status === "open" ? (
                              <Button size="small" variant="outlined" onClick={() => handleResolveFlag(flag.flag_id)}>
                                Resolve
                              </Button>
                            ) : (
                              <Chip label="Resolved" color="success" size="small" variant="outlined" />
                            )
                          }
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Chip label={FLAG_TYPE_LABELS[flag.flag_type]} size="small" variant="outlined" />
                                <Chip label={flag.severity.toUpperCase()} color={SEVERITY_COLOR[flag.severity]} size="small" />
                                <Typography variant="caption" color="text.secondary">{flag.deal_id}</Typography>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2">{flag.description}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Flagged by {flag.flagged_by} · {formatDate(flag.flagged_at)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Sub-tab 1: Portfolio Risk Report */}
      {subTab === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>DSCR Distribution</Typography>
                {deals.length === 0 ? (
                  <Alert severity="info">No deals to analyze.</Alert>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {[
                      { label: "Above 1.50x (Strong)", filter: (d: any) => d.dscr >= 1.5, color: "success" },
                      { label: "1.25x–1.50x (Acceptable)", filter: (d: any) => d.dscr >= 1.25 && d.dscr < 1.5, color: "primary" },
                      { label: "1.00x–1.25x (Borderline)", filter: (d: any) => d.dscr >= 1.0 && d.dscr < 1.25, color: "warning" },
                      { label: "Below 1.00x (Alert)", filter: (d: any) => d.dscr < 1.0, color: "error" },
                    ].map((band) => {
                      const count = deals.filter(band.filter).length;
                      const pct = deals.length ? (count / deals.length) * 100 : 0;
                      return (
                        <Box key={band.label} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="body2">{band.label}</Typography>
                            <Typography variant="body2" fontWeight={600}>{count} deals ({pct.toFixed(0)}%)</Typography>
                          </Box>
                          <Box sx={{ bgcolor: "grey.100", borderRadius: 1, height: 8 }}>
                            <Box sx={{
                              width: `${pct}%`, height: 8, borderRadius: 1,
                              bgcolor: `${band.color}.main`,
                              transition: "width 0.5s ease",
                            }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>LTV Risk Tiers</Typography>
                {deals.length === 0 ? (
                  <Alert severity="info">No deals to analyze.</Alert>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {[
                      { label: "≤65% (Low Risk)", filter: (d: any) => d.ltv <= 65, color: "success" },
                      { label: "65–75% (Standard)", filter: (d: any) => d.ltv > 65 && d.ltv <= 75, color: "primary" },
                      { label: "75–85% (Elevated)", filter: (d: any) => d.ltv > 75 && d.ltv <= 85, color: "warning" },
                      { label: ">85% (High Risk)", filter: (d: any) => d.ltv > 85, color: "error" },
                    ].map((band) => {
                      const count = deals.filter(band.filter).length;
                      const pct = deals.length ? (count / deals.length) * 100 : 0;
                      return (
                        <Box key={band.label} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="body2">{band.label}</Typography>
                            <Typography variant="body2" fontWeight={600}>{count} deals ({pct.toFixed(0)}%)</Typography>
                          </Box>
                          <Box sx={{ bgcolor: "grey.100", borderRadius: 1, height: 8 }}>
                            <Box sx={{
                              width: `${pct}%`, height: 8, borderRadius: 1,
                              bgcolor: `${band.color}.main`,
                              transition: "width 0.5s ease",
                            }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card sx={{ bgcolor: "grey.900", color: "white" }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>Portfolio Management Summary</Typography>
                <Grid container spacing={3}>
                  {[
                    { label: "Total Exposure", value: formatUSD(totalDealValue) },
                    { label: "Average DSCR", value: `${avgDscr.toFixed(2)}x` },
                    { label: "Average LTV", value: `${avgLtv.toFixed(1)}%` },
                    { label: "DSCR Passing Rate", value: `${deals.length ? ((dealsAbove125Dscr / deals.length) * 100).toFixed(0) : 0}%` },
                    { label: "Open Watch List Items", value: openFlags.length.toString() },
                    { label: "Critical Alerts", value: criticalFlags.length.toString() },
                  ].map((m) => (
                    <Grid size={{ xs: 6, sm: 4, md: 2 }} key={m.label}>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>{m.label}</Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ mt: 0.25 }}>{m.value}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Sub-tab 2: Deal Summary Table */}
      {subTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>Deal Summary Report</Typography>
            <Box sx={{ overflowX: "auto" }}>
              <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
                <Box component="thead">
                  <Box component="tr" sx={{ bgcolor: "grey.100" }}>
                    {["Deal ID", "Status", "Loan Amount", "DSCR", "LTV", "NOI 2024", "Revenue 2024", "Docs"].map((h) => (
                      <Box component="th" key={h} sx={{ p: 1.5, textAlign: "left", borderBottom: 2, borderColor: "divider" }}>
                        <Typography variant="caption" fontWeight={700}>{h}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {deals.map((deal) => (
                    <Box component="tr" key={deal.id} sx={{ "&:hover": { bgcolor: "grey.50" } }}>
                      <Box component="td" sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                        <Typography variant="body2" fontWeight={600}>{deal.id}</Typography>
                      </Box>
                      <Box component="td" sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                        <Chip label={deal.status} size="small"
                          color={deal.status === "approved" ? "success" : deal.status === "denied" ? "error" : "warning"} />
                      </Box>
                      <Box component="td" sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                        <Typography variant="body2">{formatUSD(deal.amount)}</Typography>
                      </Box>
                      <Box component="td" sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                        <Chip label={`${deal.dscr.toFixed(2)}x`} size="small"
                          color={deal.dscr >= 1.25 ? "success" : deal.dscr >= 1.0 ? "warning" : "error"} variant="outlined" />
                      </Box>
                      <Box component="td" sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                        <Typography variant="body2">{deal.ltv}%</Typography>
                      </Box>
                      <Box component="td" sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                        <Typography variant="body2">{formatUSD(deal.noi2024)}</Typography>
                      </Box>
                      <Box component="td" sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                        <Typography variant="body2">{formatUSD(deal.revenue2024)}</Typography>
                      </Box>
                      <Box component="td" sx={{ p: 1.5, borderBottom: 1, borderColor: "divider" }}>
                        <Typography variant="body2">{deal.documents}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
