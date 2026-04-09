import { NextResponse } from "next/server";
import { notifyReply } from "@/lib/notify";

// Instantly webhook payload reference:
// https://developer.instantly.ai/webhooks
//
// Event types we handle:
//   reply_received — a lead replied to one of our emails
//
// We do NOT handle unsubscribes/bounces here — Instantly handles those natively.

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Verify it's a reply event
    const eventType = payload.event_type || payload.type || "";
    if (!eventType.includes("reply")) {
      return NextResponse.json({ skipped: true, reason: "not a reply event" });
    }

    const lead = payload.lead || {};
    const email = payload.email || {};

    const leadEmail = lead.email || payload.from_address || "";
    const leadName =
      [lead.first_name, lead.last_name].filter(Boolean).join(" ") ||
      leadEmail.split("@")[0];
    const businessName = lead.company_name || lead.companyName || "";
    const subject = email.subject || payload.subject || "(no subject)";
    const replyBody = email.body || email.text || payload.body || payload.text || "";

    // Determine campaign variant from campaign_id
    const campaignId = payload.campaign_id || "";
    const campaignA = process.env.INSTANTLY_CAMPAIGN_ID_A || "";
    const campaignB = process.env.INSTANTLY_CAMPAIGN_ID_B || "";
    let campaignVariant = "?";
    if (campaignId === campaignA) campaignVariant = "A";
    else if (campaignId === campaignB) campaignVariant = "B";

    // Email step (1-indexed)
    const emailStep = (payload.sequence_step ?? payload.step ?? 0) + 1;

    if (!leadEmail) {
      console.error("Instantly reply webhook: missing lead email", payload);
      return NextResponse.json({ error: "Missing lead email" }, { status: 400 });
    }

    await notifyReply({
      leadName,
      businessName,
      leadEmail,
      subject,
      replyBody,
      campaignVariant,
      emailStep,
    });

    console.log(`Reply notification sent: ${leadName} (${leadEmail})`);
    return NextResponse.json({ success: true, lead: leadEmail });
  } catch (error) {
    console.error("Instantly reply webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
