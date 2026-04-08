import { useCallback } from "react";
import { useNegotiationStore } from "../store/negotiation-store";
import type { NegotiationDeal } from "../types/negotiation.types";

export function useNegotiations() {
  const { deals, selectedDeal, isLoading, error, setDeals, setSelectedDeal, setLoading, setError } = useNegotiationStore();

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/negotiation");
      const data = await response.json();
      setDeals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  }, [setDeals, setLoading, setError]);

  const selectDeal = useCallback((deal: NegotiationDeal | null) => {
    setSelectedDeal(deal);
  }, [setSelectedDeal]);

  return {
    deals,
    selectedDeal,
    isLoading,
    error,
    fetchDeals,
    selectDeal,
  };
}
