"use client";

import { usePosStore } from "@/stores/pos-store";
import { Package, ScanBarcode, Sparkles } from "lucide-react";

interface Product {
  id: string;
  categoryId: string | null;
  name: string;
  basePrice: number;
  barcode: string | null;
  sku: string | null;
  image: string | null;
  taxRate: number;
}

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const activeCategoryId = usePosStore((state) => state.activeCategoryId);
  const searchQuery = usePosStore((state) => state.searchQuery);
  const addToCart = usePosStore((state) => state.addToCart);

  const apiHost = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(/\/api\/v1$/, "");

  const resolveImageSrc = (image: string) => {
    if (image.startsWith("http")) {
      return image;
    }

    return `${apiHost}${image}`;
  };

  // Filter logic
  const filteredProducts = products.filter((p) => {
    // Filter by Category
    if (activeCategoryId && p.categoryId !== activeCategoryId) {
      return false;
    }
    // Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = p.name.toLowerCase().includes(query);
      const matchesBarcode = p.barcode?.toLowerCase().includes(query);
      const matchesSku = p.sku?.toLowerCase().includes(query);
      if (!matchesName && !matchesBarcode && !matchesSku) {
        return false;
      }
    }
    return true;
  });

  if (filteredProducts.length === 0) {
    return (
      <div className="mt-20 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 px-6 py-14 text-center text-muted-foreground">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 via-emerald-500/20 to-fuchsia-500/20 text-cyan-200">
          <Package className="h-8 w-8" />
        </div>
        <p className="text-lg font-semibold text-white">No products found</p>
        <p className="text-sm text-slate-400">Try adjusting search, category filters, or barcode input.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {filteredProducts.map((product, index) => (
        <button
          key={product.id}
          onClick={() =>
            addToCart({
              productId: product.id,
              name: product.name,
              price: product.basePrice,
              quantity: 1,
              taxRate: product.taxRate,
            })
          }
          className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-card/80 text-left shadow-lg shadow-cyan-500/5 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-cyan-500/10 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
          style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
        >
          <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {product.image ? (
              <img 
                src={resolveImageSrc(product.image)} 
                alt={product.name} 
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-cyan-200/60">
                <Package className="h-10 w-10" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-slate-300">
                <span>{product.sku || "No SKU"}</span>
                <span className="flex items-center gap-1 text-cyan-200">
                  <ScanBarcode className="h-3 w-3" />
                  Scan ready
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-1 flex-col p-3">
            <span className="line-clamp-2 flex-1 text-sm font-medium leading-tight text-white">
              {product.name}
            </span>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100">
                {product.barcode ? product.barcode : "No barcode"}
              </span>
              <span className="flex items-center gap-1 text-sm font-semibold text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Ksh {Number(product.basePrice).toLocaleString()}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
