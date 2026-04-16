import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import type { Submission, SubmissionStatus, SupportTier } from "@/lib/types";
import { SUPPORT_OPTIONS, BUSINESS_STAGES } from "@/lib/types";
import { getSubmissions, updateSubmission } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { ArrowLeft, Users, Sparkles, Target, Rocket, X } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Staff Dashboard — HCC" },
      { name: "description", content: "Internal staff dashboard for managing intake submissions." },
    ],
  }),
  component: AdminPage,
});

const statusColors: Record<SubmissionStatus, string> = {
  New: "bg-chart-4/15 text-chart-4 border-chart-4/20",
  "In Review": "bg-tier-2/15 text-tier-2 border-tier-2/20",
  Routed: "bg-tier-1/15 text-tier-1 border-tier-1/20",
  Closed: "bg-muted text-muted-foreground border-border",
};

const tierLabels: Record<SupportTier, string> = {
  tier1: "Foundational",
  tier2: "Targeted",
  tier3: "Ongoing",
};

function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>(getSubmissions);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (stageFilter !== "all" && s.businessStage !== stageFilter) return false;
      if (tierFilter !== "all" && s.tier !== tierFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      return true;
    });
  }, [submissions, stageFilter, tierFilter, statusFilter]);

  const metrics = useMemo(() => ({
    total: submissions.length,
    tier1: submissions.filter((s) => s.tier === "tier1").length,
    tier2: submissions.filter((s) => s.tier === "tier2").length,
    tier3: submissions.filter((s) => s.tier === "tier3").length,
  }), [submissions]);

  const selected = selectedId ? submissions.find((s) => s.id === selectedId) : null;

  const handleUpdate = (id: string, updates: Partial<Pick<Submission, "status" | "assignedTo" | "notes">>) => {
    const updated = updateSubmission(id, updates);
    setSubmissions(updated);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="font-heading font-bold text-lg text-foreground">Staff Dashboard</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Submissions", value: metrics.total, icon: Users, color: "text-foreground" },
            { label: "Foundational", value: metrics.tier1, icon: Sparkles, color: "text-tier-1" },
            { label: "Targeted", value: metrics.tier2, icon: Target, color: "text-tier-2" },
            { label: "Ongoing", value: metrics.tier3, icon: Rocket, color: "text-tier-3" },
          ].map((m) => (
            <Card key={m.label} className="border shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <m.icon className={`h-5 w-5 ${m.color}`} />
                <div>
                  <p className="text-2xl font-bold font-heading">{m.value}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Business Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {BUSINESS_STAGES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="tier1">Foundational</SelectItem>
              <SelectItem value="tier2">Targeted</SelectItem>
              <SelectItem value="tier3">Ongoing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="In Review">In Review</SelectItem>
              <SelectItem value="Routed">Routed</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table + Detail panel */}
        <div className="flex gap-6">
          <div className={`${selected ? "hidden md:block md:flex-1" : "flex-1"} overflow-auto`}>
            <Card className="border shadow-sm">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Business</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No submissions match your filters.
                        </TableCell>
                      </TableRow>
                    ) : filtered.map((sub) => (
                      <TableRow
                        key={sub.id}
                        className={`cursor-pointer ${selectedId === sub.id ? "bg-muted/50" : ""}`}
                        onClick={() => setSelectedId(sub.id)}
                      >
                        <TableCell className="font-medium">{sub.fullName}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{sub.businessName || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {tierLabels[sub.tier]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColors[sub.status]}`}>
                            {sub.status}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                          {new Date(sub.submittedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          {/* Detail Panel */}
          {selected && (
            <Card className="w-full md:w-96 shrink-0 border shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-heading font-semibold">{selected.fullName}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-3 text-sm">
                  <DetailRow label="Business" value={selected.businessName || "—"} />
                  <DetailRow label="Email" value={selected.email} />
                  <DetailRow label="Phone" value={selected.phone || "—"} />
                  <DetailRow label="Stage" value={BUSINESS_STAGES.find((s) => s.value === selected.businessStage)?.label || "—"} />
                  <DetailRow label="Location" value={selected.borough || "—"} />
                  <DetailRow label="Industry" value={selected.businessType || "—"} />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Support Needs</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.supportNeeds.map((n) => (
                        <span key={n} className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {SUPPORT_OPTIONS.find((o) => o.value === n)?.label || n}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selected.biggestChallenge && <DetailRow label="Challenge" value={selected.biggestChallenge} />}
                </div>
                <div className="border-t pt-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Select value={selected.status} onValueChange={(v) => handleUpdate(selected.id, { status: v as SubmissionStatus })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="In Review">In Review</SelectItem>
                        <SelectItem value="Routed">Routed</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Assigned To</label>
                    <Input
                      value={selected.assignedTo}
                      onChange={(e) => handleUpdate(selected.id, { assignedTo: e.target.value })}
                      placeholder="Staff member name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Notes</label>
                    <Textarea
                      value={selected.notes}
                      onChange={(e) => handleUpdate(selected.id, { notes: e.target.value })}
                      placeholder="Add internal notes..."
                      className="mt-1 min-h-[80px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
