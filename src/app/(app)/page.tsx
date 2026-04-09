"use client";

import Link from "next/link";
import { useCallQueue, useFbQueue, useInstantlyStats } from "@/hooks/use-pipeline-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Phone,
  MessageCircle,
  Trophy,
  Mail,
  MailOpen,
  MessageSquare,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const today = new Date().toISOString().split("T")[0];
  const { data: calls, isLoading: callsLoading, mutate: mutateCalls } = useCallQueue(today);
  const { data: fbTasks, isLoading: fbLoading, mutate: mutateFb } = useFbQueue(today);
  const { data: instantly, isLoading: instantlyLoading, mutate: mutateInstantly } = useInstantlyStats();

  const callsDone = calls?.filter((c) => c.call_outcome).length || 0;
  const callsTotal = calls?.length || 0;
  const fbDone = fbTasks?.filter((t) => t.fb_status).length || 0;
  const fbTotal = fbTasks?.length || 0;
  const bookedToday = calls?.filter((c) => c.call_outcome === "booked").length || 0;

  const isLoading = callsLoading || fbLoading;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  function refreshAll() {
    mutateCalls();
    mutateFb();
    mutateInstantly();
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, Daniel.
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here&apos;s your day.</p>
        </div>
        <Button variant="outline" size="icon" onClick={refreshAll} className="h-9 w-9">
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Progress rings */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatRing
          icon={Phone}
          label="Calls"
          value={callsDone}
          total={callsTotal}
          color="text-info"
          loading={callsLoading}
        />
        <StatRing
          icon={MessageCircle}
          label="Facebook"
          value={fbDone}
          total={fbTotal}
          color="text-primary"
          loading={fbLoading}
        />
        <StatRing
          icon={Trophy}
          label="Booked"
          value={bookedToday}
          total={undefined}
          color="text-success"
          loading={callsLoading}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/calls">
          <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-4 hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <Phone className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm font-bold">Start Calling</p>
                <p className="text-xs text-muted-foreground">{callsTotal - callsDone} remaining</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>

        <Link href="/fb">
          <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-4 hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">FB Queue</p>
                <p className="text-xs text-muted-foreground">{fbTotal - fbDone} remaining</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
      </div>

      {/* Instantly stats */}
      {(instantly || instantlyLoading) && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Email Campaign
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard
              icon={MailOpen}
              label="Open Rate"
              value={instantly ? `${(instantly.open_rate * 100).toFixed(1)}%` : "—"}
              loading={instantlyLoading}
            />
            <MetricCard
              icon={MessageSquare}
              label="Reply Rate"
              value={instantly ? `${(instantly.reply_rate * 100).toFixed(1)}%` : "—"}
              loading={instantlyLoading}
            />
            <MetricCard
              icon={Mail}
              label="Emails Sent"
              value={instantly ? instantly.emails_sent.toLocaleString() : "—"}
              loading={instantlyLoading}
            />
            <MetricCard
              icon={Phone}
              label="Active Leads"
              value={instantly ? instantly.active_leads.toLocaleString() : "—"}
              loading={instantlyLoading}
            />
          </div>
        </div>
      )}

      {/* Recent activity */}
      {calls && calls.filter((c) => c.call_outcome).length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Recent Activity
          </h2>
          <div className="space-y-1.5">
            {calls
              .filter((c) => c.call_outcome)
              .slice(0, 5)
              .map((c) => (
                <div
                  key={c.rowIndex}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                    c.call_outcome === "booked" && "bg-success/5"
                  )}
                >
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    c.call_outcome === "booked" && "bg-success",
                    c.call_outcome === "connected" && "bg-info",
                    c.call_outcome === "voicemail" && "bg-muted-foreground",
                    c.call_outcome === "no_answer" && "bg-muted-foreground/40",
                    c.call_outcome === "callback" && "bg-warning",
                    c.call_outcome === "not_interested" && "bg-destructive"
                  )} />
                  <span className="font-medium">{c.call_outcome}</span>
                  <span className="text-muted-foreground">
                    {c.owner_first_name} — {c.business_name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatRing({
  icon: Icon,
  label,
  value,
  total,
  color,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  total?: number;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border bg-card px-3 py-4">
      <Icon className={cn("h-5 w-5 mb-1", color)} />
      {loading ? (
        <div className="h-8 w-12 animate-pulse rounded bg-muted my-1" />
      ) : (
        <p className="font-heading text-2xl font-bold tracking-tight">
          {value}
          {total !== undefined && (
            <span className="text-sm font-normal text-muted-foreground">/{total}</span>
          )}
        </p>
      )}
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      {loading ? (
        <div className="h-7 w-16 animate-pulse rounded bg-muted" />
      ) : (
        <p className="font-heading text-xl font-bold">{value}</p>
      )}
    </div>
  );
}
