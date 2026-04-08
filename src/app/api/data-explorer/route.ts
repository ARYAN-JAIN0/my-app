import { NextRequest } from "next/server";
import { ok } from "@/server/core/api";
import { toErrorResponse, toSuccessResponse } from "@/server/core/http";
import { ExplorerTable, listExplorerRecords } from "@/server/ops/data-explorer";

export async function GET(request: NextRequest) {
  try {
    const table = (request.nextUrl.searchParams.get("table") || "leads") as ExplorerTable;
    const search = request.nextUrl.searchParams.get("search") || undefined;
    const data = await listExplorerRecords(table, search);
    return toSuccessResponse(ok({ table, rows: data }));
  } catch (error) {
    return toErrorResponse(error);
  }
}

