import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import apiClient from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import useSWR from "swr"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  serviceId: z.string().min(1, "Service is required"),
  staffId: z.string().optional(),
  status: z.string(),
  notes: z.string().optional()
})

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment?: any // if editing
  selectedSlot?: { start: Date, end: Date } | null
  onSuccess: () => void
}

export function AppointmentModal({ isOpen, onClose, appointment, selectedSlot, onSuccess }: AppointmentModalProps) {
  const currentBranch = useAuthStore(state => state.currentBranch)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!appointment

  const { data: customers } = useSWR("/api/v1/customers")
  const { data: services } = useSWR("/api/v1/services")
  const { data: staff } = useSWR(currentBranch ? `/api/v1/users?branchId=${currentBranch.id}` : null) // Assuming users endpoint exists

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      serviceId: "",
      staffId: "",
      status: "booked",
      notes: ""
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        form.reset({
          customerId: appointment.customerId || "",
          serviceId: appointment.serviceId || "",
          staffId: appointment.staffId || "",
          status: appointment.status || "booked",
          notes: appointment.notes || ""
        })
      } else {
        form.reset({
          customerId: "",
          serviceId: "",
          staffId: "",
          status: "booked",
          notes: ""
        })
      }
    }
  }, [isOpen, appointment, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentBranch) return

    try {
      setIsSubmitting(true)

      // Calculate endTime based on service duration if it's a new appointment
      let startTime = appointment?.startTime || selectedSlot?.start || new Date()
      let endTime = appointment?.endTime || selectedSlot?.end
      
      if (!appointment && !selectedSlot?.end && values.serviceId) {
        const service = services?.find((s: any) => s.id === values.serviceId)
        if (service) {
          endTime = new Date(startTime)
          endTime.setMinutes(endTime.getMinutes() + service.durationMinutes)
        }
      }

      const payload = {
        ...values,
        branchId: currentBranch.id,
        startTime: startTime.toISOString(),
        endTime: endTime?.toISOString() || new Date(startTime.getTime() + 30*60000).toISOString(),
      }

      if (isEditing) {
        await apiClient.patch(`/api/v1/appointments/${appointment.id}?branchId=${currentBranch.id}`, payload)
      } else {
        await apiClient.post("/api/v1/appointments", payload)
      }
      
      onSuccess()
    } catch (error) {
      console.error("Failed to save appointment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!currentBranch || !appointment) return
    if (!confirm("Are you sure you want to cancel/delete this appointment?")) return

    try {
      setIsSubmitting(true)
      await apiClient.delete(`/api/v1/appointments/${appointment.id}?branchId=${currentBranch.id}`)
      onSuccess()
    } catch (error) {
      console.error("Failed to delete appointment", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Appointment" : "New Appointment"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services?.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.durationMinutes}m)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="staffId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff Member (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "unassigned"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Any Available" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="unassigned">Any Available</SelectItem>
                      {staff?.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "booked"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no-show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="flex justify-between items-center w-full mt-6">
              {isEditing ? (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  Delete
                </Button>
              ) : (
                <div />
              )}
              
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
