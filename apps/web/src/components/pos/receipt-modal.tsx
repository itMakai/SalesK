"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Send, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any | null;
}

export function ReceiptModal({ open, onOpenChange, order }: ReceiptModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [smsStatus, setSmsStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });

  // Wait for the modal to be fully visible before potentially auto-printing
  useEffect(() => {
    if (open && order) {
      setPhoneNumber("");
      setSmsStatus({ type: null, message: "" });
    }
  }, [open, order]);

  if (!order) return null;

  const handlePrint = () => {
    // Generate a new window configured for thermal printing (58mm / 80mm)
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
            @media print {
              @page {
                margin: 0;
              }
              body {
                margin: 0;
              }
            }
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; padding: 10px; max-width: 300px; margin: 0 auto; color: #000; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .totals { margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .bold { font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px;}
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0; font-size:16px;">SalesK</h2>
            <div style="margin-top:5px;">Branch: ${order.branchId || 'Main'}</div>
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
            <div class="totals-row bold" style="font-size: 14px; margin-top: 5px;">
              <span>Total:</span>
              <span>${Number(order.total).toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0;">Thank you for shopping with us!</p>
            <p style="margin: 5px 0 0 0;">Powered by SalesK</p>
          </div>
          
          <script>
            window.onload = function() { 
              window.print();
              // Close window after print dialog is closed
              setTimeout(function() { window.close(); }, 500); 
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleSendSms = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      setSmsStatus({ type: "error", message: "Enter a valid phone number" });
      return;
    }
    
    setIsSending(true);
    setSmsStatus({ type: null, message: "" });
    
    try {
      await apiClient.post(`/receipts/${order.id}/send`, {
        branchId: order.branchId || "default-branch",
        phone: phoneNumber
      });
      setSmsStatus({ type: "success", message: "Receipt sent successfully!" });
      setPhoneNumber("");
    } catch (error: any) {
      console.error(error);
      setSmsStatus({ type: "error", message: "Failed to send SMS." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center">Transaction Complete</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-primary">Ksh {Number(order.total).toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground mt-1">Order: {order.orderNumber}</p>
          </div>
        </div>

        <div className="flex flex-col space-y-4 mt-2">
          {/* SMS Section */}
          <div className="bg-muted/30 p-4 rounded-lg border">
            <Label className="text-sm font-semibold mb-2 block text-muted-foreground">Digital Receipt</Label>
            <div className="flex gap-2">
              <Input 
                type="tel" 
                placeholder="07XX XXX XXX" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isSending}
              />
              <Button onClick={handleSendSms} disabled={isSending || !phoneNumber} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send SMS
              </Button>
            </div>
            {smsStatus.message && (
              <p className={`text-xs mt-2 font-medium ${smsStatus.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {smsStatus.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="lg" className="w-full flex-1" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print Receipt
            </Button>
            <Button size="lg" className="w-full flex-1" onClick={() => onOpenChange(false)}>
              New Sale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
