import { useState } from "react";
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button 
} from "@mui/material";
import { NewCompanyForm } from "../../types";

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCompany: (company: NewCompanyForm) => void;
}

export function AddCompanyDialog({ open, onOpenChange, onAddCompany }: AddCompanyDialogProps) {
  const [newCompany, setNewCompany] = useState<NewCompanyForm>({
    name: "",
    type: "",
    location: "",
    industry: "",
    borrower: ""
  });

  const handleSubmit = () => {
    if (!newCompany.name || !newCompany.type || !newCompany.location || 
        !newCompany.industry || !newCompany.borrower) {
      return;
    }
    onAddCompany(newCompany);
    setNewCompany({ name: "", type: "", location: "", industry: "", borrower: "" });
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Company</DialogTitle>
      <DialogContent>
        <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            fullWidth
            label="Company Name"
            placeholder="e.g. Downtown Office Building"
            value={newCompany.name}
            onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
          />
          <TextField
            fullWidth
            label="Business Type"
            placeholder="e.g. Commercial Real Estate"
            value={newCompany.type}
            onChange={(e) => setNewCompany({ ...newCompany, type: e.target.value })}
          />
          <TextField
            fullWidth
            label="Location"
            placeholder="e.g. New York, NY"
            value={newCompany.location}
            onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })}
          />
          <TextField
            fullWidth
            label="Industry"
            placeholder="e.g. Real Estate"
            value={newCompany.industry}
            onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
          />
          <TextField
            fullWidth
            label="Borrower Name"
            placeholder="e.g. ABC Properties LLC"
            value={newCompany.borrower}
            onChange={(e) => setNewCompany({ ...newCompany, borrower: e.target.value })}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onOpenChange(false)} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Company
        </Button>
      </DialogActions>
    </Dialog>
  );
}
