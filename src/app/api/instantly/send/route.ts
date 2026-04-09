import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/instantly";

export async function POST(request: Request) {
  try {
    const { to, subject, body } = await request.json();
    const from = process.env.INSTANTLY_FROM_EMAIL;

    if (!from) {
      return NextResponse.json({ error: "INSTANTLY_FROM_EMAIL not set" }, { status: 500 });
    }

    const result = await sendEmail({ from, to, subject, body });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Instantly send error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Send failed" },
      { status: 500 }
    );
  }
}
