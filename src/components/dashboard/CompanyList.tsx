import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Companies</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {filteredCompanies.map((company) => (
          <button
            key={company.id}
            onClick={() => onSelectCompany(company.id)}
            className={cn(
              "w-full rounded-lg border p-3 text-left transition-all",
              selectedCompanyId === company.id
                ? "border-black bg-black text-white"
                : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
            )}
          >
            <div className="mb-1 font-medium text-sm">{company.name}</div>
            <div className={cn(
              "text-xs",
              selectedCompanyId === company.id ? "text-white/70" : "text-neutral-500"
            )}>
              {company.location}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge 
                variant={selectedCompanyId === company.id ? "secondary" : "outline"}
                className="text-xs"
              >
                {company.deals.length} {company.deals.length === 1 ? 'Deal' : 'Deals'}
              </Badge>
            </div>
          </button>
        ))}

        <AddCompanyDialog
          open={addCompanyOpen}
          onOpenChange={setAddCompanyOpen}
          onAddCompany={handleAddCompany}
        />
        
        <Button 
          variant="outline" 
          className="w-full gap-2 border-dashed"
          onClick={() => setAddCompanyOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add New Company
        </Button>
      </CardContent>
    </Card>
  );
}
