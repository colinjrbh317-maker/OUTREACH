import { NextResponse } from "next/server";
import { readSheetAsObjects, updateMultipleCells } from "@/lib/google-sheets";
import type { FbQueueRow } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];

    const rows = await readSheetAsObjects<FbQueueRow>("FB Queue");
    const filtered = rows.filter((row) => {
      const rowDate = row.fb_date?.split("T")[0] || row.fb_date;
      return rowDate === date;
    });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("FB queue GET error:", error);
    return NextResponse.json({ error: "Failed to fetch FB queue" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { rowIndex, updates } = await request.json();
    await updateMultipleCells("FB Queue", rowIndex, updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("FB queue PATCH error:", error);
    return NextResponse.json({ error: "Failed to update FB queue" }, { status: 500 });
  }
}
