"use client"

import { useState } from "react"
import { Plus, Search, ArrowRight, Truck } from "lucide-react"
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
import { TransferModal } from "@/components/inventory/transfer-modal"
import apiClient from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"

export default function StockTransfersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const currentBranch = useAuthStore((state) => state.currentBranch)

  const { data: transfers, isLoading, mutate } = useSWR(
    currentBranch ? `/api/v1/stock-transfers?branchId=${currentBranch.id}` : null
  )

  const filteredTransfers = transfers?.filter((t: any) => 
    t.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.fromBranch?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.toBranch?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/stock-transfers/${id}/status`, { status })
      mutate()
    } catch (error) {
      console.error("Failed to update status", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <Badge variant="secondary">Pending</Badge>
      case 'shipped': return <Badge variant="default" className="bg-blue-500">Shipped</Badge>
      case 'received': return <Badge variant="default" className="bg-green-500">Received</Badge>
      case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Transfers</h1>
          <p className="text-sm text-muted-foreground">
            Move inventory between branches.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} disabled={!currentBranch}>
          <Plus className="w-4 h-4 mr-2" />
          New Transfer
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transfers..."
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
              <TableHead>Transfer Ref</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredTransfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No stock transfers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransfers.map((t: any, index: number) => {
                const isSource = t.fromBranchId === currentBranch?.id;
                const isDest = t.toBranchId === currentBranch?.id;

                return (
                  <TableRow 
                    key={t.id}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                    style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
                  >
                    <TableCell className="font-medium">
                      {t.transferNumber}
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(t.createdAt), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm ${isSource ? 'font-bold' : ''}`}>{t.fromBranch?.name}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-sm ${isDest ? 'font-bold' : ''}`}>{t.toBranch?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {t.items?.length || 0} items
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(t.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.status === 'pending' && isSource && (
                        <Button variant="outline" size="sm" onClick={() => updateStatus(t.id, 'shipped')}>
                          <Truck className="w-3 h-3 mr-2" /> Ship Items
                        </Button>
                      )}
                      {t.status === 'shipped' && isDest && (
                        <Button variant="default" size="sm" onClick={() => updateStatus(t.id, 'received')} className="bg-green-600 hover:bg-green-700">
                          Receive Items
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">Loading...</div>
        ) : filteredTransfers.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">No stock transfers found.</div>
        ) : (
          filteredTransfers.map((t: any, index: number) => {
            const isSource = t.fromBranchId === currentBranch?.id;
            const isDest = t.toBranchId === currentBranch?.id;

            return (
              <div 
                key={t.id} 
                className="bg-card border rounded-lg p-4 shadow-sm flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-lg">{t.transferNumber}</div>
                    <div className="text-sm text-muted-foreground">{format(new Date(t.createdAt), 'MMM d, yyyy')}</div>
                  </div>
                  {getStatusBadge(t.status)}
                </div>
                
                <div className="flex items-center space-x-2 text-sm bg-muted/30 p-2 rounded-md">
                  <span className={`${isSource ? 'font-bold' : ''}`}>{t.fromBranch?.name}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className={`${isDest ? 'font-bold' : ''}`}>{t.toBranch?.name}</span>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div className="text-sm text-muted-foreground">{t.items?.length || 0} items</div>
                  <div>
                    {t.status === 'pending' && isSource && (
                      <Button variant="outline" size="sm" onClick={() => updateStatus(t.id, 'shipped')}>
                        <Truck className="w-3 h-3 mr-2" /> Ship Items
                      </Button>
                    )}
                    {t.status === 'shipped' && isDest && (
                      <Button variant="default" size="sm" onClick={() => updateStatus(t.id, 'received')} className="bg-green-600 hover:bg-green-700">
                        Receive Items
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <TransferModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false)
          mutate()
        }}
        currentBranchId={currentBranch?.id}
      />
    </div>
  )
}
