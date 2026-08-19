import { create } from "zustand";
import { POS_PROMOTIONS } from "@salesk/shared";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  taxRate: number;
  productData?: any;
}

export interface SuspendedTicket {
  id: string;
  label: string;
  branchId: string;
  customerId: string | null;
  tableId: string | null;
  redeemedPoints: number;
  promotionCode: string | null;
  promotionLabel: string | null;
  promotionAmount: number;
  notes: string;
  items: CartItem[];
  createdAt: string;
}

export interface ShiftSession {
  id: string;
  branchId: string;
  openedAt: string;
  closedAt: string | null;
  openedBy: string;
  openingFloat: number;
  countedCash: number;
  expectedCash: number;
  variance: number;
  notes: string;
  status: "open" | "closed";
}

interface PromotionState {
  code: string | null;
  label: string | null;
  amount: number;
}

interface PosState {
  branchId: string;
  cart: CartItem[];
  searchQuery: string;
  activeCategoryId: string | null;
  taxRate: number;
  selectedCustomerId: string | null;
  selectedTableId: string | null;
  redeemedPoints: number;
  promotion: PromotionState;
  activeTicketId: string | null;
  suspendedTickets: SuspendedTicket[];
  shiftSession: ShiftSession | null;
  ticketManagerOpen: boolean;
  shiftDrawerOpen: boolean;
  setBranchId: (branchId: string) => void;
  setTaxRate: (rate: number) => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (id: string | null) => void;
  setSelectedCustomerId: (customerId: string | null) => void;
  setSelectedTableId: (tableId: string | null) => void;
  setRedeemedPoints: (points: number) => void;
  setTicketManagerOpen: (open: boolean) => void;
  setShiftDrawerOpen: (open: boolean) => void;
  applyPromotion: (code: string) => { amount: number; label: string } | null;
  clearPromotion: () => void;
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  suspendCurrentTicket: (label?: string, notes?: string) => string | null;
  resumeTicket: (ticketId: string) => SuspendedTicket | null;
  removeSuspendedTicket: (ticketId: string) => void;
  openShift: (openingFloat: number, openedBy?: string) => void;
  closeShift: (countedCash: number, notes?: string) => void;
  getSubtotal: () => number;
  getTaxTotal: () => number;
  getTotal: () => number;
}

const PROMOTION_PRESETS = Object.fromEntries(
  POS_PROMOTIONS.map((promotion) => [promotion.code, promotion])
);

const STORAGE_KEY = "salesk-pos-state";

const getPersistedState = (): Partial<PosState> => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persistState = (state: PosState) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        branchId: state.branchId,
        searchQuery: state.searchQuery,
        activeCategoryId: state.activeCategoryId,
        taxRate: state.taxRate,
        selectedCustomerId: state.selectedCustomerId,
        selectedTableId: state.selectedTableId,
        redeemedPoints: state.redeemedPoints,
        promotion: state.promotion,
        activeTicketId: state.activeTicketId,
        suspendedTickets: state.suspendedTickets,
        shiftSession: state.shiftSession,
      })
    );
  } catch (error) {
    console.warn("Failed to persist POS state", error);
  }
};

const calculatePromotionAmount = (code: string, subtotal: number, cart: CartItem[]) => {
  const preset = PROMOTION_PRESETS[code.toUpperCase()];
  if (!preset) {
    return null;
  }

  if (preset.type === "percentage") {
    return Math.round((subtotal * preset.value) / 100);
  }

  if (preset.type === "fixed") {
    return Math.min(preset.value, subtotal);
  }

  if (preset.type === "bundle") {
    if (cart.length < 2) {
      return 0;
    }

    const sortedPrices = [...cart]
      .sort((left, right) => left.price - right.price)
      .map((item) => item.price * item.quantity);

    return Math.min(sortedPrices[0] ?? 0, subtotal);
  }

  if (preset.type === "loyalty") {
    return Math.min(preset.value, subtotal);
  }

  return null;
};

const createShiftSession = (
  branchId: string,
  openingFloat: number,
  openedBy = "cashier"
): ShiftSession => ({
  id: crypto.randomUUID(),
  branchId,
  openedAt: new Date().toISOString(),
  closedAt: null,
  openedBy,
  openingFloat,
  countedCash: 0,
  expectedCash: openingFloat,
  variance: 0,
  notes: "",
  status: "open",
});

const persistedState = getPersistedState();

export const usePosStore = create<PosState>((set, get) => ({
  branchId: persistedState.branchId || "default-branch",
  cart: persistedState.cart || [],
  searchQuery: persistedState.searchQuery || "",
  activeCategoryId: persistedState.activeCategoryId || null,
  taxRate: persistedState.taxRate || 16,
  selectedCustomerId: persistedState.selectedCustomerId || null,
  selectedTableId: persistedState.selectedTableId || null,
  redeemedPoints: persistedState.redeemedPoints || 0,
  promotion: persistedState.promotion || { code: null, label: null, amount: 0 },
  activeTicketId: persistedState.activeTicketId || null,
  suspendedTickets: persistedState.suspendedTickets || [],
  shiftSession: persistedState.shiftSession || null,
  ticketManagerOpen: false,
  shiftDrawerOpen: false,

  setBranchId: (branchId) => {
    set({ branchId });
    persistState(get());
  },
  setTaxRate: (taxRate) => set({ taxRate }),
  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    persistState(get());
  },
  setActiveCategory: (activeCategoryId) => {
    set({ activeCategoryId });
    persistState(get());
  },
  setSelectedCustomerId: (selectedCustomerId) => {
    set({ selectedCustomerId, redeemedPoints: selectedCustomerId ? get().redeemedPoints : 0 });
    persistState(get());
  },
  setSelectedTableId: (selectedTableId) => {
    set({ selectedTableId });
    persistState(get());
  },
  setRedeemedPoints: (redeemedPoints) => {
    set({ redeemedPoints: Math.max(0, redeemedPoints) });
    persistState(get());
  },
  setTicketManagerOpen: (ticketManagerOpen) => set({ ticketManagerOpen }),
  setShiftDrawerOpen: (shiftDrawerOpen) => set({ shiftDrawerOpen }),
  applyPromotion: (code) => {
    const currentSubtotal = get().getSubtotal();
    const amount = calculatePromotionAmount(code, currentSubtotal, get().cart);

    if (amount === null) {
      return null;
    }

    const preset = PROMOTION_PRESETS[code.toUpperCase()];
    const promotion = {
      code: preset.code,
      label: preset.label,
      amount,
    };

    set({ promotion });
    persistState(get());

    return promotion;
  },
  clearPromotion: () => {
    set({ promotion: { code: null, label: null, amount: 0 } });
    persistState(get());
  },

  addToCart: (item) => {
    set((state) => {
      const existing = state.cart.find((entry) => entry.productId === item.productId);

      if (existing) {
        return {
          cart: state.cart.map((entry) =>
            entry.productId === item.productId
              ? { ...entry, quantity: entry.quantity + item.quantity }
              : entry
          ),
        };
      }

      return {
        cart: [...state.cart, { ...item, id: crypto.randomUUID() }],
      };
    });
    persistState(get());
  },

  removeFromCart: (id) => {
    set((state) => ({ cart: state.cart.filter((item) => item.id !== id) }));
    persistState(get());
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(id);
      return;
    }

    set((state) => ({
      cart: state.cart.map((item) => (item.id === id ? { ...item, quantity } : item)),
    }));
    persistState(get());
  },

  clearCart: () => {
    set({ cart: [], redeemedPoints: 0, promotion: { code: null, label: null, amount: 0 } });
    persistState(get());
  },

  suspendCurrentTicket: (label, notes) => {
    const state = get();

    if (state.cart.length === 0) {
      return null;
    }

    const ticket: SuspendedTicket = {
      id: crypto.randomUUID(),
      label: label?.trim() || `Ticket ${state.suspendedTickets.length + 1}`,
      branchId: state.branchId,
      customerId: state.selectedCustomerId,
      tableId: state.selectedTableId,
      redeemedPoints: state.redeemedPoints,
      promotionCode: state.promotion.code,
      promotionLabel: state.promotion.label,
      promotionAmount: state.promotion.amount,
      notes: notes || "",
      items: state.cart,
      createdAt: new Date().toISOString(),
    };

    set((current) => ({
      suspendedTickets: [ticket, ...current.suspendedTickets],
      activeTicketId: ticket.id,
      cart: [],
      selectedCustomerId: null,
      selectedTableId: null,
      redeemedPoints: 0,
      promotion: { code: null, label: null, amount: 0 },
    }));
    persistState(get());

    return ticket.id;
  },

  resumeTicket: (ticketId) => {
    const state = get();
    const ticket = state.suspendedTickets.find((entry) => entry.id === ticketId);

    if (!ticket) {
      return null;
    }

    set({
      cart: ticket.items,
      selectedCustomerId: ticket.customerId,
      selectedTableId: ticket.tableId,
      redeemedPoints: ticket.redeemedPoints,
      promotion: {
        code: ticket.promotionCode,
        label: ticket.promotionLabel,
        amount: ticket.promotionAmount,
      },
      activeTicketId: ticket.id,
      suspendedTickets: state.suspendedTickets.filter((entry) => entry.id !== ticketId),
    });
    persistState(get());

    return ticket;
  },

  removeSuspendedTicket: (ticketId) => {
    set((state) => ({
      suspendedTickets: state.suspendedTickets.filter((ticket) => ticket.id !== ticketId),
      activeTicketId: state.activeTicketId === ticketId ? null : state.activeTicketId,
    }));
    persistState(get());
  },

  openShift: (openingFloat, openedBy = "cashier") => {
    const shiftSession = createShiftSession(get().branchId, openingFloat, openedBy);
    set({ shiftSession });
    persistState(get());
  },

  closeShift: (countedCash, notes = "") => {
    const shiftSession = get().shiftSession;
    if (!shiftSession) {
      return;
    }

    const expectedCash = Math.max(0, shiftSession.openingFloat + get().getTotal());
    const variance = countedCash - expectedCash;

    set({
      shiftSession: {
        ...shiftSession,
        countedCash,
        expectedCash,
        variance,
        notes,
        closedAt: new Date().toISOString(),
        status: "closed",
      },
    });
    persistState(get());
  },

  getSubtotal: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getTaxTotal: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + item.price * item.quantity * (item.taxRate / 100), 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const taxes = get().getTaxTotal();
    const promotionAmount = get().promotion.amount || 0;
    const redeemedPoints = get().redeemedPoints || 0;
    return Math.max(0, subtotal + taxes - promotionAmount - redeemedPoints);
  },
}));
