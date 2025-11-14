import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import { formatUSD } from "../../../utils/formatters";
import { GridSection } from "../../../types";

interface AnalysisTabProps {
  gridData: GridSection[];
}

export function AnalysisTab({ gridData }: AnalysisTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-6 md:grid-cols-3">
        {gridData.map((section) => {
          const total2024 = section.children.reduce((sum, r) => sum + r.y2024, 0);
          const total2023 = section.children.reduce((sum, r) => sum + r.y2023, 0);
          const growth = ((total2024 - total2023) / total2023) * 100;

          return (
            <Card key={section.id}>
              <CardHeader className="pb-3">
                <CardDescription>{section.category}</CardDescription>
                <CardTitle className="text-3xl">{formatUSD(total2024)}</CardTitle>
              </CardHeader>
              <CardContent>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">2024</span>
                    <span className="font-medium">{formatUSD(total2024)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">2023</span>
                    <span className="font-medium">{formatUSD(total2023)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Growth</span>
                    <Badge variant={growth > 0 ? "default" : "secondary"} className="rounded-full">
                      {growth > 0 ? "+" : ""}{growth.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-black text-white">
        <CardHeader>
          <CardTitle>Final Analysis Summary</CardTitle>
          <CardDescription className="text-white/70">Comprehensive overview of financial metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <div className="text-sm opacity-80">Total Revenue</div>
              <div className="mt-1 text-xl font-semibold">
                {formatUSD(gridData[0].children.reduce((sum, r) => sum + r.y2024, 0))}
              </div>
            </div>
            <div>
              <div className="text-sm opacity-80">Total Expenses</div>
              <div className="mt-1 text-xl font-semibold">
                {formatUSD(gridData[1].children.reduce((sum, r) => sum + r.y2024, 0))}
              </div>
            </div>
            <div>
              <div className="text-sm opacity-80">Add-backs</div>
              <div className="mt-1 text-xl font-semibold">
                {formatUSD(gridData[2].children.reduce((sum, r) => sum + r.y2024, 0))}
              </div>
            </div>
            <div>
              <div className="text-sm opacity-80">Adjusted NOI</div>
              <div className="mt-1 text-xl font-semibold">
                {formatUSD(
                  gridData[0].children.reduce((sum, r) => sum + r.y2024, 0) -
                  gridData[1].children.reduce((sum, r) => sum + r.y2024, 0) +
                  gridData[2].children.reduce((sum, r) => sum + r.y2024, 0)
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
