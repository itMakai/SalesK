"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Users, Settings, LayoutDashboard, Store, ShoppingCart, Menu, Package } from "lucide-react"

import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const logout = useAuthStore((state) => state.logout)
  const [isSidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    // If no token, bounce to login
    if (!token) {
      router.push("/login")
    }
  }, [token, router])

  if (!user) return null

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "POS Terminal", href: "/pos", icon: Store },
    { name: "Orders", href: "/orders", icon: ShoppingCart },
    { name: "Products", href: "/products", icon: Package },
    { name: "Staff & Users", href: "/settings/staff", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`bg-card border-r transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-20"} hidden md:flex flex-col`}>
        <div className="h-16 flex items-center justify-center border-b">
          <h1 className={`font-bold text-primary transition-all ${isSidebarOpen ? "text-xl" : "text-sm"}`}>
            {isSidebarOpen ? "Biashara POS" : "BPOS"}
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
              return (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                      isActive 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {isSidebarOpen && <span>{item.name}</span>}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.firstName}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                </div>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!isSidebarOpen)} className="hidden md:flex">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => { logout(); router.push('/login'); }}>
              Sign out
            </Button>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
