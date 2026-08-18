"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Building2 } from "lucide-react";

export function BranchComparisonWidget() {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    apiClient.get("/dashboard/widgets/branch-comparison/data?timeframe=this_month")
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  return (
    <Card className="h-full w-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
        <CardTitle className="text-sm font-medium">
          Branch Comparison (Revenue)
        </CardTitle>
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 min-h-[200px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickLine={false} 
                axisLine={false} 
                tickFormatter={(value) => `Ksh ${value}`}
              />
              <Tooltip 
                formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Revenue']}
                labelStyle={{ color: 'black' }}
                cursor={{ fill: 'transparent' }}
              />
              <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No branch data available.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
