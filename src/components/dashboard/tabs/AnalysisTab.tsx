import { useMemo } from "react";
import { Card, CardContent, Typography, Chip, Divider, Box, Grid } from "@mui/material";
import { formatUSD } from "../../../utils/formatters";
import { GridSection } from "../../../types";
import { TreeNode } from "../../../services/tree_service";
import type { AnalysisTabProps } from "../../../types/interfaces";

interface PeriodInfo {
  period: string;
  periodType: string;
}

/** Parse a text value like "$1,234", "(500)" into a number */
function parseNumericText(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/[$,\s]/g, '');
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    return -parseFloat(cleaned.slice(1, -1)) || 0;
  }
  return parseFloat(cleaned) || 0;
}

/** Get the total numeric value of a tree node for a given period */
function getNodePeriodValue(node: TreeNode, period: string): number {
  const val = (node.values || []).find(v => v.period === period);
  return val ? parseNumericText(val.text) : 0;
}

export function AnalysisTab({ gridData, treeRoots, treePeriods }: AnalysisTabProps & {
  treeRoots?: TreeNode[];
  treePeriods?: PeriodInfo[];
}) {
  // Prefer tree data when available
  const hasTreeData = (treeRoots?.length ?? 0) > 0 && (treePeriods?.length ?? 0) > 0;

  // Build per-root node summaries using tree data
  const treeSummary = useMemo(() => {
    if (!hasTreeData || !treeRoots || !treePeriods) return null;

    return treeRoots.map(root => {
      const periodTotals: Record<string, number> = {};
      for (const p of treePeriods) {
        periodTotals[p.period] = getNodePeriodValue(root, p.period);
      }
      return { label: root.label, periodTotals };
    });
  }, [treeRoots, treePeriods, hasTreeData]);

  // ─── Tree-data driven view ────────────────────────────────────────────
  if (hasTreeData && treeSummary && treePeriods && treePeriods.length > 0) {
    const latestPeriod = treePeriods[treePeriods.length - 1].period;
    const priorPeriod = treePeriods.length >= 2 ? treePeriods[treePeriods.length - 2].period : null;

    return (
      <Box>
        <Grid container spacing={3}>
          {treeSummary.map((item) => {
            const latestVal = item.periodTotals[latestPeriod] || 0;
            const priorVal = priorPeriod ? (item.periodTotals[priorPeriod] || 0) : 0;
            const growth = priorVal !== 0 ? ((latestVal - priorVal) / Math.abs(priorVal)) * 100 : 0;

            return (
              <Grid size={{ xs: 12, md: 4 }} key={item.label}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {item.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {formatUSD(latestVal)}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {treePeriods.map(p => (
                        <Box key={p.period} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            {p.period} ({p.periodType})
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {formatUSD(item.periodTotals[p.period] || 0)}
                          </Typography>
                        </Box>
                      ))}
                      {priorPeriod && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">Growth</Typography>
                          <Chip
                            label={`${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`}
                            color={growth > 0 ? 'primary' : 'default'}
                            size="small"
                          />
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Final Analysis Summary */}
        {treeSummary.length >= 2 && (
          <Card sx={{ mt: 3, bgcolor: 'black', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Final Analysis Summary</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                Comprehensive overview across {treePeriods.length} period(s)
              </Typography>
              <Grid container spacing={2}>
                {treePeriods.map(p => {
                  const totalForPeriod = treeSummary.reduce(
                    (sum, item) => sum + (item.periodTotals[p.period] || 0), 0
                  );
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={p.period}>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Net Total — {p.period}
                      </Typography>
                      <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
                        {formatUSD(totalForPeriod)}
                      </Typography>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  }

  // ─── Legacy grid-data driven view ─────────────────────────────────────
  const safeChildren = (index: number) => gridData[index]?.children ?? [];
  const sumField = (index: number, field: 'y2024' | 'y2023') =>
    safeChildren(index).reduce((sum, r) => sum + r[field], 0);

  if (!gridData || gridData.length === 0) {
    return (
      <Box>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No data available for analysis. Please save data in the Hierarchy Grid tab first.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {gridData.map((section) => {
          const children = section.children ?? [];
          const total2024 = children.reduce((sum, r) => sum + r.y2024, 0);
          const total2023 = children.reduce((sum, r) => sum + r.y2023, 0);
          const growth = total2023 !== 0 ? ((total2024 - total2023) / total2023) * 100 : 0;

          return (
            <Grid size={{ xs: 12, md: 4 }} key={section.id}>
              <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {section.category}
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  {formatUSD(total2024)}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">2024</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatUSD(total2024)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">2023</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatUSD(total2023)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Growth</Typography>
                    <Chip
                      label={`${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`}
                      color={growth > 0 ? 'primary' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {gridData.length >= 3 && (
        <Card sx={{ mt: 3, bgcolor: 'black', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Final Analysis Summary</Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
              Comprehensive overview of financial metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Revenue</Typography>
                <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
                  {formatUSD(sumField(0, 'y2024'))}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Expenses</Typography>
                <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
                  {formatUSD(sumField(1, 'y2024'))}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Add-backs</Typography>
                <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
                  {formatUSD(sumField(2, 'y2024'))}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Adjusted NOI</Typography>
                <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
                  {formatUSD(sumField(0, 'y2024') - sumField(1, 'y2024') + sumField(2, 'y2024'))}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
