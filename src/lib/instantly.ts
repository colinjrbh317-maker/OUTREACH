const BASE_URL = "https://api.instantly.ai/api";

function headers() {
  const key = process.env.INSTANTLY_API_KEY;
  if (!key) throw new Error("INSTANTLY_API_KEY not set");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

// ── Campaign analytics ──

export async function getCampaignStats() {
  const campaignA = process.env.INSTANTLY_CAMPAIGN_ID_A;
  const campaignB = process.env.INSTANTLY_CAMPAIGN_ID_B;

  const res = await fetch(`${BASE_URL}/v2/analytics/campaigns/overview`, {
    headers: headers(),
  });

  if (!res.ok) {
    console.error("Instantly stats error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const sent = data.emails_sent_count || 0;

  return {
    open_rate: sent > 0 ? (data.open_count_unique || 0) / sent : 0,
    reply_rate: sent > 0 ? (data.reply_count_unique || 0) / sent : 0,
    emails_sent: sent,
    bounced: data.bounced_count || 0,
    active_leads:
      (data.contacted_count || 0) -
      (data.completed_count || 0) -
      (data.bounced_count || 0) -
      (data.unsubscribed_count || 0),
  };
}

// ── Send one-off email ──

export async function sendEmail(params: {
  from: string;
  to: string;
  subject: string;
  body: string;
}) {
  const res = await fetch(`${BASE_URL}/v2/emails/send`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instantly send failed: ${res.status} ${text}`);
  }

  return res.json();
}

// ── Add lead to campaign ──

export async function addLeadToCampaign(params: {
  campaign_id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  custom_variables?: Record<string, string>;
}) {
  const res = await fetch(`${BASE_URL}/v2/leads`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instantly add lead failed: ${res.status} ${text}`);
  }

  return res.json();
}

// ── Pause lead sequence (on "Booked") ──

export async function pauseLeadSequence(email: string, campaignId?: string) {
  // Uses v1 endpoint — still active and preferred for status updates
  const key = process.env.INSTANTLY_API_KEY;
  const cid =
    campaignId ||
    process.env.INSTANTLY_CAMPAIGN_ID_A ||
    process.env.INSTANTLY_CAMPAIGN_ID_B;

  const res = await fetch(`${BASE_URL}/v1/lead/update/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      campaign_id: cid,
      email,
      new_status: "Meeting Booked",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instantly pause failed: ${res.status} ${text}`);
  }

  return res.json();
}
