"use client"

import { useState } from "react"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import useSWR from "swr"
import { useAuthStore } from "@/stores/auth-store"
import { AppointmentModal } from "@/components/salon/appointment-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

const locales = {
  "en-US": enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export default function CalendarPage() {
  const currentBranch = useAuthStore((state) => state.currentBranch)
  const { data: appointments, mutate } = useSWR(currentBranch ? `/api/v1/appointments?branchId=${currentBranch.id}` : null)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [selectedSlot, setSelectedSlot] = useState<{start: Date, end: Date} | null>(null)

  const events = appointments?.map((apt: any) => ({
    id: apt.id,
    title: `${apt.service?.name || 'Appointment'} - ${apt.customer?.name || 'Guest'}`,
    start: new Date(apt.startTime),
    end: new Date(apt.endTime),
    resource: apt,
  })) || []

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedAppointment(null)
    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end })
    setIsModalOpen(true)
  }

  const handleSelectEvent = (event: any) => {
    setSelectedSlot(null)
    setSelectedAppointment(event.resource)
    setIsModalOpen(true)
  }

  const eventStyleGetter = (event: any) => {
    const status = event.resource.status
    let backgroundColor = "#3174ad"
    
    if (status === 'completed') backgroundColor = "#10b981"
    else if (status === 'no-show') backgroundColor = "#ef4444"
    else if (status === 'confirmed') backgroundColor = "#8b5cf6"
    else if (status === 'cancelled') backgroundColor = "#6b7280"

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-sm text-muted-foreground">
            Manage your salon and clinic bookings.
          </p>
        </div>
        <Button onClick={() => { setSelectedAppointment(null); setSelectedSlot(null); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Book Appointment
        </Button>
      </div>

      <div className="flex-1 bg-card rounded-lg border p-4 shadow-sm min-h-[600px]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="week"
        />
      </div>

      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={selectedAppointment}
        selectedSlot={selectedSlot}
        onSuccess={() => {
          setIsModalOpen(false)
          mutate()
        }}
      />
    </div>
  )
}
