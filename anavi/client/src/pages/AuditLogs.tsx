import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Shield, FileText, Clock, Search, Download, History, Lock, Activity, User, Building2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

function getEntityIcon(entityType: string) {
  const t = (entityType ?? "").toLowerCase();
  if (t.includes("deal") || t.includes("match")) return <Activity className="h-4 w-4" />;
  if (t.includes("user") || t.includes("profile")) return <User className="h-4 w-4" />;
  if (t.includes("document") || t.includes("intent")) return <FileText className="h-4 w-4" />;
  return <Building2 className="h-4 w-4" />;
}

export default function AuditLogs() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cursor, setCursor] = useState<{ createdAt: string; id: number } | undefined>();

  const filters = useMemo(() => ({
    entityType: entityTypeFilter || undefined,
    startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
    endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
    limit: 50,
    cursor,
  }), [entityTypeFilter, startDate, endDate, cursor]);

  const { data, isLoading } = trpc.audit.query.useQuery(filters);
  const exportMutation = trpc.audit.export.useMutation({
    onSuccess: (csv) => {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    },
    onError: () => toast.error("Export failed"),
  });

  const items = data?.items ?? [];
  const nextCursor = data?.nextCursor;

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (log) =>
        log.action.toLowerCase().includes(q) ||
        log.entityType.toLowerCase().includes(q) ||
        String(log.entityId ?? "").includes(q) ||
        String(log.userId ?? "").includes(q)
    );
  }, [items, searchQuery]);

  const canExport = user?.role === "admin";

  return (
    <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Audit Logs</h1>
            <p className="text-muted-foreground">
              Immutable, hash-chained record of all platform actions
            </p>
          </div>
          {canExport && (
            <Button
              variant="outline"
              className="gap-2"
              disabled={exportMutation.isPending}
              onClick={() =>
                exportMutation.mutate({
                  entityType: entityTypeFilter || undefined,
                  startDate: startDate ? `${startDate}T00:00:00.000Z` : undefined,
                  endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
                })
              }
            >
              <Download className="h-4 w-4" />
              {exportMutation.isPending ? "Exporting…" : "Export CSV"}
            </Button>
          )}
        </div>

        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by action, entity type, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                type="text"
                placeholder="Entity type (e.g. deal, user)"
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
                className="w-48"
              />
              <Input
                type="date"
                placeholder="Start"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
              <Input
                type="date"
                placeholder="End"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Immutable Audit Trail
                </CardTitle>
                <CardDescription>
                  Each entry is hash-chained for integrity verification
                </CardDescription>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Tamper-Proof
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">Loading audit log…</div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                No audit events match your filters.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="text-left py-3 px-4 font-medium">ID</TableHead>
                        <TableHead className="text-left py-3 px-4 font-medium">Timestamp</TableHead>
                        <TableHead className="text-left py-3 px-4 font-medium">Action</TableHead>
                        <TableHead className="text-left py-3 px-4 font-medium">Entity</TableHead>
                        <TableHead className="text-left py-3 px-4 font-medium">User ID</TableHead>
                        <TableHead className="text-left py-3 px-4 font-medium">Hash</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((log, index) => (
                        <motion.tr
                          key={`${log.id}-${log.createdAt}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(index * 0.03, 0.3) }}
                          className="border-b hover:bg-muted/50"
                        >
                          <TableCell className="py-4 px-4 font-mono text-sm text-muted-foreground">
                            #{String(log.id).padStart(6, "0")}
                          </TableCell>
                          <TableCell className="py-4 px-4 font-mono text-sm">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 flex items-center justify-center bg-muted rounded">
                                {getEntityIcon(log.entityType)}
                              </div>
                              <span className="font-medium">{log.action}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <span className="text-sm">{log.entityType}</span>
                            {log.entityId != null && (
                              <span className="text-xs text-muted-foreground ml-1">#{log.entityId}</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-4 text-sm text-muted-foreground">
                            {log.userId ?? "—"}
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            {log.hash ? (
                              <code className="text-[10px] font-mono text-muted-foreground block max-w-[120px] truncate" title={log.hash}>
                                {log.hash.slice(0, 12)}…
                              </code>
                            ) : (
                              <span className="text-muted-foreground text-xs">legacy</span>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredItems.length} entries
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!cursor}
                      onClick={() => setCursor(undefined)}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!nextCursor}
                      onClick={() => {
                        if (nextCursor)
                          setCursor({
                            createdAt:
                              typeof nextCursor.createdAt === "string"
                                ? nextCursor.createdAt
                                : new Date(nextCursor.createdAt).toISOString(),
                            id: nextCursor.id,
                          });
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <span className="font-medium">Immutable • Hash-chained</span>
                <span className="text-muted-foreground ml-2">
                  All entries are cryptographically linked. Export includes hash column for verification.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
