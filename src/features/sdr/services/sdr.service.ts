import type { Lead, LeadFilters } from "../types/sdr.types";
import { apiClient } from "@/services/api-client";

export class SdrService {
  async getLeads(filters?: LeadFilters): Promise<Lead[]> {
    const params = new URLSearchParams();
    
    if (filters?.status) params.set("status", filters.status);
    if (filters?.source) params.set("source", filters.source);
    if (filters?.priority) params.set("priority", filters.priority);
    if (filters?.search) params.set("search", filters.search);

    const queryString = params.toString();
    const url = `/api/sdr${queryString ? `?${queryString}` : ""}`;

    return apiClient.get<Lead[]>(url);
  }

  async getLeadById(id: string): Promise<Lead> {
    return apiClient.get<Lead>(`/api/sdr/${id}`);
  }

  async createLead(lead: Omit<Lead, "id" | "createdAt" | "updatedAt">): Promise<Lead> {
    return apiClient.post<Lead>("/api/sdr", lead);
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    return apiClient.patch<Lead>(`/api/sdr/${id}`, updates);
  }

  async deleteLead(id: string): Promise<void> {
    return apiClient.delete(`/api/sdr/${id}`);
  }

  async qualifyLead(id: string): Promise<{ score: number; fit: "hot" | "warm" | "cold" }> {
    return apiClient.post(`/api/sdr/${id}/qualify`, {});
  }

  async sendEmail(leadId: string, templateId: string): Promise<{ success: boolean }> {
    return apiClient.post(`/api/sdr/${leadId}/email`, { templateId });
  }
}

export const sdrService = new SdrService();
