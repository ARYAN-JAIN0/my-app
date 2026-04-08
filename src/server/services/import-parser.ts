import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { z } from "zod";

const rowSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  company: z.string().min(1),
  title: z.string().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  priority: z.string().optional(),
  notes: z.string().optional(),
});

export type ParsedLeadRow = z.infer<typeof rowSchema>;

function normalizeRow(raw: Record<string, unknown>) {
  const pick = (keys: string[]) => {
    for (const key of keys) {
      const value = raw[key];
      if (value != null && String(value).trim().length > 0) {
        return String(value).trim();
      }
    }
    return "";
  };

  return {
    firstName: pick(["firstName", "first_name", "First Name", "first name"]),
    lastName: pick(["lastName", "last_name", "Last Name", "last name"]),
    email: pick(["email", "Email"]),
    company: pick(["company", "Company"]),
    title: pick(["title", "Title"]),
    phone: pick(["phone", "Phone"]),
    source: pick(["source", "Source"]),
    priority: pick(["priority", "Priority"]),
    notes: pick(["notes", "Notes"]),
  };
}

export function parseLeadFile(filename: string, fileBuffer: Buffer) {
  const lower = filename.toLowerCase();
  let rows: Record<string, unknown>[] = [];

  if (lower.endsWith(".csv")) {
    rows = parse(fileBuffer.toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
  } else {
    throw new Error("Unsupported file format. Please upload CSV or XLSX.");
  }

  return rows.map((row, idx) => {
    const normalized = normalizeRow(row);
    const parsed = rowSchema.safeParse(normalized);
    return {
      rowNumber: idx + 1,
      raw: row,
      normalized,
      valid: parsed.success,
      issues: parsed.success ? [] : parsed.error.issues.map((issue) => issue.message),
    };
  });
}

export function buildTemplateCsv() {
  return [
    "firstName,lastName,email,company,title,phone,source,priority,notes",
    "Sarah,Jenkins,sarah.jenkins@veridian.ai,Veridian AI,VP Marketing,+1-555-0101,linkedin,high,Interested in scaling outbound",
    "Michael,Chen,michael.chen@techflow.com,TechFlow,Head of Sales,+1-555-0102,referral,urgent,Asked about pricing",
  ].join("\n");
}
