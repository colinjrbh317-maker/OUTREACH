import { NextResponse } from "next/server";
import { addLeadToCampaign } from "@/lib/instantly";

export async function POST(request: Request) {
  try {
    const { email, first_name, last_name, company_name, variant } = await request.json();

    const campaignId =
      variant === "B"
        ? process.env.INSTANTLY_CAMPAIGN_ID_B
        : process.env.INSTANTLY_CAMPAIGN_ID_A;

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID not configured" }, { status: 500 });
    }

    const result = await addLeadToCampaign({
      campaign_id: campaignId,
      email,
      first_name,
      last_name,
      company_name,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Instantly add lead error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Add failed" },
      { status: 500 }
    );
  }
}
