import { NextResponse } from "next/server";
import { getCampaignStats } from "@/lib/instantly";

export async function GET() {
  try {
    if (!process.env.INSTANTLY_API_KEY) {
      return NextResponse.json(null);
    }
    const stats = await getCampaignStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Instantly stats error:", error);
    return NextResponse.json(null);
  }
}
