"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  Users, Settings, LayoutDashboard, Store, ShoppingCart,
  Menu, Package, Utensils, BarChart3, Calendar, ChevronDown, Sparkles,
  LogOut, Building2, X, ChevronRight,
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

type NavChild = { name: string; href: string }
type NavItem = {
  name: string
  href?: string
  icon: React.ElementType
  children?: NavChild[]
  roles?: string[]
}

const navigation: NavItem[] = [
  { name: "Dashboard",    href: "/",         icon: LayoutDashboard, roles: ["owner", "admin", "manager", "cashier", "viewer"] },
  { name: "POS Terminal", href: "/pos",       icon: Store, roles: ["owner", "admin", "manager", "cashier"] },
  { name: "Orders",       href: "/orders",    icon: ShoppingCart, roles: ["owner", "admin", "manager", "cashier"] },
  { name: "Products",     href: "/products",  icon: Package, roles: ["owner", "admin", "manager"] },
  {
    name: "Inventory", icon: Package, roles: ["owner", "admin", "manager"],
    children: [
      { name: "Stock Management",  href: "/inventory" },
      { name: "Purchase Orders",   href: "/inventory/purchase-orders" },
      { name: "Stock Transfers",   href: "/inventory/transfers" },
      { name: "Suppliers",         href: "/inventory/suppliers" },
    ],
  },
  {
    name: "Restaurant", icon: Utensils, roles: ["owner", "admin", "manager", "cashier"],
    children: [
      { name: "Floor Plan",       href: "/restaurant/tables" },
      { name: "Kitchen Display",  href: "/restaurant/kds" },
    ],
  },
  {
    name: "Salon & Clinic", icon: Calendar, roles: ["owner", "admin", "manager", "cashier"],
    children: [
      { name: "Appointments", href: "/salon/calendar" },
      { name: "Services",     href: "/salon/services" },
    ],
  },
  { name: "Customers",   href: "/customers",       icon: Users, roles: ["owner", "admin", "manager", "cashier"] },
  { name: "Reports",     href: "/reports",          icon: BarChart3, roles: ["owner", "admin", "manager", "viewer"] },
  { name: "Staff",       href: "/settings/staff",   icon: Users, roles: ["owner", "admin"] },
  { name: "Settings",   href: "/settings",          icon: Settings, roles: ["owner", "admin"] },
]

function getNavigation(businessType?: string, role?: string) {
  const type = businessType?.toLowerCase()
  return navigation.filter((item) => {
    if (item.roles && !item.roles.includes(role || "")) return false
    if (item.name === "Restaurant") return type === "restaurant"
    if (item.name === "Salon & Clinic") return type === "salon" || type === "clinic"
    return true
  })
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  const user            = useAuthStore(s => s.user)
  const token           = useAuthStore(s => s.token)
  const logout          = useAuthStore(s => s.logout)
  const currentBranch   = useAuthStore(s => s.currentBranch)
  const setCurrentBranch = useAuthStore(s => s.setCurrentBranch)

  const [branches,       setBranches]       = useState<any[]>([])
  const [tenant,         setTenant]         = useState<{ name: string; logo?: string } | null>(null)
  const [isSidebarOpen,  setSidebarOpen]    = useState(true)
  const [openGroups,     setOpenGroups]     = useState<string[]>(["Inventory"])
  const [isHydrated,     setIsHydrated]     = useState(false)

  useEffect(() => { setIsHydrated(true) }, [])

  useEffect(() => {
    if (isHydrated && token) {
      apiClient.get("/branches").then(res => {
        if (res.data?.length > 0) {
          setBranches(res.data)
          if (!currentBranch) setCurrentBranch(res.data[0])
        }
      }).catch(console.error)
    }
  }, [isHydrated, token])

  useEffect(() => {
    if (isHydrated && token) apiClient.get("/tenant").then((res) => setTenant(res.data)).catch(console.error)
  }, [isHydrated, token])

  useEffect(() => {
    if (isHydrated && !token) router.push("/login")
  }, [token, router, isHydrated])

  // Auto-expand groups that contain the current path
  useEffect(() => {
    navigation.forEach(item => {
      if (item.children?.some(c => pathname?.startsWith(c.href))) {
        setOpenGroups(prev => prev.includes(item.name) ? prev : [...prev, item.name])
      }
    })
  }, [pathname])

  if (!isHydrated || !user) return null

  const visibleNavigation = getNavigation(user.businessType, user.role)

  const toggleGroup = (name: string) =>
    setOpenGroups(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  return (
    <div className="h-screen overflow-hidden flex bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(236,72,153,0.14),_transparent_22%),linear-gradient(180deg,_rgba(10,14,30,1)_0%,_rgba(11,15,28,1)_100%)]">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out border-r border-white/10 backdrop-blur-xl
          ${isSidebarOpen ? "w-60" : "w-[72px]"}`}
        style={{ background: "rgba(11, 15, 28, 0.82)" }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 shadow-lg shadow-cyan-500/10">
              <Building2 className="h-5 w-5" />
            </div>
            {isSidebarOpen && (
              <span className="truncate font-bold text-lg tracking-tight text-white select-none">{tenant?.name || "Your Business"}</span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {visibleNavigation.map(item => {
            if (item.children) {
              const isGroupOpen = openGroups.includes(item.name)
              const isGroupActive = item.children.some(c => pathname?.startsWith(c.href))
              return (
                <div key={item.name}>
                  <button
                    onClick={() => isSidebarOpen && toggleGroup(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group
                      ${isGroupActive
                        ? "text-cyan-300"
                        : "text-white/50 hover:text-white/80 hover:bg-white/5"
                      }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {isSidebarOpen && (
                      <>
                        <span className="flex-1 text-left font-medium">{item.name}</span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isGroupOpen ? "rotate-90" : ""}`} />
                      </>
                    )}
                  </button>

                  {isSidebarOpen && isGroupOpen && (
                    <div className="ml-3 mt-0.5 pl-4 border-l border-white/10 space-y-0.5">
                      {item.children.map(child => {
                        const isActive = pathname === child.href || pathname?.startsWith(`${child.href}/`)
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center px-3 py-1.5 rounded-md text-[13px] transition-all duration-150
                              ${isActive
                                ? "bg-cyan-500/15 text-cyan-300 font-medium"
                                : "text-white/40 hover:text-white/70 hover:bg-white/5"
                              }`}
                          >
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href!}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150
                  ${isActive
                    ? "bg-cyan-500/20 text-cyan-300 font-medium shadow-sm"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {isSidebarOpen && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <div className={`flex items-center ${isSidebarOpen ? "gap-3" : "justify-center"}`}>
            <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-cyan-500/30">
              <AvatarFallback className="text-xs font-bold" style={{ background: "oklch(0.70 0.16 200 / 25%)", color: "oklch(0.85 0.08 200)" }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-white/40 capitalize truncate">{user.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="relative h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-white/10"
          style={{ background: "rgba(13, 18, 34, 0.82)" }}>

          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-sm font-bold tracking-tight text-white">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 via-emerald-400 to-fuchsia-500 text-slate-950"><Sparkles className="h-4 w-4" /></div>
            <span className="hidden sm:inline">SalesK</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Branch selector */}
            {branches.length > 0 && (
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <select
                  value={currentBranch?.id || ""}
                  onChange={e => {
                    const b = branches.find((br: any) => br.id === e.target.value)
                    if (b) setCurrentBranch(b)
                  }}
                  className="text-sm pl-8 pr-8 py-1.5 rounded-lg appearance-none cursor-pointer
                    border border-white/[0.08] bg-white/[0.05] text-white/70
                    hover:border-white/[0.15] focus:outline-none focus:border-cyan-500/50
                    transition-colors"
                >
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id} className="bg-[#0f1117]">{b.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
            )}

            {/* Sign out */}
            <button
              onClick={() => { logout(); router.push("/login") }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/50
                hover:text-white/80 hover:bg-white/[0.06] border border-transparent
                hover:border-white/[0.08] transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
