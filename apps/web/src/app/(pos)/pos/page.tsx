"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Crown, ScanLine, Search, Sparkles, Ticket, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { usePosStore } from "@/stores/pos-store";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { ProductGrid } from "@/components/pos/product-grid";
import { CategoryFilter } from "@/components/pos/category-filter";
import { ModernCartPanel } from "@/components/pos/modern-cart-panel";
import { BarcodeListener } from "@/components/pos/barcode-listener";
import { BarcodeScannerDialog } from "@/components/barcode-scanner-dialog";
import { POS_SHORTCUTS } from "@salesk/shared";

export default function PosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const setBranchId = usePosStore((state) => state.setBranchId);
  const setTaxRate = usePosStore((state) => state.setTaxRate);
  const setSearchQuery = usePosStore((state) => state.setSearchQuery);
  const searchQuery = usePosStore((state) => state.searchQuery);
  const promotion = usePosStore((state) => state.promotion);
  const suspendedTickets = usePosStore((state) => state.suspendedTickets);
  const shiftSession = usePosStore((state) => state.shiftSession);
  const ticketManagerOpen = usePosStore((state) => state.ticketManagerOpen);
  const setTicketManagerOpen = usePosStore((state) => state.setTicketManagerOpen);
  const addToCart = usePosStore((state) => state.addToCart);

  const handleCodeDetected = (code: string) => {
    const product = products.find((item) => item.barcode === code || item.sku === code)
    if (!product) {
      setError(`No product matches code ${code}.`)
      return
    }
    addToCart({ productId: product.id, name: product.name, price: product.basePrice, quantity: 1, taxRate: product.taxRate || 16 })
  }

  const shortcutSummary = useMemo(
    () => POS_SHORTCUTS.slice(0, 4).map((shortcut) => `${shortcut.key} ${shortcut.label}`),
    []
  );

  useEffect(() => {
    const initPos = async () => {
      try {
        setError(null);
        const [prodRes, catRes, branchRes] = await Promise.all([
          apiClient.get("/products"),
          apiClient.get("/categories"),
          apiClient.get("/branches"),
        ]);

        const productsData = prodRes.data.data || prodRes.data;
        const categoriesData = catRes.data.data || catRes.data;
        const branches = branchRes.data.data || branchRes.data;

        // Extract Tax Rate from the first active branch
        const activeBranch = branches.find((b: any) => b.isActive) || branches[0];
        if (activeBranch?.id) {
          setBranchId(activeBranch.id);
        }
        if (activeBranch?.taxConfig?.taxRate) {
          setTaxRate(activeBranch.taxConfig.taxRate);
        }

        // Map taxRate to products for easy calculations later if needed
        const taxRate = activeBranch?.taxConfig?.taxRate || 16;
        const mappedProducts = productsData.map((p: any) => ({
          ...p,
          taxRate: p.taxRate || taxRate, // Fallback to branch default if product has no explicit tax rate
        }));

        setProducts(mappedProducts);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to initialize POS", error);
        setError(getApiErrorMessage(error, "Failed to initialize POS terminal."));
      } finally {
        setLoading(false);
      }
    };

    initPos();
  }, [setTaxRate]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === "F8") {
        event.preventDefault();
        setTicketManagerOpen(!ticketManagerOpen);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [setTicketManagerOpen, ticketManagerOpen]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/30">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-card/80 px-8 py-10 shadow-2xl shadow-cyan-500/10">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-300" />
          <div className="text-center">
            <p className="font-semibold text-white">Loading POS workspace</p>
            <p className="text-sm text-muted-foreground">Products, branches, and ticket controls are being prepared.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <BarcodeListener products={products} />
      
      {/* Left side: Search, Filters, Grid */}
      <div className="flex min-h-[55dvh] min-w-0 flex-1 flex-col bg-transparent lg:min-h-0">
        <div className="border-b border-white/10 bg-card/60 px-4 py-4 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-lg shadow-cyan-500/5 sm:min-w-[280px]">
              <Search className="h-4 w-4 text-cyan-300" />
              <Input
                placeholder="Search products by name, SKU, or barcode..."
                className="border-0 bg-transparent px-0 text-base placeholder:text-slate-400 focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="outline" className="border-cyan-400/30 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20" onClick={() => setScannerOpen(true)}><ScanLine className="mr-2 h-4 w-4" /> Scan</Button>
              <Badge className="rounded-full bg-cyan-500/15 text-cyan-200 border-cyan-400/20">
                <Ticket className="mr-1 h-3.5 w-3.5" /> {suspendedTickets.length} held
              </Badge>
              <Badge className="rounded-full bg-amber-500/15 text-amber-200 border-amber-400/20">
                <Sparkles className="mr-1 h-3.5 w-3.5" /> Promo {promotion.code || "none"}
              </Badge>
              <Badge className="rounded-full bg-emerald-500/15 text-emerald-200 border-emerald-400/20">
                <Crown className="mr-1 h-3.5 w-3.5" /> {shiftSession?.status === "open" ? "Shift open" : "Shift idle"}
              </Badge>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-rose-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
                <div>
                  <p className="font-medium">POS initialization failed</p>
                  <p className="text-sm text-rose-200/80">{error}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-rose-300/30 bg-transparent text-rose-100 hover:bg-rose-500/10" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
            {shortcutSummary.map((shortcut) => (
              <span key={shortcut} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                {shortcut}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-col space-y-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <CategoryFilter categories={categories} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
          <ProductGrid products={products} />
        </div>
      </div>

      {/* Right side: Cart Panel */}
      <ModernCartPanel />
      <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onDetected={handleCodeDetected} />
    </div>
  );
}
