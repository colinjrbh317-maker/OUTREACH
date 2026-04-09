"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCalendarSlots } from "@/hooks/use-pipeline-data";
import { toast } from "sonner";
import type { CallQueueRow } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  call: CallQueueRow | null;
  onBooked: () => void;
}

export function BookingSheet({ open, onOpenChange, call, onBooked }: BookingSheetProps) {
  const { data: slots, isLoading: slotsLoading } = useCalendarSlots();
  const [step, setStep] = useState<"time" | "email">("time");
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string; display: string } | null>(null);
  const [customTime, setCustomTime] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset state when opened
  function handleOpenChange(val: boolean) {
    if (val && call) {
      setStep("time");
      setSelectedSlot(null);
      setCustomTime("");
      setEmail(call.owner_email || "");
    }
    onOpenChange(val);
  }

  async function handleConfirm() {
    if (!call || !selectedSlot) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/calendar/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex: call.rowIndex,
          leadName: `${call.owner_first_name} ${call.owner_last_name}`.trim(),
          businessName: call.business_name,
          phone: call.phone,
          leadEmail: email,
          talkingPoint: call.call_talking_point,
          callNumber: call.call_number,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Fire confetti
        const confetti = (await import("canvas-confetti")).default;
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#2d6a2e", "#4CAF50", "#81C784"],
        });

        toast.success("Demo booked!", {
          description: `${call.owner_first_name} — ${selectedSlot.display}`,
        });
        onBooked();
        onOpenChange(false);
      } else {
        toast.error("Booking failed", { description: data.error });
      }
    } catch {
      toast.error("Network error — sheet was still updated");
    } finally {
      setSubmitting(false);
    }
  }

  if (!call) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left">
            {step === "time" ? "Pick a time" : "Confirm email"}
          </SheetTitle>
        </SheetHeader>

        {step === "time" && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Available slots on Colin&apos;s calendar:
            </p>

            {slotsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {slots?.map((slot) => (
                  <button
                    key={slot.start}
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "flex w-full items-center rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
                      selectedSlot?.start === slot.start
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    {slot.display}
                  </button>
                ))}

                {(!slots || slots.length === 0) && (
                  <p className="text-sm text-muted-foreground">No available slots found</p>
                )}
              </div>
            )}

            <div className="pt-2">
              <Label className="text-xs text-muted-foreground">Or enter custom time</Label>
              <Input
                type="datetime-local"
                value={customTime}
                onChange={(e) => {
                  setCustomTime(e.target.value);
                  if (e.target.value) {
                    const start = new Date(e.target.value);
                    const end = new Date(start.getTime() + 30 * 60 * 1000);
                    setSelectedSlot({
                      start: start.toISOString(),
                      end: end.toISOString(),
                      display: start.toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      }),
                    });
                  }
                }}
                className="mt-1"
              />
            </div>

            <Button
              onClick={() => setStep("email")}
              disabled={!selectedSlot}
              className="w-full h-12 text-base font-semibold mt-4"
            >
              Next — Confirm Email
            </Button>
          </div>
        )}

        {step === "email" && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg bg-muted/50 px-4 py-3">
              <p className="text-xs text-muted-foreground">Scheduled for</p>
              <p className="font-medium">{selectedSlot?.display}</p>
            </div>

            <div>
              <Label>Lead&apos;s email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@company.com"
                className="mt-1 h-12 text-base"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Calendar invite sent to this email + colin@socialtheorymedia.com
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep("time")}
                className="flex-1 h-12"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 h-12 text-base font-semibold outcome-booked"
              >
                {submitting ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
