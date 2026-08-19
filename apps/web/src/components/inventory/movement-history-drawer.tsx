"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { apiClient } from "@/lib/api-client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface MovementHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItem: any | null;
}

export function MovementHistoryDrawer({ isOpen, onClose, inventoryItem }: MovementHistoryDrawerProps) {
  const [movements, setMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && inventoryItem) {
      loadHistory();
    } else {
      setMovements([]);
    }
  }, [isOpen, inventoryItem]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/inventory/${inventoryItem.product.id}/${inventoryItem.branch.id}`);
      setMovements(res.data?.movements || []);
    } catch (error) {
      console.error("Failed to load movement history", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type: string, quantity: string | number) => {
    const num = Number(quantity);
    if (num > 0) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (num < 0) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  const formatType = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Movement History</SheetTitle>
          <SheetDescription>
            {inventoryItem?.product.name} at {inventoryItem?.branch.name}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 flex flex-col h-[calc(100vh-140px)]">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Loading history...
            </div>
          ) : movements.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              No movements recorded yet.
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {movements.map((movement) => (
                  <div key={movement.id} className="relative pl-6 before:absolute before:left-2 before:top-2 before:h-full before:w-[2px] before:bg-border last:before:h-0">
                    <div className="absolute left-[3px] top-[6px] h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {formatType(movement.type)}
                        </span>
                        <Badge variant="outline" className={getTypeColor(movement.type, movement.quantity)}>
                          {Number(movement.quantity) > 0 ? "+" : ""}{movement.quantity}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(movement.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                      {(movement.reference || movement.notes) && (
                        <div className="mt-2 rounded-md bg-muted p-2 text-xs text-muted-foreground">
                          {movement.reference && <p className="font-medium text-foreground">Ref: {movement.reference}</p>}
                          {movement.notes && <p>{movement.notes}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
