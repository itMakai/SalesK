"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function DashboardHomePage() {
  const [stats, setStats] = useState({
    totalRevenueToday: 0,
    salesCountToday: 0,
    activeBranches: 0,
  });

  useEffect(() => {
    apiClient.get("/orders/stats/dashboard")
      .then(res => setStats(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric Cards */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Total Revenue Today</h3>
          <div className="text-2xl font-bold mt-2">
            KES {stats.totalRevenueToday.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Sales Count</h3>
          <div className="text-2xl font-bold mt-2">+{stats.salesCountToday}</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Active Branches</h3>
          <div className="text-2xl font-bold mt-2">{stats.activeBranches}</div>
        </div>
      </div>
      <div className="p-8 text-center text-muted-foreground border rounded-xl bg-muted/20">
        <p>The full dashboard widgets engine will be implemented in Milestone 3.</p>
        <p>Your sales are now tracking live above!</p>
      </div>
    </div>
  )
}
