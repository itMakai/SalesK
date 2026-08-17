"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const detailsSchema = z.object({
  name: z.string().min(2, "Business name is required"),
  phone: z.string().min(9, "Valid phone number is required"),
  country: z.string().min(2, "Country code is required"),
  currency: z.string().min(3, "Currency code is required"),
})

export default function BusinessDetailsPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof detailsSchema>>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      country: "KE",
      currency: "KES",
    }
  })

  const onSubmit = (data: z.infer<typeof detailsSchema>) => {
    localStorage.setItem("onboarding_businessDetails", JSON.stringify(data))
    router.push("/onboarding/first-branch")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Details</CardTitle>
        <CardDescription>
          Tell us the basic information about your company.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name</Label>
            <Input id="name" placeholder="e.g. Makai Enterprises" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Business Phone Number</Label>
            <Input id="phone" placeholder="+254 700 000000" {...register("phone")} />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country Code</Label>
              <Input id="country" {...register("country")} />
              {errors.country && <p className="text-sm text-red-500">{errors.country.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Base Currency</Label>
              <Input id="currency" {...register("currency")} />
              {errors.currency && <p className="text-sm text-red-500">{errors.currency.message}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()}>Back</Button>
          <Button type="submit">Continue</Button>
        </CardFooter>
      </form>
    </Card>
  )
}
