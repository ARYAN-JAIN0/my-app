import { useCallback } from "react";
import { useCrmStore } from "../store/crm-store";
import type { Deal, DealStage } from "../types/crm.types";

export function useDeals() {
  const { deals, selectedDeal, isLoading, error, setDeals, setSelectedDeal, setLoading, setError } = useCrmStore();

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/crm");
      const data = await response.json();
      setDeals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  }, [setDeals, setLoading, setError]);

  const selectDeal = useCallback((deal: Deal | null) => {
    setSelectedDeal(deal);
  }, [setSelectedDeal]);

  const updateDealStage = useCallback(async (dealId: string, stage: DealStage) => {
    try {
      await fetch(`/api/crm/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      setDeals(deals.map((deal) => (deal.id === dealId ? { ...deal, stage } : deal)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update deal");
    }
  }, [deals, setDeals, setError]);

  return {
    deals,
    selectedDeal,
    isLoading,
    error,
    fetchDeals,
    selectDeal,
    updateDealStage,
  };
}
