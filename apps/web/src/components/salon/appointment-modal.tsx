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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CalendarDays, Check, Clock3, Scissors, Sparkles, UserRound } from "lucide-react"

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
  const [scheduledAt, setScheduledAt] = useState("")
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
  const selectedService = services?.find((service: any) => service.id === form.watch("serviceId"))
  const selectedStaff = staff?.find((member: any) => member.id === form.watch("staffId"))

  useEffect(() => {
    if (isOpen) {
      const appointmentStart = appointment?.startTime || selectedSlot?.start || new Date()
      setScheduledAt(formatDateTimeLocal(new Date(appointmentStart)))
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

      // Keep the finish time aligned with the selected treatment when a duration is configured.
      let startTime = scheduledAt ? new Date(scheduledAt) : (appointment?.startTime || selectedSlot?.start || new Date())
      let endTime = appointment?.endTime || selectedSlot?.end
      const service = services?.find((item: any) => item.id === values.serviceId)
      if (service?.durationMinutes) {
        endTime = new Date(startTime)
        endTime.setMinutes(endTime.getMinutes() + service.durationMinutes)
      }

      const payload = {
        ...values,
        staffId: values.staffId === "unassigned" ? undefined : values.staffId || undefined,
        branchId: currentBranch.id,
        startTime: startTime.toISOString(),
        endTime: endTime?.toISOString() || new Date(startTime.getTime() + 30*60000).toISOString(),
      }

      if (isEditing) {
        await apiClient.patch(`/appointments/${appointment.id}?branchId=${currentBranch.id}`, payload)
      } else {
        await apiClient.post("/appointments", payload)
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
      await apiClient.delete(`/appointments/${appointment.id}?branchId=${currentBranch.id}`)
      onSuccess()
    } catch (error) {
      console.error("Failed to delete appointment", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border/70 bg-background p-0 sm:max-w-4xl">
        <DialogHeader>
          <div className="border-b bg-gradient-to-br from-primary/12 via-background to-violet-500/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">{isEditing ? "Refine appointment" : "Smart appointment booking"}</DialogTitle>
                <p className="mt-1 text-sm text-muted-foreground">Choose the client, treatment, specialist, and time in one focused flow.</p>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-0 md:grid-cols-[1fr_280px]">
            <div className="space-y-5 px-6 py-5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">1</span>
                Appointment details
              </div>
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                    <SelectTrigger className="h-11">
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
                    <SelectTrigger className="h-11">
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
                    <SelectTrigger className="h-11">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="appointment-time" className="text-sm font-medium">Date & time</label>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="appointment-time" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="h-11 pl-10" />
                </div>
              </div>
              <div className="rounded-xl border bg-muted/35 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4 text-primary" /> Expected duration</div>
                <p className="mt-1 text-sm text-muted-foreground">{selectedService ? `${selectedService.durationMinutes} minutes` : "Select a service to calculate"}</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking notes <span className="font-normal text-muted-foreground">(optional)</span></FormLabel>
                  <FormControl><Textarea {...field} placeholder="Treatment preferences, clinical notes, allergies, or arrival instructions…" className="min-h-20 resize-none" /></FormControl>
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

            <DialogFooter className="flex items-center justify-between border-t pt-5">
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
            </div>

            <aside className="border-t bg-muted/25 px-6 py-5 md:border-l md:border-t-0">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground"><Check className="h-4 w-4 text-emerald-500" /> Booking preview</div>
              <div className="mt-5 space-y-4">
                <PreviewRow icon={Scissors} label="Service" value={selectedService?.name || "Choose a service"} detail={selectedService ? `${selectedService.durationMinutes} min · Ksh ${Number(selectedService.price || 0).toLocaleString()}` : undefined} />
                <PreviewRow icon={UserRound} label="Specialist" value={selectedStaff ? `${selectedStaff.firstName} ${selectedStaff.lastName}` : "First available"} />
                <PreviewRow icon={CalendarDays} label="When" value={scheduledAt ? formatBookingDate(scheduledAt) : "Choose a time"} detail={scheduledAt ? formatBookingTime(scheduledAt) : undefined} />
              </div>
              <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
                The appointment length and finish time adjust automatically when you change the service.
              </div>
            </aside>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function PreviewRow({ icon: Icon, label, value, detail }: { icon: typeof Scissors; label: string; value: string; detail?: string }) {
  return <div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm"><Icon className="h-4 w-4 text-primary" /></div><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="truncate text-sm font-medium">{value}</p>{detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}</div></div>
}

function formatDateTimeLocal(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000
  return new Date(value.getTime() - offset).toISOString().slice(0, 16)
}

function formatBookingDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date(value))
}

function formatBookingTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value))
}
