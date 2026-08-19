import Link from "next/link"
import { ChevronRight, CreditCard, Settings, ShieldCheck, Users } from "lucide-react"

const settingsSections = [
  {
    title: "Profile & security",
    description: "Update your account details and security preferences.",
    href: "/settings/profile",
    icon: ShieldCheck,
  },
  {
    title: "Team & permissions",
    description: "Invite staff, assign branches, and manage access.",
    href: "/settings/staff",
    icon: Users,
  },
  {
    title: "Payment methods",
    description: "Configure payment providers for your business.",
    href: "/settings/payments",
    icon: CreditCard,
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-cyan-300"><Settings className="h-5 w-5" /><span className="text-sm font-medium">Workspace</span></div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, team access, and business payment setup.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settingsSections.map(({ title, description, href, icon: Icon }) => (
          <Link key={href} href={href} className="group rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-cyan-400/30 hover:bg-cyan-500/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300"><Icon className="h-5 w-5" /></div>
              <ChevronRight className="h-5 w-5 text-white/30 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" />
            </div>
            <h2 className="mt-5 font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
