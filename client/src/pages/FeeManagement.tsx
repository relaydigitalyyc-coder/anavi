import { useState } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, Percent, TrendingUp, PieChart, Calendar,
  ArrowUpRight, Download, Filter, Settings, Users,
  Building2, Briefcase, Wallet, CreditCard, BarChart3,
  Clock, CheckCircle, AlertCircle, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";

// Demo fee data
const feeStats = {
  totalRevenue: 15840000,
  managementFees: 7482000,
  carryFees: 4250000,
  transactionFees: 2890000,
  finderFees: 1218000,
  pendingPayouts: 3420000,
  paidThisMonth: 2150000,
  partnerPayouts: 1890000,
};

const feeStructure = {
  managementFee: 2.0,
  carryFee: 20.0,
  transactionFee: 1.5,
  finderFee: 2.5,
  hurdle: 8.0,
};

const recentFees = [
  { id: 1, type: "Management Fee", source: "Q4 2025 AUM", amount: 1870500, date: "2026-01-15", status: "collected" },
  { id: 2, type: "Carry", source: "SPV Alpha - Exit", amount: 2125000, date: "2026-01-12", status: "collected" },
  { id: 3, type: "Transaction Fee", source: "Gold Trade - Swiss Refinery", amount: 487500, date: "2026-01-10", status: "collected" },
  { id: 4, type: "Finder Fee", source: "Real Estate - 131 W 57th", amount: 712500, date: "2026-01-08", status: "pending" },
  { id: 5, type: "Management Fee", source: "Q3 2025 AUM", amount: 1650000, date: "2025-12-15", status: "collected" },
  { id: 6, type: "Transaction Fee", source: "Oil Trade - NNPC", amount: 785000, date: "2025-12-10", status: "collected" },
];

const partnerPayouts = [
  { id: 1, partner: "Marcus Chen", tier: "partner", share: 15, amount: 283575, status: "paid", date: "2026-01-15" },
  { id: 2, partner: "Elena Rodriguez", tier: "partner", share: 15, amount: 283575, status: "paid", date: "2026-01-15" },
  { id: 3, partner: "James Wilson", tier: "partner", share: 10, amount: 189050, status: "pending", date: "2026-01-20" },
  { id: 4, partner: "Sarah Williams", tier: "premium", share: 5, amount: 94525, status: "pending", date: "2026-01-20" },
];

const monthlyRevenue = [
  { month: "Aug", revenue: 980000 },
  { month: "Sep", revenue: 1250000 },
  { month: "Oct", revenue: 1480000 },
  { month: "Nov", revenue: 1890000 },
  { month: "Dec", revenue: 2340000 },
  { month: "Jan", revenue: 2890000 },
];

export default function FeeManagement() {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
            <p className="text-muted-foreground mt-1">
              Track revenue, fees, and partner payouts
            </p>
          </div>
          <div className="flex gap-3">
            <Select defaultValue="2026">
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Configure Fees
            </Button>
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(feeStats.totalRevenue)}</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                <span>+32% vs last quarter</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Management Fees</p>
                  <p className="text-2xl font-bold">{formatCurrency(feeStats.managementFees)}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Percent className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{feeStructure.managementFee}% of AUM</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Carry Fees</p>
                  <p className="text-2xl font-bold">{formatCurrency(feeStats.carryFees)}</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/10">
                  <TrendingUp className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{feeStructure.carryFee}% above {feeStructure.hurdle}% hurdle</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction Fees</p>
                  <p className="text-2xl font-bold">{formatCurrency(feeStats.transactionFees)}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <CreditCard className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{feeStructure.transactionFee}% per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-4 h-48">
                  {monthlyRevenue.map((month, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(month.revenue / maxRevenue) * 100}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className="w-full bg-primary/80 rounded-t-md min-h-[20px]"
                      />
                      <span className="text-xs text-muted-foreground">{month.month}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Fees */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Fee Collections</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-b">
                        <TableHead className="text-left p-4 text-sm font-medium text-muted-foreground">Type</TableHead>
                        <TableHead className="text-left p-4 text-sm font-medium text-muted-foreground">Source</TableHead>
                        <TableHead className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</TableHead>
                        <TableHead className="text-right p-4 text-sm font-medium text-muted-foreground">Date</TableHead>
                        <TableHead className="text-right p-4 text-sm font-medium text-muted-foreground">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentFees.map((fee) => (
                        <TableRow key={fee.id} className="border-b last:border-0 hover:bg-muted/50">
                          <TableCell className="p-4">
                            <Badge variant="outline">{fee.type}</Badge>
                          </TableCell>
                          <TableCell className="p-4 text-sm">{fee.source}</TableCell>
                          <TableCell className="p-4 text-right font-mono font-medium">{formatCurrency(fee.amount)}</TableCell>
                          <TableCell className="p-4 text-right text-sm text-muted-foreground">{fee.date}</TableCell>
                          <TableCell className="p-4 text-right">
                            {fee.status === "collected" ? (
                              <Badge className="bg-green-500/10 text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Collected
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-500/10 text-yellow-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Fee Structure */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Fee Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Management Fee</span>
                  <span className="font-bold">{feeStructure.managementFee}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Carry (Performance)</span>
                  <span className="font-bold">{feeStructure.carryFee}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Hurdle Rate</span>
                  <span className="font-bold">{feeStructure.hurdle}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Transaction Fee</span>
                  <span className="font-bold">{feeStructure.transactionFee}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Finder Fee</span>
                  <span className="font-bold">{feeStructure.finderFee}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>Management</span>
                    </div>
                    <span className="font-medium">{((feeStats.managementFees / feeStats.totalRevenue) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(feeStats.managementFees / feeStats.totalRevenue) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span>Carry</span>
                    </div>
                    <span className="font-medium">{((feeStats.carryFees / feeStats.totalRevenue) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(feeStats.carryFees / feeStats.totalRevenue) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span>Transaction</span>
                    </div>
                    <span className="font-medium">{((feeStats.transactionFees / feeStats.totalRevenue) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(feeStats.transactionFees / feeStats.totalRevenue) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Finder</span>
                    </div>
                    <span className="font-medium">{((feeStats.finderFees / feeStats.totalRevenue) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(feeStats.finderFees / feeStats.totalRevenue) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Partner Payouts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Partner Payouts
                </CardTitle>
                <CardDescription>Revenue sharing with partners</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {partnerPayouts.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{payout.partner}</p>
                      <p className="text-xs text-muted-foreground">{payout.share}% share</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(payout.amount)}</p>
                      {payout.status === "paid" ? (
                        <Badge className="bg-green-500/10 text-green-600 text-xs">Paid</Badge>
                      ) : (
                        <Badge className="bg-yellow-500/10 text-yellow-600 text-xs">Pending</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
