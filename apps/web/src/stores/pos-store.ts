import { create } from "zustand";

export interface CartItem {
  id: string; // Unique ID for the cart line item
  productId: string;
  name: string;
  price: number;
  quantity: number;
  taxRate: number; // Inherited from product or branch
  productData?: any;
}

interface PosState {
  cart: CartItem[];
  searchQuery: string;
  activeCategoryId: string | null;
  taxRate: number; // Branch default tax rate
  
  // Actions
  setTaxRate: (rate: number) => void;
  setSearchQuery: (query: string) => void;
  setActiveCategory: (id: string | null) => void;
  addToCart: (item: Omit<CartItem, "id">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed (accessed via store.getState() or simple selectors)
  getSubtotal: () => number;
  getTaxTotal: () => number;
  getTotal: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  searchQuery: "",
  activeCategoryId: null,
  taxRate: 16, // Default fallback, should be overridden by Branch API

  setTaxRate: (rate) => set({ taxRate: rate }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveCategory: (id) => set({ activeCategoryId: id }),

  addToCart: (item) => {
    set((state) => {
      // Check if item already in cart
      const existing = state.cart.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.productId === item.productId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return {
        cart: [...state.cart, { ...item, id: crypto.randomUUID() }],
      };
    });
  },

  removeFromCart: (id) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== id),
    }));
  },

  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(id);
      return;
    }
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      ),
    }));
  },

  clearCart: () => set({ cart: [] }),

  getSubtotal: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getTaxTotal: () => {
    const { cart } = get();
    // Assuming tax is calculated per item based on its taxRate
    // For Kenya VAT, price might be tax-inclusive or exclusive. 
    // Here we assume basePrice is exclusive.
    return cart.reduce((sum, item) => sum + (item.price * item.quantity * (item.taxRate / 100)), 0);
  },

  getTotal: () => {
    return get().getSubtotal() + get().getTaxTotal();
  },
}));
