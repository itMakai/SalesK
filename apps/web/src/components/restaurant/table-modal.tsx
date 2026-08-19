import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import apiClient from "@/lib/api-client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  name: z.string().min(1, "Table name is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  section: z.string().optional(),
})

interface TableModalProps {
  isOpen: boolean
  onClose: () => void
  table?: any
  currentSection?: string
  branchId?: string
  onSuccess: () => void
}

export function TableModal({ isOpen, onClose, table, currentSection, branchId, onSuccess }: TableModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!table

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      capacity: 4,
      section: currentSection || "Main Dining",
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (table) {
        form.reset({
          name: table.name,
          capacity: table.capacity,
          section: table.section || "Main Dining",
        })
      } else {
        form.reset({
          name: "",
          capacity: 4,
          section: currentSection || "Main Dining",
        })
      }
    }
  }, [isOpen, table, currentSection, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!branchId) return

    try {
      setIsSubmitting(true)
      
      if (isEditing) {
        await apiClient.patch(`/api/v1/tables/${table.id}`, values)
      } else {
        await apiClient.post("/api/v1/tables", {
          branchId,
          ...values,
          posX: 0,
          posY: 0,
        })
      }
      
      onSuccess()
    } catch (error) {
      console.error("Failed to save table:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this table?")) return
    try {
      setIsSubmitting(true)
      await apiClient.delete(`/api/v1/tables/${table.id}`)
      onSuccess()
    } catch (error) {
      console.error("Failed to delete table:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Table" : "Add Table"}</DialogTitle>
          <DialogDescription>
            Configure table details for your floor plan.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Name/Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. T1, Bar 1, Patio 5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (Seats)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Main Dining" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
