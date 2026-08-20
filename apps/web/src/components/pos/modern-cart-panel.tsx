"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import {
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  Minus,
  Phone,
  Printer,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  SplitSquareHorizontal,
  Ticket,
  Trash2,
  Undo2,
  Wallet,
  X,
} from "lucide-react";

import { useAuthStore } from "@/stores/auth-store";
import { usePosStore } from "@/stores/pos-store";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReceiptModal } from "./receipt-modal";
import { SplitPaymentModal } from "./split-payment-modal";

const normalizeList = (value: any) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  return [];
};

const paymentButtons = [
  {
    key: "cash",
    label: "Cash",
    className: "bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-950 hover:from-emerald-400 hover:to-lime-400",
    icon: Banknote,
  },
  {
    key: "mpesa",
    label: "M-Pesa",
    className: "bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-400",
    icon: Phone,
  },
  {
    key: "card",
    label: "Card",
    className: "bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-400 hover:to-cyan-400",
    icon: CreditCard,
  },
] as const;

export function ModernCartPanel() {
  const user = useAuthStore((state) => state.user);

  const branchId = usePosStore((state) => state.branchId);
  const setBranchId = usePosStore((state) => state.setBranchId);
  const cart = usePosStore((state) => state.cart);
  const updateQuantity = usePosStore((state) => state.updateQuantity);
  const removeFromCart = usePosStore((state) => state.removeFromCart);
  const clearCart = usePosStore((state) => state.clearCart);
  const addToCart = usePosStore((state) => state.addToCart);
  const getSubtotal = usePosStore((state) => state.getSubtotal);
  const getTaxTotal = usePosStore((state) => state.getTaxTotal);
  const getTotal = usePosStore((state) => state.getTotal);
  const selectedCustomerId = usePosStore((state) => state.selectedCustomerId);
  const selectedTableId = usePosStore((state) => state.selectedTableId);
  const redeemedPoints = usePosStore((state) => state.redeemedPoints);
  const setSelectedCustomerId = usePosStore((state) => state.setSelectedCustomerId);
  const setSelectedTableId = usePosStore((state) => state.setSelectedTableId);
  const setRedeemedPoints = usePosStore((state) => state.setRedeemedPoints);
  const promotion = usePosStore((state) => state.promotion);
  const applyPromotion = usePosStore((state) => state.applyPromotion);
  const clearPromotion = usePosStore((state) => state.clearPromotion);
  const suspendedTickets = usePosStore((state) => state.suspendedTickets);
  const suspendCurrentTicket = usePosStore((state) => state.suspendCurrentTicket);
  const resumeTicket = usePosStore((state) => state.resumeTicket);
  const removeSuspendedTicket = usePosStore((state) => state.removeSuspendedTicket);
  const ticketManagerOpen = usePosStore((state) => state.ticketManagerOpen);
  const setTicketManagerOpen = usePosStore((state) => state.setTicketManagerOpen);
  const shiftSession = usePosStore((state) => state.shiftSession);
  const shiftDrawerOpen = usePosStore((state) => state.shiftDrawerOpen);
  const setShiftDrawerOpen = usePosStore((state) => state.setShiftDrawerOpen);
  const openShift = usePosStore((state) => state.openShift);
  const closeShift = usePosStore((state) => state.closeShift);

  const subtotal = getSubtotal();
  const taxTotal = getTaxTotal();
  const total = getTotal();

  const { data: customersData } = useSWR("/api/v1/customers");
  const { data: tablesData } = useSWR(branchId ? `/api/v1/tables?branchId=${branchId}` : null);
  const { data: ordersData, mutate: mutateOrders } = useSWR(branchId ? `/api/v1/orders?branchId=${branchId}` : null);

  const customers = useMemo(() => normalizeList(customersData), [customersData]);
  const tables = useMemo(() => normalizeList(tablesData), [tablesData]);
  const recentOrders = useMemo(() => normalizeList(ordersData).slice(0, 8), [ordersData]);
  const selectedCustomer = customers.find((customer: any) => customer.id === selectedCustomerId);

  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const [ticketLabel, setTicketLabel] = useState("");
  const [ticketNotes, setTicketNotes] = useState("");

  const [promotionCode, setPromotionCode] = useState("");

  const [openingFloat, setOpeningFloat] = useState("");
  const [countedCash, setCountedCash] = useState("");
  const [shiftNotes, setShiftNotes] = useState("");

  const [isMpesaPromptOpen, setIsMpesaPromptOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);

  const [isPaystackPromptOpen, setIsPaystackPromptOpen] = useState(false);
  const [paystackEmail, setPaystackEmail] = useState("");

  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);

  useEffect(() => {
    apiClient.get("/branches")
      .then((response) => {
        const branches = normalizeList(response.data);
        const activeBranch = branches.find((branch: any) => branch.isActive) || branches[0];
        if (activeBranch?.id) {
          setBranchId(activeBranch.id);
        }
      })
      .catch((error) => {
        setStatusMessage({ type: "error", message: getApiErrorMessage(error, "Unable to load branch settings.") });
      });
  }, [setBranchId]);

  const createOrder = async (payments?: any[]) => {
    if (cart.length === 0) {
      return null;
    }

    const discountAmount = redeemedPoints + (promotion.amount || 0);
    const payload: Record<string, any> = {
      branchId,
      type: selectedTableId ? "dine_in" : "sale",
      tableId: selectedTableId || undefined,
      customerId: selectedCustomerId || undefined,
      discountAmount,
      redeemedPoints,
      notes: [
        promotion.code ? `Promo ${promotion.code}` : null,
        shiftSession?.id ? `Shift ${shiftSession.id}` : null,
      ].filter(Boolean).join(" | ") || undefined,
      items: cart.map((item) => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.price),
        tax: Number(item.price) * item.quantity * (item.taxRate / 100),
        discount: 0,
        modifiers: item.productData?.modifiers || [],
      })),
    };

    if (payments) {
      payload.payments = payments;
    }

    const response = await apiClient.post("/orders", payload);
    return response.data;
  };

  const finishOrder = (order: any) => {
    setCompletedOrder(order);
    setReceiptOpen(true);
    clearCart();
    setSelectedCustomerId(null);
    setSelectedTableId(null);
    setRedeemedPoints(0);
    clearPromotion();
  };

  const handleCashCheckout = async () => {
    if (cart.length === 0) {
      setStatusMessage({ type: "info", message: "Add items before checking out." });
      return;
    }

    setIsProcessing(true);
    try {
      const order = await createOrder([{ method: "cash", amount: total }]);
      if (order) {
        finishOrder(order);
      }
    } catch (error) {
      setStatusMessage({ type: "error", message: getApiErrorMessage(error, "Cash checkout failed.") });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMpesaInitiate = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      setStatusMessage({ type: "error", message: "Enter a valid phone number for M-Pesa." });
      return;
    }

    setIsProcessing(true);
    setPollingStatus("Initiating STK push...");

    try {
      const order = await createOrder();
      if (!order) {
        return;
      }

      await apiClient.post("/payments/mpesa/stk-push", {
        branchId,
        orderId: order.id,
        phone: phoneNumber,
        amount: total,
      });

      setPollingStatus("Waiting for customer confirmation...");

      const pollInterval = window.setInterval(async () => {
        try {
          const checkRes = await apiClient.get(`/orders/${order.id}`);
          if (checkRes.data.status === "completed") {
            window.clearInterval(pollInterval);
            setPollingStatus(null);
            setIsMpesaPromptOpen(false);
            finishOrder(checkRes.data);
            setIsProcessing(false);
          }
        } catch (pollError) {
          console.error("M-Pesa polling error", pollError);
        }
      }, 5000);

      window.setTimeout(() => {
        window.clearInterval(pollInterval);
        setPollingStatus(null);
        setIsProcessing(false);
      }, 60000);
    } catch (error) {
      setStatusMessage({ type: "error", message: getApiErrorMessage(error, "Failed to initiate M-Pesa.") });
      setIsProcessing(false);
      setPollingStatus(null);
    }
  };

  const handlePaystackInitiate = async () => {
    if (!paystackEmail || !paystackEmail.includes("@")) {
      setStatusMessage({ type: "error", message: "Enter a valid customer email for card payment." });
      return;
    }

    setIsProcessing(true);
    try {
      const order = await createOrder();
      if (!order) {
        return;
      }

      const response = await apiClient.post("/payments/paystack/charge", {
        branchId,
        orderId: order.id,
        email: paystackEmail,
        amount: total,
      });

      if (response.data.authorizationUrl) {
        window.open(response.data.authorizationUrl, "_blank", "noopener,noreferrer");
      }

      setPollingStatus("Waiting for card payment...");
      const pollInterval = window.setInterval(async () => {
        try {
          const checkRes = await apiClient.get(`/orders/${order.id}`);
          if (checkRes.data.status === "completed") {
            window.clearInterval(pollInterval);
            setPollingStatus(null);
            setIsPaystackPromptOpen(false);
            finishOrder(checkRes.data);
            setIsProcessing(false);
          }
        } catch (pollError) {
          console.error("Paystack polling error", pollError);
        }
      }, 5000);

      window.setTimeout(() => {
        window.clearInterval(pollInterval);
        setPollingStatus(null);
        setIsProcessing(false);
      }, 300000);
    } catch (error) {
      setStatusMessage({ type: "error", message: getApiErrorMessage(error, "Card payment failed.") });
      setIsProcessing(false);
    }
  };

  const handleProcessSplit = async (payments: any[]) => {
    setIsProcessing(true);
    try {
      const order = await createOrder();
      if (!order) {
        return;
      }

      for (const payment of payments) {
        if (payment.method === "cash") {
          await apiClient.post("/payments/cash", {
            orderId: order.id,
            branchId,
            amount: payment.amount,
          });
        }

        if (payment.method === "mpesa") {
          await apiClient.post("/payments/mpesa/stk-push", {
            branchId,
            orderId: order.id,
            phone: payment.phone,
            amount: payment.amount,
          });
        }

        if (payment.method === "card") {
          await apiClient.post("/payments/paystack/charge", {
            branchId,
            orderId: order.id,
            email: payment.email,
            amount: payment.amount,
          });
        }
      }

      const hasAsync = payments.some((payment) => payment.method !== "cash");
      if (hasAsync) {
        const pollInterval = window.setInterval(async () => {
          try {
            const checkRes = await apiClient.get(`/orders/${order.id}`);
            if (checkRes.data.status === "completed") {
              window.clearInterval(pollInterval);
              setIsSplitModalOpen(false);
              finishOrder(checkRes.data);
              setIsProcessing(false);
            }
          } catch (pollError) {
            console.error("Split payment polling error", pollError);
          }
        }, 5000);

        window.setTimeout(() => {
          window.clearInterval(pollInterval);
          setIsProcessing(false);
        }, 60000);
      } else {
        setIsSplitModalOpen(false);
        finishOrder(order);
        setIsProcessing(false);
      }
    } catch (error) {
      setStatusMessage({ type: "error", message: getApiErrorMessage(error, "Split payment failed.") });
      setIsProcessing(false);
    }
  };

  const handleSuspendTicket = () => {
    if (cart.length === 0) {
      setStatusMessage({ type: "info", message: "There is no active ticket to suspend." });
      return;
    }

    const ticketId = suspendCurrentTicket(ticketLabel, ticketNotes);
    if (ticketId) {
      setTicketLabel("");
      setTicketNotes("");
      setTicketManagerOpen(true);
      setStatusMessage({ type: "success", message: "Ticket suspended and ready for recall." });
    }
  };

  const handleResumeTicket = (ticketId: string) => {
    const restored = resumeTicket(ticketId);
    if (!restored) {
      setStatusMessage({ type: "error", message: "Suspended ticket was not found." });
      return;
    }

    setTicketManagerOpen(false);
    setStatusMessage({ type: "success", message: `Resumed ${restored.label}.` });
  };

  const handleApplyPromotion = () => {
    if (!promotionCode.trim()) {
      setStatusMessage({ type: "error", message: "Enter a promotion code first." });
      return;
    }

    const applied = applyPromotion(promotionCode.trim());
    if (!applied) {
      setStatusMessage({ type: "error", message: "Unknown promotion code." });
      return;
    }

    setPromotionCode("");
    setStatusMessage({ type: "success", message: `${applied.label} applied.` });
  };

  const handleRebuildOrder = (order: any) => {
    if (!Array.isArray(order.items)) {
      setStatusMessage({ type: "error", message: "This order does not have line items to rebuild." });
      return;
    }

    clearCart();
    setSelectedCustomerId(order.customerId || null);
    setSelectedTableId(order.tableId || null);

    order.items.forEach((item: any) => {
      addToCart({
        productId: item.productId,
        name: item.productName,
        price: Number(item.unitPrice),
        quantity: item.quantity,
        taxRate: Number(item.tax) > 0 && Number(item.unitPrice) > 0 ? (Number(item.tax) / (Number(item.unitPrice) * item.quantity)) * 100 : 16,
        productData: item.product,
      });
    });

    setTicketManagerOpen(false);
    setStatusMessage({ type: "success", message: `Rebuilt ${order.orderNumber} into the current ticket.` });
  };

  const handleVoidOrder = async (order: any) => {
    const reason = window.prompt(`Reason for voiding ${order.orderNumber}:`);
    if (!reason) {
      return;
    }

    try {
      await apiClient.patch(`/orders/${order.id}/void`, { reason });
      setStatusMessage({ type: "success", message: `Voided ${order.orderNumber}.` });
      mutateOrders();
    } catch (error) {
      setStatusMessage({ type: "error", message: getApiErrorMessage(error, "Unable to void order.") });
    }
  };

  const handleRefundOrder = async (order: any) => {
    const amountInput = window.prompt(`Refund amount for ${order.orderNumber} (leave blank for full refund):`, String(Number(order.total).toFixed(2)));
    if (amountInput === null) {
      return;
    }

    const amount = amountInput.trim() ? Number(amountInput) : Number(order.total);
    if (Number.isNaN(amount) || amount <= 0) {
      setStatusMessage({ type: "error", message: "Enter a valid refund amount." });
      return;
    }

    const reason = window.prompt(`Reason for refund on ${order.orderNumber}:`) || "Manual refund";

    try {
      await apiClient.post(`/orders/${order.id}/refund`, { amount, reason });
      setStatusMessage({ type: "success", message: `Refunded Ksh ${amount.toLocaleString()} for ${order.orderNumber}.` });
      mutateOrders();
    } catch (error) {
      setStatusMessage({ type: "error", message: getApiErrorMessage(error, "Unable to process refund.") });
    }
  };

  const handleOpenShift = () => {
    const floatValue = Number(openingFloat || 0);
    if (Number.isNaN(floatValue) || floatValue < 0) {
      setStatusMessage({ type: "error", message: "Enter a valid opening cash amount." });
      return;
    }

    openShift(floatValue, `${user?.firstName || "Cashier"} ${user?.lastName || ""}`.trim());
    setOpeningFloat("");
    setStatusMessage({ type: "success", message: "Shift opened successfully." });
  };

  const handleCloseShift = () => {
    const countedValue = Number(countedCash || 0);
    if (Number.isNaN(countedValue) || countedValue < 0) {
      setStatusMessage({ type: "error", message: "Enter a valid counted cash amount." });
      return;
    }

    closeShift(countedValue, shiftNotes);
    setCountedCash("");
    setShiftNotes("");
    setStatusMessage({ type: "success", message: "Shift closed and reconciled locally." });
  };

  const latestStatus = statusMessage ?? (promotion.code ? { type: "info" as const, message: `${promotion.code} is active.` } : null);

  return (
    <>
      <aside className="sticky bottom-0 top-0 flex h-[58dvh] min-h-[420px] w-full shrink-0 flex-col overflow-hidden border-t border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl shadow-cyan-500/5 lg:h-full lg:min-h-0 lg:w-[430px] lg:border-l lg:border-t-0" aria-label="Checkout and payment processing">
        <div className="shrink-0 border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Current Order</p>
              <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">Fast checkout</h2>
              <p className="hidden text-sm text-slate-300 sm:block">Hold, resume, refund, and reconcile without leaving the terminal.</p>
            </div>
            <Button variant="ghost" size="icon" onClick={clearCart} disabled={cart.length === 0}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" className="rounded-full bg-white/10 text-white hover:bg-white/15" onClick={handleSuspendTicket} disabled={cart.length === 0 || isProcessing}>
              <Ticket className="mr-2 h-4 w-4" /> Hold ticket
            </Button>
            <Button variant="secondary" size="sm" className="rounded-full bg-white/10 text-white hover:bg-white/15" onClick={() => setTicketManagerOpen(true)}>
              <RotateCcw className="mr-2 h-4 w-4" /> Tickets
            </Button>
            <Button variant="secondary" size="sm" className="rounded-full bg-white/10 text-white hover:bg-white/15" onClick={() => setShiftDrawerOpen(true)}>
              <Wallet className="mr-2 h-4 w-4" /> Shift
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-slate-200">
              <div className="text-slate-400">Subtotal</div>
              <div className="mt-1 font-semibold">Ksh {subtotal.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-slate-200">
              <div className="text-slate-400">Tax</div>
              <div className="mt-1 font-semibold">Ksh {taxTotal.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-cyan-100">
              <div className="text-cyan-200/70">Total</div>
              <div className="mt-1 font-semibold">Ksh {total.toLocaleString()}</div>
            </div>
          </div>

          {latestStatus && (
            <div className={`mt-4 rounded-2xl border px-3 py-2 text-sm ${latestStatus.type === "error" ? "border-rose-400/20 bg-rose-500/10 text-rose-100" : latestStatus.type === "success" ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100" : "border-cyan-400/20 bg-cyan-500/10 text-cyan-100"}`}>
              {latestStatus.message}
            </div>
          )}
        </div>

        <div className="shrink-0 border-b border-white/10 px-3 py-3 sm:px-4 sm:py-4">
          <div className="grid gap-3">
            <Select value={selectedCustomerId || "walk-in"} onValueChange={(value) => setSelectedCustomerId(value === "walk-in" ? null : value)}>
              <SelectTrigger className="rounded-2xl border-white/10 bg-white/5">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk-in">Walk-in customer</SelectItem>
                {customers.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone ? `(${customer.phone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTableId || "none"} onValueChange={(value) => setSelectedTableId(value === "none" ? null : value)}>
              <SelectTrigger className="rounded-2xl border-white/10 bg-white/5">
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No table / takeaway</SelectItem>
                {tables.map((table: any) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.name} {table.section ? `(${table.section})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input
                placeholder="Promo code"
                value={promotionCode}
                onChange={(event) => setPromotionCode(event.target.value)}
                className="rounded-2xl border-white/10 bg-white/5"
              />
              <Button onClick={handleApplyPromotion} variant="outline" className="rounded-2xl border-cyan-400/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20">
                <Sparkles className="mr-2 h-4 w-4" /> Apply
              </Button>
            </div>

            {promotion.code && (
              <div className="flex items-center justify-between rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                <span>{promotion.label} applied</span>
                <Button variant="ghost" size="sm" onClick={clearPromotion} className="h-7 px-2 text-amber-50 hover:bg-white/10">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {selectedCustomer && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{selectedCustomer.name}</span>
                  <Badge className="rounded-full bg-violet-500/15 text-violet-100 border-violet-400/20">Loyalty</Badge>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {selectedCustomer.phone || "No phone"} · {selectedCustomer.loyaltyPoints || 0} points
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [scrollbar-gutter:stable] sm:px-4 sm:py-4" tabIndex={0} aria-label="Cart items">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/10 bg-white/5 py-16 text-center text-slate-300">
              <ShieldAlert className="h-12 w-12 text-cyan-300/70" />
              <div>
                <p className="text-lg font-semibold text-white">No items in cart</p>
                <p className="text-sm text-slate-400">Scan, search, or tap products to build a ticket.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-lg shadow-cyan-500/5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">{item.name}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        Ksh {Number(item.price).toLocaleString()} each · Tax {item.taxRate}%
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:bg-rose-500/10 hover:text-rose-100" onClick={() => removeFromCart(item.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-2xl border border-white/10 bg-slate-950/50">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-2xl rounded-r-none text-slate-200 hover:bg-white/10" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="min-w-10 px-3 text-center text-sm font-semibold text-white">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none rounded-r-2xl text-slate-200 hover:bg-white/10" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Line total</div>
                      <div className="text-sm font-semibold text-cyan-100">Ksh {(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/10 bg-slate-950/70 px-3 py-3 sm:px-4 sm:py-4">
          <div className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
            <div className="flex items-center justify-between text-slate-400">
              <span>Subtotal</span>
              <span>Ksh {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Tax</span>
              <span>Ksh {taxTotal.toLocaleString()}</span>
            </div>
            {promotion.amount > 0 && (
              <div className="flex items-center justify-between text-amber-200">
                <span>Promotion</span>
                <span>- Ksh {promotion.amount.toLocaleString()}</span>
              </div>
            )}
            {redeemedPoints > 0 && (
              <div className="flex items-center justify-between text-violet-200">
                <span>Loyalty points</span>
                <span>- Ksh {redeemedPoints.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-white/10 pt-2 text-lg font-semibold text-white">
              <span>Total</span>
              <span className="text-cyan-300">Ksh {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {paymentButtons.map((button) => {
              const Icon = button.icon;
              if (button.key === "cash") {
                return (
                  <Button key={button.key} size="lg" className={button.className} disabled={cart.length === 0 || isProcessing} onClick={handleCashCheckout}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Icon className="mr-2 h-4 w-4" />}
                    {button.label}
                  </Button>
                );
              }

              if (button.key === "mpesa") {
                return (
                  <Button key={button.key} size="lg" className={button.className} disabled={cart.length === 0 || isProcessing} onClick={() => setIsMpesaPromptOpen(true)}>
                    <Icon className="mr-2 h-4 w-4" />
                    {button.label}
                  </Button>
                );
              }

              return (
                <Button key={button.key} size="lg" className={button.className} disabled={cart.length === 0 || isProcessing} onClick={() => setIsPaystackPromptOpen(true)}>
                  <Icon className="mr-2 h-4 w-4" />
                  {button.label}
                </Button>
              );
            })}
            <Button size="lg" variant="secondary" className="col-span-2 border border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20" disabled={cart.length === 0 || isProcessing} onClick={() => setIsSplitModalOpen(true)}>
              <SplitSquareHorizontal className="mr-2 h-4 w-4" /> Split payment
            </Button>
          </div>
        </div>
      </aside>

      <Dialog open={ticketManagerOpen} onOpenChange={setTicketManagerOpen}>
        <DialogContent className="max-w-5xl border-white/10 bg-slate-950 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <RotateCcw className="h-5 w-5 text-cyan-300" /> Ticket manager
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Recall held tickets, rebuild previous orders, or process refunds and voids from one screen.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-white">Suspended tickets</h3>
                <Badge className="rounded-full bg-cyan-500/15 text-cyan-100 border-cyan-400/20">{suspendedTickets.length}</Badge>
              </div>
              <ScrollArea className="h-[320px] pr-3">
                <div className="space-y-3">
                  {suspendedTickets.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                      No held tickets right now.
                    </div>
                  ) : (
                    suspendedTickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-white">{ticket.label}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                              <span>{ticket.items.length} items</span>
                              <span>Held {format(new Date(ticket.createdAt), "HH:mm")}</span>
                            </div>
                          </div>
                          <Badge className="rounded-full bg-violet-500/15 text-violet-100 border-violet-400/20">Held</Badge>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" className="rounded-full bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => handleResumeTicket(ticket.id)}>
                            Resume
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full border-white/10 bg-transparent text-slate-100 hover:bg-white/5" onClick={() => removeSuspendedTicket(ticket.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-white">Recent orders</h3>
                <Badge className="rounded-full bg-emerald-500/15 text-emerald-100 border-emerald-400/20">{recentOrders.length}</Badge>
              </div>
              <ScrollArea className="h-[320px] pr-3">
                <div className="space-y-3">
                  {recentOrders.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                      No recent orders yet.
                    </div>
                  ) : (
                    recentOrders.map((order: any) => (
                      <div key={order.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-white">{order.orderNumber}</div>
                            <div className="mt-1 text-xs text-slate-400">
                              {order.customer?.name || "Walk-in"} · {format(new Date(order.createdAt), "MMM d, HH:mm")}
                            </div>
                          </div>
                          <Badge className="rounded-full bg-white/10 text-white border-white/10 capitalize">{order.status}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" className="rounded-full bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25" onClick={() => handleRebuildOrder(order)}>
                            <Undo2 className="mr-2 h-4 w-4" /> Rebuild
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full border-rose-400/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20" onClick={() => handleVoidOrder(order)}>
                            Void
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-full border-amber-400/20 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20" onClick={() => handleRefundOrder(order)}>
                            Refund
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shiftDrawerOpen} onOpenChange={setShiftDrawerOpen}>
        <DialogContent className="max-w-2xl border-white/10 bg-slate-950 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Wallet className="h-5 w-5 text-emerald-300" /> Shift management
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Track opening cash, cash counting, and end-of-shift variance locally.
            </DialogDescription>
          </DialogHeader>

          {shiftSession?.status === "open" ? (
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Opened</div>
                  <div className="mt-1 text-sm text-white">{format(new Date(shiftSession.openedAt), "MMM d, HH:mm")}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Opening float</div>
                  <div className="mt-1 text-sm text-white">Ksh {Number(shiftSession.openingFloat).toLocaleString()}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Expected cash</div>
                  <div className="mt-1 text-sm text-white">Ksh {Number(shiftSession.expectedCash).toLocaleString()}</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="counted-cash">Counted cash</Label>
                  <Input id="counted-cash" value={countedCash} onChange={(event) => setCountedCash(event.target.value)} className="rounded-2xl border-white/10 bg-white/5" placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shift-notes">Notes</Label>
                  <Textarea id="shift-notes" value={shiftNotes} onChange={(event) => setShiftNotes(event.target.value)} className="min-h-20 rounded-2xl border-white/10 bg-white/5" placeholder="Cash discrepancies, drawer issues, handover notes..." />
                </div>
              </div>

              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                Variance will be calculated as counted cash minus expected cash.
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShiftDrawerOpen(false)} className="border-white/10 bg-transparent text-slate-100 hover:bg-white/5">
                  Close
                </Button>
                <Button onClick={handleCloseShift} className="bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-950 hover:from-emerald-400 hover:to-lime-400">
                  Close shift
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="opening-float">Opening float</Label>
                  <Input id="opening-float" value={openingFloat} onChange={(event) => setOpeningFloat(event.target.value)} className="rounded-2xl border-white/10 bg-white/5" placeholder="0.00" />
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-300">
                  Open a shift before trading begins. The cashier drawer summary and variance are recorded locally until a backend shift register is added.
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShiftDrawerOpen(false)} className="border-white/10 bg-transparent text-slate-100 hover:bg-white/5">
                  Cancel
                </Button>
                <Button onClick={handleOpenShift} className="bg-gradient-to-r from-cyan-500 to-sky-500 text-white hover:from-cyan-400 hover:to-sky-400">
                  Open shift
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isMpesaPromptOpen} onOpenChange={(open) => !isProcessing && setIsMpesaPromptOpen(open)}>
        <DialogContent className="border-white/10 bg-slate-950 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-white">Lipa Na M-Pesa</DialogTitle>
            <DialogDescription className="text-slate-400">Send an STK push to the customer phone number.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="mpesa-phone">Phone number</Label>
              <Input id="mpesa-phone" type="tel" placeholder="07XX XXX XXX" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="rounded-2xl border-white/10 bg-white/5" disabled={isProcessing} />
            </div>
            {pollingStatus && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
                <p className="text-sm text-slate-200">{pollingStatus}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMpesaPromptOpen(false)} disabled={isProcessing} className="border-white/10 bg-transparent text-slate-100 hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleMpesaInitiate} disabled={isProcessing || !phoneNumber} className="bg-gradient-to-r from-green-600 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-400">
              Send prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaystackPromptOpen} onOpenChange={(open) => !isProcessing && setIsPaystackPromptOpen(open)}>
        <DialogContent className="border-white/10 bg-slate-950 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-white">Card payment</DialogTitle>
            <DialogDescription className="text-slate-400">Enter the customer email to start the Paystack checkout.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="paystack-email">Customer email</Label>
              <Input id="paystack-email" type="email" placeholder="customer@example.com" value={paystackEmail} onChange={(event) => setPaystackEmail(event.target.value)} className="rounded-2xl border-white/10 bg-white/5" disabled={isProcessing} />
            </div>
            {pollingStatus && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
                <p className="text-sm text-slate-200">{pollingStatus}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaystackPromptOpen(false)} disabled={isProcessing} className="border-white/10 bg-transparent text-slate-100 hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handlePaystackInitiate} disabled={isProcessing || !paystackEmail} className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-400 hover:to-cyan-400">
              Charge card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SplitPaymentModal
        open={isSplitModalOpen}
        onOpenChange={setIsSplitModalOpen}
        totalAmount={total}
        onProcessSplit={handleProcessSplit}
        isProcessing={isProcessing}
      />

      <ReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        order={completedOrder}
      />
    </>
  );
}
