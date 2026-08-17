"use client";

import { usePosStore } from "@/stores/pos-store";
import { Package } from "lucide-react";

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
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground mt-20">
        <Package className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">No products found.</p>
        <p className="text-sm">Try adjusting your search or category filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {filteredProducts.map((product) => (
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
          className="flex flex-col bg-card border rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all text-left shadow-sm hover:shadow-md"
        >
          <div className="aspect-square bg-muted flex items-center justify-center w-full shrink-0">
            {product.image ? (
              <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
            ) : (
              <Package className="w-8 h-8 text-muted-foreground/50" />
            )}
          </div>
          <div className="p-3 flex flex-col flex-1">
            <span className="font-medium text-sm line-clamp-2 leading-tight flex-1">
              {product.name}
            </span>
            <span className="text-primary font-bold mt-2">
              Ksh {Number(product.basePrice).toLocaleString()}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
