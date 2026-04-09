"use client";

import useSWR from "swr";
import type { CallQueueRow, FbQueueRow, LeadRow, PipelineLogRow, InstantlyStats } from "@/lib/types";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useCallQueue(date?: string) {
  const d = date || new Date().toISOString().split("T")[0];
  return useSWR<CallQueueRow[]>(`/api/sheets/call-queue?date=${d}`, fetcher, {
    refreshInterval: REFRESH_INTERVAL,
    revalidateOnFocus: true,
  });
}

export function useFbQueue(date?: string) {
  const d = date || new Date().toISOString().split("T")[0];
  return useSWR<FbQueueRow[]>(`/api/sheets/fb-queue?date=${d}`, fetcher, {
    refreshInterval: REFRESH_INTERVAL,
    revalidateOnFocus: true,
  });
}

export function useLeads(search?: string, status?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  return useSWR<LeadRow[]>(`/api/sheets/leads?${params}`, fetcher, {
    refreshInterval: REFRESH_INTERVAL,
  });
}

export function usePipelineLog() {
  return useSWR<PipelineLogRow[]>("/api/sheets/pipeline-log", fetcher, {
    refreshInterval: REFRESH_INTERVAL * 2,
  });
}

export function useInstantlyStats() {
  return useSWR<InstantlyStats | null>("/api/instantly/stats", fetcher, {
    refreshInterval: REFRESH_INTERVAL,
  });
}

export function useCalendarSlots() {
  return useSWR<Array<{ start: string; end: string; display: string }>>(
    "/api/calendar/slots",
    fetcher
  );
}
