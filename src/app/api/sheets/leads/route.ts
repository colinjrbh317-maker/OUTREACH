import { NextResponse } from "next/server";
import { readSheetAsObjects } from "@/lib/google-sheets";
import type { LeadRow } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() || "";
    const status = url.searchParams.get("status") || "";

    const rows = await readSheetAsObjects<LeadRow>("All Leads");

    let filtered = rows;

    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.business_name?.toLowerCase().includes(search) ||
          r.owner_first_name?.toLowerCase().includes(search) ||
          r.owner_last_name?.toLowerCase().includes(search) ||
          r.phone?.includes(search) ||
          r.owner_email?.toLowerCase().includes(search)
      );
    }

    if (status) {
      filtered = filtered.filter((r) => r.email_status === status);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Leads GET error:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
