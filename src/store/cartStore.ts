import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, ItemCustomization } from '@/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (item: Omit<CartItem, 'cartId'>) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Computed
  totalItems: () => number;
  subtotal: () => number;
}

const generateCartId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const cartId = generateCartId();
        set((state) => ({
          items: [...state.items, { ...item, cartId }],
          isOpen: true,
        }));
      },

      removeItem: (cartId) => {
        set((state) => ({
          items: state.items.filter((i) => i.cartId !== cartId),
        }));
      },

      updateQuantity: (cartId, quantity) => {
        if (quantity < 1) {
          get().removeItem(cartId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.cartId === cartId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'oss-patches-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
