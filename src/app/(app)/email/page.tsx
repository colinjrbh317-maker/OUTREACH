"use client";

import { useState } from "react";
import { useLeads } from "@/hooks/use-pipeline-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { LeadRow } from "@/lib/types";
import { Send, UserPlus, Search } from "lucide-react";

export default function EmailPage() {
  return (
    <div className="px-4 py-5 md:px-8 md:py-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold tracking-tight mb-5">Email</h1>

      <Tabs defaultValue="compose">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="compose" className="flex-1 gap-2">
            <Send className="h-3.5 w-3.5" /> Compose
          </TabsTrigger>
          <TabsTrigger value="add" className="flex-1 gap-2">
            <UserPlus className="h-3.5 w-3.5" /> Add to Campaign
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <ComposeTab />
        </TabsContent>
        <TabsContent value="add">
          <AddToCampaignTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ComposeTab() {
  const [search, setSearch] = useState("");
  const { data: leads } = useLeads(search);
  const [selected, setSelected] = useState<LeadRow | null>(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  function selectLead(lead: LeadRow) {
    setSelected(lead);
    setTo(lead.owner_email);
    setSubject(`Quick question about ${lead.business_name}`);
    setBody(
      [lead.opening_line, "", lead.call_talking_point, "", lead.ps_line ? `P.S. ${lead.ps_line}` : ""]
        .filter(Boolean)
        .join("\n")
    );
    setSearch("");
  }

  async function handleSend() {
    setSending(true);
    try {
      const res = await fetch("/api/instantly/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });

      if (!res.ok) throw new Error("Send failed");

      toast.success("Email sent!", { description: `To ${to}` });
      setSelected(null);
      setTo("");
      setSubject("");
      setBody("");
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {!selected && (
        <div>
          <Label>Search for a lead</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Name, business, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {search.length >= 2 && leads && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border">
              {leads.slice(0, 8).map((lead) => (
                <button
                  key={lead.rowIndex}
                  onClick={() => selectLead(lead)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  <span className="font-medium">{lead.owner_first_name} {lead.owner_last_name}</span>
                  <span className="text-muted-foreground text-xs">{lead.business_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <div>
              <p className="text-sm font-medium">{selected.owner_first_name} {selected.owner_last_name}</p>
              <p className="text-xs text-muted-foreground">{selected.business_name}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              Change
            </Button>
          </div>

          <div>
            <Label>To</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label>Body</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="mt-1 resize-none"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !to || !body}
            className="w-full h-12 text-base font-semibold"
          >
            {sending ? "Sending..." : "Send via Instantly"}
          </Button>
        </>
      )}
    </div>
  );
}

function AddToCampaignTab() {
  const [search, setSearch] = useState("");
  const { data: leads } = useLeads(search);
  const [selected, setSelected] = useState<LeadRow | null>(null);
  const [variant, setVariant] = useState<"A" | "B">("A");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!selected) return;
    setAdding(true);

    try {
      const res = await fetch("/api/instantly/add-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selected.owner_email,
          first_name: selected.owner_first_name,
          last_name: selected.owner_last_name,
          company_name: selected.business_name,
          variant,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success("Lead added to campaign!", {
        description: `${selected.owner_first_name} → Variant ${variant}`,
      });
      setSelected(null);
    } catch {
      toast.error("Failed to add lead");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      {!selected && (
        <div>
          <Label>Search for a lead</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Name, business, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {search.length >= 2 && leads && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border">
              {leads.slice(0, 8).map((lead) => (
                <button
                  key={lead.rowIndex}
                  onClick={() => { setSelected(lead); setSearch(""); }}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  <span className="font-medium">{lead.owner_first_name} {lead.owner_last_name}</span>
                  <span className="text-muted-foreground text-xs">{lead.business_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selected && (
        <>
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <div>
              <p className="text-sm font-medium">{selected.owner_first_name} {selected.owner_last_name}</p>
              <p className="text-xs text-muted-foreground">{selected.owner_email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              Change
            </Button>
          </div>

          <div>
            <Label>Campaign Variant</Label>
            <Select value={variant} onValueChange={(v) => setVariant(v as "A" | "B")}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">Variant A (PAS / Direct)</SelectItem>
                <SelectItem value="B">Variant B (BAB / Consultative)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAdd}
            disabled={adding}
            className="w-full h-12 text-base font-semibold"
          >
            {adding ? "Adding..." : "Add to Campaign"}
          </Button>
        </>
      )}
    </div>
  );
}
