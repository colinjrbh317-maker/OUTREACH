import { NextResponse } from "next/server";
import { readSheetAsObjects } from "@/lib/google-sheets";
import type { PipelineLogRow } from "@/lib/types";

export async function GET() {
  try {
    const rows = await readSheetAsObjects<PipelineLogRow>("Pipeline Log");
    return NextResponse.json(rows.reverse()); // Most recent first
  } catch (error) {
    console.error("Pipeline log GET error:", error);
    return NextResponse.json({ error: "Failed to fetch pipeline log" }, { status: 500 });
  }
}
