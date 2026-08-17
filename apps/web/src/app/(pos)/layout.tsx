"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wifi, WifiOff } from "lucide-react";

import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  if (!user) return null;

  // Assuming online by default for now. Will wire to navigator.onLine later.
  const isOnline = true; 

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="font-bold text-primary leading-tight">POS Terminal</h1>
            <span className="text-xs text-muted-foreground leading-tight">Main Store</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mr-4">
            {isOnline ? (
              <span className="flex items-center text-green-500">
                <Wifi className="w-4 h-4 mr-1" /> Online
              </span>
            ) : (
              <span className="flex items-center text-red-500">
                <WifiOff className="w-4 h-4 mr-1" /> Offline
              </span>
            )}
          </div>
          
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
            <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
          </div>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
  );
}
