// Telegram-based notifications (replaces email).
// Sends to both Colin and Daniel via their individual chat IDs.
// Set TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID_COLIN, TELEGRAM_CHAT_ID_DANIEL in env.

async function sendTelegram(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Telegram send failed (chat ${chatId}):`, err);
  }
}

async function broadcast(text: string): Promise<void> {
  const colin = process.env.TELEGRAM_CHAT_ID_COLIN || "";
  const daniel = process.env.TELEGRAM_CHAT_ID_DANIEL || "";

  // Fire both in parallel, non-blocking individually
  await Promise.allSettled([
    sendTelegram(colin, text),
    sendTelegram(daniel, text),
  ]);
}

export async function notifyBooked(params: {
  leadName: string;
  businessName: string;
  phone: string;
  scheduledTime: string;
  meetLink: string;
  callNumber: number;
  talkingPoint: string;
}) {
  const meetLine = params.meetLink
    ? `\n<a href="${params.meetLink}">Join Google Meet</a>`
    : "";

  const text = [
    `🗓 <b>Demo Booked</b>`,
    ``,
    `<b>${params.leadName}</b> — ${params.businessName}`,
    `📞 <a href="tel:${params.phone}">${params.phone}</a>`,
    `🕐 ${params.scheduledTime}`,
    `Call ${params.callNumber} of 5`,
    ``,
    `<i>${params.talkingPoint}</i>`,
    meetLine,
  ]
    .join("\n")
    .trim();

  await broadcast(text);
}

export async function notifyReply(params: {
  leadName: string;
  businessName: string;
  leadEmail: string;
  subject: string;
  replyBody: string;
  campaignVariant: string;
  emailStep: number;
}) {
  const preview = params.replyBody.slice(0, 280).trim();
  const truncated = params.replyBody.length > 280 ? "…" : "";

  const text = [
    `🔥 <b>Email Reply — reply fast</b>`,
    ``,
    `<b>${params.leadName}</b> — ${params.businessName}`,
    `📧 <a href="mailto:${params.leadEmail}">${params.leadEmail}</a>`,
    `Variant ${params.campaignVariant} · Email ${params.emailStep}`,
    ``,
    `<i>${params.subject}</i>`,
    ``,
    `"${preview}${truncated}"`,
  ]
    .join("\n")
    .trim();

  await broadcast(text);
}
