import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Search, Filter, Plus, ArrowLeftRight, CheckCircle,
  AlertTriangle, Shield, Globe, Users, TrendingUp, Eye,
  MessageSquare, Star, Verified, FileText, Wallet, Building2,
  Gem, Droplets, Home, Target, Sparkles, Clock, DollarSign,
  ChevronRight, ArrowRight, ThumbsUp, ThumbsDown, Handshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import DashboardLayout from "@/components/DashboardLayout";

// Demo data for transaction matches
const transactionMatches = [
  {
    id: 1,
    buyer: {
      name: "Meridian Capital Partners",
      verified: true,
      proofOfFunds: true,
      criteria: "99%+ purity gold, 100-500kg monthly, Dubai delivery",
    },
    seller: {
      name: "Swiss Gold Refinery AG",
      verified: true,
      proofOfProduct: true,
      listing: "99.99% Pure Gold Bullion - 500kg available",
    },
    assetClass: "gold",
    matchScore: 94,
    proposedValue: 32500000,
    status: "mutual_interest",
    matchFactors: [
      { factor: "Purity Match", score: 100 },
      { factor: "Quantity Match", score: 95 },
      { factor: "Location Match", score: 90 },
      { factor: "Price Match", score: 88 },
    ],
    createdAt: "2026-01-15",
  },
  {
    id: 2,
    buyer: {
      name: "Tokyo Energy Trading",
      verified: true,
      proofOfFunds: true,
      criteria: "Bonny Light crude, 1M+ barrels, CIF Japan",
    },
    seller: {
      name: "NNPC Trading",
      verified: true,
      proofOfProduct: true,
      listing: "Bonny Light Crude - 2M barrels available",
    },
    assetClass: "oil_gas",
    matchScore: 89,
    proposedValue: 157000000,
    status: "negotiating",
    matchFactors: [
      { factor: "Grade Match", score: 100 },
      { factor: "Quantity Match", score: 85 },
      { factor: "Delivery Match", score: 82 },
      { factor: "Price Match", score: 90 },
    ],
    createdAt: "2026-01-14",
  },
  {
    id: 3,
    buyer: {
      name: "Blackstone Real Estate",
      verified: true,
      proofOfFunds: true,
      criteria: "NYC Office, $200M+, 5%+ cap rate",
    },
    seller: {
      name: "Brookfield Properties",
      verified: true,
      proofOfProduct: true,
      listing: "131 W 57th St - Class A Office Tower",
    },
    assetClass: "real_estate",
    matchScore: 87,
    proposedValue: 285000000,
    status: "due_diligence",
    matchFactors: [
      { factor: "Property Type Match", score: 100 },
      { factor: "Location Match", score: 95 },
      { factor: "Size Match", score: 80 },
      { factor: "Cap Rate Match", score: 75 },
    ],
    createdAt: "2026-01-12",
  },
  {
    id: 4,
    buyer: {
      name: "Shanghai Metals Corp",
      verified: true,
      proofOfFunds: false,
      criteria: "LME Grade Copper, 10,000 MT, FOB Chile",
    },
    seller: {
      name: "BHP Billiton",
      verified: true,
      proofOfProduct: true,
      listing: "Grade A Copper Cathodes - 5,000 MT",
    },
    assetClass: "minerals",
    matchScore: 72,
    proposedValue: 42250000,
    status: "pending",
    matchFactors: [
      { factor: "Grade Match", score: 100 },
      { factor: "Quantity Match", score: 50 },
      { factor: "Location Match", score: 85 },
      { factor: "Price Match", score: 78 },
    ],
    createdAt: "2026-01-16",
  },
];

const buyerCriteria = [
  {
    id: 1,
    userId: 1,
    assetClass: "gold",
    commodityTypes: ["gold"],
    minPurity: 99.5,
    preferredOrigins: ["Switzerland", "UAE", "UK"],
    preferredDeliveryLocations: ["Dubai", "Singapore", "Zurich"],
    minQuantity: 100,
    maxQuantity: 1000,
    quantityUnit: "kilograms",
    frequencyPerMonth: 2,
    maxDiscountFromSpot: 3,
    requiresVerifiedSeller: true,
    requiresSKR: true,
    isActive: true,
    user: { name: "Meridian Capital Partners", verified: true },
  },
  {
    id: 2,
    userId: 2,
    assetClass: "real_estate",
    propertyTypes: ["office", "industrial"],
    preferredMarkets: ["New York", "Los Angeles", "Miami"],
    minCapRate: 5.0,
    maxCapRate: 8.0,
    minOccupancy: 85,
    minPrice: 50000000,
    maxPrice: 500000000,
    requiresVerifiedSeller: true,
    isActive: true,
    user: { name: "Blackstone Real Estate", verified: true },
  },
];

const getAssetIcon = (assetClass: string) => {
  switch (assetClass) {
    case "gold": return <Gem className="h-5 w-5 text-yellow-500" />;
    case "oil_gas": return <Droplets className="h-5 w-5 text-blue-500" />;
    case "real_estate": return <Home className="h-5 w-5 text-green-500" />;
    case "minerals": return <Building2 className="h-5 w-5 text-orange-500" />;
    default: return <Globe className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-gray-500/10 text-gray-600">Pending Review</Badge>;
    case "buyer_interested":
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600">Buyer Interested</Badge>;
    case "seller_interested":
      return <Badge variant="outline" className="bg-purple-500/10 text-purple-600">Seller Interested</Badge>;
    case "mutual_interest":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Mutual Interest</Badge>;
    case "negotiating":
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Negotiating</Badge>;
    case "due_diligence":
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Due Diligence</Badge>;
    case "completed":
      return <Badge className="bg-green-500 text-white">Completed</Badge>;
    default:
      return null;
  }
};

const MatchCard = ({ match }: { match: typeof transactionMatches[0] }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 75) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getAssetIcon(match.assetClass)}
              <div>
                <CardTitle className="text-base">Transaction Match #{match.id}</CardTitle>
                <CardDescription className="capitalize">{match.assetClass.replace("_", " ")}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(match.status)}
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className={`font-bold ${getScoreColor(match.matchScore)}`}>{match.matchScore}%</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buyer & Seller */}
          <div className="grid grid-cols-2 gap-4">
            {/* Buyer */}
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-600">BUYER</span>
              </div>
              <p className="font-semibold flex items-center gap-1">
                {match.buyer.name}
                {match.buyer.verified && <Verified className="h-3 w-3 text-blue-500" />}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{match.buyer.criteria}</p>
              <div className="flex gap-2 mt-2">
                {match.buyer.proofOfFunds && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    POF
                  </Badge>
                )}
              </div>
            </div>

            {/* Seller */}
            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-green-600">SELLER</span>
              </div>
              <p className="font-semibold flex items-center gap-1">
                {match.seller.name}
                {match.seller.verified && <Verified className="h-3 w-3 text-blue-500" />}
              </p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{match.seller.listing}</p>
              <div className="flex gap-2 mt-2">
                {match.seller.proofOfProduct && (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    POP
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Match Factors */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Match Factors</p>
            <div className="grid grid-cols-2 gap-2">
              {match.matchFactors.map((factor, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{factor.factor}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={factor.score} className="w-16 h-1.5" />
                    <span className={`font-medium ${getScoreColor(factor.score)}`}>{factor.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Proposed Value */}
          <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Proposed Transaction Value</p>
              <p className="text-xl font-bold">${(match.proposedValue / 1000000).toFixed(1)}M</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" className="gap-1">
                <Handshake className="h-4 w-4" />
                Facilitate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function TransactionMatching() {
  const [activeTab, setActiveTab] = useState("matches");
  const [showCriteriaDialog, setShowCriteriaDialog] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transaction Matching</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered buyer/seller matching with verified proof of funds and product
            </p>
          </div>
          <Dialog open={showCriteriaDialog} onOpenChange={setShowCriteriaDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Criteria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Matching Criteria</DialogTitle>
                <DialogDescription>
                  Define your buying or selling criteria to find matching counterparties
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>I want to</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                        <SelectItem value="invest">Invest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Asset Class</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gold">Gold & Precious Metals</SelectItem>
                        <SelectItem value="oil_gas">Oil & Gas</SelectItem>
                        <SelectItem value="minerals">Minerals & Metals</SelectItem>
                        <SelectItem value="real_estate">Real Estate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 p-4 rounded-lg border">
                  <h4 className="font-medium">Commodity Criteria</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Purity %</Label>
                      <Input type="number" placeholder="99.5" step="0.1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred Origins</Label>
                      <Input placeholder="Switzerland, UAE, UK" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Min Quantity</Label>
                      <Input type="number" placeholder="100" />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Quantity</Label>
                      <Input type="number" placeholder="1000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kilograms">Kilograms</SelectItem>
                          <SelectItem value="troy_ounces">Troy Ounces</SelectItem>
                          <SelectItem value="barrels">Barrels</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 rounded-lg border">
                  <h4 className="font-medium">Verification Requirements</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Require Verified Seller</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Require SKR Verification</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Require Sanctions Clearance</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Additional Requirements</Label>
                  <Textarea placeholder="Any specific requirements or preferences..." rows={3} />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowCriteriaDialog(false)}>Cancel</Button>
                  <Button>Save Criteria</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Zap className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-muted-foreground">Active Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Handshake className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">$2.1B</p>
                  <p className="text-xs text-muted-foreground">Matched Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Target className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">89%</p>
                  <p className="text-xs text-muted-foreground">Avg Match Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">4.2d</p>
                  <p className="text-xs text-muted-foreground">Avg Time to Match</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="matches" className="gap-2">
              <ArrowLeftRight className="h-4 w-4" />
              Active Matches
              <Badge variant="secondary">156</Badge>
            </TabsTrigger>
            <TabsTrigger value="criteria" className="gap-2">
              <Target className="h-4 w-4" />
              My Criteria
              <Badge variant="secondary">8</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
              <Badge variant="secondary">42</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="mt-6">
            {/* Search & Filter */}
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search matches by party name or asset..."
                  className="pl-10"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Asset Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="oil_gas">Oil & Gas</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="mutual_interest">Mutual Interest</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="due_diligence">Due Diligence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Matches Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {transactionMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="criteria" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {buyerCriteria.map((criteria) => (
                <Card key={criteria.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getAssetIcon(criteria.assetClass)}
                        <div>
                          <CardTitle className="text-base capitalize">
                            {criteria.assetClass.replace("_", " ")} Criteria
                          </CardTitle>
                          <CardDescription>{criteria.user.name}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={criteria.isActive ? "default" : "secondary"}>
                        {criteria.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {criteria.assetClass === "gold" && (
                      <>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Min Purity</p>
                            <p className="font-medium">{criteria.minPurity}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quantity</p>
                            <p className="font-medium">{criteria.minQuantity}-{criteria.maxQuantity} {criteria.quantityUnit}</p>
                          </div>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground">Preferred Origins</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {criteria.preferredOrigins?.map((origin, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">{origin}</Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    {criteria.assetClass === "real_estate" && (
                      <>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Cap Rate</p>
                            <p className="font-medium">{criteria.minCapRate}% - {criteria.maxCapRate}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Price Range</p>
                            <p className="font-medium">${(criteria.minPrice! / 1000000).toFixed(0)}M - ${(criteria.maxPrice! / 1000000).toFixed(0)}M</p>
                          </div>
                        </div>
                        <div className="text-sm">
                          <p className="text-muted-foreground">Property Types</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {criteria.propertyTypes?.map((type, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs capitalize">{type}</Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">Edit</Button>
                      <Button size="sm" className="flex-1">View Matches</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500/50 mb-4" />
              <h3 className="text-lg font-semibold">42 Completed Transactions</h3>
              <p className="text-muted-foreground">Total value: $890M</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
