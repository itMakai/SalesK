"use client";

import React, { useState, useEffect } from "react";
import { Layout, Responsive, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { apiClient } from "@/lib/api-client";
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
import { Button } from "@/components/ui/button";
import { GripHorizontal, X } from "lucide-react";

interface WidgetItem {
  id: string;
  type: string;
}

interface WidgetGridProps {
  isEditable: boolean;
}

const WIDGET_COMPONENTS: Record<string, React.FC> = {
  sales: SalesWidget,
  branches: BranchWidget,
  "revenue-chart": RevenueChartWidget,
  "top-products": TopProductsWidget,
  "recent-orders": RecentOrdersWidget,
  "payment-breakdown": PaymentBreakdownWidget,
  "low-stock-alerts": LowStockAlertsWidget,
  "branch-comparison": BranchComparisonWidget,
  "staff-performance": StaffPerformanceWidget,
  "customer-insights": CustomerInsightsWidget,
  "custom-kpis": CustomKpisWidget,
  "cashier-notifications": CashierNotificationsWidget,
};

export function WidgetGrid({ isEditable }: WidgetGridProps) {
  const [layout, setLayout] = useState<Layout>([]);
  const [widgets, setWidgets] = useState<WidgetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { width, containerRef, mounted } = useContainerWidth();

  // Load layout from API
  useEffect(() => {
    apiClient.get("/dashboard/layout")
      .then((res) => {
        if (res.data.layout && res.data.layout.length > 0) {
          setLayout(res.data.layout);
          setWidgets(res.data.widgets || []);
        } else {
          // Default layout if none exists
          setLayout([
            { i: "w-1", x: 0, y: 0, w: 3, h: 4 },
            { i: "w-2", x: 3, y: 0, w: 3, h: 4 },
            { i: "w-12", x: 6, y: 0, w: 6, h: 4 },
            { i: "w-3", x: 0, y: 4, w: 8, h: 10 },
            { i: "w-4", x: 8, y: 4, w: 4, h: 10 },
            { i: "w-5", x: 0, y: 14, w: 6, h: 10 },
            { i: "w-6", x: 6, y: 14, w: 6, h: 10 },
            { i: "w-7", x: 0, y: 24, w: 4, h: 8 },
            { i: "w-8", x: 4, y: 24, w: 4, h: 8 },
            { i: "w-9", x: 8, y: 24, w: 4, h: 8 },
            { i: "w-10", x: 0, y: 32, w: 6, h: 10 },
            { i: "w-11", x: 6, y: 32, w: 6, h: 10 },
          ]);
          setWidgets([
            { id: "w-1", type: "sales" },
            { id: "w-2", type: "custom-kpis" },
            { id: "w-12", type: "cashier-notifications" },
            { id: "w-3", type: "revenue-chart" },
            { id: "w-4", type: "top-products" },
            { id: "w-5", type: "recent-orders" },
            { id: "w-6", type: "payment-breakdown" },
            { id: "w-7", type: "low-stock-alerts" },
            { id: "w-8", type: "branch-comparison" },
            { id: "w-9", type: "staff-performance" },
            { id: "w-10", type: "customer-insights" },
            { id: "w-11", type: "branches" },
          ]);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Save layout to API whenever it changes (only in edit mode)
  const handleLayoutChange = (newLayout: Layout) => {
    setLayout(newLayout);
    if (isEditable) {
      apiClient.put("/dashboard/layout", { layout: newLayout, widgets }).catch(console.error);
    }
  };

  const addWidget = () => {
    const newId = `w-${Date.now()}`;
    const newLayoutItem = { i: newId, x: 0, y: Infinity, w: 4, h: 4 };
    const newWidget = { id: newId, type: "sales" }; // Default to sales widget for now

    const nextLayout = [...layout, newLayoutItem];
    const nextWidgets = [...widgets, newWidget];

    setLayout(nextLayout);
    setWidgets(nextWidgets);
    
    apiClient.put("/dashboard/layout", { layout: nextLayout, widgets: nextWidgets }).catch(console.error);
  };

  const removeWidget = (id: string) => {
    const nextLayout = layout.filter((l) => l.i !== id);
    const nextWidgets = widgets.filter((w) => w.id !== id);

    setLayout(nextLayout);
    setWidgets(nextWidgets);

    apiClient.put("/dashboard/layout", { layout: nextLayout, widgets: nextWidgets }).catch(console.error);
  };

  if (isLoading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="w-full" ref={containerRef}>
      {isEditable && (
        <div className="mb-4">
          <Button onClick={addWidget}>+ Add Widget</Button>
        </div>
      )}

      {mounted && width > 0 && (
      <Responsive
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        width={width}
        onLayoutChange={(currentLayout, allLayouts) => handleLayoutChange(currentLayout)}
      >
        {widgets.map((widget) => {
          const WidgetComponent = WIDGET_COMPONENTS[widget.type] || (() => <div>Unknown</div>);
          return (
            <div key={widget.id} className="relative group h-full w-full">
              {isEditable && (
                <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-50 hover:opacity-100 transition-opacity bg-background/80 backdrop-blur px-2 py-1 rounded-lg border border-border/50 shadow-sm">
                  <div className="drag-handle cursor-grab p-1 rounded hover:bg-secondary transition-colors">
                    <GripHorizontal className="h-4 w-4" />
                  </div>
                  <button 
                    onClick={() => removeWidget(widget.id)}
                    className="cursor-pointer text-destructive p-1 rounded hover:bg-destructive/10 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <WidgetComponent />
            </div>
          );
        })}
      </Responsive>
      )}
    </div>
  );
}
