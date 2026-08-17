"use client";

import { useState } from "react";
import { usePosStore } from "@/stores/pos-store";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, CreditCard, Banknote, Loader2, Phone } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { ReceiptModal } from "./receipt-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function CartPanel() {
  const cart = usePosStore((state) => state.cart);
  const updateQuantity = usePosStore((state) => state.updateQuantity);
  const removeFromCart = usePosStore((state) => state.removeFromCart);
  const clearCart = usePosStore((state) => state.clearCart);
  const getSubtotal = usePosStore((state) => state.getSubtotal);
  const getTaxTotal = usePosStore((state) => state.getTaxTotal);
  const getTotal = usePosStore((state) => state.getTotal);

  const subtotal = getSubtotal();
  const taxTotal = getTaxTotal();
  const total = getTotal();

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // M-Pesa State
  const [isMpesaPromptOpen, setIsMpesaPromptOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);

  const handleCashCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const payload = {
        branchId: "default-branch", 
        type: "sale",
        discountAmount: 0,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          tax: item.price * item.quantity * (item.taxRate / 100),
          discount: 0,
        })),
        payments: [{
          method: "cash",
          amount: total,
        }]
      };

      const res = await apiClient.post("/orders", payload);
      setCompletedOrder(res.data);
      setIsReceiptOpen(true);
      clearCart();
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Failed to process order.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMpesaInitiate = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      alert("Please enter a valid phone number");
      return;
    }

    setIsProcessing(true);
    setPollingStatus("Initiating STK Push...");

    try {
      // 1. Create a Pending Order first
      const orderPayload = {
        branchId: "default-branch", 
        type: "sale",
        discountAmount: 0,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          tax: item.price * item.quantity * (item.taxRate / 100),
          discount: 0,
        }))
        // Note: No immediate payments array here, we rely on M-Pesa
      };
      
      const orderRes = await apiClient.post("/orders", orderPayload);
      const orderId = orderRes.data.id;
      setCompletedOrder(orderRes.data); // Save reference

      // 2. Trigger M-Pesa STK Push
      const pushPayload = {
        branchId: "default-branch",
        orderId: orderId,
        phone: phoneNumber,
        amount: total,
      };

      await apiClient.post("/mpesa/stk-push", pushPayload);
      
      setPollingStatus("Waiting for Customer to input PIN...");

      // For MVP: Polling every 5 seconds to check if order status is 'completed'
      // In production, use WebSockets or Server-Sent Events
      const pollInterval = setInterval(async () => {
        try {
          const checkRes = await apiClient.get(`/orders/${orderId}`);
          if (checkRes.data.status === 'completed') {
            clearInterval(pollInterval);
            setPollingStatus(null);
            setIsMpesaPromptOpen(false);
            setCompletedOrder(checkRes.data);
            setIsReceiptOpen(true);
            clearCart();
            setIsProcessing(false);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 5000);

      // Stop polling after 60 seconds (M-Pesa timeout)
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isProcessing) {
          setPollingStatus("Payment timed out. Please check Daraja logs or try again.");
          setIsProcessing(false);
        }
      }, 60000);

    } catch (error: any) {
      console.error("M-Pesa Failed:", error);
      alert(error?.response?.data?.message || "Failed to initiate M-Pesa");
      setPollingStatus(null);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="w-96 flex flex-col border-l bg-card h-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between shrink-0">
          <h2 className="font-bold text-lg">Current Order</h2>
          <Button variant="ghost" size="sm" onClick={clearCart} disabled={cart.length === 0}>
            Clear
          </Button>
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-10">
              <p>Cart is empty</p>
              <p className="text-sm">Scan or select products to add</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-start border-b pb-3">
                  <div className="flex-1 mr-2">
                    <h4 className="text-sm font-medium leading-none mb-1">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Ksh {item.price.toLocaleString()} each
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className="font-semibold text-sm">
                      Ksh {(item.price * item.quantity).toLocaleString()}
                    </span>
                    <div className="flex items-center border rounded-md h-8">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-full w-8 px-0"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-full w-8 px-0"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Totals & Checkout */}
        <div className="p-4 bg-muted/30 border-t shrink-0">
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>Ksh {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT</span>
              <span>Ksh {taxTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg text-primary">
                Ksh {total.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full" 
              disabled={cart.length === 0 || isProcessing}
              onClick={handleCashCheckout}
            >
              {isProcessing && !isMpesaPromptOpen ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Banknote className="w-4 h-4 mr-2" />} 
              Cash
            </Button>
            <Button 
              size="lg" 
              className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white" 
              disabled={cart.length === 0 || isProcessing}
              onClick={() => setIsMpesaPromptOpen(true)}
            >
              <Phone className="w-4 h-4 mr-2" /> 
              M-Pesa
            </Button>
          </div>
        </div>
      </div>

      {/* M-Pesa Prompt Dialog */}
      <Dialog open={isMpesaPromptOpen} onOpenChange={(open) => !isProcessing && setIsMpesaPromptOpen(open)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Lipa Na M-Pesa</DialogTitle>
            <DialogDescription>
              Enter the customer's phone number to send an STK push to their phone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="07XX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            
            {pollingStatus && (
              <div className="p-4 bg-muted text-center rounded-md flex flex-col items-center">
                <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
                <p className="text-sm font-medium">{pollingStatus}</p>
                <p className="text-xs text-muted-foreground mt-1">Please do not close this window.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsMpesaPromptOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMpesaInitiate}
              disabled={isProcessing || !phoneNumber}
              className="bg-[#4CAF50] hover:bg-[#45a049] text-white"
            >
              Send Prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptModal 
        open={isReceiptOpen} 
        onOpenChange={setIsReceiptOpen} 
        order={completedOrder} 
      />
    </>
  );
}
