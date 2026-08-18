"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
})

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    try {
      setIsLoading(true)
      setError("")
      const response = await apiClient.post("/auth/login", data)
      // API returns: { user, tokens: { accessToken, refreshToken } }
      const { user, tokens } = response.data

      setAuth(tokens.accessToken, user.tenantId, user)

      // Redirect to dashboard
      router.push("/")
    } catch (err: any) {
      const messages = err.response?.data?.message
      if (Array.isArray(messages)) {
        setError(messages.join(", "))
      } else {
        setError(messages || "Invalid email or password")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 relative p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign in to SalesK</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to login
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <a href="/register" className="text-primary hover:underline">
                Register here
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
