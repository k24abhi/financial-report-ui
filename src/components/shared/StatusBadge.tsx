import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<string, { bg: string; text: string }> = {
    "Approved": { bg: "bg-green-100", text: "text-green-700" },
    "Funded": { bg: "bg-blue-100", text: "text-blue-700" },
    "Under Review": { bg: "bg-amber-100", text: "text-amber-700" },
    "Declined": { bg: "bg-red-100", text: "text-red-700" },
  };

  const variant = variants[status] || { bg: "bg-neutral-100", text: "text-neutral-700" };

  return (
    <Badge className={cn("border-0", variant.bg, variant.text)}>
      {status}
    </Badge>
  );
}
