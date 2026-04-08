import { NextResponse } from "next/server";

export async function GET() {
  const contacts = [
    { id: "1", name: "Acme Corp", status: "active", value: 50000 },
    { id: "2", name: "TechStart Inc", status: "lead", value: 25000 },
  ];
  return NextResponse.json(contacts);
}
