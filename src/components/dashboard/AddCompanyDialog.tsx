import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Company</DialogTitle>
          <DialogDescription>
            Enter the company details to add them to your portfolio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              placeholder="e.g. Downtown Office Building"
              value={newCompany.name}
              onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Business Type</Label>
            <Input
              id="type"
              placeholder="e.g. Commercial Real Estate"
              value={newCompany.type}
              onChange={(e) => setNewCompany({ ...newCompany, type: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. New York, NY"
              value={newCompany.location}
              onChange={(e) => setNewCompany({ ...newCompany, location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              placeholder="e.g. Real Estate"
              value={newCompany.industry}
              onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="borrower">Borrower Name</Label>
            <Input
              id="borrower"
              placeholder="e.g. ABC Properties LLC"
              value={newCompany.borrower}
              onChange={(e) => setNewCompany({ ...newCompany, borrower: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-black">
            Add Company
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
