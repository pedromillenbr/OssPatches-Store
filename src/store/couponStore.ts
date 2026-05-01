import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CouponState {
  appliedCoupon: string | null;
  discountPercent: number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

// Coupons available
const VALID_COUPONS: Record<string, number> = {
  
};

export const useCouponStore = create<CouponState>()(
  persist(
    (set) => ({
      appliedCoupon: null,
      discountPercent: 0,

      applyCoupon: (code: string) => {
        const upperCode = code.toUpperCase().trim();
        const discount = VALID_COUPONS[upperCode];

        if (discount) {
          set({ appliedCoupon: upperCode, discountPercent: discount });
          return true;
        }
        return false;
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
