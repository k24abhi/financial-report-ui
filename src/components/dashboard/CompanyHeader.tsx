import { MapPin, Building2, User } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Company } from "../../types";

interface CompanyHeaderProps {
  company: Company;
}

export function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{company.name}</CardTitle>
            <CardDescription className="mt-2 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {company.location}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {company.industry}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {company.borrower}
              </span>
            </CardDescription>
          </div>
          <Badge className="bg-black">{company.type}</Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
