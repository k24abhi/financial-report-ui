import { Card, CardContent, Typography, Divider, Box, Grid } from "@mui/material";
import { formatUSD, formatDate } from "../../../utils/formatters";
import { Deal } from "../../../types";
import type { FinancialsTabProps } from "../../../types/interfaces";

export function FinancialsTab({ deals }: FinancialsTabProps) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Financial Performance Over Time</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Revenue and NOI trends across all deals
        </Typography>
        <Box sx={{ mt: 3 }}>
          {deals.map((deal, idx) => (
            <Box key={deal.id} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={500}>{formatDate(deal.date)}</Typography>
                <Typography variant="body2" color="text.secondary">{deal.id}</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                    <Typography variant="caption" color="text.secondary">Revenue 2024</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                      {formatUSD(deal.revenue2024)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                    <Typography variant="caption" color="text.secondary">Revenue 2023</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                      {formatUSD(deal.revenue2023)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                    <Typography variant="caption" color="text.secondary">NOI 2024</Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ mt: 0.5 }}>
                      {formatUSD(deal.noi2024)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              {idx < deals.length - 1 && <Divider sx={{ mt: 3 }} />}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
