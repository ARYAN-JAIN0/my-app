import { buildTemplateCsv } from "@/server/services/import-parser";

export async function GET() {
  const csv = buildTemplateCsv();
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rivo-leads-template.csv"',
    },
  });
}

