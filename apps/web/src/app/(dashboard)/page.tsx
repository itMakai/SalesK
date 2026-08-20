"use client";

import { useAuthStore } from "@/stores/auth-store";
import { WidgetGrid } from "@/components/dashboard/widget-grid";
import { CashierDashboard } from "@/components/dashboard/cashier-dashboard";

export default function DashboardHomePage() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === "cashier") return <CashierDashboard />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white/90">Dashboard Overview</h2>
      </div>

      <WidgetGrid />
    </div>
  )
}
