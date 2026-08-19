"use client";

import { useState, useEffect } from "react";
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
import { apiClient } from "@/lib/api-client";

interface ThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: any | null;
  onSuccess: () => void;
}

export function ThresholdModal({ isOpen, onClose, inventoryItem, onSuccess }: ThresholdModalProps) {
  const [threshold, setThreshold] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (inventoryItem) {
      setThreshold(inventoryItem.lowStockThreshold?.toString() || "");
    }
  }, [inventoryItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryItem) return;

    setIsSubmitting(true);
    try {
      await apiClient.patch(`/inventory/${inventoryItem.product.id}/${inventoryItem.branch.id}/threshold`, {
        lowStockThreshold: threshold ? parseFloat(threshold) : null,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update threshold", error);
      alert("Failed to update threshold. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Low Stock Alert</DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-muted-foreground">
          Alert me when stock for <strong>{inventoryItem?.product.name}</strong> at <strong>{inventoryItem?.branch.name}</strong> drops to or below this level.
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="threshold">Low Stock Threshold</Label>
            <Input
              id="threshold"
              type="number"
              step="any"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g. 10 (Leave blank to disable)"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Alert Level"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
