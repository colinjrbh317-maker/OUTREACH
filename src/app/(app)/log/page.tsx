"use client";

import { usePipelineLog } from "@/hooks/use-pipeline-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RefreshCw, FileText } from "lucide-react";

export default function LogPage() {
  const { data: logs, mutate, isLoading } = usePipelineLog();

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold tracking-tight">Pipeline Log</h1>
        <Button variant="outline" size="icon" onClick={() => mutate()} className="h-9 w-9">
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
        </div>
      )}

      {!isLoading && (!logs || logs.length === 0) && (
        <div className="text-center py-16">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">No pipeline runs yet</p>
        </div>
      )}

      {/* Mobile: cards */}
      <div className="md:hidden space-y-2">
        {logs?.map((log, i) => (
          <div key={i} className={cn(
            "rounded-lg border bg-card px-4 py-3",
            log.errors && "border-destructive/30"
          )}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{log.phase}</span>
              <span className="text-xs text-muted-foreground">{log.run_date}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{log.leads_in} in → {log.leads_out} out</span>
              <span>{log.duration_seconds}s</span>
              {log.errors && <Badge variant="destructive" className="text-[10px]">Error</Badge>}
            </div>
            {log.errors && <p className="mt-1 text-xs text-destructive">{log.errors}</p>}
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
              <th className="px-3 py-2.5 font-medium">Date</th>
              <th className="px-3 py-2.5 font-medium">Phase</th>
              <th className="px-3 py-2.5 font-medium">In</th>
              <th className="px-3 py-2.5 font-medium">Out</th>
              <th className="px-3 py-2.5 font-medium">Duration</th>
              <th className="px-3 py-2.5 font-medium">Errors</th>
              <th className="px-3 py-2.5 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log, i) => (
              <tr key={i} className={cn(
                "border-b",
                log.errors && "bg-destructive/5"
              )}>
                <td className="px-3 py-2.5 text-muted-foreground">{log.run_date}</td>
                <td className="px-3 py-2.5 font-medium">{log.phase}</td>
                <td className="px-3 py-2.5">{log.leads_in}</td>
                <td className="px-3 py-2.5">{log.leads_out}</td>
                <td className="px-3 py-2.5">{log.duration_seconds}s</td>
                <td className="px-3 py-2.5 text-destructive max-w-[200px] truncate">{log.errors || "—"}</td>
                <td className="px-3 py-2.5 text-muted-foreground max-w-[200px] truncate">{log.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
