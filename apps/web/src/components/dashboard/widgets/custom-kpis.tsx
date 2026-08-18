"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface KpiData {
  averageOrderValue: number;
  totalItemsSold: number;
  totalOrders: number;
}

export function CustomKpisWidget() {
  const [data, setData] = useState<KpiData | null>(null);

  useEffect(() => {
    apiClient.get("/dashboard/widgets/custom-kpis/data?timeframe=this_month")
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  return (
    <Card className="h-full w-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
        <CardTitle className="text-sm font-medium">
          Performance KPIs
        </CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center gap-4">
        {data ? (
          <>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium uppercase">Avg Order Value (AOV)</span>
              <span className="text-2xl font-bold mt-1">
                KES {data.averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 border-t pt-4">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Items Sold</span>
                <span className="text-lg font-bold">{data.totalItemsSold}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Total Orders</span>
                <span className="text-lg font-bold">{data.totalOrders}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
