import { NextResponse } from "next/server";
import { bookMeeting } from "@/lib/google-calendar";
import { pauseLeadSequence } from "@/lib/instantly";
import { notifyBooked } from "@/lib/notify";
import { updateMultipleCells } from "@/lib/google-sheets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      rowIndex,
      leadName,
      businessName,
      phone,
      leadEmail,
      talkingPoint,
      callNumber,
      startTime,
      endTime,
    } = body;

    // 1. Update Google Sheet first (always succeeds independently)
    await updateMultipleCells("Call Queue", rowIndex, {
      call_outcome: "booked",
      booked_at: new Date().toISOString(),
    });

    // 2. Try to pause Instantly sequence (non-blocking)
    let instantlyResult = null;
    try {
      if (process.env.INSTANTLY_API_KEY && leadEmail) {
        instantlyResult = await pauseLeadSequence(leadEmail);
      }
    } catch (e) {
      console.error("Instantly pause failed (non-blocking):", e);
    }

    // 3. Try to create Google Calendar event
    let calendarResult = null;
    try {
      if (process.env.GOOGLE_CALENDAR_OWNER_EMAIL) {
        calendarResult = await bookMeeting({
          leadName,
          businessName,
          phone,
          leadEmail,
          talkingPoint,
          startTime,
          endTime,
        });
      }
    } catch (e) {
      console.error("Calendar booking failed (non-blocking):", e);
    }

    // 4. Try to send notification email
    try {
      if (process.env.SMTP_USER) {
        const displayTime = new Date(startTime).toLocaleString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/Denver",
        });

        await notifyBooked({
          leadName,
          businessName,
          phone,
          scheduledTime: displayTime,
          meetLink: calendarResult?.meetLink || "",
          callNumber,
          talkingPoint,
        });
      }
    } catch (e) {
      console.error("Notification email failed (non-blocking):", e);
    }

    return NextResponse.json({
      success: true,
      sheetUpdated: true,
      instantlyPaused: !!instantlyResult,
      calendarBooked: !!calendarResult,
      meetLink: calendarResult?.meetLink || null,
    });
  } catch (error) {
    console.error("Book error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Booking failed" },
      { status: 500 }
    );
  }
}
