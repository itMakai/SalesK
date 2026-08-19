"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: any | null;
  onSuccess: () => void;
}

export function StockAdjustmentModal({ isOpen, onClose, inventoryItem, onSuccess }: StockAdjustmentModalProps) {
  const [type, setType] = useState("adjustment");
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryItem) return;

    setIsSubmitting(true);
    try {
      // For types that reduce stock, quantity should be negative in the backend if we want decrement
      // Wait, the backend does `quantity: { increment: dto.quantity }`
      // So if it's a deduction (e.g. sale, transfer_out), we should send a negative value.
      const numQuantity = parseFloat(quantity);
      const isDeduction = ["sale", "transfer_out", "return_to_supplier", "loss"].includes(type);
      const finalQuantity = isDeduction ? -Math.abs(numQuantity) : Math.abs(numQuantity);

      await apiClient.post(`/inventory/${inventoryItem.product.id}/${inventoryItem.branch.id}/movement`, {
        type,
        quantity: finalQuantity,
        reference,
        notes,
      });

      onSuccess();
      onClose();
      // Reset form
      setQuantity("");
      setReference("");
      setNotes("");
      setType("adjustment");
    } catch (error) {
      console.error("Failed to adjust stock", error);
      alert("Failed to adjust stock. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock: {inventoryItem?.product.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Movement Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase">Purchase (Stock In)</SelectItem>
                <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                <SelectItem value="transfer_in">Transfer In</SelectItem>
                <SelectItem value="transfer_out">Transfer Out</SelectItem>
                <SelectItem value="loss">Loss / Damage</SelectItem>
                <SelectItem value="return_to_supplier">Return to Supplier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity Change</Label>
            <Input
              id="quantity"
              type="number"
              step="any"
              min="0.01"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 10"
            />
            <p className="text-xs text-muted-foreground">
              Enter the positive amount. It will be added or subtracted based on the type.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reference">Reference (Optional)</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PO number, Waybill, etc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for adjustment"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Record Movement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
