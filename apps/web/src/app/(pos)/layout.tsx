"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Cpu, ShieldCheck, Sparkles, Wifi, WifiOff } from "lucide-react";

import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [businessName, setBusinessName] = useState("Your Business");

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  useEffect(() => {
    if (token) apiClient.get("/tenant").then((response) => setBusinessName(response.data.name || "Your Business")).catch(console.error);
  }, [token]);

  if (!user) return null;

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),_transparent_24%),linear-gradient(180deg,_rgba(10,14,30,1)_0%,_rgba(11,15,28,1)_100%)]">
      <header className="shrink-0 border-b border-white/10 bg-background/70 backdrop-blur-xl">
        <div className="relative flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-emerald-400 to-fuchsia-500 text-slate-950 shadow-lg shadow-cyan-500/25">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-base font-semibold tracking-tight text-white">{businessName} POS Terminal</h1>
                  <Badge variant="secondary" className="hidden sm:inline-flex rounded-full bg-white/10 text-white border-white/10">
                    Live
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                    {user.role}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
                    <Cpu className="h-3.5 w-3.5 text-cyan-300" />
                    Main Store
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 text-sm font-bold text-white xl:flex">
            <Sparkles className="h-4 w-4 text-cyan-300" /> SalesK
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
              {isOnline ? (
                <span className="flex items-center gap-1 text-emerald-300">
                  <Wifi className="h-4 w-4" /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-rose-300">
                  <WifiOff className="h-4 w-4" /> Offline sync pending
                </span>
              )}
            </div>
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
              <span>F2 search</span>
              <span className="text-white/30">•</span>
              <span>F4 hold ticket</span>
              <span className="text-white/30">•</span>
              <span>F8 tickets</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex min-h-0 flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
