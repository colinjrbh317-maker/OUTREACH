"use client";

import { useState, useCallback } from "react";
import { useFbQueue } from "@/hooks/use-pipeline-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { FbStatus } from "@/lib/types";
import {
  MessageCircle,
  Copy,
  Check,
  RefreshCw,
  CalendarDays,
} from "lucide-react";

const FB_STATUSES: { value: FbStatus; label: string }[] = [
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "replied", label: "Replied" },
  { value: "skipped", label: "Skip" },
];

const ACTION_LABELS: Record<string, string> = {
  friend_request: "Friend Request",
  dm_1: "DM 1",
  dm_2: "DM 2",
  dm_3: "DM 3 (Breakup)",
};

export default function FbPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const { data: tasks, mutate, isLoading } = useFbQueue(date);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [optimistic, setOptimistic] = useState<Record<number, FbStatus>>({});

  const filtered = tasks?.filter((t) => {
    const status = optimistic[t.rowIndex] || t.fb_status;
    if (filter === "pending") return !status;
    if (filter === "done") return !!status;
    return true;
  });

  const total = tasks?.length || 0;
  const done = tasks?.filter((t) => optimistic[t.rowIndex] || t.fb_status).length || 0;

  const copyMessage = useCallback(async (text: string, id: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied!");
  }, []);

  const handleStatus = useCallback(async (rowIndex: number, status: FbStatus) => {
    setOptimistic((prev) => ({ ...prev, [rowIndex]: status }));

    try {
      await fetch("/api/sheets/fb-queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowIndex, updates: { fb_status: status } }),
      });
      mutate();
    } catch {
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[rowIndex];
        return next;
      });
      toast.error("Sync failed");
    }
  }, [mutate]);

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Facebook Queue</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{done} of {total} done</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-10 w-40 h-9" />
          </div>
          <Button variant="outline" size="icon" onClick={() => mutate()} className="h-9 w-9">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Progress value={total > 0 ? (done / total) * 100 : 0} className="h-2 mb-4" />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">All ({total})</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">Pending ({total - done})</TabsTrigger>
          <TabsTrigger value="done" className="flex-1">Done ({done})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>
      )}

      {!isLoading && filtered?.length === 0 && (
        <div className="text-center py-16">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">No FB tasks</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered?.map((task) => {
          const currentStatus = optimistic[task.rowIndex] || task.fb_status;
          const isDone = !!currentStatus;

          return (
            <div
              key={task.rowIndex}
              className={cn(
                "rounded-xl border bg-card transition-all",
                isDone && "opacity-60"
              )}
            >
              <div className="px-4 py-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px] font-semibold">
                    {ACTION_LABELS[task.fb_action] || task.fb_action}
                  </Badge>
                  {isDone && (
                    <Badge className="text-[10px] bg-primary/10 text-primary">
                      {currentStatus}
                    </Badge>
                  )}
                </div>

                <h3 className="text-lg font-bold leading-tight">{task.owner_first_name}</h3>
                <p className="text-sm text-muted-foreground">{task.business_name}</p>

                {task.fb_message_template && (
                  <>
                    <button
                      onClick={() => setExpandedId(expandedId === task.rowIndex ? null : task.rowIndex)}
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expandedId === task.rowIndex ? "Hide" : "Show"} message template
                    </button>

                    {expandedId === task.rowIndex && (
                      <div className="mt-2 relative">
                        <p className="text-sm bg-muted/50 rounded-lg px-3 py-2 pr-10">
                          {task.fb_message_template}
                        </p>
                        <button
                          onClick={() => copyMessage(task.fb_message_template, task.rowIndex)}
                          className="absolute right-2 top-2 p-1.5 rounded-md hover:bg-muted transition-colors"
                        >
                          {copiedId === task.rowIndex
                            ? <Check className="h-4 w-4 text-success" />
                            : <Copy className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {!isDone && (
                  <div className="flex gap-1.5 mt-3">
                    {FB_STATUSES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => handleStatus(task.rowIndex, s.value)}
                        className={cn(
                          "flex-1 rounded-lg py-2.5 text-xs font-bold transition-all active:scale-95 border",
                          s.value === "skipped"
                            ? "bg-muted text-muted-foreground"
                            : "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
