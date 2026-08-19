"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Settings, Trash2, Users } from "lucide-react"
import useSWR from "swr"
import apiClient from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableModal } from "@/components/restaurant/table-modal"

export default function FloorPlanPage() {
  const currentBranch = useAuthStore((state) => state.currentBranch)
  const { data: tables, mutate } = useSWR(currentBranch ? `/api/v1/tables?branchId=${currentBranch.id}` : null)
  
  const [activeSection, setActiveSection] = useState<string>("Main Dining")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<any>(null)
  
  // Dragging state
  const [draggingTable, setDraggingTable] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Derive unique sections
  const sections = Array.from(new Set(tables?.map((t: any) => t.section || "Main Dining") || []))
  if (sections.length === 0) sections.push("Main Dining")
  
  // Ensure activeSection is valid
  useEffect(() => {
    if (sections.length > 0 && !sections.includes(activeSection)) {
      setActiveSection(sections[0])
    }
  }, [sections, activeSection])

  const visibleTables = tables?.filter((t: any) => (t.section || "Main Dining") === activeSection) || []

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent, table: any) => {
    // Only drag on left click and not on buttons
    if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    
    setDraggingTable(table.id)
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    
    // Capture pointer to document body so we can drag outside the element bounds
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingTable || !containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    
    let newX = e.clientX - containerRect.left - dragOffset.x
    let newY = e.clientY - containerRect.top - dragOffset.y
    
    // Snap to grid (e.g. 20px)
    newX = Math.round(newX / 20) * 20
    newY = Math.round(newY / 20) * 20
    
    // Bounds check
    newX = Math.max(0, Math.min(newX, containerRect.width - 100))
    newY = Math.max(0, Math.min(newY, containerRect.height - 100))
    
    // Optimistic update
    mutate((prev: any) => {
      if (!prev) return prev
      return prev.map((t: any) => 
        t.id === draggingTable ? { ...t, posX: newX, posY: newY } : t
      )
    }, false)
  }

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (!draggingTable) return
    
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    const tableId = draggingTable
    setDraggingTable(null)
    
    // Find the updated table to save its new position
    const table = tables?.find((t: any) => t.id === tableId)
    if (table) {
      try {
        await apiClient.patch(`/api/v1/tables/${table.id}`, {
          posX: table.posX,
          posY: table.posY
        })
      } catch (error) {
        console.error("Failed to save table position", error)
        mutate() // Revert on error
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-red-100 border-red-500 text-red-900'
      case 'reserved': return 'bg-yellow-100 border-yellow-500 text-yellow-900'
      default: return 'bg-green-100 border-green-500 text-green-900'
    }
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Floor Plan Editor</h1>
          <p className="text-sm text-muted-foreground">
            Manage your restaurant tables and layout.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={activeSection} onValueChange={setActiveSection}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { setSelectedTable(null); setIsModalOpen(true); }} disabled={!currentBranch}>
            <Plus className="w-4 h-4 mr-2" /> Add Table
          </Button>
        </div>
      </div>

      <div 
        className="flex-1 border-2 border-dashed rounded-lg bg-muted/10 relative overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle, #00000020 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {visibleTables.map((table: any) => (
          <div
            key={table.id}
            onPointerDown={(e) => handlePointerDown(e, table)}
            style={{
              position: 'absolute',
              left: table.posX || 0,
              top: table.posY || 0,
              touchAction: 'none'
            }}
            className={`w-24 h-24 rounded-lg border-2 shadow-sm flex flex-col items-center justify-center cursor-move transition-shadow hover:shadow-md ${getStatusColor(table.status)} ${draggingTable === table.id ? 'opacity-80 scale-105 z-50 shadow-xl' : 'z-10'}`}
          >
            <span className="font-bold text-lg">{table.name}</span>
            <div className="flex items-center text-xs mt-1 opacity-70">
              <Users className="w-3 h-3 mr-1" />
              {table.capacity}
            </div>
            
            <div className="absolute top-1 right-1 opacity-0 hover:opacity-100 transition-opacity flex space-x-1">
              <button 
                className="p-1 bg-background/80 rounded-full hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedTable(table)
                  setIsModalOpen(true)
                }}
              >
                <Settings className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <TableModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        table={selectedTable}
        currentSection={activeSection}
        branchId={currentBranch?.id}
        onSuccess={() => {
          setIsModalOpen(false)
          mutate()
        }}
      />
    </div>
  )
}
