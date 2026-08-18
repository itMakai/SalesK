"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "lucide-react";

export function BranchWidget() {
  const [stats, setStats] = useState({
    activeBranches: 0,
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
          Active Branches
        </CardTitle>
        <Store className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {stats.activeBranches}
        </div>
        <p className="text-xs text-muted-foreground">
          Operating stores
        </p>
      </CardContent>
    </Card>
  );
}
