// ── Pipeline CRM Types ──

export type CallOutcome =
  | "connected"
  | "voicemail"
  | "no_answer"
  | "callback"
  | "not_interested"
  | "booked";

export type FbAction = "friend_request" | "dm_1" | "dm_2" | "dm_3";

export type FbStatus = "sent" | "accepted" | "replied" | "skipped" | "";

export interface CallQueueRow {
  rowIndex: number;
  call_date: string;
  owner_first_name: string;
  owner_last_name: string;
  business_name: string;
  phone: string;
  owner_email: string;
  call_number: number;
  voicemail_ok: boolean;
  call_talking_point: string;
  call_outcome: CallOutcome | "";
  booked_at: string;
  notes: string;
}

export interface FbQueueRow {
  rowIndex: number;
  fb_date: string;
  owner_first_name: string;
  business_name: string;
  fb_action: FbAction;
  fb_message_template: string;
  fb_status: FbStatus;
}

export interface LeadRow {
  rowIndex: number;
  business_name: string;
  category: string;
  full_address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  website: string;
  google_maps_url: string;
  rating: string;
  review_count: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
  owner_phone: string;
  email_source: string;
  email_status: string;
  opening_line: string;
  ps_line: string;
  call_talking_point: string;
  variant: "A" | "B" | "";
  instantly_status: string;
  date_added: string;
}

export interface PipelineLogRow {
  run_date: string;
  phase: string;
  leads_in: number;
  leads_out: number;
  duration_seconds: number;
  errors: string;
  notes: string;
}

export interface InstantlyStats {
  open_rate: number;
  reply_rate: number;
  emails_sent: number;
  bounced: number;
  active_leads: number;
}

export interface DashboardData {
  calls_today: number;
  calls_done: number;
  fb_today: number;
  fb_done: number;
  booked_this_week: number;
  instantly: InstantlyStats | null;
  recent_activity: ActivityItem[];
}

export interface ActivityItem {
  type: "call" | "fb" | "email" | "booked";
  description: string;
  timestamp: string;
}

export interface CalendarSlot {
  start: string;
  end: string;
  display: string;
}
