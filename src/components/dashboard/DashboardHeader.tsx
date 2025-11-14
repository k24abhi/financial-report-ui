import { Building2, Filter, Download } from "lucide-react";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface DashboardHeaderProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function DashboardHeader({ statusFilter, onStatusFilterChange }: DashboardHeaderProps) {
  return (
    <div className="sticky top-0 z-30 border-b bg-white">
      <div className="mx-auto max-w-[1600px] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-black">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">Underwriter Dashboard</div>
              <div className="text-xs text-neutral-500">Deal & Company Analysis</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="funded">Funded</SelectItem>
                <SelectItem value="under review">Under Review</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
