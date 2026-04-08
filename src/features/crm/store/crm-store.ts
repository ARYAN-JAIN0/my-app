import { create } from "zustand";
import type { Deal, Contact, Account } from "../types/crm.types";

interface CrmState {
  deals: Deal[];
  contacts: Contact[];
  accounts: Account[];
  selectedDeal: Deal | null;
  isLoading: boolean;
  error: string | null;

  setDeals: (deals: Deal[]) => void;
  setContacts: (contacts: Contact[]) => void;
  setAccounts: (accounts: Account[]) => void;
  setSelectedDeal: (deal: Deal | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCrmStore = create<CrmState>((set) => ({
  deals: [],
  contacts: [],
  accounts: [],
  selectedDeal: null,
  isLoading: false,
  error: null,

  setDeals: (deals) => set({ deals }),
  setContacts: (contacts) => set({ contacts }),
  setAccounts: (accounts) => set({ accounts }),
  setSelectedDeal: (deal) => set({ selectedDeal: deal }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
