"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package } from "lucide-react";

export function SalesWidget() {
  const [stats, setStats] = useState({
    totalRevenueToday: 0,
    salesCountToday: 0,
  });

  useEffect(() => {
    apiClient.get("/orders/stats/dashboard")
      .then(res => setStats(res.data))
      .catch(console.error);
  }, []);

  return (
    <Card className="h-full w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Total Revenue Today
        </CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          KES {stats.totalRevenueToday.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="text-xs text-muted-foreground">
          +{stats.salesCountToday} sales made today
        </p>
      </CardContent>
    </Card>
  );
}
