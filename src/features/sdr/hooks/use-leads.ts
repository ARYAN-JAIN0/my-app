import { useEffect, useCallback } from "react";
import { useSdrStore } from "../store/sdr-store";
import { sdrService } from "../services/sdr.service";
import type { Lead, LeadFilters } from "../types/sdr.types";

export function useLeads() {
  const {
    leads,
    selectedLead,
    filters,
    isLoading,
    error,
    setLeads,
    addLead,
    updateLead,
    deleteLead,
    setSelectedLead,
    setFilters,
    setLoading,
    setError,
  } = useSdrStore();

  const fetchLeads = useCallback(async (filterParams?: LeadFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await sdrService.getLeads(filterParams || filters);
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, [filters, setLeads, setLoading, setError]);

  const createLead = useCallback(async (lead: Parameters<typeof sdrService.createLead>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const newLead = await sdrService.createLead(lead);
      addLead(newLead);
      return newLead;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addLead, setLoading, setError]);

  const updateLeadById = useCallback(async (id: string, updates: Parameters<typeof sdrService.updateLead>[1]) => {
    setLoading(true);
    setError(null);
    try {
      const updatedLead = await sdrService.updateLead(id, updates);
      updateLead(id, updatedLead);
      return updatedLead;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update lead");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateLead, setLoading, setError]);

  const removeLead = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await sdrService.deleteLead(id);
      deleteLead(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete lead");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [deleteLead, setLoading, setError]);

  const updateFilters = useCallback((newFilters: Partial<LeadFilters>) => {
    setFilters(newFilters);
  }, [setFilters]);

  const selectLead = useCallback((lead: Lead | null) => {
    setSelectedLead(lead);
  }, [setSelectedLead]);

  useEffect(() => {
    fetchLeads();
  }, []);

  return {
    leads,
    selectedLead,
    filters,
    isLoading,
    error,
    fetchLeads,
    createLead,
    updateLead: updateLeadById,
    deleteLead: removeLead,
    setFilters: updateFilters,
    selectLead,
  };
}
