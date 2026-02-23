import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useParams, Link } from "wouter";
import {
  FileText, Shield, Scale, Wallet, Clock,
  Upload, Download, Eye, Check, AlertTriangle,
  ChevronRight, ChevronLeft, Lock, User, Search, Filter, X, Image as ImageIcon
} from "lucide-react";
import { SlideIn, FadeInView } from "@/components/PageTransition";
import { toast } from "sonner";

type TabKey = "overview" | "documents" | "diligence" | "compliance" | "escrow" | "payouts" | "audit";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: Eye },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "diligence", label: "Diligence", icon: Shield },
  { key: "compliance", label: "Compliance", icon: Scale },
  { key: "escrow", label: "Escrow", icon: Lock },
  { key: "payouts", label: "Payouts", icon: Wallet },
  { key: "audit", label: "Audit Trail", icon: Clock },
];

function getStatusClass(status: string | null): string {
  switch (status) {
    case "active": return "status-active";
    case "closed": return "status-completed";
    case "archived": return "status-declined";
    default: return "status-nda-pending";
  }
}

function getStatusLabel(status: string | null): string {
  switch (status) {
    case "active": return "Active";
    case "closed": return "Completed";
    case "archived": return "Declined";
    default: return "NDA Pending";
  }
}

function daysSince(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ room, payouts, auditEntries }: { room: any; payouts: any[]; auditEntries: any[] }) {
  return (
    <div className="space-y-6">
      {/* Deal Summary */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Deal Summary</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-label text-muted-foreground">Type</span>
            <p className="font-medium mt-0.5">Private Transaction</p>
          </div>
          <div>
            <span className="text-label text-muted-foreground">Description</span>
            <p className="font-medium mt-0.5">{room.description || "—"}</p>
          </div>
          <div>
            <span className="text-label text-muted-foreground">Created</span>
            <p className="font-medium mt-0.5">{new Date(room.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-label text-muted-foreground">Current Stage</span>
            <p className="font-medium mt-0.5">{getStatusLabel(room.status)}</p>
          </div>
        </div>
      </section>

      {/* Parties */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Parties</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { role: "Originator", name: "Party A" },
            { role: "Buyer", name: "Party B" },
            { role: "Seller", name: "Party C" },
          ].map((p) => (
            <div key={p.role} className="flex items-center gap-3 p-3 rounded-lg bg-[#F3F7FC]">
              <div className="w-9 h-9 rounded-full bg-[#D1DCF0] flex items-center justify-center">
                <User className="w-4 h-4" style={{ color: "#1E3A5F" }} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{p.role}</div>
                <div className="text-sm font-medium" style={{ color: "#0A1628" }}>{p.name}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Payout Structure Preview */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Payout Structure Preview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#D1DCF0" }}>
                <th className="text-left py-2 text-label text-muted-foreground font-medium">Role</th>
                <th className="text-right py-2 text-label text-muted-foreground font-medium">Attribution %</th>
                <th className="text-right py-2 text-label text-muted-foreground font-medium">Expected Payout</th>
              </tr>
            </thead>
            <tbody>
              {payouts && payouts.length > 0 ? (
                payouts.map((p: any, i: number) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: "#D1DCF0" }}>
                    <td className="py-2.5 font-medium">{p.role || "Participant"}</td>
                    <td className="py-2.5 text-right">{p.attributionPercentage ?? "—"}%</td>
                    <td className="py-2.5 text-right font-data-mono">${Number(p.amount || 0).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-muted-foreground">
                    No payout data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Activity Timeline */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Activity Timeline</h3>
        <div className="relative pl-6">
          <div className="absolute left-[9px] top-2 bottom-2 w-px" style={{ background: "#D1DCF0" }} />
          {auditEntries && auditEntries.length > 0 ? (
            auditEntries.slice(0, 5).map((entry: any, i: number) => (
              <div key={i} className="relative pb-5 last:pb-0">
                <div
                  className="absolute left-[-18px] top-1.5 w-3 h-3 rounded-full border-2 bg-white"
                  style={{ borderColor: "#2563EB" }}
                />
                <div className="text-sm font-medium" style={{ color: "#0A1628" }}>{entry.action}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {new Date(entry.createdAt).toLocaleString()}
                  {entry.performedBy ? ` · User #${entry.performedBy}` : ""}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground py-4">No activity recorded yet</div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Documents Tab ────────────────────────────────────────────────────────────

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  preview?: string;
}

function DocumentsTab({ documents }: { documents: any[] }) {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      setUploadProgress(0);
      const reader = new FileReader();
      reader.onload = () => {
        const isImage = file.type.startsWith("image/");
        setUploads((prev) => [
          ...prev,
          { name: file.name, size: file.size, type: file.type, preview: isImage ? (reader.result as string) : undefined },
        ]);
        let p = 0;
        const interval = setInterval(() => {
          p += Math.random() * 30 + 10;
          if (p >= 100) {
            clearInterval(interval);
            setUploadProgress(null);
            toast.success(`${file.name} uploaded`);
          } else {
            setUploadProgress(Math.min(p, 95));
          }
        }, 200);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return ImageIcon;
    return FileText;
  };

  return (
    <div className="space-y-6">
      {/* E15: Functional Upload Zone */}
      <div
        className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors hover:border-[#2563EB]/40 hover:bg-[#2563EB]/5"
        style={{ borderColor: "#D1DCF0", background: "#F3F7FC" }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: "#2563EB" }} />
        <p className="text-sm font-medium" style={{ color: "#0A1628" }}>Drag & drop files here</p>
        <p className="text-xs text-muted-foreground mt-1">or click to browse · PDF, DOC, images up to 10MB</p>
        {uploadProgress !== null && (
          <div className="mt-4 mx-auto max-w-xs">
            <div className="h-1.5 rounded-full bg-[#D1DCF0]">
              <div className="h-full rounded-full bg-[#2563EB] transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p className="text-xs text-[#2563EB] mt-1">{Math.round(uploadProgress)}% uploading...</p>
          </div>
        )}
      </div>

      {/* Uploaded files preview */}
      {uploads.length > 0 && (
        <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
          <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Uploaded Files ({uploads.length})</h3>
          <div className="space-y-2">
            {uploads.map((f, i) => {
              const Icon = getFileIcon(f.type);
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#F3F7FC]">
                  {f.preview ? (
                    <img src={f.preview} alt={f.name} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-[#2563EB]/10 flex items-center justify-center">
                      <Icon className="w-5 h-5" style={{ color: "#2563EB" }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#0A1628" }}>{f.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(f.size)} · {f.type.split("/")[1]?.toUpperCase()}</p>
                  </div>
                  <button
                    onClick={() => setUploads((prev) => prev.filter((_, idx) => idx !== i))}
                    className="p-1 rounded hover:bg-red-50"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Document Library */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Document Library</h3>
        {documents && documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F3F7FC] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5" style={{ color: "#2563EB" }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#0A1628" }}>{doc.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {doc.category && (
                        <span className="inline-block mr-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium">
                          {doc.category}
                        </span>
                      )}
                      {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "—"}
                      {doc.version ? ` · v${doc.version}` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.signatureStatus && (
                    <span className={`status-pill text-[10px] ${doc.signatureStatus === "signed" ? "status-completed" : "status-nda-pending"}`}>
                      {doc.signatureStatus === "signed" ? "Signed" : "Pending"}
                    </span>
                  )}
                  <button className="p-1.5 rounded hover:bg-gray-100">
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No documents uploaded yet</p>
        )}
      </section>
    </div>
  );
}

// ─── Diligence Tab ────────────────────────────────────────────────────────────

const DILIGENCE_ITEMS = [
  "Financial Statements",
  "Legal Review",
  "Asset Verification",
  "Management Assessment",
  "Market Analysis",
  "Compliance Check",
];

function DiligenceTab({ roomId }: { roomId: number }) {
  const storageKey = `dealroom_diligence_${roomId}`;
  const notesKey = `dealroom_diligence_notes_${roomId}`;

  const [checked, setChecked] = useState<Record<string, "pending" | "in_progress" | "completed">>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return Object.fromEntries(DILIGENCE_ITEMS.map(item => [item, "pending" as const]));
  });
  const [notes, setNotes] = useState(() => {
    try { return localStorage.getItem(notesKey) || ""; } catch { return ""; }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(checked));
  }, [checked, storageKey]);

  useEffect(() => {
    localStorage.setItem(notesKey, notes);
  }, [notes, notesKey]);

  const completedCount = Object.values(checked).filter(v => v === "completed").length;
  const completionPct = Math.round((completedCount / DILIGENCE_ITEMS.length) * 100);

  function cycleStatus(item: string) {
    setChecked(prev => {
      const order: Array<"pending" | "in_progress" | "completed"> = ["pending", "in_progress", "completed"];
      const current = prev[item];
      const next = order[(order.indexOf(current) + 1) % order.length];
      return { ...prev, [item]: next };
    });
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-subheading" style={{ color: "#0A1628" }}>Due Diligence Checklist</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{
            backgroundColor: completionPct === 100 ? "#ECFDF5" : "#FFFBEB",
            color: completionPct === 100 ? "#059669" : "#C4972A",
          }}>
            {completionPct}% complete
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 mb-4">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completionPct}%`, background: completionPct === 100 ? "#059669" : "#2563EB" }} />
        </div>
        <div className="space-y-2">
          {DILIGENCE_ITEMS.map((item) => {
            const status = checked[item];
            return (
              <button
                key={item}
                onClick={() => cycleStatus(item)}
                className="flex items-center gap-3 w-full text-left p-3 rounded-lg hover:bg-[#F3F7FC] transition-colors"
              >
                <div
                  className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: status === "completed" ? "#059669" : status === "in_progress" ? "#2563EB" : "#D1DCF0",
                    background: status === "completed" ? "#059669" : "transparent",
                  }}
                >
                  {status === "completed" && <Check className="w-3 h-3 text-white" />}
                  {status === "in_progress" && <div className="w-2 h-2 rounded-sm" style={{ background: "#2563EB" }} />}
                </div>
                <span className="text-sm font-medium flex-1" style={{ color: "#0A1628" }}>{item}</span>
                <span className={`status-pill text-[10px] ${
                  status === "completed" ? "status-completed" :
                  status === "in_progress" ? "status-active" :
                  "status-nda-pending"
                }`}>
                  {status === "completed" ? "Completed" : status === "in_progress" ? "In Progress" : "Pending"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-3" style={{ color: "#0A1628" }}>Notes</h3>
        <textarea
          className="w-full rounded-lg border p-3 text-sm resize-none focus:outline-none focus:ring-2"
          style={{ borderColor: "#D1DCF0", minHeight: 100 }}
          placeholder="Add notes about the diligence process..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4" style={{ color: "#C4972A" }} />
          <h3 className="text-subheading" style={{ color: "#0A1628" }}>AI Diligence Summary</h3>
        </div>
        <p className="text-sm text-muted-foreground">Coming in Phase 2</p>
      </section>
    </div>
  );
}

// ─── Compliance Tab ───────────────────────────────────────────────────────────

function ComplianceTab() {
  const parties = [
    {
      name: "Party A", tier: "Tier 2 — Enhanced", lastCheck: "Feb 18, 2026",
      checks: [
        { label: "KYC Status", value: "Verified", status: "good" },
        { label: "AML Status", value: "Clear", status: "good" },
        { label: "Sanctions Check", value: "Clear", status: "good" },
        { label: "PEP Status", value: "Not PEP", status: "good" },
      ],
    },
    {
      name: "Party B", tier: "Tier 1 — Basic", lastCheck: "Feb 10, 2026",
      checks: [
        { label: "KYC Status", value: "Pending", status: "warning" },
        { label: "AML Status", value: "In Review", status: "warning" },
        { label: "Sanctions Check", value: "Clear", status: "good" },
        { label: "PEP Status", value: "Not PEP", status: "good" },
      ],
    },
  ];

  function badgeClass(status: string) {
    if (status === "good") return "status-completed";
    if (status === "warning") return "status-nda-pending";
    return "status-declined";
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        {parties.map((party) => {
          const allGood = party.checks.every(c => c.status === "good");
          return (
            <section key={party.name} className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-subheading" style={{ color: "#0A1628" }}>{party.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{party.tier}</p>
                </div>
                <span className={`status-pill text-[10px] ${allGood ? "status-completed" : "status-diligence"}`}>
                  {allGood ? "Verified" : "Action Required"}
                </span>
              </div>
              <div className="space-y-3">
                {party.checks.map((c) => (
                  <div key={c.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{c.label}</span>
                    <span className={`status-pill text-[10px] ${badgeClass(c.status)}`}>{c.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t text-xs text-muted-foreground" style={{ borderColor: "#D1DCF0" }}>
                Last verified: {party.lastCheck}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ─── Escrow Tab ───────────────────────────────────────────────────────────────

function EscrowTab() {
  const milestones = [
    { name: "NDA Execution", trigger: "All parties sign NDA", amount: "$0", date: "Jan 15, 2026", status: "completed" as const },
    { name: "Due Diligence Deposit", trigger: "DD period begins", amount: "$50,000", date: "Feb 1, 2026", status: "active" as const },
    { name: "Closing Deposit", trigger: "Final agreement signed", amount: "$200,000", date: "TBD", status: "pending" as const },
    { name: "Final Settlement", trigger: "Transfer complete", amount: "$750,000", date: "TBD", status: "pending" as const },
  ];

  const completedCount = milestones.filter(m => m.status === "completed").length;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Escrow Balance</h3>
        <div className="text-3xl font-bold number-display" style={{ color: "#059669" }}>$0.00</div>
        <p className="text-xs text-muted-foreground mt-1">Total held in escrow · $1,000,000 total deal value</p>
      </section>

      {/* E17: Visual Milestone Tracker */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-6" style={{ color: "#0A1628" }}>Escrow Milestones</h3>
        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-[#D1DCF0]">
            <div
              className="w-full bg-[#059669] transition-all duration-700"
              style={{ height: `${(completedCount / milestones.length) * 100}%` }}
            />
          </div>
          <div className="space-y-6">
            {milestones.map((m, i) => {
              const isCompleted = m.status === "completed";
              const isActive = m.status === "active";
              return (
                <div key={m.name} className="flex gap-4 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                    isCompleted ? "bg-[#059669] border-[#059669]" :
                    isActive ? "bg-white border-[#2563EB] animate-pulse" :
                    "bg-white border-[#D1DCF0]"
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-xs font-bold" style={{ color: isActive ? "#2563EB" : "#94A3B8" }}>{i + 1}</span>
                    )}
                  </div>
                  <div className={`flex-1 rounded-lg border p-4 ${isActive ? "border-[#2563EB]/30 bg-[#2563EB]/5" : ""}`} style={{ borderColor: isActive ? undefined : "#D1DCF0" }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#0A1628" }}>{m.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.trigger}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-data-mono" style={{ color: "#0A1628" }}>{m.amount}</p>
                        <p className="text-[10px] text-muted-foreground">{m.date}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className={`status-pill text-[10px] ${
                        isCompleted ? "status-completed" : isActive ? "status-active" : "status-nda-pending"
                      }`}>
                        {isCompleted ? "Released" : isActive ? "In Progress" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Payouts Tab ──────────────────────────────────────────────────────────────

function PayoutsTab({ payouts }: { payouts: any[] }) {
  const totalAmount = payouts?.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Payout Structure</h3>
        {payouts && payouts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "#D1DCF0" }}>
                  <th className="text-left py-2 text-label text-muted-foreground font-medium">Party</th>
                  <th className="text-left py-2 text-label text-muted-foreground font-medium">Role</th>
                  <th className="text-right py-2 text-label text-muted-foreground font-medium">Attribution %</th>
                  <th className="text-right py-2 text-label text-muted-foreground font-medium">Amount</th>
                  <th className="text-right py-2 text-label text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p: any, i: number) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: "#D1DCF0" }}>
                    <td className="py-2.5 font-medium">User #{p.userId}</td>
                    <td className="py-2.5">{p.role || "Participant"}</td>
                    <td className="py-2.5 text-right">{p.attributionPercentage ?? "—"}%</td>
                    <td className="py-2.5 text-right font-data-mono">${Number(p.amount || 0).toLocaleString()}</td>
                    <td className="py-2.5 text-right">
                      <span className={`status-pill text-[10px] ${
                        p.status === "completed" ? "status-completed" :
                        p.status === "processing" ? "status-active" :
                        "status-nda-pending"
                      }`}>
                        {p.status || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No payout data available</p>
        )}
      </section>

      {/* Milestone Release Schedule */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-4" style={{ color: "#0A1628" }}>Release Schedule</h3>
        <div className="relative pl-6">
          <div className="absolute left-[9px] top-2 bottom-2 w-px" style={{ background: "#D1DCF0" }} />
          {["DD Complete", "Agreement Signed", "Transfer Complete", "Final Settlement"].map((label, i) => (
            <div key={label} className="relative pb-5 last:pb-0">
              <div
                className="absolute left-[-18px] top-1.5 w-3 h-3 rounded-full border-2 bg-white"
                style={{ borderColor: i === 0 ? "#059669" : "#D1DCF0" }}
              />
              <div className="text-sm font-medium" style={{ color: "#0A1628" }}>{label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Milestone {i + 1}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Total Distribution */}
      <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
        <h3 className="text-subheading mb-2" style={{ color: "#0A1628" }}>Total Distribution</h3>
        <div className="text-3xl font-bold number-display" style={{ color: "#0A1628" }}>
          ${totalAmount.toLocaleString()}
        </div>
      </section>
    </div>
  );
}

// ─── Audit Tab ────────────────────────────────────────────────────────────────

function AuditTab({ entries }: { entries: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const actionTypes = [...new Set((entries || []).map((e: any) => e.action).filter(Boolean))];

  const filtered = (entries || []).filter((e: any) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || e.action?.toLowerCase().includes(q) || e.entityType?.toLowerCase().includes(q);
    const matchesType = !typeFilter || e.action === typeFilter;
    return matchesSearch && matchesType;
  });

  const exportCsv = () => {
    const header = "Timestamp,User,Action,Entity,Details\n";
    const rows = filtered.map((e: any) =>
      `"${new Date(e.createdAt).toLocaleString()}","User #${e.performedBy || "—"}","${e.action}","${e.entityType}","${e.details ? JSON.stringify(e.details).replace(/"/g, '""') : "—"}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <section className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-subheading" style={{ color: "#0A1628" }}>Immutable Audit Trail</h3>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-gray-50"
          style={{ borderColor: "#D1DCF0", color: "#0A1628" }}
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* E19: Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border text-sm"
            style={{ borderColor: "#D1DCF0" }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border text-sm"
          style={{ borderColor: "#D1DCF0", color: typeFilter ? "#0A1628" : "#94A3B8" }}
        >
          <option value="">All types</option>
          {actionTypes.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "#D1DCF0" }}>
                <th className="text-left py-2 text-label text-muted-foreground font-medium">Timestamp</th>
                <th className="text-left py-2 text-label text-muted-foreground font-medium">User</th>
                <th className="text-left py-2 text-label text-muted-foreground font-medium">Action</th>
                <th className="text-left py-2 text-label text-muted-foreground font-medium">Entity</th>
                <th className="text-left py-2 text-label text-muted-foreground font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry: any, i: number) => (
                <tr
                  key={i}
                  className="border-b last:border-0"
                  style={{
                    borderColor: "#D1DCF0",
                    background: i % 2 === 1 ? "#F3F7FC" : "transparent",
                  }}
                >
                  <td className="py-2.5 font-data-mono text-xs whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5">User #{entry.performedBy || "—"}</td>
                  <td className="py-2.5 font-medium">{entry.action}</td>
                  <td className="py-2.5">{entry.entityType}</td>
                  <td className="py-2.5 text-muted-foreground max-w-[200px] truncate">
                    {entry.details ? JSON.stringify(entry.details) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          {entries && entries.length > 0 ? "No matching entries" : "No audit entries recorded"}
        </p>
      )}
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DealRoom() {
  const params = useParams<{ id: string }>();
  const roomId = Number(params.id);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const { data: room, isLoading } = trpc.dealRoom.get.useQuery(
    { id: roomId },
    { enabled: !!roomId && !isNaN(roomId) }
  );

  const { data: documents } = trpc.dealRoom.getDocuments.useQuery(
    { dealRoomId: roomId },
    { enabled: !!roomId && !isNaN(roomId) }
  );

  const { data: auditEntries } = trpc.audit.list.useQuery(
    { entityType: "deal_room", entityId: roomId },
    { enabled: !!roomId && !isNaN(roomId) }
  );

  const { data: payouts } = trpc.payout.getByDeal.useQuery(
    { dealId: room?.dealId ?? 0 },
    { enabled: !!room?.dealId }
  );

  if (isLoading) {
    return (
      <div className="p-8 animate-fade-in">
        <div className="h-8 w-64 animate-shimmer rounded mb-6" />
        <div className="h-12 animate-shimmer rounded mb-4" />
        <div className="h-96 animate-shimmer rounded" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F3F7FC] flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" style={{ color: "#DC2626" }} />
        </div>
        <h2 className="text-lg font-semibold mb-2">Deal Room Not Found</h2>
        <p className="text-muted-foreground mb-4 text-sm">This deal room may have been removed or you don't have access.</p>
        <Link href="/deal-rooms" className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: "#2563EB" }}>
          <ChevronLeft className="w-4 h-4" /> Back to Deal Rooms
        </Link>
      </div>
    );
  }

  const days = daysSince(room.createdAt);
  const dealValue = "$2.5M";
  const stages = ["NDA", "Diligence", "Negotiation", "Closing"];
  const currentStageIdx = room.status === "active" ? 1 : room.status === "closed" ? 3 : 0;

  useEffect(() => { document.title = `Deal Room: ${room.name} | ANAVI`; }, [room.name]);

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/deal-rooms" className="hover:underline" style={{ color: "#2563EB" }}>
          Deal Rooms
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-medium" style={{ color: "#0A1628" }}>{room.name}</span>
      </div>

      {/* E20: Enhanced Room Header */}
      <FadeInView>
        <div className="bg-white rounded-lg border p-6" style={{ borderColor: "#D1DCF0" }}>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-display" style={{ color: "#0A1628" }}>{room.name}</h1>
                <span className={`status-pill ${getStatusClass(room.status)}`}>
                  {getStatusLabel(room.status)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {days} days active
                </span>
                {/* Participant avatars */}
                <span className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {["A", "B", "C"].map((letter, i) => (
                      <div
                        key={letter}
                        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ backgroundColor: i === 0 ? "#2563EB" : i === 1 ? "#C4972A" : "#059669", zIndex: 3 - i }}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                  3 participants
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Deal Value</div>
              <div className="text-2xl font-bold number-display" style={{ color: "#0A1628" }}>{dealValue}</div>
            </div>
          </div>

          {/* Stage progress bar */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor: "#D1DCF0" }}>
            <div className="flex items-center gap-2">
              {stages.map((stage, i) => (
                <div key={stage} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${
                    i <= currentStageIdx ? "text-[#2563EB]" : "text-gray-400"
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i < currentStageIdx ? "bg-[#059669] text-white" :
                      i === currentStageIdx ? "bg-[#2563EB] text-white" :
                      "bg-gray-200 text-gray-400"
                    }`}>
                      {i < currentStageIdx ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    {stage}
                  </div>
                  {i < stages.length - 1 && (
                    <div className="flex-1 h-0.5 rounded" style={{ backgroundColor: i < currentStageIdx ? "#059669" : "#D1DCF0" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeInView>

      {/* Tab Bar */}
      <div className="border-b overflow-x-auto scrollbar-premium" style={{ borderColor: "#D1DCF0" }}>
        <div className="flex gap-0 min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2"
                style={{
                  borderColor: isActive ? "#2563EB" : "transparent",
                  color: isActive ? "#2563EB" : undefined,
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* E21: Tab Content with SlideIn animations */}
      <SlideIn key={activeTab} direction="up">
        {activeTab === "overview" && (
          <OverviewTab room={room} payouts={payouts ?? []} auditEntries={auditEntries ?? []} />
        )}
        {activeTab === "documents" && <DocumentsTab documents={documents ?? []} />}
        {activeTab === "diligence" && <DiligenceTab roomId={roomId} />}
        {activeTab === "compliance" && <ComplianceTab />}
        {activeTab === "escrow" && <EscrowTab />}
        {activeTab === "payouts" && <PayoutsTab payouts={payouts ?? []} />}
        {activeTab === "audit" && <AuditTab entries={auditEntries ?? []} />}
      </SlideIn>
    </div>
  );
}
