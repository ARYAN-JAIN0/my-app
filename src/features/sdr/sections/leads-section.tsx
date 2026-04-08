"use client";

import { useState } from "react";
import { LeadCard } from "../components/lead-card";
import { LeadTable } from "../components/lead-table";
import { SearchInput } from "@/components/shared/inputs/search-input";
import { FilterDropdown } from "@/components/shared/inputs/filter-dropdown";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import { SdrLoading } from "@/components/shared/feedback/loading";
import { useLeads } from "../hooks/use-leads";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import type { Lead, LeadPriority, LeadStatus } from "../types/sdr.types";

type ViewMode = "grid" | "list";

const statusOptions = [
  { label: "All Status", value: "" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Unqualified", value: "unqualified" },
  { label: "Converted", value: "converted" },
];

const priorityOptions = [
  { label: "All Priority", value: "" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

export function LeadsSection() {
  const { leads, isLoading, error, filters, setFilters } = useLeads();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchValue, setSearchValue] = useState("");

  const filteredLeads = leads.filter((lead) => {
    if (filters.status && lead.status !== filters.status) return false;
    if (filters.priority && lead.priority !== filters.priority) return false;
    if (searchValue) {
      const search = searchValue.toLowerCase();
      return (
        lead.firstName.toLowerCase().includes(search) ||
        lead.lastName.toLowerCase().includes(search) ||
        lead.company.toLowerCase().includes(search) ||
        lead.email.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleSelectLead = (lead: Lead) => {
    console.log("Selected lead:", lead);
  };

  const handleEmailLead = (lead: Lead) => {
    console.log("Email lead:", lead);
  };

  if (isLoading) {
    return <SdrLoading />;
  }

  if (error) {
    return (
      <EmptyState
        title="Error loading leads"
        description={error}
        action={{ label: "Retry", onClick: () => window.location.reload() }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <SearchInput
          placeholder="Search leads..."
          value={searchValue}
          onChange={setSearchValue}
          className="w-64"
        />
        <FilterDropdown
          options={statusOptions}
          value={filters.status}
          onChange={(value) => setFilters({ status: value as LeadStatus })}
          placeholder="Status"
        />
        <FilterDropdown
          options={priorityOptions}
          value={filters.priority}
          onChange={(value) => setFilters({ priority: value as LeadPriority })}
          placeholder="Priority"
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="Try adjusting your filters or add new leads."
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onSelect={handleSelectLead}
              onEmail={handleEmailLead}
            />
          ))}
        </div>
      ) : (
        <LeadTable
          leads={filteredLeads}
          onSelect={handleSelectLead}
          onEmail={handleEmailLead}
        />
      )}
    </div>
  );
}
