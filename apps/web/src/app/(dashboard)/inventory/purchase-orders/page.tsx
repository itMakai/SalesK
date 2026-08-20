"use client"

import { useState } from "react"
import { Plus, Search, Calendar, DollarSign, Package } from "lucide-react"
import useSWR from "swr"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PurchaseOrderModal } from "@/components/inventory/po-modal"
import apiClient from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"

export default function PurchaseOrdersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const currentBranch = useAuthStore((state) => state.currentBranch)

  const { data: pos, isLoading, mutate } = useSWR(
    currentBranch ? `/api/v1/purchase-orders?branchId=${currentBranch.id}` : null
  )

  const filteredPOs = pos?.filter((po: any) => 
    po.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/purchase-orders/${id}/status`, { status })
      mutate()
    } catch (error) {
      console.error("Failed to update status", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'draft': return <Badge variant="secondary">Draft</Badge>
      case 'ordered': return <Badge variant="default" className="bg-blue-500">Ordered</Badge>
      case 'received': return <Badge variant="default" className="bg-green-500">Received</Badge>
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage procurement and incoming stock.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} disabled={!currentBranch}>
          <Plus className="w-4 h-4 mr-2" />
          Create PO
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search POs..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="hidden md:block border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Expected Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredPOs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No purchase orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPOs.map((po: any, index: number) => (
                <TableRow 
                  key={po.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                  style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
                >
                  <TableCell className="font-medium">
                    {po.orderNumber}
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(po.createdAt), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>{po.supplier?.name}</TableCell>
                  <TableCell>
                    {po.expectedDate ? (
                      <div className="flex items-center text-sm">
                        <Calendar className="w-3 h-3 mr-2 text-muted-foreground" />
                        {format(new Date(po.expectedDate), 'MMM d, yyyy')}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center font-medium">
                      <DollarSign className="w-3 h-3 mr-1 text-muted-foreground" />
                      {po.totalAmount}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(po.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    {po.status === 'draft' && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(po.id, 'ordered')}>
                        Mark Ordered
                      </Button>
                    )}
                    {po.status === 'ordered' && (
                      <Button variant="default" size="sm" onClick={() => updateStatus(po.id, 'received')} className="bg-green-600 hover:bg-green-700">
                        <Package className="w-3 h-3 mr-2" /> Receive Stock
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">Loading...</div>
        ) : filteredPOs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">No purchase orders found.</div>
        ) : (
          filteredPOs.map((po: any, index: number) => (
            <div 
              key={po.id} 
              className="bg-card border rounded-lg p-4 shadow-sm flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">{po.orderNumber}</div>
                  <div className="text-sm text-muted-foreground">{format(new Date(po.createdAt), 'MMM d, yyyy')}</div>
                </div>
                {getStatusBadge(po.status)}
              </div>
              
              <div className="border-t border-white/5 pt-3 space-y-2">
                <div className="flex items-center text-sm text-slate-300">
                  <span className="font-medium mr-2">Supplier:</span> {po.supplier?.name}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    {po.expectedDate ? format(new Date(po.expectedDate), 'MMM d, yyyy') : '-'}
                  </div>
                  <div className="font-bold text-cyan-600 dark:text-cyan-400">
                    <DollarSign className="w-3 h-3 inline-block" />{po.totalAmount}
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-white/5 pt-3">
                {po.status === 'draft' && (
                  <Button variant="outline" size="sm" onClick={() => updateStatus(po.id, 'ordered')}>
                    Mark Ordered
                  </Button>
                )}
                {po.status === 'ordered' && (
                  <Button variant="default" size="sm" onClick={() => updateStatus(po.id, 'received')} className="bg-green-600 hover:bg-green-700">
                    <Package className="w-3 h-3 mr-2" /> Receive Stock
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <PurchaseOrderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false)
          mutate()
        }}
        branchId={currentBranch?.id}
      />
    </div>
  )
}
