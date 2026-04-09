"use client";

import { useState, useCallback } from "react";
import { useCallQueue } from "@/hooks/use-pipeline-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BookingSheet } from "@/components/booking-sheet";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CallOutcome, CallQueueRow } from "@/lib/types";
import {
  Phone,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CalendarDays,
} from "lucide-react";

const OUTCOMES: { value: CallOutcome; label: string; className: string }[] = [
  { value: "connected", label: "Connected", className: "outcome-connected" },
  { value: "voicemail", label: "Voicemail", className: "outcome-voicemail" },
  { value: "no_answer", label: "No Answer", className: "outcome-no-answer" },
  { value: "callback", label: "Callback", className: "outcome-callback" },
  { value: "not_interested", label: "Not Int.", className: "outcome-not-interested" },
  { value: "booked", label: "BOOKED", className: "outcome-booked" },
];

export default function CallsPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: calls, mutate, isLoading } = useCallQueue(date);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [bookingCall, setBookingCall] = useState<CallQueueRow | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<number, CallOutcome>>({});

  const filtered = calls?.filter((c) => {
    const outcome = optimisticUpdates[c.rowIndex] || c.call_outcome;
    if (filter === "pending") return !outcome;
    if (filter === "done") return !!outcome;
    return true;
  });

  const totalCalls = calls?.length || 0;
  const doneCalls = calls?.filter((c) => optimisticUpdates[c.rowIndex] || c.call_outcome).length || 0;
  const progressPct = totalCalls > 0 ? (doneCalls / totalCalls) * 100 : 0;

  const handleOutcome = useCallback(async (call: CallQueueRow, outcome: CallOutcome) => {
    if (outcome === "booked") {
      setBookingCall(call);
      return;
    }

    // Optimistic update
    setOptimisticUpdates((prev) => ({ ...prev, [call.rowIndex]: outcome }));

    try {
      const res = await fetch("/api/sheets/call-queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: call.rowIndex,
          updates: { call_outcome: outcome },
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      toast.success(`Logged: ${outcome}`, {
        description: `${call.owner_first_name} — ${call.business_name}`,
      });

      mutate();
    } catch {
      setOptimisticUpdates((prev) => {
        const next = { ...prev };
        delete next[call.rowIndex];
        return next;
      });
      toast.error("Sync failed", { description: "Retrying..." });
    }
  }, [mutate]);

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Call Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {doneCalls} of {totalCalls} done
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="pl-10 w-40 h-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => mutate()} className="h-9 w-9">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progressPct} className="h-2 mb-4" />

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">All ({totalCalls})</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">Pending ({totalCalls - doneCalls})</TabsTrigger>
          <TabsTrigger value="done" className="flex-1">Done ({doneCalls})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered?.length === 0 && (
        <div className="text-center py-16">
          <Phone className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">No calls scheduled</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {filter === "pending" ? "All done for today" : "Check a different date"}
          </p>
        </div>
      )}

      {/* Call cards */}
      <div className="space-y-3">
        {filtered?.map((call) => {
          const currentOutcome = optimisticUpdates[call.rowIndex] || call.call_outcome;
          const isExpanded = expandedId === call.rowIndex;
          const isDone = !!currentOutcome;

          return (
            <div
              key={call.rowIndex}
              className={cn(
                "rounded-xl border bg-card transition-all",
                isDone && currentOutcome === "booked" && "border-success bg-success/5",
                isDone && currentOutcome === "not_interested" && "border-destructive/30 opacity-60",
                isDone && currentOutcome !== "booked" && currentOutcome !== "not_interested" && "opacity-60"
              )}
            >
              <div className="px-4 py-3.5">
                {/* Top row */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Call {call.call_number}/5
                    </span>
                    {call.voicemail_ok && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">VM OK</Badge>
                    )}
                    {isDone && (
                      <Badge
                        className={cn(
                          "text-[10px] px-1.5 py-0",
                          currentOutcome === "booked" && "outcome-booked",
                          currentOutcome === "connected" && "outcome-connected",
                          currentOutcome === "not_interested" && "outcome-not-interested",
                          currentOutcome === "callback" && "outcome-callback",
                          currentOutcome === "voicemail" && "outcome-voicemail",
                          currentOutcome === "no_answer" && "outcome-no-answer"
                        )}
                      >
                        {currentOutcome}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold leading-tight">
                  {call.owner_first_name} {call.owner_last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{call.business_name}</p>

                {/* Phone — tap to call */}
                <a
                  href={`tel:${call.phone}`}
                  className="inline-flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {call.phone}
                </a>

                {/* Talking point (collapsible) */}
                {call.call_talking_point && (
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : call.rowIndex)}
                    className="flex items-center gap-1 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    Talking point
                  </button>
                )}
                {isExpanded && call.call_talking_point && (
                  <p className="mt-1.5 text-sm text-foreground/80 bg-muted/50 rounded-lg px-3 py-2">
                    {call.call_talking_point}
                  </p>
                )}

                {/* Notes */}
                {call.notes && (
                  <p className="mt-2 text-xs text-muted-foreground italic">{call.notes}</p>
                )}

                {/* Outcome buttons */}
                {!isDone && (
                  <div className="grid grid-cols-3 gap-1.5 mt-3">
                    {OUTCOMES.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => handleOutcome(call, o.value)}
                        className={cn(
                          "rounded-lg py-2.5 text-xs font-bold transition-all active:scale-95",
                          o.className,
                          o.value === "booked" && "col-span-3 py-3 text-sm"
                        )}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking sheet */}
      <BookingSheet
        open={!!bookingCall}
        onOpenChange={(open) => !open && setBookingCall(null)}
        call={bookingCall}
        onBooked={() => {
          if (bookingCall) {
            setOptimisticUpdates((prev) => ({ ...prev, [bookingCall.rowIndex]: "booked" }));
          }
          mutate();
        }}
      />
    </div>
  );
}
