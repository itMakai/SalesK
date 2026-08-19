"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Zap } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
})

export default function LoginPage() {
  const router  = useRouter()
  const setAuth = useAuthStore(s => s.setAuth)
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
      const { user, tokens } = response.data
      setAuth(tokens.accessToken, user.tenantId, user)
      router.push("/")
    } catch (err: any) {
      const messages = err.response?.data?.message
      setError(Array.isArray(messages) ? messages.join(", ") : messages || "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "oklch(0.10 0.018 264)" }}>

      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse, oklch(0.65 0.22 290), transparent)" }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse, oklch(0.72 0.17 165), transparent)" }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.22 260))" }}>
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: "oklch(0.55 0.012 264)" }}>
            Sign in to your SalesK account
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 border border-white/[0.08]"
          style={{ background: "oklch(0.14 0.018 264)" }}>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="px-4 py-3 rounded-lg text-sm text-red-400 border border-red-500/20"
                style={{ background: "oklch(0.62 0.22 25 / 10%)" }}>
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-white/70">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                className="bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25
                  focus:border-violet-500/60 focus:ring-violet-500/20 h-10 rounded-lg"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-white/70">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25
                  focus:border-violet-500/60 focus:ring-violet-500/20 h-10 rounded-lg"
                {...register("password")}
              />
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 rounded-lg text-sm font-semibold text-white
                flex items-center justify-center gap-2
                transition-all duration-200 hover:opacity-90 active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.22 260))" }}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              ) : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm mt-5" style={{ color: "oklch(0.50 0.010 264)" }}>
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
