import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import useSWR from "swr"
import { Plus, Trash2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const transferItemSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.coerce.number().min(0.001, "Quantity must be greater than 0"),
})

const formSchema = z.object({
  toBranchId: z.string().min(1, "Destination branch is required"),
  notes: z.string().optional(),
  items: z.array(transferItemSchema).min(1, "Add at least one item"),
})

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentBranchId?: string
}

export function TransferModal({ isOpen, onClose, onSuccess, currentBranchId }: TransferModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: branches } = useSWR('/api/v1/branches')
  const { data: inventory } = useSWR(currentBranchId ? `/api/v1/inventory?branchId=${currentBranchId}` : null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toBranchId: "",
      notes: "",
      items: [{ productId: "", quantity: 1 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        toBranchId: "",
        notes: "",
        items: [{ productId: "", quantity: 1 }],
      })
    }
  }, [isOpen, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!currentBranchId) return

    try {
      setIsSubmitting(true)
      await apiClient.post("/api/v1/stock-transfers", {
        fromBranchId: currentBranchId,
        ...values,
      })
      onSuccess()
    } catch (error) {
      console.error("Failed to create Transfer:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter out current branch from destinations
  const destinationBranches = branches?.filter((b: any) => b.id !== currentBranchId) || []

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Stock Transfer</DialogTitle>
          <DialogDescription>
            Move items from your current location to another branch.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="toBranchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination Branch *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {destinationBranches.map((b: any) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Transfer Items</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => append({ productId: "", quantity: 1 })}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md bg-muted/20">
                  <FormField
                    control={form.control}
                    name={`items.${index}.productId`}
                    render={({ field: selectField }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Inventory Item</FormLabel>
                        <Select onValueChange={selectField.onChange} value={selectField.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select item to transfer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {inventory?.map((inv: any) => (
                              <SelectItem key={inv.productId} value={inv.productId}>
                                {inv.product.name} (In Stock: {inv.quantity} {inv.product.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field: inputField }) => (
                      <FormItem className="w-32">
                        <FormLabel className="text-xs">Qty to Transfer</FormLabel>
                        <FormControl>
                          <Input type="number" min="0.001" step="any" {...inputField} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0 mb-0.5"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {form.formState.errors.items?.root && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.items.root.message}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes / Reason</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Why is this transfer happening?" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Transfer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
