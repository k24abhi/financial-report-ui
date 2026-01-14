import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Card, CardContent, TextField, Chip, Button, Box, Typography } from "@mui/material";
import { Company } from "../../types";
import { AddCompanyDialog } from "./AddCompanyDialog";

interface CompanyListProps {
  companies: Company[];
  selectedCompanyId: number | null;
  onSelectCompany: (id: number) => void;
  onAddCompany: (company: Omit<Company, "id" | "deals">) => void;
}

export function CompanyList({ 
  companies, 
  selectedCompanyId, 
  onSelectCompany,
  onAddCompany 
}: CompanyListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCompany = (companyData: Omit<Company, "id" | "deals">) => {
    onAddCompany(companyData);
    setAddCompanyOpen(false);
  };

  return (
    <Card>
      <CardContent sx={{ pt: 2 }}>
        <Typography variant="h6" gutterBottom>Companies</Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search style={{ marginRight: 8, width: 16, height: 16, color: '#999' }} />
          }}
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filteredCompanies.map((company) => (
            <Button
              key={company.id}
              onClick={() => onSelectCompany(company.id)}
              variant={selectedCompanyId === company.id ? "contained" : "outlined"}
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                textTransform: 'none',
                p: 1.5,
                bgcolor: selectedCompanyId === company.id ? 'black' : 'transparent',
                color: selectedCompanyId === company.id ? 'white' : 'inherit',
                borderColor: selectedCompanyId === company.id ? 'black' : '#e0e0e0',
                '&:hover': {
                  bgcolor: selectedCompanyId === company.id ? 'black' : '#f5f5f5',
                  borderColor: selectedCompanyId === company.id ? 'black' : '#d0d0d0',
                }
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Typography variant="body2" fontWeight={500}>{company.name}</Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: selectedCompanyId === company.id ? 'rgba(255,255,255,0.7)' : 'text.secondary' 
                  }}
                >
                  {company.location}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip 
                    label={`${company.deals.length} ${company.deals.length === 1 ? 'Deal' : 'Deals'}`}
                    size="small"
                    variant={selectedCompanyId === company.id ? "outlined" : "outlined"}
                    sx={{ 
                      fontSize: '0.7rem',
                      color: selectedCompanyId === company.id ? 'white' : 'inherit',
                      borderColor: selectedCompanyId === company.id ? 'rgba(255,255,255,0.5)' : undefined
                    }}
                  />
                </Box>
              </Box>
            </Button>
          ))}

          <AddCompanyDialog
            open={addCompanyOpen}
            onOpenChange={setAddCompanyOpen}
            onAddCompany={handleAddCompany}
          />
          
          <Button 
            variant="outlined" 
            startIcon={<Plus style={{ width: 16, height: 16 }} />}
            onClick={() => setAddCompanyOpen(true)}
            sx={{ 
              borderStyle: 'dashed',
              textTransform: 'none',
              mt: 1
            }}
          >
            Add New Company
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
