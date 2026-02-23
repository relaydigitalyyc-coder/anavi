import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, TrendingUp, FileText, Bell, Shield, CheckCircle2,
  Clock, DollarSign, PieChart, ArrowUpRight, ArrowDownRight,
  Building2, Users, Calendar, AlertCircle, Download, Eye
} from "lucide-react";

// Mock data for LP Portal
const portfolioSummary = {
  totalInvested: 2500000,
  currentValue: 3125000,
  totalDistributions: 450000,
  unrealizedGains: 625000,
  irr: 18.5,
  moic: 1.43,
};

const investments = [
  {
    id: 1,
    spvName: "Acme Ventures SPV I",
    assetClass: "Venture Capital",
    committed: 500000,
    called: 400000,
    currentValue: 520000,
    status: "active",
    vintage: "2024",
    irr: 22.5,
  },
  {
    id: 2,
    spvName: "Meridian Real Estate Fund",
    assetClass: "Real Estate",
    committed: 1000000,
    called: 1000000,
    currentValue: 1180000,
    status: "active",
    vintage: "2023",
    irr: 15.2,
  },
  {
    id: 3,
    spvName: "TechGrowth Partners II",
    assetClass: "Private Equity",
    committed: 750000,
    called: 600000,
    currentValue: 780000,
    status: "active",
    vintage: "2024",
    irr: 19.8,
  },
  {
    id: 4,
    spvName: "Infrastructure Alpha",
    assetClass: "Infrastructure",
    committed: 250000,
    called: 250000,
    currentValue: 295000,
    status: "active",
    vintage: "2022",
    irr: 12.4,
  },
];

const pendingActions = [
  { id: 1, type: "capital_call", spv: "Acme Ventures SPV I", amount: 100000, dueDate: "2026-02-01" },
  { id: 2, type: "document", spv: "TechGrowth Partners II", document: "Q4 2025 Report", action: "Review" },
  { id: 3, type: "signature", spv: "Meridian Real Estate Fund", document: "Amendment #2", action: "Sign" },
];

const documents = [
  { id: 1, name: "Subscription Agreement - Acme Ventures", type: "Legal", date: "2024-03-15", signed: true },
  { id: 2, name: "Q4 2025 Quarterly Report", type: "Report", date: "2026-01-10", signed: false },
  { id: 3, name: "K-1 Tax Document 2025", type: "Tax", date: "2026-01-05", signed: false },
  { id: 4, name: "Capital Call Notice #3", type: "Notice", date: "2026-01-15", signed: false },
];

const accreditationStatus = {
  status: "accredited",
  method: "net_worth",
  verifiedAt: "2024-06-15",
  expiresAt: "2026-06-15",
  kycStatus: "approved",
  amlStatus: "cleared",
};

export default function LPPortal() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">LP Portal</h1>
            <p className="text-muted-foreground">
              Manage your investments, track performance, and access documents
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1 py-1.5 px-3 border-green-500 text-green-500">
              <Shield className="h-3.5 w-3.5" />
              Accredited Investor
            </Badge>
            <Button variant="outline" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </Button>
          </div>
        </div>

        {/* Pending Actions Alert */}
        {pendingActions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-sky-500/10 border-sky-500/30">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-sky-500" />
                    <span className="font-medium">You have {pendingActions.length} pending actions</span>
                  </div>
                  <Button size="sm" className="bg-sky-500 hover:bg-sky-600">
                    View All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          <Card className="col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Wallet className="h-4 w-4" />
                <span className="text-sm">Total Invested</span>
              </div>
              <div className="text-2xl font-bold">
                ${(portfolioSummary.totalInvested / 1000000).toFixed(2)}M
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Current Value</span>
              </div>
              <div className="text-2xl font-bold text-green-500">
                ${(portfolioSummary.currentValue / 1000000).toFixed(2)}M
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Distributions</span>
              </div>
              <div className="text-2xl font-bold">
                ${(portfolioSummary.totalDistributions / 1000).toFixed(0)}K
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <ArrowUpRight className="h-4 w-4" />
                <span className="text-sm">Unrealized Gains</span>
              </div>
              <div className="text-2xl font-bold text-green-500">
                +${(portfolioSummary.unrealizedGains / 1000).toFixed(0)}K
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <PieChart className="h-4 w-4" />
                <span className="text-sm">IRR</span>
              </div>
              <div className="text-2xl font-bold text-sky-500">
                {portfolioSummary.irr}%
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">MOIC</span>
              </div>
              <div className="text-2xl font-bold">
                {portfolioSummary.moic}x
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
            <TabsTrigger value="investments">Investments</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="capital-calls">Capital Calls</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-3 gap-6">
              {/* Investments List */}
              <div className="col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Investments</CardTitle>
                    <CardDescription>Your current portfolio allocations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {investments.map((inv) => (
                        <div
                          key={inv.id}
                          className="flex items-center justify-between p-4 border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
<div className="w-12 h-12 bg-sky-500/10 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-sky-500" />
                            </div>
                            <div>
                              <div className="font-semibold">{inv.spvName}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{inv.assetClass}</Badge>
                                <span>Vintage {inv.vintage}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">${(inv.currentValue / 1000).toFixed(0)}K</div>
                            <div className="text-sm text-green-500 flex items-center justify-end gap-1">
                              <ArrowUpRight className="h-3 w-3" />
                              {inv.irr}% IRR
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Pending Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-sky-500" />
                      Pending Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingActions.map((action) => (
                        <div key={action.id} className="p-3 border bg-muted/30">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant={action.type === "capital_call" ? "destructive" : "secondary"}>
                              {action.type === "capital_call" ? "Capital Call" : 
                               action.type === "document" ? "Document" : "Signature"}
                            </Badge>
                            {action.dueDate && (
                              <span className="text-xs text-muted-foreground">Due {action.dueDate}</span>
                            )}
                          </div>
                          <div className="text-sm font-medium">{action.spv}</div>
                          {action.amount && (
                            <div className="text-sm text-sky-500">${action.amount.toLocaleString()}</div>
                          )}
                          {action.document && (
                            <div className="text-sm text-muted-foreground">{action.document}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Accreditation Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      Accreditation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge className="bg-green-500">Verified</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Method</span>
                        <span className="text-sm font-medium">Net Worth</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Expires</span>
                        <span className="text-sm font-medium">{accreditationStatus.expiresAt}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">KYC</span>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">AML</span>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="investments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Investment Details</CardTitle>
                    <CardDescription>Detailed view of all your investments</CardDescription>
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="text-left py-3 px-4 font-medium">SPV Name</TableHead>
                        <TableHead className="text-left py-3 px-4 font-medium">Asset Class</TableHead>
                        <TableHead className="text-right py-3 px-4 font-medium">Committed</TableHead>
                        <TableHead className="text-right py-3 px-4 font-medium">Called</TableHead>
                        <TableHead className="text-right py-3 px-4 font-medium">Current Value</TableHead>
                        <TableHead className="text-right py-3 px-4 font-medium">IRR</TableHead>
                        <TableHead className="text-center py-3 px-4 font-medium">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investments.map((inv) => (
                        <TableRow key={inv.id} className="border-b hover:bg-muted/50">
                          <TableCell className="py-4 px-4">
                            <div className="font-medium">{inv.spvName}</div>
                            <div className="text-xs text-muted-foreground">Vintage {inv.vintage}</div>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <Badge variant="outline">{inv.assetClass}</Badge>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono">
                            ${inv.committed.toLocaleString()}
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono">
                            ${inv.called.toLocaleString()}
                            <div className="text-xs text-muted-foreground">
                              {((inv.called / inv.committed) * 100).toFixed(0)}% called
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono text-green-500">
                            ${inv.currentValue.toLocaleString()}
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono text-sky-500">
                            {inv.irr}%
                          </TableCell>
                          <TableCell className="py-4 px-4 text-center">
                            <Badge className="bg-green-500">Active</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>Legal documents, reports, and notices</CardDescription>
                  </div>
                  <Input placeholder="Search documents..." className="w-64" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.signed ? (
                          <Badge className="bg-green-500 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Signed
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="capital-calls">
            <Card>
              <CardHeader>
                <CardTitle>Capital Calls</CardTitle>
                <CardDescription>Manage your capital call obligations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingActions
                    .filter((a) => a.type === "capital_call")
                    .map((call) => (
                      <div
                        key={call.id}
                        className="p-6 border bg-sky-500/5 border-sky-500/30"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="font-semibold text-lg">{call.spv}</div>
                            <div className="text-sm text-muted-foreground">Capital Call Notice</div>
                          </div>
                          <Badge variant="destructive">Due {call.dueDate}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-6 mb-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Amount Due</div>
                            <div className="text-2xl font-bold">${call.amount?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Due Date</div>
                            <div className="text-lg font-medium">{call.dueDate}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Status</div>
                            <Badge variant="outline">Pending Payment</Badge>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button className="bg-sky-500 hover:bg-sky-600">
                            View Wire Instructions
                          </Button>
                          <Button variant="outline">
                            Download Notice
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Accreditation Status</CardTitle>
                  <CardDescription>Your investor accreditation details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <div>
                        <div className="font-semibold">Accredited Investor</div>
                        <div className="text-sm text-muted-foreground">Verified via Net Worth</div>
                      </div>
                    </div>
                    <Badge className="bg-green-500">Active</Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verified On</span>
                      <span>{accreditationStatus.verifiedAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires On</span>
                      <span>{accreditationStatus.expiresAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verification Method</span>
                      <span className="capitalize">{accreditationStatus.method.replace("_", " ")}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Update Accreditation
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>KYC/AML Status</CardTitle>
                  <CardDescription>Know Your Customer and Anti-Money Laundering checks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span>Identity Verification</span>
                      </div>
                      <Badge className="bg-green-500">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span>Address Verification</span>
                      </div>
                      <Badge className="bg-green-500">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span>AML Screening</span>
                      </div>
                      <Badge className="bg-green-500">Cleared</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span>Sanctions Check</span>
                      </div>
                      <Badge className="bg-green-500">Cleared</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span>PEP Status</span>
                      </div>
                      <Badge variant="outline">Not PEP</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
