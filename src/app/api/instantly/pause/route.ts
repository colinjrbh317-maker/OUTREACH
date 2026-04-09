import { NextResponse } from "next/server";
import { pauseLeadSequence } from "@/lib/instantly";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const result = await pauseLeadSequence(email);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Instantly pause error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Pause failed" },
      { status: 500 }
    );
  }
}
