import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, Typography, Box, Grid } from "@mui/material";
import { formatUSD } from "../../utils/formatters";
import { Deal } from "../../types";

interface KeyMetricsProps {
  deals: Deal[];
}

export function KeyMetrics({ deals }: KeyMetricsProps) {
  const totalAmount = deals.reduce((sum, d) => sum + d.amount, 0);
  const avgDSCR = deals.reduce((sum, d) => sum + d.dscr, 0) / deals.length;
  const avgLTV = deals.reduce((sum, d) => sum + d.ltv, 0) / deals.length;
  const approved = deals.filter(d => d.status === "Approved" || d.status === "Funded").length;
  const total = deals.length;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Total Loan Volume
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {formatUSD(totalAmount)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Across {total} {total === 1 ? 'deal' : 'deals'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Approval Rate
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {((approved / total) * 100).toFixed(0)}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {approved} of {total} approved/funded
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Avg DSCR
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {avgDSCR.toFixed(2)}x
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
              {avgDSCR > 1.25 ? (
                <>
                  <TrendingUp style={{ width: 12, height: 12, color: '#16a34a' }} />
                  <Typography variant="caption" sx={{ color: '#16a34a' }}>
                    Strong coverage
                  </Typography>
                </>
              ) : (
                <>
                  <TrendingDown style={{ width: 12, height: 12, color: '#dc2626' }} />
                  <Typography variant="caption" sx={{ color: '#dc2626' }}>
                    Below threshold
                  </Typography>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6, lg: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Avg LTV
            </Typography>
            <Typography variant="h5" fontWeight={600}>
              {avgLTV.toFixed(0)}%
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Loan-to-value ratio
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
