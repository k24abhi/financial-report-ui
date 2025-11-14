import { Calendar, FileText, Eye, Download, TrendingUp, TrendingDown, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";
import { StatusBadge } from "../../shared/StatusBadge";
import { formatUSD, formatDate } from "../../../utils/formatters";
import { Deal } from "../../../types";

interface DealsTabProps {
  deals: Deal[];
}

export function DealsTab({ deals }: DealsTabProps) {
  if (deals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="mb-4 h-12 w-12 text-neutral-300" />
          <div className="text-neutral-500">No deals found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {deals.map((deal) => (
        <Card key={deal.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{deal.id}</CardTitle>
                  <StatusBadge status={deal.status} />
                </div>
                <CardDescription className="mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(deal.date)} • {deal.purpose}
                  </div>
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold">{formatUSD(deal.amount)}</div>
                <div className="text-xs text-neutral-500">Loan Amount</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Financial Metrics */}
              <div>
                <div className="mb-3 text-sm font-medium">Key Metrics</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="text-sm text-neutral-600">DSCR</div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">{deal.dscr.toFixed(2)}x</div>
                      {deal.dscr >= 1.25 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="text-sm text-neutral-600">LTV</div>
                    <div className="font-semibold">{deal.ltv}%</div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="text-sm text-neutral-600">NOI (2024)</div>
                    <div className="font-semibold">{formatUSD(deal.noi2024)}</div>
                  </div>
                </div>
              </div>

              {/* Revenue Comparison */}
              <div>
                <div className="mb-3 text-sm font-medium">Revenue YoY</div>
                <div className="space-y-3">
                  <div className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-neutral-600">2024</span>
                      <span className="font-semibold">{formatUSD(deal.revenue2024)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div 
                        className="h-full bg-black"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-neutral-600">2023</span>
                      <span className="font-semibold">{formatUSD(deal.revenue2023)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div 
                        className="h-full bg-neutral-400"
                        style={{ width: `${(deal.revenue2023 / deal.revenue2024) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {deal.revenue2024 > deal.revenue2023 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          +{(((deal.revenue2024 - deal.revenue2023) / deal.revenue2023) * 100).toFixed(1)}%
                        </span>
                        <span className="text-neutral-500">growth</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-600">
                          {(((deal.revenue2024 - deal.revenue2023) / deal.revenue2023) * 100).toFixed(1)}%
                        </span>
                        <span className="text-neutral-500">decline</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <FileText className="h-4 w-4" />
                {deal.documents} documents uploaded
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
