import { create } from 'zustand';
import {
  CheckoutStep,
  CustomerIdentification,
  Address,
  ShippingOption,
  OrderPayment,
} from '@/types';

interface CheckoutState {
  step: CheckoutStep;
  customer: CustomerIdentification | null;
  address: Address | null;
  selectedShipping: ShippingOption | null;
  payment: OrderPayment | null;
  orderId: string | null;

  setStep: (step: CheckoutStep) => void;
  setCustomer: (customer: CustomerIdentification) => void;
  setAddress: (address: Address) => void;
  setShipping: (shipping: ShippingOption | null) => void;
  setPayment: (payment: OrderPayment) => void;
  setOrderId: (id: string) => void;
  reset: () => void;
}

const initialState = {
  step: 'identification' as CheckoutStep,
  customer: null,
  address: null,
  selectedShipping: null,
  payment: null,
  orderId: null,
};

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setCustomer: (customer) => set({ customer }),
  setAddress: (address) => set({ address }),
  setShipping: (selectedShipping) => set({ selectedShipping }),
  setPayment: (payment) => set({ payment }),
  setOrderId: (orderId) => set({ orderId }),
  reset: () => set(initialState),
}));
