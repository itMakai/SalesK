"use client"

import { useParams, useRouter } from "next/navigation"
import useSWR from "swr"
import { ArrowLeft, MapPin, Phone, Mail, Clock, CalendarCheck, Utensils, Award } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function CustomerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: customer } = useSWR(`/api/v1/customers/${id}`)

  if (!customer) {
    return <div className="p-12 text-center">Loading profile...</div>
  }

  const getSegment = (totalSpent: string, visitCount: number) => {
    const spent = Number(totalSpent)
    if (spent > 50000 || visitCount >= 10) return { label: "VIP", color: "bg-purple-100 text-purple-800" }
    if (visitCount >= 3) return { label: "Regular", color: "bg-blue-100 text-blue-800" }
    return { label: "New", color: "bg-green-100 text-green-800" }
  }
  const segment = getSegment(customer.totalSpent, customer.visitCount)

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{customer.name}'s Profile</h1>
          <p className="text-sm text-muted-foreground">View detailed history and stats.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="col-span-1 bg-card border rounded-lg p-6 shadow-sm flex flex-col items-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center text-4xl mb-4 text-muted-foreground font-bold">
            {customer.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold mb-1">{customer.name}</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold mb-6 ${segment.color}`}>
            {segment.label}
          </span>
          
          <div className="w-full space-y-3 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Phone className="w-4 h-4 mr-3" /> {customer.phone || "No phone"}
            </div>
            <div className="flex items-center text-muted-foreground">
              <Mail className="w-4 h-4 mr-3" /> {customer.email || "No email"}
            </div>
            <div className="flex items-center text-muted-foreground">
              <Clock className="w-4 h-4 mr-3" /> Joined {new Date(customer.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          <div className="w-full grid grid-cols-2 gap-4 mt-8 pt-6 border-t text-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Points</p>
              <p className="text-2xl font-bold text-primary flex items-center justify-center">
                <Award className="w-5 h-5 mr-1" /> {customer.loyaltyPoints}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Spent</p>
              <p className="text-2xl font-bold">Ksh {Number(customer.totalSpent).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* History Area */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <CalendarCheck className="w-5 h-5 mr-2" /> Recent Appointments
            </h3>
            {customer.appointments?.length > 0 ? (
              <div className="space-y-4">
                {customer.appointments.slice(0, 5).map((apt: any) => (
                  <div key={apt.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <div className="font-semibold">{apt.service?.name}</div>
                      <div className="text-sm text-muted-foreground">{new Date(apt.startTime).toLocaleString()}</div>
                    </div>
                    <div className="text-sm font-semibold capitalize bg-muted px-2 py-1 rounded">
                      {apt.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No appointments found.</p>
            )}
          </div>

          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Utensils className="w-5 h-5 mr-2" /> Recent POS Orders
            </h3>
            {customer.orders?.length > 0 ? (
              <div className="space-y-4">
                {customer.orders.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex flex-col p-3 border rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold">{order.orderNumber}</div>
                      <div className="font-bold">Ksh {Number(order.total).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">{new Date(order.createdAt).toLocaleString()}</div>
                    <div className="text-sm space-y-1">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-muted-foreground">
                          <span>{item.quantity}x {item.productName}</span>
                          <span>Ksh {(item.quantity * Number(item.unitPrice)).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No recent orders found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
