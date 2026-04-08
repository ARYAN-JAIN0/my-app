import { create } from "zustand";
import type { NegotiationDeal } from "../types/negotiation.types";

interface NegotiationState {
  deals: NegotiationDeal[];
  selectedDeal: NegotiationDeal | null;
  isLoading: boolean;
  error: string | null;

  setDeals: (deals: NegotiationDeal[]) => void;
  setSelectedDeal: (deal: NegotiationDeal | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useNegotiationStore = create<NegotiationState>((set) => ({
  deals: [],
  selectedDeal: null,
  isLoading: false,
  error: null,

  setDeals: (deals) => set({ deals }),
  setSelectedDeal: (deal) => set({ selectedDeal: deal }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
