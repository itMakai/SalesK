"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export function TopProductsWidget() {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    apiClient.get("/dashboard/widgets/top-products/data?timeframe=this_month")
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  return (
    <Card className="h-full w-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
        <CardTitle className="text-sm font-medium">
          Top Products (Revenue)
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {data.length > 0 ? (
          <div className="space-y-4 mt-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-muted-foreground">
                  KES {item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No product data yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
