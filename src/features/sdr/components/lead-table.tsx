"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Mail, Phone } from "lucide-react";
import type { Lead, LeadStatus } from "../types/sdr.types";

interface LeadTableProps {
  leads: Lead[];
  onSelect?: (lead: Lead) => void;
  onEmail?: (lead: Lead) => void;
  className?: string;
}

const statusColors: Record<LeadStatus, string> = {
  new: "bg-blue-500 hover:bg-blue-600",
  contacted: "bg-yellow-500 hover:bg-yellow-600",
  qualified: "bg-green-500 hover:bg-green-600",
  unqualified: "bg-gray-500 hover:bg-gray-600",
  converted: "bg-purple-500 hover:bg-purple-600",
};

export function LeadTable({ leads, onSelect, onEmail, className }: LeadTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              data-state={selectedId === lead.id && "selected"}
              className="cursor-pointer"
              onClick={() => {
                setSelectedId(lead.id);
                onSelect?.(lead);
              }}
            >
              <TableCell className="font-medium">
                {lead.firstName} {lead.lastName}
              </TableCell>
              <TableCell>{lead.company}</TableCell>
              <TableCell>
                <Badge variant="secondary" className={statusColors[lead.status]}>
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell className="capitalize">{lead.priority}</TableCell>
              <TableCell>
                {lead.value ? `$${lead.value.toLocaleString()}` : "-"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEmail?.(lead);
                    }}
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                  {lead.phone && (
                    <Button variant="ghost" size="icon">
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
