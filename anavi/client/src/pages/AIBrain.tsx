import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { Streamdown } from 'streamdown';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Sparkles, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Send,
  Lightbulb,
  Target,
  Users,
  DollarSign,
  Database,
  RefreshCw,
  Zap,
  ArrowRight,
  Bot,
  User,
  Loader2,
  ChevronRight,
  Shield,
  Globe,
  BarChart3,
  Copy,
  Mail,
} from 'lucide-react';

// AI-generated market insights
const marketInsights = [
  {
    id: 1,
    title: 'Gold Market Opportunity',
    category: 'Commodities',
    insight: 'Strong demand for physical gold with verified provenance. Key buyers seeking 99.99% purity with LBMA certification.',
    confidence: 94,
    impact: 'High',
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    title: 'Real Estate Tokenization',
    category: 'Real Estate',
    insight: 'Manhattan commercial showing 15% yield compression. Miami Beach residential up 22% YoY.',
    confidence: 87,
    impact: 'High',
    timestamp: '4 hours ago',
  },
  {
    id: 3,
    title: 'Infrastructure Demand',
    category: 'Technology',
    insight: 'Phone farm infrastructure showing 340% ROI potential with compliance-first approach.',
    confidence: 89,
    impact: 'Very High',
    timestamp: '6 hours ago',
  },
];

// AI recommendations
const aiRecommendations = [
  {
    id: 1,
    type: 'Connection',
    title: 'Introduce Shane Fox to FDA Consultant',
    reason: 'Accelerate compliance timeline by 3-4 months',
    priority: 'Urgent',
  },
  {
    id: 2,
    type: 'Deal',
    title: 'Fast-track Phone Farm Closing',
    reason: 'All due diligence complete. Capital committed.',
    priority: 'High',
  },
  {
    id: 3,
    type: 'Capital',
    title: 'Increase GloFi Allocation',
    reason: 'Strong institutional interest in gold tokens',
    priority: 'Medium',
  },
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const quickActions = [
  { label: "Analyze Deal", icon: Target, proc: "analyzeDeal" as const },
  { label: "Suggest Connections", icon: Users, proc: "suggestConnections" as const },
  { label: "Due Diligence", icon: Shield, proc: "dueDiligence" as const },
  { label: "Risk Assessment", icon: AlertTriangle, proc: "assessRisk" as const },
  { label: "Market Query", icon: Globe, proc: "marketQuery" as const },
  { label: "Sector Intel", icon: BarChart3, proc: "sectorIntelligence" as const },
];

const quickActionLabels: Record<string, string> = {
  analyzeDeal: "Analyzing deal pipeline...",
  suggestConnections: "Finding high-value connections in your network...",
  dueDiligence: "Running due diligence review...",
  assessRisk: "Running risk assessment on current pipeline...",
  marketQuery: "Querying current market overview...",
  sectorIntelligence: "Gathering cross-sector intelligence...",
};

export default function AIBrain() {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: `Welcome to NAVI - your elite Deal Flow Partner.

I have full context from your network, deals, and market intelligence. I can help you:

• **Analyze opportunities** across commodities, real estate, and private equity
• **Identify warm introductions** through your relationship network
• **Generate due diligence insights** on potential partners
• **Craft outreach messages** for family offices and LPs

What would you like to explore?`
    }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [outreachTarget, setOutreachTarget] = useState('');
  const [outreachResult, setOutreachResult] = useState('');

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    },
    onError: (error) => {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `I apologize, but I encountered an error: ${error.message}. Please try again.`
      }]);
    },
  });

  const analyzeDealMutation = trpc.ai.analyzeDeal.useMutation({
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.analysis }]);
    },
    onError: (error) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    },
  });

  const suggestConnectionsMutation = trpc.ai.suggestConnections.useMutation({
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.suggestions }]);
    },
    onError: (error) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    },
  });

  const dueDiligenceMutation = trpc.ai.dueDiligence.useMutation({
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.result }]);
    },
    onError: (error) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    },
  });

  const assessRiskMutation = trpc.ai.assessRisk.useMutation({
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }]);
    },
    onError: (error) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    },
  });

  const marketQueryMutation = trpc.ai.marketQuery.useMutation({
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    },
    onError: (error) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    },
  });

  const sectorIntelligenceMutation = trpc.ai.sectorIntelligence.useMutation({
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }]);
    },
    onError: (error) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    },
  });

  const generateOutreachMutation = trpc.ai.generateOutreach.useMutation({
    onSuccess: (data) => {
      setOutreachResult(data.message);
    },
    onError: (error) => {
      setOutreachResult(`Error: ${error.message}`);
    },
  });

  const anyQuickActionPending =
    analyzeDealMutation.isPending ||
    suggestConnectionsMutation.isPending ||
    dueDiligenceMutation.isPending ||
    assessRiskMutation.isPending ||
    marketQueryMutation.isPending ||
    sectorIntelligenceMutation.isPending;

  const handleQuickAction = (proc: (typeof quickActions)[number]['proc']) => {
    setChatHistory(prev => [...prev, { role: 'user', content: quickActionLabels[proc] }]);

    switch (proc) {
      case 'analyzeDeal':
        analyzeDealMutation.mutate({ dealId: 0 });
        break;
      case 'suggestConnections':
        suggestConnectionsMutation.mutate();
        break;
      case 'dueDiligence':
        dueDiligenceMutation.mutate({ query: 'General due diligence review of current pipeline' });
        break;
      case 'assessRisk':
        assessRiskMutation.mutate({ type: 'portfolio', description: 'Overall risk assessment of current deal pipeline' });
        break;
      case 'marketQuery':
        marketQueryMutation.mutate({ query: 'Current market overview' });
        break;
      case 'sectorIntelligence':
        sectorIntelligenceMutation.mutate({ sector: 'fintech' });
        break;
    }
  };

  const handleSendMessage = async () => {
    if (!query.trim() || chatMutation.isPending) return;
    
    const userMessage = query.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setQuery('');
    
    // Send all messages to Claude for context
    const allMessages = [...chatHistory, { role: 'user' as const, content: userMessage }];
    chatMutation.mutate({ messages: allMessages });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const suggestedQueries = [
    "What are my highest-value deal opportunities right now?",
    "Who should I introduce to close the GloFi deal?",
    "Analyze the risk profile of my current pipeline",
    "Draft an outreach message for Walton Family Office",
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-background via-background to-sky-500/5 min-h-screen">
        {/* Luxury Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-transparent to-emerald-500/10 rounded-2xl blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-sky-500/20 rounded-xl blur-xl" />
                <div className="relative h-14 w-14 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
                  <Brain className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  NAVI
                  <span className="text-sky-500 ml-2 text-lg font-normal">Deal Flow Partner</span>
                </h1>
                <p className="text-muted-foreground text-sm">
                  Powered by Claude • Your unfair advantage in private markets
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-sky-500/30 hover:bg-sky-500/10">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Context
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white border-0">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Meetings Analyzed', value: '47', icon: MessageSquare, color: 'sky' },
            { label: 'Active Insights', value: '12', icon: Lightbulb, color: 'amber' },
            { label: 'Deals Tracked', value: '8', icon: Target, color: 'emerald' },
            { label: 'Memory Entries', value: '156', icon: Database, color: 'violet' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.05 }}
            >
              <Card className={`relative overflow-hidden border-${stat.color}-500/20 bg-gradient-to-br from-${stat.color}-500/5 to-transparent hover:border-${stat.color}-500/40 transition-all duration-300`}>
                <div className={`absolute top-0 right-0 w-20 h-20 bg-${stat.color}-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2`} />
                <CardContent className="p-4 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 text-${stat.color}-500 opacity-80`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="flex flex-wrap gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {quickActions.map((action) => (
            <Button
              key={action.proc}
              variant="outline"
              size="sm"
              className="border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-500"
              onClick={() => handleQuickAction(action.proc)}
              disabled={anyQuickActionPending || chatMutation.isPending}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Chat - Main Feature */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="h-[600px] flex flex-col border-sky-500/20 bg-gradient-to-br from-card to-sky-500/5">
              <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Deal Flow Partner</CardTitle>
                      <CardDescription className="text-xs">Claude-powered intelligence</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-sky-500/30 text-sky-500 bg-sky-500/10">
                    <span className="h-2 w-2 rounded-full bg-sky-500 mr-2 animate-pulse" />
                    Online
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                  <AnimatePresence mode="popLayout">
                    {chatHistory.map((msg, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            msg.role === 'user' 
                              ? 'bg-gradient-to-br from-slate-600 to-slate-700' 
                              : 'bg-gradient-to-br from-sky-500 to-emerald-500'
                          }`}>
                            {msg.role === 'user' ? (
                              <User className="h-4 w-4 text-white" />
                            ) : (
                              <Bot className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div className={`p-4 rounded-2xl ${
                            msg.role === 'user' 
                              ? 'bg-slate-800 text-white rounded-tr-sm' 
                              : 'bg-muted/50 border border-border/50 rounded-tl-sm'
                          }`}>
                            {msg.role === 'assistant' ? (
                              <Streamdown className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
                                {msg.content}
                              </Streamdown>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {(chatMutation.isPending || anyQuickActionPending) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="p-4 rounded-2xl rounded-tl-sm bg-muted/50 border border-border/50">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                            <span className="text-sm text-muted-foreground">Analyzing your request...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Suggested Queries */}
                {chatHistory.length <= 1 && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-muted-foreground mb-2">Suggested queries:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQueries.map((q, idx) => (
                        <Button
                          key={idx}
                          onClick={() => setQuery(q)}
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-full bg-sky-500/10 text-sky-500 border-sky-500/20 hover:bg-sky-500/20 hover:text-sky-500"
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-border/50 bg-background/50">
                  <div className="flex gap-2">
                    <Input 
                      ref={inputRef}
                      placeholder="Ask about deals, connections, or market opportunities..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-muted/50 border-border/50 focus:border-sky-500/50 focus:ring-sky-500/20"
                      disabled={chatMutation.isPending}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={chatMutation.isPending || !query.trim()}
                      className="bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white border-0 px-6"
                    >
                      {chatMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* AI Recommendations */}
            <Card className="border-sky-500/20 bg-gradient-to-br from-card to-amber-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4 text-sky-500" />
                  Priority Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiRecommendations.map((rec, idx) => (
                  <motion.div 
                    key={rec.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-sky-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={
                        rec.priority === 'Urgent' ? 'destructive' :
                        rec.priority === 'High' ? 'default' : 'secondary'
                      } className="text-xs">
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{rec.type}</Badge>
                    </div>
                    <h4 className="font-medium text-sm mb-1 group-hover:text-sky-500 transition-colors">{rec.title}</h4>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Outreach Generator */}
            <Card className="border-sky-500/20 bg-gradient-to-br from-card to-sky-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4 text-sky-500" />
                  Outreach Generator
                </CardTitle>
                <CardDescription className="text-xs">Craft a personalized message</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Target name (e.g. John Smith)"
                  value={outreachTarget}
                  onChange={(e) => setOutreachTarget(e.target.value)}
                  className="bg-muted/50 border-border/50 focus:border-sky-500/50 text-sm"
                />
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 text-white border-0"
                  disabled={!outreachTarget.trim() || generateOutreachMutation.isPending}
                  onClick={() => {
                    setOutreachResult('');
                    generateOutreachMutation.mutate({
                      targetName: outreachTarget.trim(),
                      context: 'Introductory outreach for potential deal collaboration',
                    });
                  }}
                >
                  {generateOutreachMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate
                </Button>
                {outreachResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative p-3 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-sky-500"
                      onClick={() => navigator.clipboard.writeText(outreachResult)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap pr-8">{outreachResult}</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Market Insights */}
            <Card className="border-sky-500/20 bg-gradient-to-br from-card to-emerald-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-sky-500" />
                  Market Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {marketInsights.map((insight, idx) => (
                  <motion.div 
                    key={insight.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-sky-500/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">{insight.category}</Badge>
                      <span className="text-xs text-muted-foreground">{insight.timestamp}</span>
                    </div>
                    <h4 className="font-medium text-sm mb-1 group-hover:text-sky-500 transition-colors">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{insight.insight}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <Badge variant="outline" className="text-sky-500 border-sky-500/30 text-xs">
                          {insight.confidence}%
                        </Badge>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-sky-500 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-sky-500/20 bg-gradient-to-br from-card to-violet-500/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-sky-500" />
                  Intelligence Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground">Network Reach</span>
                  <span className="text-sm font-semibold">2.4K contacts</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground">Pipeline Value</span>
                  <span className="text-sm font-semibold">$47.2M</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground">Avg. Deal Cycle</span>
                  <span className="text-sm font-semibold">34 days</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground">Win Rate</span>
                  <span className="text-sm font-semibold text-sky-500">68%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
  );
}
