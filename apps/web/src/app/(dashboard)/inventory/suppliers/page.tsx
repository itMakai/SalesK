"use client"

import { useState } from "react"
import { Plus, Search, MapPin, Phone, Mail, FileText } from "lucide-react"
import useSWR from "swr"

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
import { SupplierModal } from "@/components/inventory/supplier-modal"

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)

  const { data: suppliers, isLoading, mutate } = useSWR('/api/v1/suppliers')

  const filteredSuppliers = suppliers?.filter((s: any) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your vendors and supply chain partners.
          </p>
        </div>
        <Button onClick={() => {
          setEditingSupplier(null)
          setIsModalOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="hidden md:block border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier: any, index: number) => (
                <TableRow 
                  key={supplier.id} 
                  className="cursor-pointer hover:bg-muted/50 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
                  style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
                  onClick={() => {
                    setEditingSupplier(supplier)
                    setIsModalOpen(true)
                  }}
                >
                  <TableCell>
                    <div className="font-medium">{supplier.name}</div>
                    {supplier.taxPin && <div className="text-xs text-muted-foreground mt-1">PIN: {supplier.taxPin}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="w-3 h-3 mr-2" /> {supplier.phone}
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Mail className="w-3 h-3 mr-2" /> {supplier.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {supplier.address ? (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-2" />
                        <span className="truncate max-w-[200px]">{supplier.address}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                      {supplier.status}
                    </Badge>
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
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">No suppliers found.</div>
        ) : (
          filteredSuppliers.map((supplier: any, index: number) => (
            <div 
              key={supplier.id} 
              className="bg-card border rounded-lg p-4 shadow-sm flex flex-col space-y-3 cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
              style={{ animationDelay: `${Math.min(index * 50, 1000)}ms` }}
              onClick={() => {
                setEditingSupplier(supplier)
                setIsModalOpen(true)
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-lg">{supplier.name}</div>
                  {supplier.taxPin && <div className="text-xs text-muted-foreground">PIN: {supplier.taxPin}</div>}
                </div>
                <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                  {supplier.status}
                </Badge>
              </div>
              
              <div className="border-t border-white/5 pt-3 space-y-2 text-sm text-slate-300">
                {supplier.phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" /> {supplier.phone}
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-muted-foreground" /> {supplier.email}
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" /> {supplier.address}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <SupplierModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        supplier={editingSupplier}
        onSuccess={() => {
          setIsModalOpen(false)
          mutate()
        }}
      />
    </div>
  )
}
