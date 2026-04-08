import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building } from "lucide-react";
import type { Lead } from "../types/sdr.types";

interface LeadCardProps {
  lead: Lead;
  onSelect?: (lead: Lead) => void;
  onEmail?: (lead: Lead) => void;
  className?: string;
}

const statusColors: Record<Lead["status"], string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  qualified: "bg-green-500",
  unqualified: "bg-gray-500",
  converted: "bg-purple-500",
};

const priorityColors: Record<Lead["priority"], string> = {
  low: "border-green-500",
  medium: "border-yellow-500",
  high: "border-orange-500",
  urgent: "border-red-500",
};

export function LeadCard({ lead, onSelect, onEmail, className }: LeadCardProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors",
        priorityColors[lead.priority],
        "border-l-4",
        className
      )}
      onClick={() => onSelect?.(lead)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-semibold">
            {lead.firstName} {lead.lastName}
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Building className="w-3 h-3" />
            {lead.company}
          </p>
          <p className="text-xs text-muted-foreground">{lead.title}</p>
        </div>
        <Badge variant="secondary" className={statusColors[lead.status]}>
          {lead.status}
        </Badge>
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEmail?.(lead);
          }}
        >
          <Mail className="w-4 h-4 mr-1" />
          Email
        </Button>
        {lead.phone && (
          <Button variant="ghost" size="sm">
            <Phone className="w-4 h-4 mr-1" />
            Call
          </Button>
        )}
      </div>

      {lead.value && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm font-medium">
            Deal Value: ${lead.value.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
