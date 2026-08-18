"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListOrdered } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  total: number;
  status: string;
  time: string;
}

export function RecentOrdersWidget() {
  const [data, setData] = useState<RecentOrder[]>([]);

  useEffect(() => {
    apiClient.get("/dashboard/widgets/recent-orders/data")
      .then((res) => setData(res.data))
      .catch(console.error);
  }, []);

  return (
    <Card className="h-full w-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
        <CardTitle className="text-sm font-medium">
          Recent Orders
        </CardTitle>
        <ListOrdered className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {data.length > 0 ? (
          <div className="space-y-4 mt-2">
            {data.map((order) => (
              <div key={order.id} className="flex flex-col justify-center border-b pb-2 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{order.orderNumber}</span>
                  <span className="text-sm font-bold">KES {order.total.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{order.customer}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(order.time), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No recent orders.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
