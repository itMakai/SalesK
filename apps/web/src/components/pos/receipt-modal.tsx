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
import { Printer, Send, Loader2, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAuthStore } from "@/stores/auth-store";

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any | null;
}

export function ReceiptModal({ open, onOpenChange, order }: ReceiptModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [smsStatus, setSmsStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const currentBranch = useAuthStore((state) => state.currentBranch);
  const [business, setBusiness] = useState<{ name?: string; phone?: string; email?: string; logo?: string }>({});

  const money = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  // Wait for the modal to be fully visible before potentially auto-printing
  useEffect(() => {
    if (open && order) {
      setPhoneNumber("");
      setSmsStatus({ type: null, message: "" });
    }
  }, [open, order]);

  useEffect(() => {
    if (open) apiClient.get("/tenant").then((response) => setBusiness(response.data)).catch(console.error);
  }, [open]);

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
            .discount { color: #0f766e; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px;}
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0; font-size:16px;">${business.name || 'Your Business'}</h2>
            ${business.phone ? `<div style="margin-top:5px;">${business.phone}</div>` : ''}
            ${business.email ? `<div>${business.email}</div>` : ''}
            <div style="margin-top:5px;">Branch: ${currentBranch?.name || order.branchId || 'Main'}</div>
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
              <span>${money(order.taxAmount).toLocaleString()}</span>
            </div>
            ${Number(order.discountAmount) > 0 ? `
            <div class="totals-row discount">
              <span>Discount:</span>
              <span>- ${money(order.discountAmount).toLocaleString()}</span>
            </div>
            ` : ""}
            <div class="totals-row">
              <span>Net total:</span>
              <span>${money(order.total).toLocaleString()}</span>
            </div>
            <div class="totals-row bold" style="font-size: 14px; margin-top: 5px;">
              <span>Total:</span>
              <span>${money(order.total).toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0;">Thank you for shopping with us!</p>
            <p style="margin: 5px 0 0 0;">Thank you for your visit.</p>
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
      setSmsStatus({ type: "error", message: getApiErrorMessage(error, "Failed to send SMS.") });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-slate-950 text-white sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-center text-white">
            <Sparkles className="h-4 w-4 text-cyan-300" /> Transaction complete
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-fuchsia-500/20 text-emerald-300">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-cyan-200">Ksh {money(order.total).toLocaleString()}</h3>
            <p className="mt-1 text-sm text-slate-400">Order: {order.orderNumber}</p>
          </div>
        </div>

        <div className="flex flex-col space-y-4 mt-2">
          {/* SMS Section */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <Label className="mb-2 block text-sm font-semibold text-slate-300">Digital receipt</Label>
            <div className="flex gap-2">
              <Input 
                type="tel" 
                placeholder="07XX XXX XXX" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isSending}
                className="border-white/10 bg-slate-950/60 text-white placeholder:text-slate-500"
              />
              <Button onClick={handleSendSms} disabled={isSending || !phoneNumber} className="shrink-0 bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-400 hover:to-cyan-400">
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send SMS
              </Button>
            </div>
            {smsStatus.message && (
              <p className={`mt-2 text-xs font-medium ${smsStatus.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>
                {smsStatus.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="lg" className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print Receipt
            </Button>
            <Button size="lg" className="flex-1 bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-950 hover:from-emerald-400 hover:to-lime-400" onClick={() => onOpenChange(false)}>
              New Sale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
