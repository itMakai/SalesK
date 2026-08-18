import { ThemeToggle } from "@/components/theme-toggle"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </header>
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome to SalesK</h1>
          <p className="mt-2 text-muted-foreground">Let&apos;s get your business set up in a few simple steps.</p>
        </div>
        {children}
      </div>
    </div>
  )
}
