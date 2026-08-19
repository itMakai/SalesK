import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import useSWR from "swr"
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
import { Switch } from "@/components/ui/switch"

const branchPricingItemSchema = z.object({
  branchId: z.string(),
  branchName: z.string().optional(),
  price: z.coerce.number().min(0),
  isAvailable: z.boolean(),
})

const formSchema = z.object({
  branchPricing: z.array(branchPricingItemSchema),
})

interface BranchPricingModalProps {
  isOpen: boolean
  onClose: () => void
  product: any
  onSuccess: () => void
}

export function BranchPricingModal({ isOpen, onClose, product, onSuccess }: BranchPricingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: branches } = useSWR('/api/v1/branches')

  const form = useForm<z.input<typeof formSchema>, any, z.output<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      branchPricing: [],
    },
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: "branchPricing",
  })

  useEffect(() => {
    if (isOpen && product && branches) {
      // Map existing branch pricing from the product, defaulting to base price if not set
      const initialPricing = branches.map((branch: any) => {
        const existing = product.branchPricing?.find((bp: any) => bp.branchId === branch.id)
        return {
          branchId: branch.id,
          branchName: branch.name,
          price: existing ? Number(existing.price) : Number(product.basePrice),
          isAvailable: existing ? existing.isAvailable : true,
        }
      })
      
      form.reset({ branchPricing: initialPricing })
    }
  }, [isOpen, product, branches, form])

  const onSubmit = async (values: z.output<typeof formSchema>) => {
    if (!product) return

    try {
      setIsSubmitting(true)
      await apiClient.patch(`/products/${product.id}/branch-pricing`, values.branchPricing)
      onSuccess()
    } catch (error) {
      console.error("Failed to update branch pricing:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Branch Pricing: {product?.name}</DialogTitle>
          <DialogDescription>
            Override the base price (KES {product?.basePrice}) and availability for specific branches.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{form.getValues(`branchPricing.${index}.branchName`)}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <FormField
                      control={form.control}
                      name={`branchPricing.${index}.price`}
                      render={({ field: inputField }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormLabel className="text-xs text-muted-foreground m-0">KES</FormLabel>
                          <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                className="w-24 h-8 text-right" 
                                {...inputField}
                                value={typeof inputField.value === "number" ? inputField.value : ""}
                                onChange={(e) => inputField.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                              />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`branchPricing.${index}.isAvailable`}
                      render={({ field: switchField }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Switch 
                              checked={switchField.value} 
                              onCheckedChange={switchField.onChange} 
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Pricing"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
