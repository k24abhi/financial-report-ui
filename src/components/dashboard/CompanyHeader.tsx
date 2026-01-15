import { MapPin, Building2, User } from "lucide-react";
import { Card, CardContent, Chip, Box, Typography } from "@mui/material";
import { Company } from "../../types";
import type { CompanyHeaderProps } from "../../types/interfaces";

export function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight={600}>{company.name}</Typography>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MapPin style={{ width: 16, height: 16 }} />
                <Typography variant="body2" color="text.secondary">{company.location}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Building2 style={{ width: 16, height: 16 }} />
                <Typography variant="body2" color="text.secondary">{company.industry}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <User style={{ width: 16, height: 16 }} />
                <Typography variant="body2" color="text.secondary">{company.borrower}</Typography>
              </Box>
            </Box>
          </Box>
          <Chip 
            label={company.type} 
            sx={{ bgcolor: 'black', color: 'white' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
