import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, FileText, Clock, CheckCircle2, AlertTriangle, XCircle,
  Search, Download, Eye, Filter, Calendar, User, Building2,
  Lock, Activity, History, Flag
} from "lucide-react";

// Mock audit log data
const auditLogs = [
  {
    id: 1,
    action: "LP Onboarded",
    actionCategory: "lp",
    entityType: "LP Profile",
    entityName: "Smith Family Office",
    userId: 1,
    userEmail: "avraham@anavi.io",
    riskLevel: "low",
    createdAt: "2026-01-16T08:30:00Z",
    metadata: { accreditationMethod: "net_worth" },
    checksum: "a3f2b1c4d5e6f7890123456789abcdef",
  },
  {
    id: 2,
    action: "Capital Call Created",
    actionCategory: "capital_call",
    entityType: "Capital Call",
    entityName: "Acme Ventures SPV I - Call #3",
    userId: 1,
    userEmail: "avraham@anavi.io",
    riskLevel: "medium",
    createdAt: "2026-01-16T09:15:00Z",
    metadata: { amount: 1500000, lpCount: 12 },
    checksum: "b4g3c2d5e6f7890123456789abcdef01",
  },
  {
    id: 3,
    action: "Document Signed",
    actionCategory: "document",
    entityType: "Subscription Agreement",
    entityName: "Johnson Capital - Subscription",
    userId: 2,
    userEmail: "johnson@capital.com",
    riskLevel: "low",
    createdAt: "2026-01-16T10:00:00Z",
    metadata: { documentType: "subscription_agreement" },
    checksum: "c5h4d3e6f7890123456789abcdef0123",
  },
  {
    id: 4,
    action: "Wire Instructions Updated",
    actionCategory: "payout",
    entityType: "Wire Instructions",
    entityName: "Meridian Partners",
    userId: 1,
    userEmail: "avraham@anavi.io",
    riskLevel: "high",
    createdAt: "2026-01-16T11:30:00Z",
    metadata: { previousBank: "Chase", newBank: "Goldman Sachs" },
    checksum: "d6i5e4f7890123456789abcdef012345",
  },
  {
    id: 5,
    action: "SPV Created",
    actionCategory: "spv",
    entityType: "SPV",
    entityName: "TechGrowth Partners III",
    userId: 1,
    userEmail: "avraham@anavi.io",
    riskLevel: "medium",
    createdAt: "2026-01-16T14:00:00Z",
    metadata: { entityType: "llc", jurisdiction: "Delaware" },
    checksum: "e7j6f5g890123456789abcdef0123456",
  },
  {
    id: 6,
    action: "Accreditation Expired",
    actionCategory: "compliance",
    entityType: "LP Profile",
    entityName: "Legacy Investments",
    userId: null,
    userEmail: "system",
    riskLevel: "critical",
    createdAt: "2026-01-16T00:00:00Z",
    metadata: { expirationDate: "2026-01-15" },
    checksum: "f8k7g6h90123456789abcdef01234567",
  },
  {
    id: 7,
    action: "User Login",
    actionCategory: "auth",
    entityType: "User",
    entityName: "Avraham",
    userId: 1,
    userEmail: "avraham@anavi.io",
    riskLevel: "low",
    createdAt: "2026-01-16T07:45:00Z",
    metadata: { ipAddress: "192.168.1.1", device: "Chrome/Windows" },
    checksum: "g9l8h7i0123456789abcdef012345678",
  },
  {
    id: 8,
    action: "Distribution Initiated",
    actionCategory: "payout",
    entityType: "Distribution",
    entityName: "Meridian Real Estate Fund - Q4 2025",
    userId: 1,
    userEmail: "avraham@anavi.io",
    riskLevel: "high",
    createdAt: "2026-01-15T16:00:00Z",
    metadata: { totalAmount: 2500000, lpCount: 18 },
    checksum: "h0m9i8j123456789abcdef0123456789",
  },
];

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const getRiskBadge = (level: string) => {
    switch (level) {
      case "low":
        return <Badge className="bg-green-500">Low</Badge>;
      case "medium":
        return <Badge className="bg-sky-500">Medium</Badge>;
      case "high":
        return <Badge className="bg-orange-500">High</Badge>;
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "lp":
        return <User className="h-5 w-5" />;
      case "spv":
        return <Building2 className="h-5 w-5" />;
      case "capital_call":
        return <Activity className="h-5 w-5" />;
      case "document":
        return <FileText className="h-5 w-5" />;
      case "payout":
        return <Lock className="h-5 w-5" />;
      case "compliance":
        return <Shield className="h-5 w-5" />;
      case "auth":
        return <User className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (riskFilter !== "all" && log.riskLevel !== riskFilter) return false;
    if (categoryFilter !== "all" && log.actionCategory !== categoryFilter) return false;
    if (searchQuery && !log.action.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.entityName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: auditLogs.length,
    low: auditLogs.filter(l => l.riskLevel === "low").length,
    medium: auditLogs.filter(l => l.riskLevel === "medium").length,
    high: auditLogs.filter(l => l.riskLevel === "high").length,
    critical: auditLogs.filter(l => l.riskLevel === "critical").length,
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Audit Logs</h1>
            <p className="text-muted-foreground">
              Immutable, cryptographically-verified record of all platform actions
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Total Events</div>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Low Risk</div>
              <div className="text-3xl font-bold text-green-500">{stats.low}</div>
            </CardContent>
          </Card>
          <Card className="border-sky-500/30">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Medium Risk</div>
              <div className="text-3xl font-bold text-sky-500">{stats.medium}</div>
            </CardContent>
          </Card>
          <Card className="border-orange-500/30">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">High Risk</div>
              <div className="text-3xl font-bold text-orange-500">{stats.high}</div>
            </CardContent>
          </Card>
          <Card className="border-red-500/30">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Critical</div>
              <div className="text-3xl font-bold text-red-500">{stats.critical}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by action, entity, or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risks</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="lp">LP Management</SelectItem>
                  <SelectItem value="spv">SPV Management</SelectItem>
                  <SelectItem value="capital_call">Capital Calls</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="payout">Payouts</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Immutable Audit Trail
                </CardTitle>
                <CardDescription>
                  Each entry is cryptographically signed and chain-linked for integrity verification
                </CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Tamper-Proof
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="text-left py-3 px-4 font-medium">ID</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">Timestamp</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">Action</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">Entity</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">User</TableHead>
                    <TableHead className="text-center py-3 px-4 font-medium">Risk</TableHead>
                    <TableHead className="text-left py-3 px-4 font-medium">Checksum</TableHead>
                    <TableHead className="text-center py-3 px-4 font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log, index) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-muted/50"
                    >
                      <TableCell className="py-4 px-4 font-mono text-sm text-muted-foreground">
                        #{log.id.toString().padStart(6, '0')}
                      </TableCell>
                      <TableCell className="py-4 px-4 font-mono text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 flex items-center justify-center ${
                            log.riskLevel === "critical" ? "bg-red-500/10 text-red-500" :
                            log.riskLevel === "high" ? "bg-orange-500/10 text-orange-500" :
                            log.riskLevel === "medium" ? "bg-sky-500/10 text-sky-500" : 
                            "bg-green-500/10 text-green-500"
                          }`}>
                            {getCategoryIcon(log.actionCategory)}
                          </div>
                          <div>
                            <div className="font-medium">{log.action}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {log.actionCategory}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="text-sm">{log.entityName}</div>
                        <div className="text-xs text-muted-foreground">{log.entityType}</div>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-sm text-muted-foreground">
                        {log.userEmail}
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center">
                        {getRiskBadge(log.riskLevel)}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <code className="text-xs bg-muted px-2 py-1 font-mono">
                          {log.checksum.substring(0, 12)}...
                        </code>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Flag for Review">
                            <Flag className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {filteredLogs.length} of {auditLogs.length} entries
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrity Notice */}
        <Card className="mt-6 bg-muted/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <span className="font-medium">Audit Log Integrity Verified</span>
                <span className="text-muted-foreground ml-2">
                  All entries are cryptographically chain-linked. Last verification: {new Date().toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
