"use client";

import React from "react";
import { SalesWidget } from "./widgets/sales-widget";
import { BranchWidget } from "./widgets/branch-widget";
import { RevenueChartWidget } from "./widgets/revenue-chart";
import { TopProductsWidget } from "./widgets/top-products";
import { RecentOrdersWidget } from "./widgets/recent-orders";
import { PaymentBreakdownWidget } from "./widgets/payment-breakdown";
import { LowStockAlertsWidget } from "./widgets/low-stock-alerts";
import { BranchComparisonWidget } from "./widgets/branch-comparison";
import { StaffPerformanceWidget } from "./widgets/staff-performance";
import { CustomerInsightsWidget } from "./widgets/customer-insights";
import { CustomKpisWidget } from "./widgets/custom-kpis";
import { CashierNotificationsWidget } from "./widgets/cashier-notifications";

interface WidgetGridProps {
  isEditable?: boolean; // Kept for backwards compatibility if used elsewhere, but unused here
}

export function WidgetGrid({ isEditable }: WidgetGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 pb-12">
      {/* Top Metrics Row */}
      <div className="xl:col-span-1 min-h-[160px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '0ms' }}>
        <SalesWidget />
      </div>
      <div className="xl:col-span-1 min-h-[160px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '100ms' }}>
        <CustomKpisWidget />
      </div>
      <div className="xl:col-span-2 min-h-[160px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '200ms' }}>
        <CashierNotificationsWidget />
      </div>
      
      {/* Main Charts Row */}
      <div className="xl:col-span-3 min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '300ms' }}>
        <RevenueChartWidget />
      </div>
      <div className="xl:col-span-1 min-h-[400px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '400ms' }}>
        <TopProductsWidget />
      </div>

      {/* Orders and Breakdowns */}
      <div className="xl:col-span-2 min-h-[350px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '500ms' }}>
        <RecentOrdersWidget />
      </div>
      <div className="xl:col-span-1 min-h-[350px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '600ms' }}>
        <PaymentBreakdownWidget />
      </div>
      <div className="xl:col-span-1 min-h-[350px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '700ms' }}>
        <LowStockAlertsWidget />
      </div>
      
      {/* Performance & Insights Row */}
      <div className="xl:col-span-2 min-h-[350px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '800ms' }}>
        <BranchComparisonWidget />
      </div>
      <div className="xl:col-span-1 min-h-[350px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '900ms' }}>
        <StaffPerformanceWidget />
      </div>
      <div className="xl:col-span-1 min-h-[350px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '1000ms' }}>
        <CustomerInsightsWidget />
      </div>

      {/* Full width branch list */}
      <div className="xl:col-span-4 min-h-[300px] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both" style={{ animationDelay: '1100ms' }}>
        <BranchWidget />
      </div>
    </div>
  );
}
