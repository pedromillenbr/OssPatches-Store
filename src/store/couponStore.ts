import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CouponState {
  appliedCoupon: string | null;
  discountPercent: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
}

export const useCouponStore = create<CouponState>()(
  persist(
    (set) => ({
      appliedCoupon: null,
      discountPercent: 0,

      applyCoupon: async (code: string) => {
        try {
          const res = await fetch('/api/coupons/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          const data = await res.json();

          if (data.valid) {
            set({ appliedCoupon: data.code, discountPercent: data.discountPercent });
            return { success: true };
          }

          return { success: false, error: data.error || 'Cupom inválido' };
        } catch {
          return { success: false, error: 'Erro ao validar cupom' };
        }
      },

      removeCoupon: () => {
        set({ appliedCoupon: null, discountPercent: 0 });
      },
    }),
    {
      name: 'coupon-storage',
    }
  )
);
