import { useState } from "react";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";

export function AuditTab({ entries }: { entries: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const actionTypes = Array.from(new Set((entries || []).map((e: any) => e.action).filter(Boolean)));

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

      {/* Filters */}
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
