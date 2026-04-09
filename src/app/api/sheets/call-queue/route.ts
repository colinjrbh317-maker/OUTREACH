import { NextResponse } from "next/server";
import { readSheetAsObjects, updateMultipleCells } from "@/lib/google-sheets";
import type { CallQueueRow } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];

    const rows = await readSheetAsObjects<CallQueueRow>("Call Queue");

    // Filter by date (YYYY-MM-DD format in sheet)
    const filtered = rows.filter((row) => {
      const rowDate = row.call_date?.split("T")[0] || row.call_date;
      return rowDate === date;
    });

    // Parse numeric/boolean fields
    const parsed = filtered.map((row) => ({
      ...row,
      call_number: Number(row.call_number) || 0,
      voicemail_ok:
        String(row.voicemail_ok).toLowerCase() === "y" ||
        String(row.voicemail_ok).toLowerCase() === "yes" ||
        String(row.voicemail_ok).toLowerCase() === "true",
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Call queue GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch call queue" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { rowIndex, updates } = body as {
      rowIndex: number;
      updates: Record<string, string>;
    };

    if (!rowIndex || !updates) {
      return NextResponse.json({ error: "Missing rowIndex or updates" }, { status: 400 });
    }

    await updateMultipleCells("Call Queue", rowIndex, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Call queue PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update call queue" },
      { status: 500 }
    );
  }
}
