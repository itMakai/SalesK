"use client"

import { BarChart3, CalendarDays } from "lucide-react"

import { RevenueChartWidget } from "@/components/dashboard/widgets/revenue-chart"
import { PaymentBreakdownWidget } from "@/components/dashboard/widgets/payment-breakdown"
import { BranchComparisonWidget } from "@/components/dashboard/widgets/branch-comparison"
import { TopProductsWidget } from "@/components/dashboard/widgets/top-products"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-300">
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm font-medium">Business intelligence</span>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">A clear view of this month&apos;s sales, payments, and branch performance.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
          <CalendarDays className="h-4 w-4 text-cyan-300" /> This month
        </div>
      </div>

      <div className="grid auto-rows-[320px] gap-5 lg:grid-cols-2">
        <RevenueChartWidget />
        <PaymentBreakdownWidget />
        <BranchComparisonWidget />
        <TopProductsWidget />
      </div>
    </div>
  )
}
