import { useState } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, DollarSign, Percent, PieChart,
  ArrowUpRight, ArrowDownRight, RefreshCw, Clock, Target,
  Wallet, BarChart3, LineChart, Activity, Zap, Shield,
  ChevronRight, Plus, Eye, Settings, Bell, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Demo trading data
const portfolioStats = {
  totalValue: 75000000,
  weeklyReturn: 20.4,
  monthlyReturn: 87.2,
  ytdReturn: 342.8,
  allocatedCapital: 100000000,
  availableCapital: 25000000,
  activePositions: 12,
  pendingOrders: 3,
};

const positions = [
  { id: 1, asset: "Gold Futures", type: "long", entry: 2045.50, current: 2089.30, quantity: 500, pnl: 21900, pnlPercent: 2.14, status: "active" },
  { id: 2, asset: "Crude Oil (WTI)", type: "long", entry: 72.40, current: 78.90, quantity: 10000, pnl: 65000, pnlPercent: 8.98, status: "active" },
  { id: 3, asset: "S&P 500 Index", type: "long", entry: 4890, current: 5120, quantity: 100, pnl: 23000, pnlPercent: 4.70, status: "active" },
  { id: 4, asset: "Bitcoin", type: "long", entry: 42500, current: 48200, quantity: 25, pnl: 142500, pnlPercent: 13.41, status: "active" },
  { id: 5, asset: "EUR/USD", type: "short", entry: 1.0920, current: 1.0850, quantity: 1000000, pnl: 7000, pnlPercent: 0.64, status: "active" },
];

const recentTrades = [
  { id: 1, asset: "Gold Futures", action: "BUY", quantity: 100, price: 2045.50, total: 204550, time: "2 hours ago", status: "filled" },
  { id: 2, asset: "Crude Oil", action: "SELL", quantity: 5000, price: 76.20, total: 381000, time: "5 hours ago", status: "filled" },
  { id: 3, asset: "Bitcoin", action: "BUY", quantity: 10, price: 45800, total: 458000, time: "1 day ago", status: "filled" },
  { id: 4, asset: "Silver Futures", action: "BUY", quantity: 200, price: 24.50, total: 4900, time: "2 days ago", status: "filled" },
];

const allocationBreakdown = [
  { category: "Commodities", allocation: 40, value: 30000000, color: "bg-yellow-500" },
  { category: "Crypto", allocation: 25, value: 18750000, color: "bg-purple-500" },
  { category: "Equities", allocation: 20, value: 15000000, color: "bg-blue-500" },
  { category: "Forex", allocation: 10, value: 7500000, color: "bg-green-500" },
  { category: "Cash", allocation: 5, value: 3750000, color: "bg-gray-500" },
];

const weeklyPerformance = [
  { week: "Week 1", return: 18.5, target: 20 },
  { week: "Week 2", return: 22.3, target: 20 },
  { week: "Week 3", return: 19.8, target: 20 },
  { week: "Week 4", return: 21.1, target: 20 },
];

export default function TradingPlatform() {
  const [showDepositDialog, setShowDepositDialog] = useState(false);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Trading Platform</h1>
            <p className="text-muted-foreground mt-1">
              GoFi Trading Dashboard - 20% Weekly Target Returns
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Sync
            </Button>
            <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Deposit Funds
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deposit Funds</DialogTitle>
                  <DialogDescription>
                    Add capital to your trading account
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Amount (USD)</Label>
                    <Input type="number" placeholder="100000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wire">Wire Transfer</SelectItem>
                        <SelectItem value="crypto">Crypto Wallet</SelectItem>
                        <SelectItem value="internal">Internal Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowDepositDialog(false)}>Cancel</Button>
                    <Button>Confirm Deposit</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(portfolioStats.totalValue)}</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <Wallet className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4" />
                <span>+{portfolioStats.weeklyReturn}% this week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Weekly Return</p>
                  <p className="text-2xl font-bold text-green-600">+{portfolioStats.weeklyReturn}%</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Target: 20%</span>
                  <span className="text-green-600">Exceeded</span>
                </div>
                <Progress value={(portfolioStats.weeklyReturn / 20) * 100} className="h-1.5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Return</p>
                  <p className="text-2xl font-bold text-green-600">+{portfolioStats.monthlyReturn}%</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Compounded from weekly returns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Capital</p>
                  <p className="text-2xl font-bold">{formatCurrency(portfolioStats.availableCapital)}</p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/10">
                  <DollarSign className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ready to deploy
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Positions & Trades */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="positions">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="positions" className="gap-1 md:gap-2 text-xs md:text-sm">
                  <Activity className="h-4 w-4" />
                  Active Positions
                  <Badge variant="secondary">{positions.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="trades" className="gap-1 md:gap-2 text-xs md:text-sm">
                  <Clock className="h-4 w-4" />
                  Recent Trades
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-1 md:gap-2 text-xs md:text-sm">
                  <Target className="h-4 w-4" />
                  Pending Orders
                  <Badge variant="secondary">{portfolioStats.pendingOrders}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="positions" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="border-b">
                            <TableHead className="text-left p-4 text-sm font-medium text-muted-foreground">Asset</TableHead>
                            <TableHead className="text-left p-4 text-sm font-medium text-muted-foreground">Type</TableHead>
                            <TableHead className="text-right p-4 text-sm font-medium text-muted-foreground">Entry</TableHead>
                            <TableHead className="text-right p-4 text-sm font-medium text-muted-foreground">Current</TableHead>
                            <TableHead className="text-right p-4 text-sm font-medium text-muted-foreground">P&L</TableHead>
                            <TableHead className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {positions.map((position) => (
                            <motion.tr 
                              key={position.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="border-b last:border-0 hover:bg-muted/50"
                            >
                              <TableCell className="p-4">
                                <div className="font-medium">{position.asset}</div>
                                <div className="text-xs text-muted-foreground">Qty: {position.quantity.toLocaleString()}</div>
                              </TableCell>
                              <TableCell className="p-4">
                                <Badge variant={position.type === "long" ? "default" : "secondary"} className={position.type === "long" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
                                  {position.type.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="p-4 text-right font-mono">${position.entry.toLocaleString()}</TableCell>
                              <TableCell className="p-4 text-right font-mono">${position.current.toLocaleString()}</TableCell>
                              <TableCell className="p-4 text-right">
                                <div className={`font-medium ${position.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {position.pnl >= 0 ? "+" : ""}{formatCurrency(position.pnl)}
                                </div>
                                <div className={`text-xs ${position.pnlPercent >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {position.pnlPercent >= 0 ? "+" : ""}{position.pnlPercent}%
                                </div>
                              </TableCell>
                              <TableCell className="p-4 text-right">
                                <Button variant="outline" size="sm">Close</Button>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="trades" className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table className="w-full">
                        <TableHeader>
                          <TableRow className="border-b">
                            <TableHead className="text-left p-4 text-sm font-medium text-muted-foreground">Asset</TableHead>
                            <TableHead className="text-left p-4 text-sm font-medium text-muted-foreground">Action</TableHead>
                            <TableHead className="text-right p-4 text-sm font-medium text-muted-foreground">Quantity</TableHead>
                            <TableHead className="text-right p-4 text-sm font-medium text-muted-foreground">Price</TableHead>
                            <TableHead className="text-right p-4 text-sm font-medium text-muted-foreground">Total</TableHead>
                            <TableHead className="text-right p-4 text-sm font-medium text-muted-foreground">Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentTrades.map((trade) => (
                            <TableRow key={trade.id} className="border-b last:border-0 hover:bg-muted/50">
                              <TableCell className="p-4 font-medium">{trade.asset}</TableCell>
                              <TableCell className="p-4">
                                <Badge className={trade.action === "BUY" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}>
                                  {trade.action}
                                </Badge>
                              </TableCell>
                              <TableCell className="p-4 text-right font-mono">{trade.quantity.toLocaleString()}</TableCell>
                              <TableCell className="p-4 text-right font-mono">${trade.price.toLocaleString()}</TableCell>
                              <TableCell className="p-4 text-right font-mono">{formatCurrency(trade.total)}</TableCell>
                              <TableCell className="p-4 text-right text-muted-foreground">{trade.time}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="mt-4">
                <Card>
                  <CardContent className="py-12 text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold">3 Pending Orders</h3>
                    <p className="text-muted-foreground">Limit orders waiting to be filled</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Weekly Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Weekly Performance vs Target
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyPerformance.map((week, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{week.week}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">Target: {week.target}%</span>
                          <span className={week.return >= week.target ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                            Actual: {week.return}%
                          </span>
                        </div>
                      </div>
                      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-primary/20 rounded-full"
                          style={{ width: `${week.target}%` }}
                        />
                        <div 
                          className={`absolute inset-y-0 left-0 rounded-full ${week.return >= week.target ? "bg-green-500" : "bg-yellow-500"}`}
                          style={{ width: `${week.return}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Allocation & Stats */}
          <div className="space-y-6">
            {/* Allocation Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Portfolio Allocation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {allocationBreakdown.map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span>{item.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{item.allocation}%</span>
                        <span className="text-muted-foreground ml-2">({formatCurrency(item.value)})</span>
                      </div>
                    </div>
                    <Progress value={item.allocation} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Win Rate</span>
                  </div>
                  <span className="font-bold text-green-600">78.4%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Avg Trade Duration</span>
                  </div>
                  <span className="font-bold">3.2 days</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Max Drawdown</span>
                  </div>
                  <span className="font-bold text-green-600">-4.2%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Sharpe Ratio</span>
                  </div>
                  <span className="font-bold">2.84</span>
                </div>
              </CardContent>
            </Card>

            {/* Liquidity Status */}
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Lock className="h-5 w-5" />
                  Liquidity Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Members Onboarded</span>
                    <span className="font-bold">1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Avg Capital/Member</span>
                    <span className="font-bold">$300,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Pool</span>
                    <span className="font-bold text-green-600">$374.1M</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Platform Fees (2%)</span>
                    <span className="font-bold">$7.48M</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}
