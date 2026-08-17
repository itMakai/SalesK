"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, ArrowLeft, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { CategoryModal } from "@/components/dashboard/products/category-modal";

const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  basePrice: z.coerce.number().min(0, "Price must be positive"),
  costPrice: z.coerce.number().optional(),
  categoryId: z.string().optional(),
  trackInventory: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      trackInventory: true,
    },
  });

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    try {
      let imageUrl = null;

      // 1. Upload Image if exists
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await apiClient.post("/products/upload-image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        imageUrl = uploadRes.data.url;
      }

      // 2. Create Product
      await apiClient.post("/products", {
        ...data,
        imageUrl,
        isActive: true,
      });

      router.push("/products");
    } catch (error) {
      console.error("Failed to create product", error);
      // Add toast here in the future
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add New Product</h2>
          <p className="text-muted-foreground">Create a new item in your catalog.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Main Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Main details about the product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" placeholder="e.g., iPhone 15 Pro" {...register("name")} />
                  {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" placeholder="IPH-15P-128" {...register("sku")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input id="barcode" placeholder="123456789012" {...register("barcode")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" placeholder="Brief product description" {...register("description")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
                <CardDescription>Set the base and cost price (KES).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">Selling Price *</Label>
                    <Input id="basePrice" type="number" step="0.01" {...register("basePrice")} />
                    {errors.basePrice && <p className="text-sm text-red-500">{errors.basePrice.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price</Label>
                    <Input id="costPrice" type="number" step="0.01" {...register("costPrice")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Organization & Image */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization</CardTitle>
                <CardDescription>Categorize this product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="categoryId">Category</Label>
                    <Button type="button" variant="link" className="h-auto p-0" onClick={() => setCategoryModalOpen(true)}>
                      + New Category
                    </Button>
                  </div>
                  {/* Select goes here. For now, we'll use a simple input or you could use shadcn select */}
                  <Input id="categoryId" placeholder="Category ID (Optional)" {...register("categoryId")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Image</CardTitle>
                <CardDescription>Upload an image for the POS and receipt.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 space-y-2">
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {imageFile ? imageFile.name : "Drag and drop or click to upload"}
                  </p>
                  <Input 
                    type="file" 
                    className="max-w-[250px]" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Product"}
            {!isSubmitting && <Save className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </form>

      <CategoryModal open={isCategoryModalOpen} onOpenChange={setCategoryModalOpen} />
    </div>
  );
}
