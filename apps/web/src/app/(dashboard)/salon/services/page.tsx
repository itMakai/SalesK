"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Clock } from "lucide-react"
import useSWR from "swr"
import apiClient from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { ServiceModal } from "@/components/salon/service-modal"

export default function ServicesPage() {
  const currentBranch = useAuthStore((state) => state.currentBranch)
  // Services are global to the tenant, but we can fetch them simply via GET /services 
  // since the tenantId is derived from the JWT
  const { data: services, mutate } = useSWR("/api/v1/services")
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)

  const openModal = (service: any = null) => {
    setSelectedService(service)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return
    try {
      await apiClient.delete(`/api/v1/services/${id}`)
      mutate()
    } catch (err) {
      console.error("Failed to delete service", err)
    }
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Manage the list of services you offer to clients.
          </p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" /> Add Service
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services?.map((service: any) => (
          <div key={service.id} className="p-4 border rounded-lg bg-card shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{service.name}</h3>
              <div className="font-bold text-primary">Ksh {service.price.toLocaleString()}</div>
            </div>
            {service.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                {service.description}
              </p>
            )}
            <div className="flex items-center text-sm text-muted-foreground mt-auto pt-4 border-t">
              <Clock className="w-4 h-4 mr-2" />
              {service.durationMinutes} mins
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => openModal(service)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(service.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {services?.length === 0 && (
          <div className="col-span-full p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            No services configured. Click "Add Service" to get started.
          </div>
        )}
      </div>

      <ServiceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={selectedService}
        onSuccess={() => {
          setIsModalOpen(false)
          mutate()
        }}
      />
    </div>
  )
}
