"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Download, Upload, Search, Settings, MapPin } from "lucide-react";
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
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { BranchPricingModal } from "@/components/products/branch-pricing-modal";

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const loadProducts = () => {
    apiClient.get("/products")
      .then((res) => {
        setProducts(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to load products", err);
      });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleExport = async () => {
    try {
      const res = await apiClient.get("/products/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "products.csv");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error("Export failed", error);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      await apiClient.post("/products/import", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      loadProducts();
      alert("Import successful!");
    } catch (err) {
      console.error("Import failed", err);
      alert("Import failed. Check console for details.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 sm:pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Products</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="hidden sm:flex">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv" 
            onChange={handleImport} 
          />
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button size="sm" onClick={() => router.push("/products/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Product
          </Button>
        </div>
      </div>

      <div className="flex items-center py-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product, index) => (
                <TableRow 
                  key={product.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                  style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
                >
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.sku || "-"}</TableCell>
                  <TableCell>{product.category?.name || "-"}</TableCell>
                  <TableCell className="text-right">KES {product.basePrice}</TableCell>
                  <TableCell className="text-right">
                    {product.isActive ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        Inactive
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      title="Set Branch Pricing"
                      onClick={() => {
                        setSelectedProduct(product)
                        setIsPricingModalOpen(true)
                      }}
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
            No products found.
          </div>
        ) : (
          filteredProducts.map((product, index) => (
            <div 
              key={product.id} 
              className="bg-card border rounded-lg p-4 shadow-sm flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">{product.name}</div>
                  <div className="text-sm text-muted-foreground">SKU: {product.sku || "-"} | {product.category?.name || "No Category"}</div>
                </div>
                <div className="font-bold text-cyan-600 dark:text-cyan-400">KES {product.basePrice}</div>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <div>
                  {product.isActive ? (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 border-cyan-500/20 text-cyan-700 dark:text-cyan-400 bg-cyan-500/10"
                    onClick={() => {
                      setSelectedProduct(product)
                      setIsPricingModalOpen(true)
                    }}
                  >
                    <MapPin className="h-3.5 w-3.5 mr-1" /> Pricing
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <BranchPricingModal 
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        product={selectedProduct}
        onSuccess={() => {
          setIsPricingModalOpen(false)
          loadProducts()
        }}
      />
    </div>
  );
}
