import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card";
import { Separator } from "../../ui/separator";
import { formatUSD, formatDate } from "../../../utils/formatters";
import { Deal } from "../../../types";

interface FinancialsTabProps {
  deals: Deal[];
}

export function FinancialsTab({ deals }: FinancialsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Performance Over Time</CardTitle>
        <CardDescription>Revenue and NOI trends across all deals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {deals.map((deal, idx) => (
            <div key={deal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{formatDate(deal.date)}</div>
                <div className="text-sm text-neutral-500">{deal.id}</div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="text-xs text-neutral-500">Revenue 2024</div>
                  <div className="mt-1 font-semibold">{formatUSD(deal.revenue2024)}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs text-neutral-500">Revenue 2023</div>
                  <div className="mt-1 font-semibold">{formatUSD(deal.revenue2023)}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs text-neutral-500">NOI 2024</div>
                  <div className="mt-1 font-semibold">{formatUSD(deal.noi2024)}</div>
                </div>
              </div>
              {idx < deals.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
