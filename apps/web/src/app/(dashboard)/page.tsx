"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { WidgetGrid } from "@/components/dashboard/widget-grid";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CashierDashboard } from "@/components/dashboard/cashier-dashboard";

export default function DashboardHomePage() {
  const user = useAuthStore((state) => state.user);
  const [isEditMode, setIsEditMode] = useState(false);

  // Only allow admin or owner to edit the dashboard
  const canEdit = user?.role === "admin" || user?.role === "owner";

  if (user?.role === "cashier") return <CashierDashboard />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
        
        {/* 
        {canEdit && (
          <div className="flex items-center space-x-2 bg-muted p-2 rounded-lg border">
            <Switch 
              id="edit-mode" 
              checked={isEditMode} 
              onCheckedChange={setIsEditMode} 
            />
            <Label htmlFor="edit-mode" className="cursor-pointer">Edit Dashboard</Label>
          </div>
        )}
        */}
      </div>

      <WidgetGrid isEditable={false} />

      {/* 
      <div className="p-4 text-center text-xs text-muted-foreground border rounded-xl bg-muted/20 mt-8">
        <p>The dashboard layout engine is live! Drag, drop, and resize widgets. Layouts are saved automatically per-tenant.</p>
      </div> 
      */}
    </div>
  )
}
