"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { usePosStore } from "@/stores/pos-store";

import { ProductGrid } from "@/components/pos/product-grid";
import { CategoryFilter } from "@/components/pos/category-filter";
import { CartPanel } from "@/components/pos/cart-panel";
import { BarcodeListener } from "@/components/pos/barcode-listener";

export default function PosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const setTaxRate = usePosStore((state) => state.setTaxRate);
  const setSearchQuery = usePosStore((state) => state.setSearchQuery);
  const searchQuery = usePosStore((state) => state.searchQuery);

  useEffect(() => {
    const initPos = async () => {
      try {
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
      } finally {
        setLoading(false);
      }
    };

    initPos();
  }, [setTaxRate]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex w-full h-full">
      <BarcodeListener products={products} />
      
      {/* Left side: Search, Filters, Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
        <div className="p-4 border-b bg-card shrink-0 flex flex-col space-y-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name, SKU, or barcode..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <CategoryFilter categories={categories} />
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <ProductGrid products={products} />
        </div>
      </div>

      {/* Right side: Cart Panel */}
      <CartPanel />
    </div>
  );
}
