import { Chip } from "@mui/material";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getColor = (status: string): "success" | "info" | "warning" | "error" | "default" => {
    switch (status) {
      case "Approved":
        return "success";
      case "Funded":
        return "info";
      case "Under Review":
        return "warning";
      case "Declined":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Chip 
      label={status} 
      color={getColor(status)}
      size="small"
    />
  );
}
