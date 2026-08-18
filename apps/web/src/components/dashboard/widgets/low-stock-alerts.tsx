"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface LowStockItem {
  id: string;
  product: string;
  branch: string;
  quantity: number;
}

export function LowStockAlertsWidget() {
  const [data, setData] = useState<LowStockItem[]>([]);

  useEffect(() => {
    apiClient.get("/dashboard/widgets/low-stock-alerts/data")
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  return (
    <Card className="h-full w-full flex flex-col border-destructive/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
        <CardTitle className="text-sm font-medium text-destructive">
          Low Stock Alerts
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-destructive" />
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {data.length > 0 ? (
          <div className="space-y-3 mt-2">
            {data.map((item) => (
              <div key={item.id} className="flex flex-col justify-center border-b pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.product}</span>
                  <span className="text-sm font-bold text-destructive">{item.quantity} left</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{item.branch}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            All stock levels look good.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
