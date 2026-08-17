"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const branchSchema = z.object({
  name: z.string().min(2, "Branch name is required"),
  code: z.string().min(2, "Short code is required"),
  city: z.string().min(2, "City is required"),
})

export default function FirstBranchPage() {
  const router = useRouter()
  const setTenantId = useAuthStore((state) => state.setTenantId)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof branchSchema>>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "Headquarters",
      code: "HQ",
      city: "Nairobi",
    }
  })

  const onSubmit = async (data: z.infer<typeof branchSchema>) => {
    try {
      setIsLoading(true)
      setError("")

      // Gather data from previous steps
      const businessType = localStorage.getItem("onboarding_businessType") || "retail"
      const businessDetailsRaw = localStorage.getItem("onboarding_businessDetails") || "{}"
      const businessDetails = JSON.parse(businessDetailsRaw)

      // 1. Create the Tenant
      const tenantRes = await apiClient.patch("/tenant", {
        name: businessDetails.name,
        businessType: businessType,
        phone: businessDetails.phone,
        country: businessDetails.country,
        currency: businessDetails.currency,
      })

      const tenantId = tenantRes.data.id

      // Set the tenant ID globally in the state
      setTenantId(tenantId)

      // 2. Create the first Branch
      await apiClient.post("/branches", {
        name: data.name,
        code: data.code,
        city: data.city,
        isHeadquarters: true,
      })

      // 3. Apply the Business Type Template (sets up categories, widgets, receipt styles, etc)
      await apiClient.post("/tenant/apply-template", { template: businessType })

      // Clear local storage
      localStorage.removeItem("onboarding_businessType")
      localStorage.removeItem("onboarding_businessDetails")

      router.push("/onboarding/setup-complete")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to set up business. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>First Branch Details</CardTitle>
        <CardDescription>
          Where is your primary location or headquarters located?
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Branch Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Short Code</Label>
              <Input id="code" placeholder="e.g. HQ, NRB-1" {...register("code")} />
              {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
              {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>Back</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Setting up..." : "Complete Setup"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
