import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserPlus, CheckCircle, Clock, DollarSign, Briefcase,
  Building2, MapPin, Star, ArrowRight, ChevronRight, Search,
  Filter, Eye, MessageSquare, Verified, Award, TrendingUp,
  Wallet, Target, Zap, FileText, Upload, Check, X
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
import { Checkbox } from "@/components/ui/checkbox";

// Demo member data
const members = [
  {
    id: 1,
    name: "Marcus Chen",
    email: "marcus.chen@example.com",
    status: "active",
    tier: "partner",
    allocatedCapital: 300000,
    deployedCapital: 285000,
    totalReturns: 68400,
    returnPercent: 24.0,
    joinDate: "2025-11-15",
    industry: "Distribution",
    expertise: ["Beverage Distribution", "Logistics", "Supply Chain"],
    connections: ["Pepsi Cola", "Coca-Cola Bottlers", "Regional Distributors"],
    contributionScore: 92,
    referrals: 8,
    verified: true,
  },
  {
    id: 2,
    name: "Sarah Williams",
    email: "sarah.w@example.com",
    status: "active",
    tier: "premium",
    allocatedCapital: 300000,
    deployedCapital: 250000,
    totalReturns: 52500,
    returnPercent: 21.0,
    joinDate: "2025-12-01",
    industry: "Real Estate",
    expertise: ["Commercial RE", "Development", "Property Management"],
    connections: ["CBRE", "JLL", "Local Developers"],
    contributionScore: 85,
    referrals: 5,
    verified: true,
  },
  {
    id: 3,
    name: "David Park",
    email: "david.park@example.com",
    status: "pending",
    tier: "basic",
    allocatedCapital: 0,
    deployedCapital: 0,
    totalReturns: 0,
    returnPercent: 0,
    joinDate: "2026-01-10",
    industry: "Technology",
    expertise: ["SaaS", "AI/ML", "Enterprise Software"],
    connections: ["Tech Startups", "VCs"],
    contributionScore: 0,
    referrals: 0,
    verified: false,
  },
  {
    id: 4,
    name: "Elena Rodriguez",
    email: "elena.r@example.com",
    status: "active",
    tier: "partner",
    allocatedCapital: 300000,
    deployedCapital: 300000,
    totalReturns: 78000,
    returnPercent: 26.0,
    joinDate: "2025-10-20",
    industry: "Finance",
    expertise: ["Investment Banking", "M&A", "Private Equity"],
    connections: ["Goldman Sachs Alumni", "Family Offices"],
    contributionScore: 98,
    referrals: 12,
    verified: true,
  },
];

const onboardingStats = {
  totalMembers: 1247,
  activeMembers: 1189,
  pendingApproval: 58,
  totalAllocated: 374100000,
  avgCapitalPerMember: 300000,
  totalReturns: 89784000,
  avgReturnPercent: 24.0,
  platformFees: 7482000,
};

const MemberCard = ({ member }: { member: typeof members[0] }) => {
  const getTierBadge = () => {
    switch (member.tier) {
      case "partner":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">Partner</Badge>;
      case "premium":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">Premium</Badge>;
      default:
        return <Badge variant="outline">Basic</Badge>;
    }
  };

  const getStatusBadge = () => {
    switch (member.status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      default:
        return <Badge variant="outline">{member.status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold">
                {member.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {member.name}
                  {member.verified && <Verified className="h-4 w-4 text-blue-500" />}
                </h3>
                <p className="text-sm text-muted-foreground">{member.industry}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {getTierBadge()}
              {getStatusBadge()}
            </div>
          </div>

          {member.status === "active" && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Allocated Capital</p>
                  <p className="text-lg font-bold">${(member.allocatedCapital / 1000).toFixed(0)}K</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10">
                  <p className="text-xs text-muted-foreground">Total Returns</p>
                  <p className="text-lg font-bold text-green-600">+${(member.totalReturns / 1000).toFixed(1)}K</p>
                  <p className="text-xs text-green-600">+{member.returnPercent}%</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Capital Deployed</span>
                  <span>{((member.deployedCapital / member.allocatedCapital) * 100).toFixed(0)}%</span>
                </div>
                <Progress value={(member.deployedCapital / member.allocatedCapital) * 100} className="h-2" />
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {member.expertise.slice(0, 3).map((exp, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">{exp}</Badge>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{member.contributionScore}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{member.referrals} referrals</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">View Profile</Button>
              </div>
            </>
          )}

          {member.status === "pending" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-600">
                  Application pending review. Awaiting verification of expertise and connections.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-1">
                  <X className="h-4 w-4" />
                  Reject
                </Button>
                <Button className="flex-1 gap-1">
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function MemberOnboarding() {
  const [showOnboardDialog, setShowOnboardDialog] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Member Onboarding</h1>
            <p className="text-muted-foreground mt-1">
              Onboard members with $300K capital allocation and track contributions
            </p>
          </div>
          <Dialog open={showOnboardDialog} onOpenChange={setShowOnboardDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Onboard New Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Member Onboarding</DialogTitle>
                <DialogDescription>
                  Step {onboardingStep} of 4 - {onboardingStep === 1 ? "Basic Information" : onboardingStep === 2 ? "Experience & Expertise" : onboardingStep === 3 ? "Connections & Network" : "Capital Allocation"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex gap-2 mb-6">
                {[1, 2, 3, 4].map((step) => (
                  <div 
                    key={step}
                    className={`flex-1 h-2 rounded-full ${step <= onboardingStep ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>

              {onboardingStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input type="tel" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>LinkedIn Profile</Label>
                    <Input placeholder="https://linkedin.com/in/..." />
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Primary Industry</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="finance">Finance & Investment</SelectItem>
                        <SelectItem value="real_estate">Real Estate</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="distribution">Distribution & Logistics</SelectItem>
                        <SelectItem value="commodities">Commodities</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="media">Media & Entertainment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Work History (Resume)</Label>
                    <Textarea placeholder="Previous positions, companies, and key achievements..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Areas of Expertise</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["M&A", "Private Equity", "Venture Capital", "Real Estate Development", "Distribution", "Supply Chain", "Marketing", "Sales"].map((exp) => (
                        <div key={exp} className="flex items-center gap-2">
                          <Checkbox id={exp} />
                          <Label htmlFor={exp} className="text-sm">{exp}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Key Connections & Network</Label>
                    <Textarea placeholder="List key industry connections, companies you have relationships with, and notable contacts..." rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Distribution/Sales Channels You Can Access</Label>
                    <Textarea placeholder="Describe any distribution networks, sales channels, or market access you can provide..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>How Can You Contribute to the Network?</Label>
                    <Textarea placeholder="Describe how your expertise and connections can benefit other members..." rows={3} />
                  </div>
                </div>
              )}

              {onboardingStep === 4 && (
                <div className="space-y-4">
                  <div className="p-6 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-full bg-green-500/20">
                        <Wallet className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-600">Capital Allocation</h3>
                        <p className="text-sm text-muted-foreground">Standard member allocation</p>
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-green-600 mb-2">$300,000</div>
                    <p className="text-sm text-muted-foreground">
                      This capital will be allocated to the member's trading account upon approval.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Membership Tier</Label>
                    <Select defaultValue="basic">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic - Standard allocation</SelectItem>
                        <SelectItem value="premium">Premium - Priority access</SelectItem>
                        <SelectItem value="partner">Partner - Revenue sharing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Investment Preferences</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Commodities", "Real Estate", "Crypto", "Equities", "Forex", "Pre-IPO"].map((pref) => (
                        <div key={pref} className="flex items-center gap-2">
                          <Checkbox id={pref} />
                          <Label htmlFor={pref} className="text-sm">{pref}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <Checkbox id="terms" />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the membership terms and capital allocation agreement
                    </Label>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => onboardingStep > 1 ? setOnboardingStep(onboardingStep - 1) : setShowOnboardDialog(false)}
                >
                  {onboardingStep > 1 ? "Back" : "Cancel"}
                </Button>
                <Button 
                  onClick={() => onboardingStep < 4 ? setOnboardingStep(onboardingStep + 1) : setShowOnboardDialog(false)}
                >
                  {onboardingStep < 4 ? "Continue" : "Complete Onboarding"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{onboardingStats.totalMembers.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(onboardingStats.totalAllocated)}</p>
                  <p className="text-xs text-muted-foreground">Total Allocated</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(onboardingStats.totalReturns)}</p>
                  <p className="text-xs text-muted-foreground">Total Returns</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Wallet className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(onboardingStats.platformFees)}</p>
                  <p className="text-xs text-muted-foreground">Platform Fees (2%)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liquidity Calculation */}
        <Card className="border-green-500/20 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-green-500/20">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Liquidity Pool Status</h3>
                <p className="text-sm text-muted-foreground">Super liquid through member onboarding</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Members Onboarded</p>
                <p className="text-xl md:text-3xl font-bold">{onboardingStats.totalMembers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capital Per Member</p>
                <p className="text-xl md:text-3xl font-bold">${(onboardingStats.avgCapitalPerMember / 1000).toFixed(0)}K</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Liquidity Pool</p>
                <p className="text-xl md:text-3xl font-bold text-green-600">{formatCurrency(onboardingStats.totalAllocated)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Return</p>
                <p className="text-xl md:text-3xl font-bold text-green-600">+{onboardingStats.avgReturnPercent}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="active" className="gap-1 md:gap-2 text-xs md:text-sm">
              <CheckCircle className="h-4 w-4" />
              Active Members
              <Badge variant="secondary">{onboardingStats.activeMembers}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1 md:gap-2 text-xs md:text-sm">
              <Clock className="h-4 w-4" />
              Pending Approval
              <Badge variant="secondary">{onboardingStats.pendingApproval}</Badge>
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-1 md:gap-2 text-xs md:text-sm">
              <Award className="h-4 w-4" />
              Partners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search members..." className="pl-10" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {members.filter(m => m.status === "active").map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {members.filter(m => m.status === "pending").map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="partners" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {members.filter(m => m.tier === "partner").map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}
