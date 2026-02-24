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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, TrendingUp, Users, Calendar, Plus, Send,
  CheckCircle2, Clock, AlertCircle, ArrowUpRight, ArrowDownRight,
  Building2, FileText, Download, Eye, Bell, Wallet
} from "lucide-react";
import { toast } from "sonner";

// Mock data
const spvs = [
  {
    id: 1,
    name: "Acme Ventures SPV I",
    targetRaise: 10000000,
    totalCommitted: 7500000,
    totalCalled: 6000000,
    totalReceived: 5800000,
    lpCount: 12,
    status: "fundraising",
  },
  {
    id: 2,
    name: "Meridian Real Estate Fund",
    targetRaise: 25000000,
    totalCommitted: 25000000,
    totalCalled: 20000000,
    totalReceived: 20000000,
    lpCount: 18,
    status: "active",
  },
];

const capitalCalls = [
  {
    id: 1,
    spvId: 1,
    spvName: "Acme Ventures SPV I",
    callNumber: 3,
    callAmount: 1500000,
    callPercentage: 20,
    dueDate: "2026-02-01",
    status: "sent",
    totalCalled: 1500000,
    totalReceived: 1200000,
    responses: [
      { lpName: "Smith Family Office", amount: 300000, status: "paid" },
      { lpName: "Johnson Capital", amount: 500000, status: "paid" },
      { lpName: "Apex Investments", amount: 400000, status: "paid" },
      { lpName: "Meridian Partners", amount: 300000, status: "pending" },
    ],
  },
  {
    id: 2,
    spvId: 2,
    spvName: "Meridian Real Estate Fund",
    callNumber: 4,
    callAmount: 5000000,
    callPercentage: 20,
    dueDate: "2026-01-25",
    status: "complete",
    totalCalled: 5000000,
    totalReceived: 5000000,
    responses: [],
  },
];

const commitments = [
  { id: 1, lpName: "Smith Family Office", spv: "Acme Ventures SPV I", committed: 1500000, called: 1200000, funded: 1200000, unfunded: 300000 },
  { id: 2, lpName: "Johnson Capital", spv: "Acme Ventures SPV I", committed: 2500000, called: 2000000, funded: 2000000, unfunded: 500000 },
  { id: 3, lpName: "Apex Investments", spv: "Acme Ventures SPV I", committed: 2000000, called: 1600000, funded: 1600000, unfunded: 400000 },
  { id: 4, lpName: "Meridian Partners", spv: "Acme Ventures SPV I", committed: 1500000, called: 1200000, funded: 1000000, unfunded: 500000 },
];

export default function CapitalManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSpv, setSelectedSpv] = useState<number | null>(null);
  const [isNewCallDialogOpen, setIsNewCallDialogOpen] = useState(false);

  const totalCommitted = spvs.reduce((sum, spv) => sum + spv.totalCommitted, 0);
  const totalCalled = spvs.reduce((sum, spv) => sum + spv.totalCalled, 0);
  const totalReceived = spvs.reduce((sum, spv) => sum + spv.totalReceived, 0);
  const pendingAmount = totalCalled - totalReceived;

  const handleCreateCapitalCall = () => {
    toast.success("Capital Call Created", {
      description: "Notices have been sent to all LPs.",
    });
    setIsNewCallDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Capital Management</h1>
            <p className="text-muted-foreground">
              Track commitments, manage capital calls, and monitor fund flows
            </p>
          </div>
          <Dialog open={isNewCallDialogOpen} onOpenChange={setIsNewCallDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-sky-500 hover:bg-sky-600">
                <Plus className="h-4 w-4" />
                New Capital Call
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Capital Call</DialogTitle>
                <DialogDescription>
                  Send a capital call notice to all LPs in the selected SPV
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select SPV</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an SPV" />
                    </SelectTrigger>
                    <SelectContent>
                      {spvs.map((spv) => (
                        <SelectItem key={spv.id} value={spv.id.toString()}>
                          {spv.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Call Amount</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="number" placeholder="1,000,000" className="pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Call Percentage</Label>
                    <Input type="number" placeholder="20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Textarea placeholder="Describe the purpose of this capital call..." />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsNewCallDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCapitalCall} className="gap-2 bg-sky-500 hover:bg-sky-600">
                  <Send className="h-4 w-4" />
                  Send Capital Call
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Wallet className="h-4 w-4" />
                <span className="text-sm">Total Committed</span>
              </div>
              <div className="text-3xl font-bold">
                ${(totalCommitted / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Across {spvs.length} SPVs
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Send className="h-4 w-4" />
                <span className="text-sm">Total Called</span>
              </div>
              <div className="text-3xl font-bold">
                ${(totalCalled / 1000000).toFixed(1)}M
              </div>
              <Progress value={(totalCalled / totalCommitted) * 100} className="mt-2 h-2" />
              <div className="text-sm text-muted-foreground mt-1">
                {((totalCalled / totalCommitted) * 100).toFixed(0)}% of commitments
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Total Received</span>
              </div>
              <div className="text-3xl font-bold text-green-500">
                ${(totalReceived / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {((totalReceived / totalCalled) * 100).toFixed(0)}% collection rate
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Pending</span>
              </div>
              <div className="text-3xl font-bold text-sky-500">
                ${(pendingAmount / 1000).toFixed(0)}K
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Awaiting payment
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="capital-calls">Capital Calls</TabsTrigger>
            <TabsTrigger value="commitments">Commitments</TabsTrigger>
            <TabsTrigger value="cap-table">Cap Table</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-2 gap-6">
              {/* SPV Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>SPV Summary</CardTitle>
                  <CardDescription>Capital status by vehicle</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {spvs.map((spv) => (
                      <div key={spv.id} className="p-4 border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-sky-500/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-sky-500" />
                            </div>
                            <div>
                              <div className="font-semibold">{spv.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {spv.lpCount} LPs
                              </div>
                            </div>
                          </div>
                          <Badge className={spv.status === "active" ? "bg-green-500" : "bg-sky-500"}>
                            {spv.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Committed</span>
                            <span className="font-medium">${(spv.totalCommitted / 1000000).toFixed(1)}M / ${(spv.targetRaise / 1000000).toFixed(0)}M</span>
                          </div>
                          <Progress value={(spv.totalCommitted / spv.targetRaise) * 100} className="h-2" />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Called</span>
                            <span className="font-medium">${(spv.totalCalled / 1000000).toFixed(1)}M ({((spv.totalCalled / spv.totalCommitted) * 100).toFixed(0)}%)</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Received</span>
                            <span className="font-medium text-green-500">${(spv.totalReceived / 1000000).toFixed(1)}M</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Capital Calls */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Capital Calls</CardTitle>
                  <CardDescription>Latest capital call activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {capitalCalls.map((call) => (
                      <div key={call.id} className="p-4 border">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-semibold">{call.spvName}</div>
                            <div className="text-sm text-muted-foreground">
                              Capital Call #{call.callNumber}
                            </div>
                          </div>
                          <Badge className={call.status === "complete" ? "bg-green-500" : "bg-sky-500"}>
                            {call.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Amount</div>
                            <div className="font-medium">${(call.callAmount / 1000000).toFixed(1)}M</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Due Date</div>
                            <div className="font-medium">{call.dueDate}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Received</div>
                            <div className="font-medium text-green-500">
                              ${(call.totalReceived / 1000000).toFixed(1)}M
                            </div>
                          </div>
                        </div>
                        {call.status === "sent" && (
                          <div className="mt-3">
                            <Progress 
                              value={(call.totalReceived / call.totalCalled) * 100} 
                              className="h-2"
                            />
                            <div className="text-xs text-muted-foreground mt-1">
                              {((call.totalReceived / call.totalCalled) * 100).toFixed(0)}% collected
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="capital-calls">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Capital Calls</CardTitle>
                    <CardDescription>All capital call notices and their status</CardDescription>
                  </div>
                  <div className="flex gap-3">
                    <Select defaultValue="all">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All SPVs</SelectItem>
                        {spvs.map((spv) => (
                          <SelectItem key={spv.id} value={spv.id.toString()}>
                            {spv.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {capitalCalls.map((call) => (
                    <div key={call.id} className="border">
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-sky-500/10 flex items-center justify-center">
                            <Send className="h-6 w-6 text-sky-500" />
                          </div>
                          <div>
                            <div className="font-semibold">{call.spvName} - Call #{call.callNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {call.callPercentage}% of commitments • Due {call.dueDate}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold">${(call.callAmount / 1000000).toFixed(1)}M</div>
                            <div className="text-sm text-green-500">
                              ${(call.totalReceived / 1000000).toFixed(1)}M received
                            </div>
                          </div>
                          <Badge className={call.status === "complete" ? "bg-green-500" : "bg-sky-500"}>
                            {call.status}
                          </Badge>
                        </div>
                      </div>
                      {call.responses.length > 0 && (
                        <div className="border-t p-4 bg-muted/30">
                          <div className="text-sm font-medium mb-3">LP Responses</div>
                          <div className="grid grid-cols-4 gap-3">
                            {call.responses.map((response, idx) => (
                              <div key={idx} className="p-3 bg-background border">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{response.lpName}</span>
                                  {response.status === "paid" ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-sky-500" />
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  ${(response.amount / 1000).toFixed(0)}K
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commitments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>LP Commitments</CardTitle>
                    <CardDescription>All LP commitments and funding status</CardDescription>
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
                        <TableHead className="text-left py-3 px-4 font-medium">LP Name</TableHead>
                        <TableHead className="text-left py-3 px-4 font-medium">SPV</TableHead>
                        <TableHead className="text-right py-3 px-4 font-medium">Committed</TableHead>
                        <TableHead className="text-right py-3 px-4 font-medium">Called</TableHead>
                        <TableHead className="text-right py-3 px-4 font-medium">Funded</TableHead>
                        <TableHead className="text-right py-3 px-4 font-medium">Unfunded</TableHead>
                        <TableHead className="text-center py-3 px-4 font-medium">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commitments.map((c) => (
                        <TableRow key={c.id} className="border-b hover:bg-muted/50">
                          <TableCell className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-muted flex items-center justify-center">
                                <Users className="h-4 w-4" />
                              </div>
                              <span className="font-medium">{c.lpName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-muted-foreground">{c.spv}</TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono">
                            ${c.committed.toLocaleString()}
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono">
                            ${c.called.toLocaleString()}
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono text-green-500">
                            ${c.funded.toLocaleString()}
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono text-muted-foreground">
                            ${c.unfunded.toLocaleString()}
                          </TableCell>
                          <TableCell className="py-4 px-4 text-center">
                            {c.funded >= c.called ? (
                              <Badge className="bg-green-500">Current</Badge>
                            ) : (
                              <Badge variant="destructive">Outstanding</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cap-table">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cap Table</CardTitle>
                    <CardDescription>Ownership breakdown by SPV</CardDescription>
                  </div>
                  <Select defaultValue="1">
                    <SelectTrigger className="w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {spvs.map((spv) => (
                        <SelectItem key={spv.id} value={spv.id.toString()}>
                          {spv.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Visual Cap Table */}
                  <div className="grid grid-cols-4 gap-4">
                    {commitments.map((c, idx) => {
                      const percentage = (c.committed / 7500000) * 100;
                      const colors = ["bg-sky-500", "bg-blue-500", "bg-green-500", "bg-purple-500"];
                      return (
                        <div key={c.id} className="p-4 border">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 ${colors[idx % colors.length]}`} />
                            <span className="font-medium text-sm">{c.lpName}</span>
                          </div>
                          <div className="text-2xl font-bold">{percentage.toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">
                            ${(c.committed / 1000000).toFixed(2)}M committed
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Table */}
                  <div className="overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow className="border-b">
                          <TableHead className="text-left py-3 px-4 font-medium">Holder</TableHead>
                          <TableHead className="text-left py-3 px-4 font-medium">Type</TableHead>
                          <TableHead className="text-right py-3 px-4 font-medium">Ownership %</TableHead>
                          <TableHead className="text-right py-3 px-4 font-medium">Capital Contributed</TableHead>
                          <TableHead className="text-right py-3 px-4 font-medium">Current Value</TableHead>
                          <TableHead className="text-center py-3 px-4 font-medium">Voting Rights</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commitments.map((c) => {
                          const percentage = (c.committed / 7500000) * 100;
                          return (
                            <TableRow key={c.id} className="border-b hover:bg-muted/50">
                              <TableCell className="py-4 px-4 font-medium">{c.lpName}</TableCell>
                              <TableCell className="py-4 px-4">
                                <Badge variant="outline">LP</Badge>
                              </TableCell>
                              <TableCell className="py-4 px-4 text-right font-mono">
                                {percentage.toFixed(2)}%
                              </TableCell>
                              <TableCell className="py-4 px-4 text-right font-mono">
                                ${c.funded.toLocaleString()}
                              </TableCell>
                              <TableCell className="py-4 px-4 text-right font-mono text-green-500">
                                ${(c.funded * 1.15).toLocaleString()}
                              </TableCell>
                              <TableCell className="py-4 px-4 text-center">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="border-b bg-muted/30">
                          <TableCell className="py-4 px-4 font-medium">GP Interest</TableCell>
                          <TableCell className="py-4 px-4">
                            <Badge>GP</Badge>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono">0.00%</TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono">$0</TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono">-</TableCell>
                          <TableCell className="py-4 px-4 text-center">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-b bg-muted/30">
                          <TableCell className="py-4 px-4 font-medium">Carried Interest</TableCell>
                          <TableCell className="py-4 px-4">
                            <Badge variant="secondary">Carry</Badge>
                          </TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono">20.00%</TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono">-</TableCell>
                          <TableCell className="py-4 px-4 text-right font-mono text-sky-500">
                            ${(7500000 * 0.15 * 0.2).toLocaleString()}
                          </TableCell>
                          <TableCell className="py-4 px-4 text-center">-</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
