"use client";

import { useEffect, useState } from "react";
import { Download, Search, History, Settings2, PlusCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { StockAdjustmentModal } from "@/components/inventory/stock-adjustment-modal";
import { ThresholdModal } from "@/components/inventory/threshold-modal";
import { MovementHistoryDrawer } from "@/components/inventory/movement-history-drawer";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isAdjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [isThresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invRes, branchesRes] = await Promise.all([
        apiClient.get("/inventory", {
          params: {
            branchId: branchFilter !== "all" ? branchFilter : undefined,
            lowStock: lowStockOnly ? "true" : undefined
          }
        }),
        apiClient.get("/branches")
      ]);
      setInventory(invRes.data || []);
      setBranches(branchesRes.data || []);
    } catch (error) {
      console.error("Failed to load inventory data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchFilter, lowStockOnly]);

  const handleExport = () => {
    // Basic CSV export for now
    const headers = ["Product", "SKU", "Branch", "Stock", "Threshold"];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + filteredInventory.map(item => {
          return `"${item.product.name}","${item.product.sku || ""}","${item.branch.name}","${item.quantity}","${item.lowStockThreshold || ""}"`;
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInventory = inventory.filter(
    (item) =>
      item.product.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.product.sku && item.product.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between py-4 bg-card p-4 rounded-lg border">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or SKU..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={branchFilter} onValueChange={(value) => setBranchFilter(value ?? "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="low-stock"
            checked={lowStockOnly}
            onCheckedChange={setLowStockOnly}
          />
          <Label htmlFor="low-stock">Show Low Stock Only</Label>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Stock Level</TableHead>
              <TableHead className="text-right">Alert Threshold</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Loading inventory...</TableCell>
              </TableRow>
            ) : filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">No inventory records found.</TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => {
                const isLowStock = item.lowStockThreshold !== null && Number(item.quantity) <= Number(item.lowStockThreshold);
                const isOutOfStock = Number(item.quantity) <= 0;
                
                return (
                  <TableRow key={item.id} className={isLowStock && !isOutOfStock ? "bg-red-50/50 dark:bg-red-950/20" : isOutOfStock ? "bg-red-100/50 dark:bg-red-900/20" : ""}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{item.product.name}</span>
                        <span className="text-xs text-muted-foreground">{item.product.sku || "No SKU"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.branch.name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(item.quantity)} <span className="text-xs text-muted-foreground">{item.product.unit}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.lowStockThreshold !== null ? Number(item.lowStockThreshold) : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                          <AlertCircle className="w-3 h-3 mr-1" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          In Stock
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          title="Record Movement"
                          onClick={() => { setSelectedItem(item); setAdjustmentModalOpen(true); }}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Alert Threshold"
                          onClick={() => { setSelectedItem(item); setThresholdModalOpen(true); }}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Movement History"
                          onClick={() => { setSelectedItem(item); setHistoryDrawerOpen(true); }}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => { setAdjustmentModalOpen(false); setSelectedItem(null); }}
        inventoryItem={selectedItem}
        onSuccess={fetchData}
      />
      
      <ThresholdModal
        isOpen={isThresholdModalOpen}
        onClose={() => { setThresholdModalOpen(false); setSelectedItem(null); }}
        inventoryItem={selectedItem}
        onSuccess={fetchData}
      />

      <MovementHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => { setHistoryDrawerOpen(false); setSelectedItem(null); }}
        inventoryItem={selectedItem}
      />
    </div>
  );
}
