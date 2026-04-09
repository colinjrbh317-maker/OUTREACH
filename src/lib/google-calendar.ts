import { google } from "googleapis";
import { getAuth } from "./google-sheets";
import type { CalendarSlot } from "./types";

const OWNER_EMAIL = () =>
  process.env.GOOGLE_CALENDAR_OWNER_EMAIL || "colin@socialtheorymedia.com";

function getCalendar() {
  const auth = getAuth();
  // Impersonate Colin's workspace account for calendar operations
  const impersonatedAuth = new google.auth.GoogleAuth({
    credentials: JSON.parse(
      Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "", "base64").toString("utf-8")
    ),
    scopes: ["https://www.googleapis.com/auth/calendar"],
    clientOptions: { subject: OWNER_EMAIL() },
  });

  return google.calendar({ version: "v3", auth: impersonatedAuth });
}

// ── Get available slots ──

export async function getAvailableSlots(
  daysAhead: number = 7,
  slotDuration: number = 30
): Promise<CalendarSlot[]> {
  const calendar = getCalendar();
  const now = new Date();
  const end = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const busyRes = await calendar.freebusy.query({
    requestBody: {
      timeMin: now.toISOString(),
      timeMax: end.toISOString(),
      items: [{ id: OWNER_EMAIL() }],
    },
  });

  const busy = busyRes.data.calendars?.[OWNER_EMAIL()]?.busy || [];

  // Generate 30-min slots during business hours (9 AM - 5 PM MT)
  const slots: CalendarSlot[] = [];
  const current = new Date(now);
  current.setMinutes(0, 0, 0);
  current.setHours(current.getHours() + 1); // Next full hour

  while (current < end && slots.length < 10) {
    const hour = current.getHours();
    const day = current.getDay();

    // Skip weekends and non-business hours
    if (day === 0 || day === 6 || hour < 9 || hour >= 17) {
      if (day === 0 || day === 6) {
        current.setDate(current.getDate() + 1);
        current.setHours(9, 0, 0, 0);
      } else {
        current.setHours(hour < 9 ? 9 : 9, 0, 0, 0);
        if (hour >= 17) current.setDate(current.getDate() + 1);
      }
      continue;
    }

    const slotEnd = new Date(current.getTime() + slotDuration * 60 * 1000);

    // Check if slot overlaps with any busy period
    const isBusy = busy.some((b) => {
      const bStart = new Date(b.start!);
      const bEnd = new Date(b.end!);
      return current < bEnd && slotEnd > bStart;
    });

    if (!isBusy) {
      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
        display: current.toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/Denver",
        }),
      });
    }

    current.setMinutes(current.getMinutes() + slotDuration);
  }

  return slots;
}

// ── Book a meeting ──

export async function bookMeeting(params: {
  leadName: string;
  businessName: string;
  phone: string;
  leadEmail: string;
  talkingPoint: string;
  startTime: string;
  endTime: string;
}) {
  const calendar = getCalendar();

  const event = await calendar.events.insert({
    calendarId: OWNER_EMAIL(),
    conferenceDataVersion: 1,
    requestBody: {
      summary: `Colin / ${params.leadName}`,
      description: [
        `${params.businessName} | ${params.phone}`,
        `Booked by Daniel`,
        ``,
        `Talking point: ${params.talkingPoint}`,
      ].join("\n"),
      start: { dateTime: params.startTime, timeZone: "America/Denver" },
      end: { dateTime: params.endTime, timeZone: "America/Denver" },
      attendees: [
        { email: OWNER_EMAIL() },
        { email: params.leadEmail },
      ],
      conferenceData: {
        createRequest: {
          requestId: `pipeline-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  return {
    eventId: event.data.id,
    htmlLink: event.data.htmlLink,
    meetLink: event.data.conferenceData?.entryPoints?.[0]?.uri || "",
  };
}
