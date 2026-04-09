import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/google-calendar";

export async function GET() {
  try {
    const slots = await getAvailableSlots();
    return NextResponse.json(slots);
  } catch (error) {
    console.error("Calendar slots error:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar slots" },
      { status: 500 }
    );
  }
}
