"use client"

import { useState, useEffect } from "react"
import { Clock, CheckCircle, ChefHat, Play } from "lucide-react"
import { io, Socket } from "socket.io-client"
import { formatDistanceToNow } from "date-fns"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import apiClient from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"

type KdsItem = {
  id: string
  productName: string
  quantity: number
  modifiers: any[]
  notes: string | null
  kdsStatus: string
}

type KdsOrder = {
  id: string
  orderNumber: string
  type: string
  createdAt: string
  table?: { name: string }
  items: KdsItem[]
}

export default function KDSPage() {
  const currentBranch = useAuthStore((state) => state.currentBranch)
  const token = useAuthStore((state) => state.token)
  
  const [orders, setOrders] = useState<KdsOrder[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // Timer for updating "Time elapsed" every minute
  const [, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!currentBranch) return

    // 1. Fetch initial active items
    const fetchActiveItems = async () => {
      try {
        const res = await apiClient.get(`/orders/kds/active?branchId=${currentBranch.id}`)
        setOrders(res.data)
      } catch (err) {
        console.error("Failed to fetch KDS items", err)
      }
    }
    fetchActiveItems()

    // 2. Connect WebSocket
    // Derive WS URL from API URL or fallback to localhost
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || `http://${hostname}:4000`
    const newSocket = io(`${apiUrl}/kds`, {
      query: { branchId: currentBranch.id },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    })

    newSocket.on("connect", () => {
      setIsConnected(true)
    })

    newSocket.on("disconnect", () => {
      setIsConnected(false)
    })

    newSocket.on("new_order", (order: KdsOrder) => {
      // Filter out non-kitchen items if any (simplified)
      const kitchenItems = order.items.filter((item: any) => item.product?.category?.isKitchen)
      if (kitchenItems.length > 0) {
        order.items = kitchenItems
        setOrders(prev => [...prev, order])
      }
    })

    newSocket.on("item_status_updated", (data: { orderId: string, orderItemId: string, status: string }) => {
      setOrders(prev => {
        return prev.map(order => {
          if (order.id !== data.orderId) return order
          
          const updatedItems = order.items.map(item => 
            item.id === data.orderItemId ? { ...item, kdsStatus: data.status } : item
          )
          
          return { ...order, items: updatedItems }
        }).filter(order => order.items.some(item => item.kdsStatus !== 'served')) // Remove orders that are fully served
      })
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [currentBranch, token])

  const updateItemStatus = (orderItemId: string, status: string) => {
    if (socket && isConnected) {
      socket.emit("update_item_status", {
        orderItemId,
        status,
        branchId: currentBranch?.id
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'ready': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100'
    }
  }

  if (!currentBranch) {
    return <div className="p-8 text-center text-muted-foreground">Please select a branch.</div>
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ChefHat className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Kitchen Display</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">{isConnected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex space-x-4 h-full items-start min-w-max">
          {orders.length === 0 ? (
            <div className="w-full text-center p-12 text-muted-foreground border-2 border-dashed rounded-lg">
              No active orders in the kitchen.
            </div>
          ) : (
            orders.map(order => {
              const elapsed = formatDistanceToNow(new Date(order.createdAt), { addSuffix: false })
              const isUrgent = (new Date().getTime() - new Date(order.createdAt).getTime()) > 15 * 60000 // 15 mins
              
              return (
                <Card key={order.id} className={`w-[320px] flex-shrink-0 ${isUrgent ? 'border-red-400 border-2' : ''}`}>
                  <CardHeader className={`py-3 ${isUrgent ? 'bg-red-50' : 'bg-muted/50'}`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-bold flex items-center">
                        {order.table?.name || order.type}
                      </CardTitle>
                      <div className="flex items-center text-xs text-muted-foreground font-medium">
                        <Clock className="w-3 h-3 mr-1" />
                        {elapsed}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Order: {order.orderNumber}</div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ul className="divide-y">
                      {order.items.map(item => (
                        <li key={item.id} className={`p-4 ${item.kdsStatus === 'ready' ? 'opacity-50 bg-green-50/50' : ''}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-start space-x-2">
                              <span className="font-bold text-lg">{Number(item.quantity)}x</span>
                              <div>
                                <p className={`font-semibold ${item.kdsStatus === 'ready' ? 'line-through' : ''}`}>
                                  {item.productName}
                                </p>
                                {item.modifiers && item.modifiers.length > 0 && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {item.modifiers.map((m: any) => m.name).join(', ')}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="text-xs text-orange-600 font-medium mt-1 uppercase">
                                    ** {item.notes} **
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <Badge variant="outline" className={getStatusColor(item.kdsStatus)}>
                              {item.kdsStatus.toUpperCase()}
                            </Badge>
                            
                            <div className="flex space-x-2">
                              {item.kdsStatus === 'pending' && (
                                <Button size="sm" variant="outline" onClick={() => updateItemStatus(item.id, 'preparing')}>
                                  <Play className="w-3 h-3 mr-1" /> Start
                                </Button>
                              )}
                              {item.kdsStatus === 'preparing' && (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateItemStatus(item.id, 'ready')}>
                                  <CheckCircle className="w-3 h-3 mr-1" /> Ready
                                </Button>
                              )}
                              {item.kdsStatus === 'ready' && (
                                <Button size="sm" variant="ghost" onClick={() => updateItemStatus(item.id, 'served')}>
                                  Serve
                                </Button>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
