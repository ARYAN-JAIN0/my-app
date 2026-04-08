import { getAnalyticsSummary } from "@/server/orchestrators/analytics-orchestrator";
import { getLiveProcessingStream } from "@/server/orchestrators/analytics-orchestrator";

function csvEscape(value: string | number) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/\"/g, '""')}"`;
  }
  return text;
}

export async function GET() {
  try {
    const [summary, stream] = await Promise.all([
      getAnalyticsSummary(),
      getLiveProcessingStream({}),
    ]);

    const header = "leadName,company,status,signalScore,timestamp";
    const rows = stream.map((row) =>
      [row.leadName, row.company, row.status, row.signalScore, row.timestamp]
        .map(csvEscape)
        .join(",")
    );

    const summaryRows = [
      ["totalLeads", summary.totalLeads],
      ["contacted", summary.contacted],
      ["contactRate", summary.contactRate.toFixed(2)],
      ["conversionRate", summary.conversionRate.toFixed(2)],
      ["approvalRate", summary.approvalRate.toFixed(2)],
    ].map((entry) => entry.map(csvEscape).join(","));

    const body = ["metric,value", ...summaryRows, "", header, ...rows].join("\n");
    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="rivo-analytics.csv"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export analytics";
    return new Response(message, { status: 500 });
  }
}

