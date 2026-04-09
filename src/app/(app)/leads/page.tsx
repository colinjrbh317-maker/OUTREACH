"use client";

import { useState } from "react";
import { useLeads } from "@/hooks/use-pipeline-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { LeadRow } from "@/lib/types";
import {
  Search,
  RefreshCw,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  Users,
  ChevronRight,
} from "lucide-react";

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const { data: leads, mutate, isLoading } = useLeads(search);
  const [selected, setSelected] = useState<LeadRow | null>(null);

  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold tracking-tight">All Leads</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{leads?.length || 0} leads</span>
          <Button variant="outline" size="icon" onClick={() => mutate()} className="h-9 w-9">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, business, phone, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11"
        />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && leads?.length === 0 && (
        <div className="text-center py-16">
          <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">No leads found</p>
        </div>
      )}

      {/* Mobile: card list. Desktop: table. */}
      <div className="md:hidden space-y-1.5">
        {leads?.map((lead) => (
          <button
            key={lead.rowIndex}
            onClick={() => setSelected(lead)}
            className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left hover:border-primary/30 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {lead.owner_first_name} {lead.owner_last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{lead.business_name}</p>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              <StatusBadge status={lead.email_status} />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
              <th className="px-3 py-2.5 font-medium">Business</th>
              <th className="px-3 py-2.5 font-medium">Owner</th>
              <th className="px-3 py-2.5 font-medium">Phone</th>
              <th className="px-3 py-2.5 font-medium">Email</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Variant</th>
            </tr>
          </thead>
          <tbody>
            {leads?.map((lead) => (
              <tr
                key={lead.rowIndex}
                onClick={() => setSelected(lead)}
                className="border-b cursor-pointer hover:bg-muted/30 transition-colors"
              >
                <td className="px-3 py-2.5 font-medium">{lead.business_name}</td>
                <td className="px-3 py-2.5">{lead.owner_first_name} {lead.owner_last_name}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{lead.phone}</td>
                <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[200px]">{lead.owner_email}</td>
                <td className="px-3 py-2.5"><StatusBadge status={lead.email_status} /></td>
                <td className="px-3 py-2.5">
                  {lead.variant && <Badge variant="outline" className="text-[10px]">{lead.variant}</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lead detail slide-out */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left text-lg">
                  {selected.owner_first_name} {selected.owner_last_name}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                <p className="text-base font-semibold">{selected.business_name}</p>

                <div className="space-y-2.5">
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-sm text-primary">
                      <Phone className="h-4 w-4" /> {selected.phone}
                    </a>
                  )}
                  {selected.owner_email && (
                    <a href={`mailto:${selected.owner_email}`} className="flex items-center gap-2 text-sm text-primary">
                      <Mail className="h-4 w-4" /> {selected.owner_email}
                    </a>
                  )}
                  {selected.website && (
                    <a href={selected.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary">
                      <Globe className="h-4 w-4" /> {selected.website}
                    </a>
                  )}
                  {selected.full_address && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {selected.full_address}
                    </p>
                  )}
                  {selected.rating && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4" /> {selected.rating} ({selected.review_count} reviews)
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Personalization
                  </h3>
                  {selected.opening_line && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground">Opening line</p>
                      <p className="text-sm">{selected.opening_line}</p>
                    </div>
                  )}
                  {selected.call_talking_point && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground">Call talking point</p>
                      <p className="text-sm">{selected.call_talking_point}</p>
                    </div>
                  )}
                  {selected.ps_line && (
                    <div>
                      <p className="text-xs text-muted-foreground">PS line</p>
                      <p className="text-sm">{selected.ps_line}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <StatusBadge status={selected.email_status} />
                  {selected.variant && <Badge variant="outline" className="text-[10px]">Variant {selected.variant}</Badge>}
                  {selected.email_source && <span>via {selected.email_source}</span>}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (!status) return null;
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-[10px]",
        status === "valid" && "bg-success/10 text-success",
        status === "catch_all" && "bg-warning/10 text-warning",
        status === "invalid" && "bg-destructive/10 text-destructive"
      )}
    >
      {status}
    </Badge>
  );
}
