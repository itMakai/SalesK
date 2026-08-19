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

const poItemSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z.coerce.number().min(0.001, "Quantity must be greater than 0"),
  unitCost: z.coerce.number().min(0, "Cost must be greater than 0"),
})

const formSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(poItemSchema).min(1, "Add at least one item"),
})

interface PurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  branchId?: string
}

export function PurchaseOrderModal({ isOpen, onClose, onSuccess, branchId }: PurchaseOrderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: suppliers } = useSWR('/api/v1/suppliers')
  const { data: products } = useSWR('/api/v1/products')

  const form = useForm<z.input<typeof formSchema>, any, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: "",
      expectedDate: "",
      notes: "",
      items: [{ productId: "", quantity: 1, unitCost: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        supplierId: "",
        expectedDate: "",
        notes: "",
        items: [{ productId: "", quantity: 1, unitCost: 0 }],
      })
    }
  }, [isOpen, form])

  const onSubmit = async (values: z.output<typeof formSchema>) => {
    if (!branchId) return

    try {
      setIsSubmitting(true)
      await apiClient.post("/purchase-orders", {
        branchId,
        ...values,
      })
      onSuccess()
    } catch (error) {
      console.error("Failed to create PO:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper to auto-fill cost price when product is selected
  const handleProductSelect = (index: number, productId: string) => {
    const product = products?.find((p: any) => p.id === productId)
    if (product) {
      form.setValue(`items.${index}.unitCost`, Number(product.costPrice) || 0)
    }
  }

  const calculateTotal = () => {
    return form.getValues().items.reduce((total, item) => {
      return total + (Number(item.quantity) * Number(item.unitCost) || 0)
    }, 0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Raise a new purchase order to restock inventory.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value ?? "")} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers?.map((s: any) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Delivery Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Order Items</FormLabel>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => append({ productId: "", quantity: 1, unitCost: 0 })}
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
                        <FormLabel className="text-xs">Product</FormLabel>
                          <Select 
                          onValueChange={(val) => {
                            const selectedValue = val ?? ""
                            selectField.onChange(selectedValue)
                            handleProductSelect(index, selectedValue)
                          }} 
                            value={typeof selectField.value === "string" ? selectField.value : ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products?.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                      <FormItem className="w-24">
                        <FormLabel className="text-xs">Qty</FormLabel>
                        <FormControl>
                          <Input type="number" min="0.001" step="any" {...inputField} value={typeof inputField.value === "number" ? inputField.value : ""} onChange={(e) => inputField.onChange(e.target.value === "" ? "" : Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.unitCost`}
                    render={({ field: inputField }) => (
                      <FormItem className="w-32">
                        <FormLabel className="text-xs">Unit Cost</FormLabel>
                        <FormControl>
                            <Input type="number" min="0" step="any" {...inputField} value={typeof inputField.value === "number" ? inputField.value : ""} onChange={(e) => inputField.onChange(e.target.value === "" ? "" : Number(e.target.value))} />
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

            <div className="flex justify-end p-4 bg-muted/50 rounded-md">
              <div className="text-right">
                <span className="text-sm text-muted-foreground">Estimated Total</span>
                <div className="text-2xl font-bold">
                  {calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Delivery instructions..." 
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
                {isSubmitting ? "Creating..." : "Create PO"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
