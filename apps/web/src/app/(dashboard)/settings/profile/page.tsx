"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuthStore } from "@/stores/auth-store"
import { apiClient } from "@/lib/api-client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

const profileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
})

export default function ProfileSettingsPage() {
  const user = useAuthStore((state) => state.user)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    }
  })

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    setIsLoading(true)
    setMessage("")
    // Mock save, as there's no direct PATCH /user endpoint built in week 6 yet
    await new Promise(res => setTimeout(res, 800))
    setMessage("Profile updated successfully.")
    setIsLoading(false)
  }

  const handleEnable2FA = async () => {
    try {
      const res = await apiClient.post("/auth/2fa/generate")
      // Normally we would show a QR code here based on res.data.qrCodeUrl
      alert("2FA Secret generated! In a real app, a QR code would appear here.")
    } catch (err) {
      alert("Failed to generate 2FA.")
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Profile & Security</h2>
        <p className="text-muted-foreground">
          Manage your personal information and account security.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your name and contact details.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {message && <div className="text-sm text-green-600 bg-green-50 p-2 rounded">{message}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" {...register("firstName")} />
                  {errors.firstName && <span className="text-xs text-red-500">{errors.firstName.message}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" {...register("lastName")} />
                  {errors.lastName && <span className="text-xs text-red-500">{errors.lastName.message}</span>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>Add an extra layer of security to your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Two-factor authentication (2FA) is currently disabled. We recommend enabling it to protect your business data.
            </p>
            <Button variant="outline" onClick={handleEnable2FA}>
              Enable 2FA (Authenticator App)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
