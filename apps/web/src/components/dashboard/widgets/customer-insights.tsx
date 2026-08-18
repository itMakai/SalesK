"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { HeartHandshake } from "lucide-react";

const COLORS = ['#8b5cf6', '#0ea5e9'];

interface CustomerInsightsData {
  topSpenders: { name: string; value: number }[];
  newVsReturning: { name: string; value: number }[];
}

export function CustomerInsightsWidget() {
  const [data, setData] = useState<CustomerInsightsData | null>(null);

  useEffect(() => {
    apiClient.get("/dashboard/widgets/customer-insights/data?timeframe=this_month")
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  return (
    <Card className="h-full w-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
        <CardTitle className="text-sm font-medium">
          Customer Insights
        </CardTitle>
        <HeartHandshake className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 min-h-[200px] flex flex-col gap-4 overflow-auto">
        {data ? (
          <>
            <div className="h-32 min-h-[120px] w-full shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.newVsReturning}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.newVsReturning.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip labelStyle={{ color: 'black' }} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="border-t pt-3">
              <h4 className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-wider">Top Spenders</h4>
              <div className="space-y-2">
                {data.topSpenders.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm truncate max-w-[120px]">{item.name}</span>
                    <span className="text-sm font-medium">
                      KES {item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
                {data.topSpenders.length === 0 && (
                  <div className="text-xs text-muted-foreground">No named customers yet.</div>
                )}
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
