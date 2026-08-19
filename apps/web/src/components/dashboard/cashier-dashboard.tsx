"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { AlertTriangle, BellRing, CreditCard, Package, Send, Users, TrendingUp, MessageSquare } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts"

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
const PIE_COLORS = ['#3b82f6', '#14b8a6', '#f43f5e', '#f59e0b'];

export function CashierDashboard() {
  const branch = useAuthStore((state) => state.currentBranch)
  const user = useAuthStore((state) => state.user)
  const [message, setMessage] = useState("")
  const [noticeType, setNoticeType] = useState<"low_stock" | "customer_request">("low_stock")
  const [sent, setSent] = useState(false)
  
  const { data: orders = [] } = useSWR(branch ? ["cashier-orders", branch.id] : null, () => apiClient.get(`/orders?branchId=${branch!.id}`).then((response) => response.data))
  const { data: lowStock = [] } = useSWR(branch ? ["cashier-low-stock", branch.id] : null, () => apiClient.get(`/inventory?branchId=${branch!.id}&lowStock=true`).then((response) => response.data))
  const { data: tenant } = useSWR("/tenant", () => apiClient.get("/tenant").then((response) => response.data), { refreshInterval: 15000 })
  
  const myResponses = (tenant?.settings?.cashierNotifications || [])
    .filter((n: any) => n.createdBy === user?.id && n.responses && n.responses.length > 0)
    .slice(0, 5);
  
  const summary = useMemo(() => {
    const productTotals = new Map<string, number>()
    const payments = new Map<string, number>()
    const customers = new Map<string, { name: string; total: number }>()
    
    orders.forEach((order: any) => { 
      order.items?.forEach((item: any) => productTotals.set(item.productName, (productTotals.get(item.productName) || 0) + item.quantity))
      order.payments?.forEach((payment: any) => payments.set(payment.method, (payments.get(payment.method) || 0) + Number(payment.amount)))
      if (order.customer?.id) customers.set(order.customer.id, { name: order.customer.name, total: (customers.get(order.customer.id)?.total || 0) + Number(order.total) }) 
    })
    
    const topProducts = [...productTotals.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)
    const paymentData = [...payments.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    const topSpenders = [...customers.values()].sort((a, b) => b.total - a.total).slice(0, 5)
    
    return { topProducts, paymentData, topSpenders, customerCount: customers.size }
  }, [orders])
  
  const notify = async () => { 
    if (!message.trim() || !branch || !user) return; 
    await apiClient.post("/tenant/notifications", { 
      type: noticeType, 
      message, 
      branchId: branch.id,
      branchName: branch.name,
      cashierName: `${user.firstName} ${user.lastName}`
    })
    setMessage("")
    setSent(true) 
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Branch Workspace</h2>
        <p className="text-sm text-muted-foreground">Today&apos;s activity for {branch?.name || "your assigned branch"}.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Top Products Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Products Sold
            </CardTitle>
            <CardDescription>Most popular items based on quantity sold today</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.topProducts.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.topProducts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {summary.topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No data for this branch yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Payment Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Breakdown
            </CardTitle>
            <CardDescription>Revenue by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.paymentData.length > 0 ? (
              <div className="h-[250px] w-full flex flex-col">
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={summary.paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {summary.paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: '#0f172a', border: '1px solid #334155' }} formatter={(value: any) => [`Ksh ${Number(value).toLocaleString()}`, "Amount"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {summary.paymentData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="capitalize">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No data for this branch yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length > 0 ? (
              <div className="space-y-1">
                {orders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex justify-between border-b border-white/5 py-2.5 text-sm last:border-0 hover:bg-white/5 px-2 rounded-md transition-colors">
                    <span className="font-medium text-white/90">{order.orderNumber}</span>
                    <b className="text-emerald-400 font-mono">Ksh {Number(order.total).toLocaleString()}</b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No recent orders.</p>
            )}
          </CardContent>
        </Card>

        {/* Top Spenders & Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              Customer Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-5 text-center shadow-inner">
              <p className="text-4xl font-bold bg-gradient-to-br from-cyan-300 to-blue-500 bg-clip-text text-transparent">{summary.customerCount}</p>
              <p className="text-[11px] text-cyan-400/80 uppercase tracking-widest mt-2 font-medium">Returning Customers</p>
            </div>
            
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Spenders</h4>
              {summary.topSpenders.length ? (
                <div className="space-y-1">
                  {summary.topSpenders.map((customer) => (
                    <div key={customer.name} className="flex justify-between items-center py-2 text-sm">
                      <span className="text-white/80">{customer.name}</span>
                      <b className="text-emerald-400 font-mono text-xs bg-emerald-400/10 px-2 py-1 rounded">Ksh {customer.total.toLocaleString()}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No customer sales yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length ? (
              <div className="space-y-2">
                {lowStock.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg border border-amber-500/10 bg-amber-500/5 text-sm">
                    <span className="truncate pr-4 text-white/90 font-medium">{item.product?.name}</span>
                    <span className="whitespace-nowrap rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-400 ring-1 ring-amber-500/30">
                      {item.quantity} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-emerald-500/70">
                <Package className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Stock levels are good.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-indigo-500/20 bg-indigo-500/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-400">
            <BellRing className="h-4 w-4" />
            Notify Management
          </CardTitle>
          <CardDescription>Send an alert to the owner or managers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <div className="flex gap-2">
            <Button size="sm" type="button" variant={noticeType === "low_stock" ? "default" : "outline"} onClick={() => setNoticeType("low_stock")} className={noticeType === "low_stock" ? "bg-indigo-500 hover:bg-indigo-600 text-white border-transparent" : "border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"}>
              Low stock
            </Button>
            <Button size="sm" type="button" variant={noticeType === "customer_request" ? "default" : "outline"} onClick={() => setNoticeType("customer_request")} className={noticeType === "customer_request" ? "bg-indigo-500 hover:bg-indigo-600 text-white border-transparent" : "border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"}>
              Customer request
            </Button>
          </div>
          <Textarea 
            value={message} 
            onChange={(event) => { setMessage(event.target.value); setSent(false) }} 
            placeholder={noticeType === "low_stock" ? "List the products that need restocking..." : "What are customers asking for that is not currently offered?"} 
            className="bg-black/40 border-indigo-500/20 focus-visible:ring-indigo-500/50 min-h-[100px] resize-none"
          />
          <div className="flex items-center gap-4">
            <Button onClick={notify} disabled={!message.trim()} className="bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Send className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
            {sent && <p className="text-sm font-medium text-emerald-400 animate-in fade-in slide-in-from-left-2">Update sent successfully.</p>}
          </div>
        </CardContent>
      </Card>

      {myResponses.length > 0 && (
        <Card className="border-cyan-500/20 bg-cyan-500/5 overflow-hidden relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-400">
              <MessageSquare className="h-4 w-4" />
              Manager Responses
            </CardTitle>
            <CardDescription>Replies to your previous notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {myResponses.map((notif: any, i: number) => (
              <div key={notif.id || i} className="bg-white/[0.02] border border-white/5 p-3 rounded-lg">
                <div className="text-xs text-white/50 mb-1 flex items-center justify-between">
                  <span>Your message: {notif.message}</span>
                  <span>{notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : ""}</span>
                </div>
                <div className="space-y-2 border-l-2 border-cyan-500/30 pl-3 py-1">
                  {notif.responses.map((resp: any, ri: number) => (
                    <div key={ri}>
                      <span className="text-xs font-semibold text-cyan-300">{resp.authorName}: </span>
                      <span className="text-sm text-white/90">{resp.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
