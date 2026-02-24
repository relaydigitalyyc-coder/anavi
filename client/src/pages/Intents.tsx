import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  Target, Plus, Search, Zap, Eye, EyeOff, 
  DollarSign, Clock, Sparkles, Play, Pause, TrendingUp, Filter, ChevronRight, ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";

export default function Intents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newIntent, setNewIntent] = useState({
    intentType: "buy" as "buy" | "sell" | "invest" | "seek_investment" | "partner",
    title: "",
    description: "",
    assetType: undefined as any,
    minValue: "",
    maxValue: "",
    targetTimeline: "",
    isAnonymous: true,
  });

  const { data: intents, isLoading, refetch } = trpc.intent.list.useQuery();
  const createMutation = trpc.intent.create.useMutation({
    onSuccess: () => {
      toast.success("Intent created! AI matching is now active.");
      setIsAddDialogOpen(false);
      setNewIntent({
        intentType: "buy",
        title: "",
        description: "",
        assetType: undefined,
        minValue: "",
        maxValue: "",
        targetTimeline: "",
        isAnonymous: true,
      });
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.intent.update.useMutation({
    onSuccess: () => {
      toast.success("Intent updated");
      refetch();
    },
  });

  const findMatchesMutation = trpc.intent.findMatches.useMutation({
    onSuccess: (data) => {
      if (data.matches.length > 0) {
        toast.success(`Found ${data.matches.length} potential matches!`);
      } else {
        toast.info("No matches found yet. Keep your intent active.");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const filteredIntents = intents?.filter(intent => 
    intent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    intent.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getIntentTypeStyle = (type: string) => {
    switch (type) {
      case "buy": return "bg-sky-500";
      case "sell": return "bg-rose-500";
      case "invest": return "bg-blue-500";
      case "seek_investment": return "bg-purple-500";
      case "partner": return "bg-sky-500";
      default: return "bg-muted";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "matched": return "default";
      default: return "outline";
    }
  };

  const stats = [
    { label: "Total Intents", value: intents?.length || 0, icon: Target, color: "accent" },
    { label: "Active", value: intents?.filter(i => i.status === 'active').length || 0, icon: Zap, color: "dark" },
    { label: "Matched", value: intents?.filter(i => i.status === 'matched').length || 0, icon: TrendingUp, color: "accent" },
    { label: "Anonymous", value: intents?.filter(i => i.isAnonymous).length || 0, icon: EyeOff, color: "dark" },
  ];

  return (
    <div className="min-h-screen bg-background bg-geometric">
      {/* Header */}
      <div className="px-8 pt-10 pb-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="geo-dot" />
              <span className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">AI Blind Matching</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-3">
              Deal <span className="gradient-text">Intents</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              Post what you're looking for and let AI find matches.
            </p>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 animate-fade-in stagger-2">
                <Plus className="w-4 h-4" />
                New Intent
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold tracking-tight">Create Intent</DialogTitle>
                <DialogDescription>
                  AI will match you with compatible counterparties
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Intent Type</Label>
                  <Select
                    value={newIntent.intentType}
                    onValueChange={(value: any) => setNewIntent({ ...newIntent, intentType: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy / Acquire</SelectItem>
                      <SelectItem value="sell">Sell / Divest</SelectItem>
                      <SelectItem value="invest">Invest Capital</SelectItem>
                      <SelectItem value="seek_investment">Seek Investment</SelectItem>
                      <SelectItem value="partner">Find Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g., Seeking 50,000 MT EN590 Rotterdam delivery"
                    value={newIntent.title}
                    onChange={(e) => setNewIntent({ ...newIntent, title: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Provide details about your requirements..."
                    value={newIntent.description}
                    onChange={(e) => setNewIntent({ ...newIntent, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Asset Type</Label>
                  <Select
                    value={newIntent.assetType}
                    onValueChange={(value: any) => setNewIntent({ ...newIntent, assetType: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commodity">Commodity</SelectItem>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="equity">Equity</SelectItem>
                      <SelectItem value="debt">Debt</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="renewable_energy">Renewable Energy</SelectItem>
                      <SelectItem value="mining">Mining</SelectItem>
                      <SelectItem value="oil_gas">Oil & Gas</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Min Value (USD)</Label>
                    <Input
                      type="number"
                      placeholder="1,000,000"
                      value={newIntent.minValue}
                      onChange={(e) => setNewIntent({ ...newIntent, minValue: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Value (USD)</Label>
                    <Input
                      type="number"
                      placeholder="10,000,000"
                      value={newIntent.maxValue}
                      onChange={(e) => setNewIntent({ ...newIntent, maxValue: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Target Timeline</Label>
                  <Input
                    placeholder="e.g., Q2 2026, Within 6 months"
                    value={newIntent.targetTimeline}
                    onChange={(e) => setNewIntent({ ...newIntent, targetTimeline: e.target.value })}
                    className="h-11"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-3">
                    {newIntent.isAnonymous ? <EyeOff className="w-5 h-5 text-accent" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
                    <div>
                      <span className="font-medium text-sm">Anonymous Mode</span>
                      <p className="text-xs text-muted-foreground">Hide identity until mutual interest</p>
                    </div>
                  </div>
                  <Switch
                    checked={newIntent.isAnonymous}
                    onCheckedChange={(checked) => setNewIntent({ ...newIntent, isAnonymous: checked })}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    if (!newIntent.title) {
                      toast.error("Please enter a title");
                      return;
                    }
                    createMutation.mutate({
                      ...newIntent,
                      minValue: newIntent.minValue || undefined,
                      maxValue: newIntent.maxValue || undefined,
                    });
                  }}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Create Intent
                    </>
                  )}
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
              placeholder="Search intents..."
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-in stagger-4">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-lg border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  stat.color === 'accent' ? 'icon-container-accent' : 'icon-container-dark'
                }`}>
                  <stat.icon className={`w-5 h-5 ${
                    stat.color === 'accent' ? 'text-accent' : 'text-primary-foreground'
                  }`} />
                </div>
              </div>
              <div className="text-number-lg text-foreground mb-1">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Intents List */}
      <div className="px-8 pb-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border border-border/60 bg-card p-6 shadow-sm">
                <div className="h-40 animate-shimmer rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredIntents.length === 0 ? (
          <div className="rounded-lg border border-border/60 bg-card p-16 shadow-sm text-center">
            <div className="w-20 h-20 rounded-2xl icon-container mx-auto mb-6 flex items-center justify-center">
              <Target className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground mb-2">No Intents Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first intent and let AI find compatible counterparties
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Intent
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredIntents.map((intent, index) => (
              <div 
                key={intent.id} 
                className={`rounded-lg border border-border/60 bg-card p-6 shadow-sm hover-lift cursor-pointer group animate-fade-in stagger-${Math.min(index + 1, 8)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${getIntentTypeStyle(intent.intentType)} flex items-center justify-center`}>
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant={getStatusBadgeVariant(intent.status || "draft")} className="text-xs">
                        {(intent.status || 'draft').charAt(0).toUpperCase() + (intent.status || 'draft').slice(1)}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">
                        {intent.intentType.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  {intent.isAnonymous && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <EyeOff className="w-3 h-3" />
                      Anonymous
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-1">
                  {intent.title}
                </h3>
                
                {intent.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {intent.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm mb-4">
                  {(intent.minValue || intent.maxValue) && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>
                        ${(parseFloat(intent.minValue || "0") / 1000000).toFixed(1)}M - ${(parseFloat(intent.maxValue || "0") / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  )}
                  {intent.assetType && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {intent.assetType.replace('_', ' ')}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(intent.createdAt).toLocaleDateString()}</span>
                    </div>

                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-xs p-2"
                      onClick={() => {
                        updateMutation.mutate({
                          id: intent.id,
                          status: intent.status === 'active' ? 'paused' : 'active'
                        });
                      }}
                    >
                      {intent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-xs p-2"
                      onClick={() => findMatchesMutation.mutate({ intentId: intent.id })}
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
