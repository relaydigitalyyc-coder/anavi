import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  TrendingUp, Plus, Search, DollarSign, Users, 
  Clock, CheckCircle2, Circle, FileText, Filter, ArrowUpRight, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

const DEAL_STAGES = [
  { id: "lead", label: "Lead", color: "bg-muted" },
  { id: "qualification", label: "Qualification", color: "bg-blue-500" },
  { id: "due_diligence", label: "Due Diligence", color: "bg-sky-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { id: "documentation", label: "Documentation", color: "bg-purple-500" },
  { id: "closing", label: "Closing", color: "bg-sky-500" },
  { id: "completed", label: "Completed", color: "bg-accent" },
  { id: "cancelled", label: "Cancelled", color: "bg-destructive" },
];

export default function Deals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDeal, setNewDeal] = useState({
    title: "",
    description: "",
    dealType: "commodity_trade" as any,
    dealValue: "",
    currency: "USD",
  });

  const { data: deals, isLoading, refetch } = trpc.deal.list.useQuery();
  
  const createMutation = trpc.deal.create.useMutation({
    onSuccess: () => {
      toast.success("Deal created successfully!");
      setIsAddDialogOpen(false);
      setNewDeal({
        title: "",
        description: "",
        dealType: "commodity_trade",
        dealValue: "",
        currency: "USD",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateStageMutation = trpc.deal.updateStage.useMutation({
    onSuccess: () => {
      toast.success("Deal stage updated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredDeals = deals?.filter(deal => 
    deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    deal.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStageIndex = (stage: string) => {
    return DEAL_STAGES.findIndex(s => s.id === stage);
  };

  const getStageProgress = (stage: string) => {
    const index = getStageIndex(stage);
    if (index === -1) return 0;
    return ((index + 1) / (DEAL_STAGES.length - 1)) * 100;
  };

  const getDealTypeLabel = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const totalPipelineValue = deals?.reduce((sum, d) => sum + parseFloat(d.dealValue || "0"), 0) || 0;
  const activeDeals = deals?.filter(d => !['completed', 'cancelled'].includes(d.stage || '')).length || 0;

  const stats = [
    { label: "Total Pipeline", value: `$${(totalPipelineValue / 1000000).toFixed(1)}M`, icon: DollarSign, trend: "+12% this month" },
    { label: "Active Deals", value: activeDeals, icon: TrendingUp, trend: `${deals?.length || 0} total` },
    { label: "Avg Deal Size", value: `$${deals?.length ? ((totalPipelineValue / deals.length) / 1000000).toFixed(2) : 0}M`, icon: FileText, trend: "Per deal" },
  ];

  return (
    <div className="min-h-screen bg-background bg-geometric">
      {/* Header */}
      <div className="px-8 pt-10 pb-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="geo-dot" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Deal Pipeline</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-3">
              Active <span className="gradient-text">Deals</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Track and manage your deal flow from lead to close.
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 animate-fade-in stagger-2">
                <Plus className="w-4 h-4" />
                New Deal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold tracking-tight">Create Deal</DialogTitle>
                <DialogDescription>
                  Add a new deal to your pipeline
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Deal Title</Label>
                  <Input
                    placeholder="e.g., 50,000 MT EN590 Rotterdam"
                    value={newDeal.title}
                    onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Deal details and notes..."
                    value={newDeal.description}
                    onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Deal Type</Label>
                    <Select
                      value={newDeal.dealType}
                      onValueChange={(value: any) => setNewDeal({ ...newDeal, dealType: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commodity_trade">Commodity Trade</SelectItem>
                        <SelectItem value="real_estate">Real Estate</SelectItem>
                        <SelectItem value="equity_investment">Equity Investment</SelectItem>
                        <SelectItem value="debt_financing">Debt Financing</SelectItem>
                        <SelectItem value="ma_transaction">M&A Transaction</SelectItem>
                        <SelectItem value="joint_venture">Joint Venture</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={newDeal.currency}
                      onValueChange={(value) => setNewDeal({ ...newDeal, currency: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CHF">CHF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Deal Value</Label>
                  <Input
                    type="number"
                    placeholder="10,000,000"
                    value={newDeal.dealValue}
                    onChange={(e) => setNewDeal({ ...newDeal, dealValue: e.target.value })}
                    className="h-11"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    if (!newDeal.title) {
                      toast.error("Please enter a deal title");
                      return;
                    }
                    createMutation.mutate({
                      ...newDeal,
                      dealValue: newDeal.dealValue || undefined,
                    });
                  }}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create Deal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="px-8 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in stagger-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
              className="pl-11 h-12 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in stagger-4">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-lg border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl icon-container-accent flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-accent" />
                </div>
                <span className="text-xs text-accent font-medium">{stat.trend}</span>
              </div>
              <div className="text-number-lg text-foreground mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage Pipeline */}
      <div className="px-8 pb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 animate-fade-in stagger-5">
          {DEAL_STAGES.slice(0, -1).map((stage, index) => {
            const count = deals?.filter(d => d.stage === stage.id).length || 0;
            return (
              <div key={stage.id} className="flex items-center">
                <Button variant="ghost" className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  count > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}>
                  {stage.label}
                  {count > 0 && <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">{count}</span>}
                </Button>
                {index < DEAL_STAGES.length - 2 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Deals List */}
      <div className="px-8 pb-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-lg border border-border/60 bg-card p-6 shadow-sm">
                <div className="h-40 animate-shimmer rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="rounded-lg border border-border/60 bg-card p-16 shadow-sm text-center">
            <div className="w-20 h-20 rounded-2xl icon-container mx-auto mb-6 flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-2">No Deals Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first deal to start tracking your pipeline
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Deal
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.map((deal, index) => {
              const stageInfo = DEAL_STAGES.find(s => s.id === deal.stage) || DEAL_STAGES[0];
              const progress = getStageProgress(deal.stage || 'lead');
              
              return (
                <div 
                  key={deal.id} 
                  className={`rounded-lg border border-border/60 bg-card p-6 shadow-sm hover-lift cursor-pointer group animate-fade-in stagger-${Math.min(index + 1, 8)}`}
                >
                  {/* Progress bar */}
                  <div className="h-1 bg-muted rounded-full mb-5 overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <Badge className="text-xs">
                      {stageInfo.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">
                      {getDealTypeLabel(deal.dealType)}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-2">
                    {deal.title}
                  </h3>
                  
                  {deal.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {deal.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-accent" />
                      <span className="font-semibold text-foreground">
                        {deal.currency} {(parseFloat(deal.dealValue || "0") / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={deal.stage || 'lead'}
                        onValueChange={(value) => {
                          updateStageMutation.mutate({ id: deal.id, stage: value as any });
                        }}
                      >
                        <SelectTrigger className="h-8 w-auto text-xs border-0 bg-transparent">
                          <ChevronRight className="w-4 h-4" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEAL_STAGES.map((stage) => (
                            <SelectItem key={stage.id} value={stage.id}>
                              {stage.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
