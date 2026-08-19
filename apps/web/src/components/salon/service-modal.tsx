import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import apiClient from "@/lib/api-client"

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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be >= 0"),
  durationMinutes: z.coerce.number().min(5, "Duration must be at least 5 mins"),
})

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  service?: any
  onSuccess: () => void
}

export function ServiceModal({ isOpen, onClose, service, onSuccess }: ServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!service

  const form = useForm<z.input<typeof formSchema>, any, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      durationMinutes: 30,
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (service) {
        form.reset({
          name: service.name,
          description: service.description || "",
          price: service.price,
          durationMinutes: service.durationMinutes,
        })
      } else {
        form.reset({
          name: "",
          description: "",
          price: 0,
          durationMinutes: 30,
        })
      }
    }
  }, [isOpen, service, form])

  const onSubmit = async (values: z.output<typeof formSchema>) => {
    try {
      setIsSubmitting(true)
      if (isEditing) {
        await apiClient.patch(`/services/${service.id}`, values)
      } else {
        await apiClient.post("/services", values)
      }
      onSuccess()
    } catch (error) {
      console.error("Failed to save service:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Service" : "Add Service"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Haircut" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (Ksh)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} value={typeof field.value === "number" ? field.value : ""} onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Mins)</FormLabel>
                    <FormControl>
                      <Input type="number" min="5" step="5" {...field} value={typeof field.value === "number" ? field.value : ""} onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
