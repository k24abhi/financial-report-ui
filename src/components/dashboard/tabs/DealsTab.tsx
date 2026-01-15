import { Calendar, FileText, Eye, Download, TrendingUp, TrendingDown, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, Button, Divider, Box, Typography, LinearProgress, Grid } from "@mui/material";
import { StatusBadge } from "../../shared/StatusBadge";
import { formatUSD, formatDate } from "../../../utils/formatters";
import { Deal } from "../../../types";
import type { DealsTabProps } from "../../../types/interfaces";

export function DealsTab({ deals }: DealsTabProps) {
  if (deals.length === 0) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
          <AlertCircle style={{ width: 48, height: 48, color: '#d0d0d0', marginBottom: 16 }} />
          <Typography color="text.secondary">No deals found</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {deals.map((deal) => (
        <Card key={deal.id}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Typography variant="h6">{deal.id}</Typography>
                  <StatusBadge status={deal.status} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Calendar style={{ width: 12, height: 12 }} />
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(deal.date)} • {deal.purpose}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h5" fontWeight={600}>{formatUSD(deal.amount)}</Typography>
                <Typography variant="caption" color="text.secondary">Loan Amount</Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* Financial Metrics */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" fontWeight={500} gutterBottom>Key Metrics</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">DSCR</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{deal.dscr.toFixed(2)}x</Typography>
                      {deal.dscr >= 1.25 ? (
                        <CheckCircle2 style={{ width: 16, height: 16, color: '#16a34a' }} />
                      ) : (
                        <AlertCircle style={{ width: 16, height: 16, color: '#f59e0b' }} />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">LTV</Typography>
                    <Typography variant="body2" fontWeight={600}>{deal.ltv}%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">NOI (2024)</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatUSD(deal.noi2024)}</Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Revenue Comparison */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" fontWeight={500} gutterBottom>Revenue YoY</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">2024</Typography>
                      <Typography variant="body2" fontWeight={600}>{formatUSD(deal.revenue2024)}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={100} sx={{ height: 8, borderRadius: 1, bgcolor: '#f5f5f5', '& .MuiLinearProgress-bar': { bgcolor: 'black' } }} />
                  </Box>
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">2023</Typography>
                      <Typography variant="body2" fontWeight={600}>{formatUSD(deal.revenue2023)}</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={(deal.revenue2023 / deal.revenue2024) * 100} sx={{ height: 8, borderRadius: 1, bgcolor: '#f5f5f5', '& .MuiLinearProgress-bar': { bgcolor: '#999' } }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {deal.revenue2024 > deal.revenue2023 ? (
                      <>
                        <TrendingUp style={{ width: 16, height: 16, color: '#16a34a' }} />
                        <Typography variant="body2" fontWeight={500} sx={{ color: '#16a34a' }}>
                          +{(((deal.revenue2024 - deal.revenue2023) / deal.revenue2023) * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">growth</Typography>
                      </>
                    ) : (
                      <>
                        <TrendingDown style={{ width: 16, height: 16, color: '#dc2626' }} />
                        <Typography variant="body2" fontWeight={500} sx={{ color: '#dc2626' }}>
                          {(((deal.revenue2024 - deal.revenue2023) / deal.revenue2023) * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">decline</Typography>
                      </>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileText style={{ width: 16, height: 16 }} />
                <Typography variant="body2" color="text.secondary">
                  {deal.documents} documents uploaded
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<Eye style={{ width: 16, height: 16 }} />}>
                  View Details
                </Button>
                <Button variant="outlined" size="small" startIcon={<Download style={{ width: 16, height: 16 }} />}>
                  Export
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
