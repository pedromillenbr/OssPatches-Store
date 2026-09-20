import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CouponState {
  appliedCoupon: string | null;
  discountPercent: number;
  /** Compras que ainda restam ao cliente com este cupom (null = sem limite). */
  remaining: number | null;
  applyCoupon: (code: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
}

export const useCouponStore = create<CouponState>()(
  persist(
    (set) => ({
      appliedCoupon: null,
      discountPercent: 0,
      remaining: null,

      applyCoupon: async (code: string, email?: string) => {
        try {
          const res = await fetch('/api/coupons/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, email }),
          });

          const data = await res.json();

          if (data.valid) {
            set({
              appliedCoupon: data.code,
              discountPercent: data.discountPercent,
              remaining: data.remaining ?? null,
            });
            return { success: true };
          }

          // Cupom recusado (desligado ou sem saldo): tira o desconto da tela
          // para o cliente nunca ver um total que o servidor não vai honrar.
          set({ appliedCoupon: null, discountPercent: 0, remaining: null });
          return { success: false, error: data.error || 'Cupom inválido' };
        } catch {
          return { success: false, error: 'Erro ao validar cupom' };
        }
      },

      removeCoupon: () => {
        set({ appliedCoupon: null, discountPercent: 0, remaining: null });
      },
    }),
    {
      name: 'coupon-storage',
    }
  )
);
