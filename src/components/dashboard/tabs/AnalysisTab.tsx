import { Card, CardContent, Typography, Chip, Divider, Box, Grid } from "@mui/material";
import { formatUSD } from "../../../utils/formatters";
import { GridSection } from "../../../types";

interface AnalysisTabProps {
  gridData: GridSection[];
}

export function AnalysisTab({ gridData }: AnalysisTabProps) {
  return (
    <Box>
      <Grid container spacing={3}>
        {gridData.map((section) => {
          const total2024 = section.children.reduce((sum, r) => sum + r.y2024, 0);
          const total2023 = section.children.reduce((sum, r) => sum + r.y2023, 0);
          const growth = ((total2024 - total2023) / total2023) * 100;

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
                {formatUSD(gridData[0].children.reduce((sum, r) => sum + r.y2024, 0))}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Expenses</Typography>
              <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
                {formatUSD(gridData[1].children.reduce((sum, r) => sum + r.y2024, 0))}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Add-backs</Typography>
              <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
                {formatUSD(gridData[2].children.reduce((sum, r) => sum + r.y2024, 0))}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Adjusted NOI</Typography>
              <Typography variant="h6" fontWeight={600} sx={{ mt: 0.5 }}>
                {formatUSD(
                  gridData[0].children.reduce((sum, r) => sum + r.y2024, 0) -
                  gridData[1].children.reduce((sum, r) => sum + r.y2024, 0) +
                  gridData[2].children.reduce((sum, r) => sum + r.y2024, 0)
                )}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
