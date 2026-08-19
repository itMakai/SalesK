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
      await apiClient.patch(`/api/v1/purchase-orders/${id}/status`, { status })
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

      <div className="border rounded-md">
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
              filteredPOs.map((po: any) => (
                <TableRow key={po.id}>
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
