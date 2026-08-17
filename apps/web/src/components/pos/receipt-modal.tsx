"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer } from "lucide-react";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any | null;
}

export function ReceiptModal({ open, onOpenChange, order }: ReceiptModalProps) {
  // Wait for the modal to be fully visible before potentially auto-printing
  useEffect(() => {
    if (open && order) {
      // Could automatically trigger print here, but better to let user click "Print"
    }
  }, [open, order]);

  if (!order) return null;

  const handlePrint = () => {
    // A simple window.print() triggered on a special print-only layout 
    // or by popping a new window. For simplicity in this POS:
    // We can open a minimal print window with the receipt HTML.
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const itemsHtml = order.items.map((item: any) => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <div>
          <div>${item.productName}</div>
          <div style="font-size: 12px; color: #666;">${item.quantity} x ${Number(item.unitPrice).toLocaleString()}</div>
        </div>
        <div>${Number(item.total).toLocaleString()}</div>
      </div>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Receipt ${order.orderNumber}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; font-size: 14px; padding: 20px; max-width: 300px; margin: 0 auto; color: #000; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .totals { margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .bold { font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Biashara POS</h2>
            <div>Branch: ${order.branchId}</div>
            <div>Order: ${order.orderNumber}</div>
            <div>Date: ${new Date(order.createdAt).toLocaleString()}</div>
          </div>
          
          <div class="items">
            ${itemsHtml}
          </div>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>${Number(order.subtotal).toLocaleString()}</span>
            </div>
            <div class="totals-row">
              <span>VAT:</span>
              <span>${Number(order.taxAmount).toLocaleString()}</span>
            </div>
            <div class="totals-row bold" style="font-size: 16px;">
              <span>Total:</span>
              <span>${Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for shopping with us!</p>
          </div>
          
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center">Transaction Complete</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold">Ksh {Number(order.total).toLocaleString()}</h3>
          <p className="text-sm text-muted-foreground">Order: {order.orderNumber}</p>
        </div>

        <div className="flex flex-col space-y-2 mt-4">
          <Button size="lg" className="w-full" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print Receipt
          </Button>
          <Button variant="outline" size="lg" className="w-full" onClick={() => onOpenChange(false)}>
            New Sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
