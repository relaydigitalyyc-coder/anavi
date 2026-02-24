import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Sparkles, TrendingUp, AlertCircle, CheckCircle2, Clock, 
  Users, DollarSign, Target, Zap, Bell, ArrowRight, ChevronDown,
  Building2, Pill, Smartphone, Bot, CreditCard, Network, Calendar,
  MessageSquare, FileText, ExternalLink, Star, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Extracted deals from Fireflies transcripts
const extractedDeals = [
  {
    id: 'peptide-ecommerce',
    name: 'Peptide E-Commerce Platform',
    icon: Pill,
    status: 'primed',
    readinessScore: 92,
    category: 'Healthcare',
    thesis: 'Launch healthcare division focused on peptide-based therapies and regenerative medicine. Bypass traditional prescriptions by selling products for research purposes with 98% efficacy claims.',
    capitalNeeded: '$500K - $2M',
    timeline: 'Q1 2026',
    keyPlayers: [
      { name: 'Shane Fox', role: 'Medical Lead', avatar: 'SF', commitment: 'confirmed' },
      { name: 'Avraham Adler', role: 'Strategy', avatar: 'AA', commitment: 'confirmed' },
      { name: 'Nikita Tyukalo', role: 'Tech Lead', avatar: 'NT', commitment: 'confirmed' },
    ],
    actionItems: [
      { task: 'Lead peptide product development', assignee: 'Shane Fox', status: 'in-progress', priority: 'high' },
      { task: 'Finalize team onboarding and equity distribution', assignee: 'Avraham Adler', status: 'pending', priority: 'high' },
      { task: 'Optimize software demo for mobile', assignee: 'Nikita Tyukalo', status: 'in-progress', priority: 'medium' },
    ],
    signals: [
      { type: 'commitment', text: 'Shane detailed 98% efficacy - strong product confidence', date: 'Jan 16' },
      { type: 'momentum', text: 'Team aligned on bypass prescription strategy', date: 'Jan 16' },
      { type: 'blocker', text: 'Need compliance review for research-purpose sales', date: 'Jan 16' },
    ],
    sourceTranscript: 'Strategic Plan - January 16, 2026',
    lastActivity: '2 hours ago',
  },
  {
    id: 'fintech-tokenization',
    name: 'GloFi Asset Tokenization Platform',
    icon: Building2,
    status: 'primed',
    readinessScore: 85,
    category: 'Fintech',
    thesis: 'Build fintech ecosystem around asset tokenization with trading platform for democratized investment in illiquid markets. Focus on real estate, commodities, and alternative assets.',
    capitalNeeded: '$1M - $5M',
    timeline: 'Q2 2026',
    keyPlayers: [
      { name: 'Avraham Adler', role: 'Project Lead', avatar: 'AA', commitment: 'confirmed' },
      { name: 'Andrew Godfrey', role: 'Marketing', avatar: 'AG', commitment: 'confirmed' },
      { name: 'Nikita Tyukalo', role: 'Platform Dev', avatar: 'NT', commitment: 'confirmed' },
    ],
    actionItems: [
      { task: 'Lead fintech trading platform launch', assignee: 'Avraham Adler', status: 'in-progress', priority: 'high' },
      { task: 'Align marketing with tokenization developments', assignee: 'Andrew Godfrey', status: 'pending', priority: 'medium' },
    ],
    signals: [
      { type: 'commitment', text: 'Avraham leading GloFi rollout coordination', date: 'Jan 16' },
      { type: 'momentum', text: 'Clear strategic direction approved by team', date: 'Jan 16' },
    ],
    sourceTranscript: 'Strategic Plan - January 16, 2026',
    lastActivity: '2 hours ago',
  },
  {
    id: 'phone-farm',
    name: 'Remote Phone Farm Infrastructure',
    icon: Smartphone,
    status: 'ready',
    readinessScore: 95,
    category: 'Infrastructure',
    thesis: 'Remotely controlled iPhone phone farm for sensitive Snapchat operations. Multi-VA system managing 15-20 phones from central computer using Rust Desk/AnyDesk.',
    capitalNeeded: '$40K - $50K/month',
    timeline: 'Immediate',
    keyPlayers: [
      { name: 'Dan', role: 'Infrastructure', avatar: 'DN', commitment: 'confirmed' },
      { name: 'Dug Dugmor', role: 'Tech Support', avatar: 'DD', commitment: 'confirmed' },
      { name: 'Nikita Tyukalo', role: 'Client Lead', avatar: 'NT', commitment: 'confirmed' },
    ],
    actionItems: [
      { task: 'Send phone farm setup details', assignee: 'Dan', status: 'completed', priority: 'high' },
      { task: 'Provide licensing options (10 keys)', assignee: 'Dug Dugmor', status: 'completed', priority: 'high' },
      { task: 'Set up Telegram support group', assignee: 'Dug Dugmor', status: 'completed', priority: 'medium' },
    ],
    signals: [
      { type: 'commitment', text: '$40K setup fee agreed upon', date: 'Jan 15' },
      { type: 'momentum', text: 'Licensing and support structure finalized', date: 'Jan 16' },
      { type: 'ready', text: 'System ready for deployment', date: 'Jan 16' },
    ],
    sourceTranscript: 'Dan Snapchat demo - January 15, 2026',
    lastActivity: '1 day ago',
  },
  {
    id: 'ai-saas',
    name: 'AI SaaS Suite for OnlyFans Agencies',
    icon: Bot,
    status: 'in-progress',
    readinessScore: 68,
    category: 'AI/SaaS',
    thesis: 'AI-powered SaaS suite for OnlyFans agencies and related industries. Includes AI dating app with face/voice scanning and compatibility features.',
    capitalNeeded: '$250K - $1M',
    timeline: 'Q1 2026',
    keyPlayers: [
      { name: 'Nikita Tyukalo', role: 'Tech Lead', avatar: 'NT', commitment: 'confirmed' },
      { name: 'Veronica Welch', role: 'Pitch Lead', avatar: 'VW', commitment: 'pending' },
    ],
    actionItems: [
      { task: 'Develop AI-powered dating app', assignee: 'Nikita Tyukalo', status: 'in-progress', priority: 'high' },
      { task: 'Prepare pitch deck', assignee: 'Veronica Welch', status: 'pending', priority: 'high' },
      { task: 'Send software suite info to team', assignee: 'Nikita Tyukalo', status: 'pending', priority: 'medium' },
    ],
    signals: [
      { type: 'momentum', text: 'AI integration approved for consumer products', date: 'Jan 16' },
      { type: 'blocker', text: 'Pitch deck not yet prepared', date: 'Jan 9' },
    ],
    sourceTranscript: 'AI SaaS Demo - January 9, 2026',
    lastActivity: '1 week ago',
  },
  {
    id: 'model-network',
    name: 'Model Network Monetization',
    icon: Users,
    status: 'in-progress',
    readinessScore: 72,
    category: 'Revenue',
    thesis: 'Leverage existing network of models to generate significant revenue and expand investment opportunities across various sectors including content, affiliate marketing, and brand partnerships.',
    capitalNeeded: '$100K - $500K',
    timeline: 'Ongoing',
    keyPlayers: [
      { name: 'Carmello Gainz', role: 'Operations', avatar: 'CG', commitment: 'confirmed' },
      { name: 'Veronica Welch', role: 'Talent', avatar: 'VW', commitment: 'confirmed' },
      { name: 'Vladimir Nikolić', role: 'Strategy', avatar: 'VN', commitment: 'pending' },
    ],
    actionItems: [
      { task: 'Create Asana task for team coordination', assignee: 'Carmello Gainz', status: 'completed', priority: 'medium' },
      { task: 'Send model profile samples', assignee: 'Nikita Tyukalo', status: 'pending', priority: 'medium' },
      { task: 'Gauge chatting team interest', assignee: 'Vladimir Nikolić', status: 'in-progress', priority: 'low' },
    ],
    signals: [
      { type: 'momentum', text: 'Model network identified as key growth driver', date: 'Jan 16' },
      { type: 'commitment', text: 'Asana/Airtable tracking established', date: 'Jan 12' },
    ],
    sourceTranscript: 'Instagram Account Creation - January 12, 2026',
    lastActivity: '4 days ago',
  },
];

// Network connections needed
const neededConnections = [
  {
    deal: 'Peptide E-Commerce',
    need: 'FDA Compliance Consultant',
    reason: 'Research-purpose sales strategy needs legal review',
    urgency: 'high',
    warmPath: 'Shane Fox may have medical industry contacts',
  },
  {
    deal: 'GloFi Tokenization',
    need: 'SEC/Fintech Attorney',
    reason: 'Token offering compliance and regulatory framework',
    urgency: 'high',
    warmPath: null,
  },
  {
    deal: 'Phone Farm',
    need: 'Snapchat Policy Expert',
    reason: 'Ensure compliance with platform ToS',
    urgency: 'medium',
    warmPath: 'Dan has existing platform relationships',
  },
  {
    deal: 'AI SaaS Suite',
    need: 'AI/ML Engineers',
    reason: 'Face/voice scanning feature development',
    urgency: 'medium',
    warmPath: 'Nikita Tyukalo can recruit from network',
  },
];

// AI-generated notifications
const aiNotifications = [
  {
    id: 1,
    type: 'ready',
    title: 'Phone Farm Deal Ready to Close',
    message: 'All action items completed. $40K setup fee agreed. Ready for wire transfer.',
    deal: 'phone-farm',
    time: '2 hours ago',
    priority: 'high',
  },
  {
    id: 2,
    type: 'primed',
    title: 'Peptide E-Commerce Highly Primed',
    message: 'Shane Fox confirmed 98% efficacy. Team aligned. Missing: compliance review.',
    deal: 'peptide-ecommerce',
    time: '3 hours ago',
    priority: 'high',
  },
  {
    id: 3,
    type: 'action',
    title: 'Action Item Due: Pitch Deck',
    message: 'Veronica Welch needs to prepare AI SaaS pitch deck - overdue by 8 days.',
    deal: 'ai-saas',
    time: '1 day ago',
    priority: 'medium',
  },
  {
    id: 4,
    type: 'stalled',
    title: 'Model Network Deal Needs Attention',
    message: 'No activity in 4 days. Vladimir Nikolić action item pending.',
    deal: 'model-network',
    time: '4 days ago',
    priority: 'low',
  },
];

const statusColors: Record<string, string> = {
  ready: 'bg-green-500',
  primed: 'bg-sky-500',
  'in-progress': 'bg-blue-500',
  stalled: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
  ready: 'Ready to Close',
  primed: 'Highly Primed',
  'in-progress': 'In Progress',
  stalled: 'Needs Attention',
};

export default function DealIntelligence() {
  const [selectedDeal, setSelectedDeal] = useState<typeof extractedDeals[0] | null>(null);
  const [activeTab, setActiveTab] = useState('deals');

  const totalDeals = extractedDeals.length;
  const readyDeals = extractedDeals.filter(d => d.status === 'ready').length;
  const primedDeals = extractedDeals.filter(d => d.status === 'primed').length;
  const avgReadiness = Math.round(extractedDeals.reduce((acc, d) => acc + d.readinessScore, 0) / totalDeals);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-40">
        <div className="container py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                <Brain className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">AI Deal Intelligence</h1>
                <p className="text-xs md:text-sm text-slate-400">Extracted from 13 Fireflies transcripts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                <Bell className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{aiNotifications.length} Alerts</span>
                <span className="sm:hidden">{aiNotifications.length}</span>
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                <Sparkles className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sync Fireflies</span>
                <span className="sm:hidden">Sync</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4 md:py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/20">
                    <Target className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-slate-400">Total Deals</p>
                    <p className="text-xl md:text-2xl font-bold text-white">{totalDeals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-slate-400">Ready to Close</p>
                    <p className="text-xl md:text-2xl font-bold text-white">{readyDeals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/20">
                    <Zap className="w-4 h-4 md:w-5 md:h-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-slate-400">Highly Primed</p>
                    <p className="text-xl md:text-2xl font-bold text-white">{primedDeals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Activity className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-slate-400">Avg Readiness</p>
                    <p className="text-xl md:text-2xl font-bold text-white">{avgReadiness}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI Notifications Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6 md:mb-8"
        >
          <Card className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-sky-500/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-sky-500/20 animate-pulse">
                    <Sparkles className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">AI detected {aiNotifications.filter(n => n.priority === 'high').length} high-priority opportunities</p>
                    <p className="text-xs text-slate-400">Phone Farm ready to close • Peptide deal highly primed</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-sky-500/30 text-sky-300 hover:bg-sky-500/20 w-full sm:w-auto">
                  View All Alerts
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="bg-white/5 border border-white/10 p-1 w-full overflow-x-auto flex-nowrap">
            <TabsTrigger value="deals" className="data-[state=active]:bg-white/10 text-white flex-1 text-xs md:text-sm">
              <Target className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Extracted </span>Deals
            </TabsTrigger>
            <TabsTrigger value="network" className="data-[state=active]:bg-white/10 text-white flex-1 text-xs md:text-sm">
              <Network className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Needed </span>Connections
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-white/10 text-white flex-1 text-xs md:text-sm">
              <Bell className="w-4 h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">AI </span>Alerts
            </TabsTrigger>
          </TabsList>

          {/* Deals Tab */}
          <TabsContent value="deals" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {extractedDeals.map((deal, index) => (
                <motion.div
                  key={deal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="bg-white/5 border-white/10 hover:border-white/20 transition-all cursor-pointer group"
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            deal.status === 'ready' ? 'bg-green-500/20' :
                            deal.status === 'primed' ? 'bg-sky-500/20' :
                            'bg-blue-500/20'
                          }`}>
                            <deal.icon className={`w-5 h-5 ${
                              deal.status === 'ready' ? 'text-green-400' :
                              deal.status === 'primed' ? 'text-sky-400' :
                              'text-blue-400'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white group-hover:text-sky-300 transition-colors text-sm md:text-base">
                              {deal.name}
                            </h3>
                            <p className="text-xs text-slate-400">{deal.category}</p>
                          </div>
                        </div>
                        <Badge className={`${statusColors[deal.status]} text-white text-xs`}>
                          {statusLabels[deal.status]}
                        </Badge>
                      </div>

                      <p className="text-xs md:text-sm text-slate-300 mb-4 line-clamp-2">{deal.thesis}</p>

                      <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4 text-xs md:text-sm">
                        <div className="flex items-center gap-1 text-slate-400">
                          <DollarSign className="w-3 h-3 md:w-4 md:h-4" />
                          <span>{deal.capitalNeeded}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                          <span>{deal.timeline}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {deal.keyPlayers.slice(0, 3).map((player, i) => (
                            <Avatar key={i} className="w-6 h-6 md:w-8 md:h-8 border-2 border-slate-900">
                              <AvatarFallback className="text-xs bg-slate-700 text-white">
                                {player.avatar}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {deal.keyPlayers.length > 3 && (
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-xs text-white">
                              +{deal.keyPlayers.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Readiness</span>
                          <div className="w-16 md:w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                deal.readinessScore >= 90 ? 'bg-green-500' :
                                deal.readinessScore >= 70 ? 'bg-sky-500' :
                                'bg-blue-500'
                              }`}
                              style={{ width: `${deal.readinessScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-white">{deal.readinessScore}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-sky-400" />
                  Needed Connections
                </CardTitle>
                <CardDescription className="text-slate-400">
                  AI-identified connection gaps based on deal requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {neededConnections.map((connection, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-white">{connection.need}</h4>
                            <Badge variant={connection.urgency === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                              {connection.urgency} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">For: {connection.deal}</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-sky-500/30 text-sky-300 hover:bg-sky-500/20 w-full sm:w-auto">
                          Find Connection
                        </Button>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{connection.reason}</p>
                      {connection.warmPath && (
                        <div className="flex items-center gap-2 text-xs text-green-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Warm path: {connection.warmPath}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-sky-400" />
                  AI-Generated Alerts
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Intelligent notifications based on deal momentum and action items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border ${
                        notification.priority === 'high' 
                          ? 'bg-red-500/10 border-red-500/30' 
                          : notification.priority === 'medium'
                          ? 'bg-sky-500/10 border-sky-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          notification.type === 'ready' ? 'bg-green-500/20' :
                          notification.type === 'primed' ? 'bg-sky-500/20' :
                          notification.type === 'action' ? 'bg-blue-500/20' :
                          'bg-red-500/20'
                        }`}>
                          {notification.type === 'ready' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> :
                           notification.type === 'primed' ? <Zap className="w-4 h-4 text-sky-400" /> :
                           notification.type === 'action' ? <Clock className="w-4 h-4 text-blue-400" /> :
                           <AlertCircle className="w-4 h-4 text-red-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-white text-sm">{notification.title}</h4>
                            <span className="text-xs text-slate-500 whitespace-nowrap">{notification.time}</span>
                          </div>
                          <p className="text-sm text-slate-300 mt-1">{notification.message}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Deal Detail Dialog */}
      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDeal && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedDeal.status === 'ready' ? 'bg-green-500/20' :
                    selectedDeal.status === 'primed' ? 'bg-sky-500/20' :
                    'bg-blue-500/20'
                  }`}>
                    <selectedDeal.icon className={`w-6 h-6 ${
                      selectedDeal.status === 'ready' ? 'text-green-400' :
                      selectedDeal.status === 'primed' ? 'text-sky-400' :
                      'text-blue-400'
                    }`} />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedDeal.name}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      {selectedDeal.category} • {selectedDeal.timeline}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Thesis */}
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Deal Thesis</h4>
                  <p className="text-slate-200">{selectedDeal.thesis}</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-slate-400">Capital Needed</p>
                    <p className="text-lg font-semibold text-white">{selectedDeal.capitalNeeded}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-slate-400">Readiness Score</p>
                    <p className="text-lg font-semibold text-white">{selectedDeal.readinessScore}%</p>
                  </div>
                </div>

                {/* Key Players */}
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3">Key Players</h4>
                  <div className="space-y-2">
                    {selectedDeal.keyPlayers.map((player, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-slate-700 text-white text-xs">
                              {player.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-white">{player.name}</p>
                            <p className="text-xs text-slate-400">{player.role}</p>
                          </div>
                        </div>
                        <Badge variant={player.commitment === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                          {player.commitment}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Items */}
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3">Action Items</h4>
                  <div className="space-y-2">
                    {selectedDeal.actionItems.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          {item.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : item.status === 'in-progress' ? (
                            <Clock className="w-4 h-4 text-sky-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-slate-400" />
                          )}
                          <div>
                            <p className="text-sm text-white">{item.task}</p>
                            <p className="text-xs text-slate-400">{item.assignee}</p>
                          </div>
                        </div>
                        <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                          {item.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signals */}
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3">AI-Detected Signals</h4>
                  <div className="space-y-2">
                    {selectedDeal.signals.map((signal, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-white/5">
                        {signal.type === 'commitment' ? (
                          <Star className="w-4 h-4 text-green-400 mt-0.5" />
                        ) : signal.type === 'momentum' ? (
                          <TrendingUp className="w-4 h-4 text-sky-400 mt-0.5" />
                        ) : signal.type === 'ready' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm text-white">{signal.text}</p>
                          <p className="text-xs text-slate-400">{signal.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Source */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span className="text-sm text-slate-300">Source: {selectedDeal.sourceTranscript}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="text-sky-300 hover:text-sky-200">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
