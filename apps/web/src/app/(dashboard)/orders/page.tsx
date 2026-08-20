"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Search, Eye, Filter } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/orders");
      setOrders(res.data.data || res.data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.cashier?.firstName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            View and manage historical transactions.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number or cashier..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="hidden md:block border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order, index) => (
                <TableRow 
                  key={order.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                  style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
                >
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>
                    {format(new Date(order.createdAt), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    {order.cashier?.firstName} {order.cashier?.lastName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === "completed"
                          ? "default"
                          : order.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {order.payments?.map((p: any) => (
                        <Badge key={p.id} variant="outline" className="uppercase">
                          {p.method}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    Ksh {Number(order.total).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
            No orders found.
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <div 
              key={order.id} 
              className="bg-card border rounded-lg p-4 shadow-sm flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg text-white/90">{order.orderNumber}</div>
                  <div className="text-sm text-muted-foreground">{format(new Date(order.createdAt), "MMM d, yyyy HH:mm")}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-cyan-500">Ksh {Number(order.total).toLocaleString()}</div>
                  <Badge
                    variant={
                      order.status === "completed" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"
                    }
                    className="capitalize mt-1"
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                <div className="flex flex-col gap-1 text-sm text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="text-muted-foreground">Cashier:</span> {order.cashier?.firstName} {order.cashier?.lastName}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {order.payments?.map((p: any) => (
                      <Badge key={p.id} variant="outline" className="uppercase text-[10px] py-0 h-4">{p.method}</Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-8">
                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
