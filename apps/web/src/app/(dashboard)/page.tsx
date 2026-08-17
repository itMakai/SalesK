export default function DashboardHomePage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards for metrics */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Total Revenue Today</h3>
          <div className="text-2xl font-bold mt-2">KES 0.00</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Sales Count</h3>
          <div className="text-2xl font-bold mt-2">+0</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <h3 className="tracking-tight text-sm font-medium">Active Branches</h3>
          <div className="text-2xl font-bold mt-2">1</div>
        </div>
      </div>
      <div className="p-8 text-center text-muted-foreground border rounded-xl bg-muted/20">
        <p>The dashboard widgets engine will be implemented in Milestone 3.</p>
        <p>Use the sidebar to navigate to the Staff Settings page to complete Milestone 1!</p>
      </div>
    </div>
  )
}
