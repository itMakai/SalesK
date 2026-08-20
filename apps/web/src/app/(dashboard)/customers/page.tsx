"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Eye, Search, UserPlus } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function CustomersPage() {
  const { data: customers } = useSWR("/api/v1/customers")
  const [searchTerm, setSearchTerm] = useState("")

  const getSegment = (totalSpent: string, visitCount: number) => {
    const spent = Number(totalSpent)
    if (spent > 50000 || visitCount >= 10) return { label: "VIP", color: "bg-purple-100 text-purple-800" }
    if (visitCount >= 3) return { label: "Regular", color: "bg-blue-100 text-blue-800" }
    return { label: "New", color: "bg-green-100 text-green-800" }
  }

  const filteredCustomers = customers?.filter((c: any) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm))
  )

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers CRM</h1>
          <p className="text-sm text-muted-foreground">
            Manage customer profiles, view history, and loyalty points.
          </p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" /> Add Customer
        </Button>
      </div>

      <div className="flex items-center space-x-2 max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name or phone..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="hidden md:block bg-card border rounded-lg overflow-hidden shadow-sm flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Segment</th>
                <th className="px-6 py-3">Visits</th>
                <th className="px-6 py-3">Total Spent</th>
                <th className="px-6 py-3">Points</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers?.map((customer: any, index: number) => {
                const segment = getSegment(customer.totalSpent, customer.visitCount)
                return (
                  <tr 
                    key={customer.id} 
                    className="bg-card border-b hover:bg-muted/30 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                    style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
                  >
                    <td className="px-6 py-4 font-medium">{customer.name}</td>
                    <td className="px-6 py-4">
                      {customer.phone || "-"}
                      <br />
                      <span className="text-xs text-muted-foreground">{customer.email || ""}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${segment.color}`}>
                        {segment.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">{customer.visitCount}</td>
                    <td className="px-6 py-4">Ksh {Number(customer.totalSpent).toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-primary">{customer.loyaltyPoints}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/customers/${customer.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {filteredCustomers?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4 pb-6">
        {filteredCustomers?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
            No customers found.
          </div>
        ) : (
          filteredCustomers?.map((customer: any, index: number) => {
            const segment = getSegment(customer.totalSpent, customer.visitCount)
            return (
              <div 
                key={customer.id} 
                className="bg-card border rounded-lg p-4 shadow-sm flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {customer.phone || "No phone"} {customer.email ? `• ${customer.email}` : ""}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${segment.color}`}>
                    {segment.label}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs uppercase">Total Spent</span>
                    <span className="font-medium text-cyan-600 dark:text-cyan-400">Ksh {Number(customer.totalSpent).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs uppercase">Visits / Points</span>
                    <span className="font-medium">{customer.visitCount} visits • {customer.loyaltyPoints} pts</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Link href={`/customers/${customer.id}`}>
                    <Button variant="outline" size="sm" className="h-8">
                      <Eye className="w-3.5 h-3.5 mr-1" /> View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
