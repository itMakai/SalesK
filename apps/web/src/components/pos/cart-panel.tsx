"use client";

import { useState } from "react";
import { usePosStore } from "@/stores/pos-store";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, CreditCard, Banknote, Loader2, Phone, SplitSquareHorizontal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { ReceiptModal } from "./receipt-modal";
import { SplitPaymentModal } from "./split-payment-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";

export function CartPanel() {
  const [branchId, setBranchId] = useState<string>("default-branch");

  useEffect(() => {
    // Fetch user's branches and select the first one as active to avoid 400 errors
    apiClient.get("/branches").then(res => {
      if (res.data && res.data.length > 0) {
        setBranchId(res.data[0].id);
      }
    }).catch(console.error);
  }, []);
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

  // Paystack State
  const [isPaystackPromptOpen, setIsPaystackPromptOpen] = useState(false);
  const [paystackEmail, setPaystackEmail] = useState("");

  // Split Payment State
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  // --- Common Order Creation ---
  const createOrder = async (payments?: any[]) => {
    const payload: any = {
      branchId: branchId, 
      type: "sale",
      discountAmount: 0,
      items: cart.map(item => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.price),
        tax: Number(item.price) * item.quantity * (item.taxRate / 100),
        discount: 0,
      }))
    };
    if (payments) payload.payments = payments;
    
    const res = await apiClient.post("/orders", payload);
    return res.data;
  };

  const handleCashCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const order = await createOrder([{ method: "cash", amount: total }]);
      setCompletedOrder(order);
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
      const order = await createOrder();
      setCompletedOrder(order); // Save reference

      await apiClient.post("/payments/mpesa/stk-push", { // Adjust route if needed, was /mpesa/stk-push
        branchId: branchId,
        orderId: order.id,
        phone: phoneNumber,
        amount: total,
      });
      
      setPollingStatus("Waiting for Customer to input PIN...");

      const pollInterval = setInterval(async () => {
        try {
          const checkRes = await apiClient.get(`/orders/${order.id}`);
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

  const handlePaystackInitiate = async () => {
    if (!paystackEmail || !paystackEmail.includes('@')) {
      alert("Please enter a valid email");
      return;
    }
    setIsProcessing(true);

    try {
      const order = await createOrder();
      const res = await apiClient.post("/payments/paystack/charge", {
        branchId: branchId,
        orderId: order.id,
        email: paystackEmail,
        amount: total,
      });

      // Redirect to PayStack checkout URL
      if (res.data.authorizationUrl) {
        window.open(res.data.authorizationUrl, '_blank');
        
        setPollingStatus("Waiting for Card Payment...");
        const pollInterval = setInterval(async () => {
          try {
            const checkRes = await apiClient.get(`/orders/${order.id}`);
            if (checkRes.data.status === 'completed') {
              clearInterval(pollInterval);
              setPollingStatus(null);
              setIsPaystackPromptOpen(false);
              setCompletedOrder(checkRes.data);
              setIsReceiptOpen(true);
              clearCart();
              setIsProcessing(false);
            }
          } catch (e) { }
        }, 5000);

        setTimeout(() => {
          clearInterval(pollInterval);
          if (isProcessing) {
            setPollingStatus("Payment timed out or cancelled.");
            setIsProcessing(false);
          }
        }, 300000); // 5 mins
      }
    } catch (error: any) {
      console.error("Paystack Failed:", error);
      alert(error?.response?.data?.message || "Failed to initiate Paystack");
      setIsProcessing(false);
    }
  };

  const handleProcessSplit = async (payments: any[]) => {
    setIsProcessing(true);
    try {
      const order = await createOrder();
      setCompletedOrder(order);

      // Process each payment method
      for (const p of payments) {
        if (p.method === 'cash') {
          await apiClient.post("/payments/cash", {
            orderId: order.id,
            branchId: branchId,
            amount: p.amount,
          });
        } else if (p.method === 'mpesa') {
          await apiClient.post("/payments/mpesa/stk-push", {
            branchId: branchId,
            orderId: order.id,
            phone: p.phone,
            amount: p.amount,
          });
          // Note: In a real flow with Split, you'd have to manage multiple async gateways gracefully.
        } else if (p.method === 'card') {
          const res = await apiClient.post("/payments/paystack/charge", {
            branchId: "default-branch",
            orderId: order.id,
            email: p.email,
            amount: p.amount,
          });
          if (res.data.authorizationUrl) {
            window.open(res.data.authorizationUrl, '_blank');
          }
        }
      }

      // Start polling for order completion if M-Pesa or Card was used
      const hasAsync = payments.some(p => p.method !== 'cash');
      if (hasAsync) {
        // Simple polling for MVP
        const pollInterval = setInterval(async () => {
          try {
            const checkRes = await apiClient.get(`/orders/${order.id}`);
            if (checkRes.data.status === 'completed') {
              clearInterval(pollInterval);
              setIsSplitModalOpen(false);
              setCompletedOrder(checkRes.data);
              setIsReceiptOpen(true);
              clearCart();
              setIsProcessing(false);
            }
          } catch (e) { }
        }, 5000);

        setTimeout(() => {
          clearInterval(pollInterval);
          setIsProcessing(false);
        }, 60000);
      } else {
        // Only cash was used
        setIsSplitModalOpen(false);
        setIsReceiptOpen(true);
        clearCart();
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Split payment failed:", error);
      alert("Failed to process split payment.");
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="w-[400px] flex flex-col border-l bg-card h-full">
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
                      <Button variant="ghost" size="icon" className="h-full w-8 px-0" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-full w-8 px-0" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
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

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button size="lg" variant="outline" className="w-full" disabled={cart.length === 0 || isProcessing} onClick={handleCashCheckout}>
              {isProcessing && !isMpesaPromptOpen && !isPaystackPromptOpen && !isSplitModalOpen ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Banknote className="w-4 h-4 mr-2" />} 
              Cash
            </Button>
            <Button size="lg" className="w-full bg-[#4CAF50] hover:bg-[#45a049] text-white" disabled={cart.length === 0 || isProcessing} onClick={() => setIsMpesaPromptOpen(true)}>
              <Phone className="w-4 h-4 mr-2" /> 
              M-Pesa
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button size="lg" className="w-full bg-[#0BA4DB] hover:bg-[#098bba] text-white" disabled={cart.length === 0 || isProcessing} onClick={() => setIsPaystackPromptOpen(true)}>
              <CreditCard className="w-4 h-4 mr-2" /> 
              Card
            </Button>
            <Button size="lg" variant="secondary" className="w-full border-primary text-primary hover:bg-primary/10" disabled={cart.length === 0 || isProcessing} onClick={() => setIsSplitModalOpen(true)}>
              <SplitSquareHorizontal className="w-4 h-4 mr-2" /> 
              Split
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
              <Input id="phone" type="tel" placeholder="07XX XXX XXX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isProcessing} />
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
            <Button variant="outline" onClick={() => setIsMpesaPromptOpen(false)} disabled={isProcessing}>Cancel</Button>
            <Button onClick={handleMpesaInitiate} disabled={isProcessing || !phoneNumber} className="bg-[#4CAF50] hover:bg-[#45a049] text-white">Send Prompt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PayStack Prompt Dialog */}
      <Dialog open={isPaystackPromptOpen} onOpenChange={(open) => !isProcessing && setIsPaystackPromptOpen(open)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pay by Card</DialogTitle>
            <DialogDescription>
              Enter customer email to initiate PayStack checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Customer Email</Label>
              <Input id="email" type="email" placeholder="customer@example.com" value={paystackEmail} onChange={(e) => setPaystackEmail(e.target.value)} disabled={isProcessing} />
            </div>
            {pollingStatus && (
              <div className="p-4 bg-muted text-center rounded-md flex flex-col items-center">
                <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
                <p className="text-sm font-medium">{pollingStatus}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaystackPromptOpen(false)} disabled={isProcessing}>Cancel</Button>
            <Button onClick={handlePaystackInitiate} disabled={isProcessing || !paystackEmail} className="bg-[#0BA4DB] hover:bg-[#098bba] text-white">Charge Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Split Payment Modal */}
      <SplitPaymentModal
        open={isSplitModalOpen}
        onOpenChange={setIsSplitModalOpen}
        totalAmount={total}
        onProcessSplit={handleProcessSplit}
        isProcessing={isProcessing}
      />

      <ReceiptModal 
        open={isReceiptOpen} 
        onOpenChange={setIsReceiptOpen} 
        order={completedOrder} 
      />
    </>
  );
}
