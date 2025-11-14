import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "../ui/card";
import { formatUSD } from "../../utils/formatters";
import { Deal } from "../../types";

interface KeyMetricsProps {
  deals: Deal[];
}

export function KeyMetrics({ deals }: KeyMetricsProps) {
  const totalAmount = deals.reduce((sum, d) => sum + d.amount, 0);
  const avgDSCR = deals.reduce((sum, d) => sum + d.dscr, 0) / deals.length;
  const avgLTV = deals.reduce((sum, d) => sum + d.ltv, 0) / deals.length;
  const approved = deals.filter(d => d.status === "Approved" || d.status === "Funded").length;
  const total = deals.length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total Loan Volume</CardDescription>
          <CardTitle className="text-2xl">{formatUSD(totalAmount)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-neutral-500">
            Across {total} {total === 1 ? 'deal' : 'deals'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Approval Rate</CardDescription>
          <CardTitle className="text-2xl">
            {((approved / total) * 100).toFixed(0)}%
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-neutral-500">
            {approved} of {total} approved/funded
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Avg DSCR</CardDescription>
          <CardTitle className="text-2xl">{avgDSCR.toFixed(2)}x</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 text-xs text-green-600">
            {avgDSCR > 1.25 ? (
              <>
                <TrendingUp className="h-3 w-3" />
                Strong coverage
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3" />
                Below threshold
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Avg LTV</CardDescription>
          <CardTitle className="text-2xl">{avgLTV.toFixed(0)}%</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-neutral-500">
            Loan-to-value ratio
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
