import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Network, Users, User, Building2, Briefcase, Calendar, Tag, 
  MessageSquare, RefreshCw, Download, Share2, Filter,
  ChevronRight, Clock, Mail, Phone, MapPin, TrendingUp,
  Zap, Target, CheckCircle2, AlertCircle, ArrowUpRight
} from 'lucide-react';
import { KnowledgeGraph, GraphNode, GraphLink, NodeType } from '@/components/KnowledgeGraph';

// Sample data extracted from Fireflies meetings
const sampleNodes: GraphNode[] = [
  // People from meetings
  { id: 'person-1', label: 'Avraham Adler', type: 'person', data: { 
    email: 'management@novatalentcorp.com', 
    role: 'CEO & Founder',
    company: 'Nova Talent Corp',
    actionItems: [
      'Finalize team onboarding and equity distribution',
      'Lead fintech trading platform launch',
      'Manage global asset transactions'
    ]
  }},
  { id: 'person-2', label: 'Nikita Tyukalo', type: 'person', data: { 
    role: 'CTO',
    company: 'Nova Talent Corp',
    actionItems: [
      'Optimize software demo for mobile',
      'Develop AI-powered dating app',
      'Create Signal group chat'
    ]
  }},
  { id: 'person-3', label: 'Shane Fox', type: 'person', data: { 
    role: 'Healthcare Lead',
    company: 'Navi Labs',
    actionItems: [
      'Lead peptide product development',
      'Arrange production and distribution',
      'Coordinate with biotech partners'
    ]
  }},
  { id: 'person-4', label: 'Andrew Godfrey', type: 'person', data: { 
    role: 'Marketing Strategist',
    actionItems: [
      'Align marketing strategies with fintech',
      'Support tokenization concepts',
      'Clarify development roadmap'
    ]
  }},
  { id: 'person-5', label: 'Dug Dugmor', type: 'person', data: { 
    email: 'dugmor@gmail.com',
    role: 'Tech Support',
    actionItems: [
      'Help set up phone controller',
      'Provide licensing options',
      'Send knowledge base access'
    ]
  }},
  { id: 'person-6', label: 'Dan', type: 'person', data: { 
    role: 'Snapchat Automation',
    actionItems: [
      'Review device list and features',
      'Provide remote access setup',
      'Facilitate developer meeting'
    ]
  }},
  { id: 'person-7', label: 'Carmello Gainz', type: 'person', data: { 
    role: 'Operations',
    actionItems: [
      'Create Asana tasks',
      'Share GMART platform access',
      'Guide VAs on verification'
    ]
  }},
  { id: 'person-8', label: 'Veronica Welch', type: 'person', data: { 
    role: 'Strategy',
    actionItems: [
      'Review model profiles',
      'Prepare proposal deck'
    ]
  }},
  
  // Companies
  { id: 'company-1', label: 'Nova Talent Corp', type: 'company', data: { 
    description: 'Holding company for fintech, healthcare, and media ventures',
    revenue: '$10M/month'
  }},
  { id: 'company-2', label: 'Navi Labs', type: 'company', data: { 
    description: 'Peptide science and integrative health technologies'
  }},
  { id: 'company-3', label: 'Virtual Exposure (VX)', type: 'company', data: { 
    description: 'Real estate media company in Canada'
  }},
  { id: 'company-4', label: 'GloFi', type: 'company', data: { 
    description: 'Asset tokenization platform'
  }},
  { id: 'company-5', label: 'JMB Virtuals', type: 'company', data: { 
    description: 'Virtual assistant agency'
  }},
  
  // Deals
  { id: 'deal-1', label: 'Peptide Product Launch', type: 'deal', data: { 
    value: '$5M',
    stage: 'Development',
    description: 'Healthcare division for peptide-based therapies'
  }},
  { id: 'deal-2', label: 'Trading Platform', type: 'deal', data: { 
    value: '$20K/week',
    stage: 'Live',
    description: 'Fintech trading platform generating revenue'
  }},
  { id: 'deal-3', label: 'Asset Tokenization', type: 'deal', data: { 
    value: '$260M',
    stage: 'In Progress',
    description: 'Tokenization of real estate, gold, art portfolios'
  }},
  { id: 'deal-4', label: 'Phone Farm Setup', type: 'deal', data: { 
    value: '$40-50K/month',
    stage: 'Negotiation',
    description: 'Remote iPhone phone farm for Snapchat operations'
  }},
  { id: 'deal-5', label: 'Model Credit Lines', type: 'deal', data: { 
    value: '$300K+/model',
    stage: 'Planning',
    description: 'Leveraging model creditworthiness for investment'
  }},
  
  // Meetings
  { id: 'meeting-1', label: 'Strategy Session Jan 16', type: 'meeting', data: { 
    date: '2026-01-17T05:51:46.000Z',
    duration: '109 min',
    description: 'Healthcare, fintech, and tokenization strategy'
  }},
  { id: 'meeting-2', label: 'VA Phone Control Setup', type: 'meeting', data: { 
    date: '2026-01-16T18:00:00.000Z',
    duration: '12 min',
    description: 'Multi-VA remote phone control system'
  }},
  { id: 'meeting-3', label: 'Snapchat Demo', type: 'meeting', data: { 
    date: '2026-01-15T01:03:10.000Z',
    duration: '11 min',
    description: 'Phone farm setup and pricing discussion'
  }},
  { id: 'meeting-4', label: 'Instagram Strategy', type: 'meeting', data: { 
    date: '2026-01-12T06:39:32.000Z',
    duration: '55 min',
    description: 'Instagram account creation strategy'
  }},
  { id: 'meeting-5', label: 'AI SaaS Demo', type: 'meeting', data: { 
    date: '2026-01-09T05:49:35.000Z',
    duration: '20 min',
    description: 'AI-powered SaaS suite for OnlyFans agencies'
  }},
  
  // Topics
  { id: 'topic-1', label: 'Peptides', type: 'topic', data: { mentions: 45 }},
  { id: 'topic-2', label: 'Tokenization', type: 'topic', data: { mentions: 38 }},
  { id: 'topic-3', label: 'Stablecoin', type: 'topic', data: { mentions: 22 }},
  { id: 'topic-4', label: 'AI-powered CRM', type: 'topic', data: { mentions: 18 }},
  { id: 'topic-5', label: 'Regenerative Medicine', type: 'topic', data: { mentions: 15 }},
  { id: 'topic-6', label: 'Modeling Agency', type: 'topic', data: { mentions: 28 }},
  { id: 'topic-7', label: 'Phone Farm', type: 'topic', data: { mentions: 12 }},
  { id: 'topic-8', label: 'Virtual Assistants', type: 'topic', data: { mentions: 20 }},
  
  // Action Items
  { id: 'action-1', label: 'Mobile Demo Optimization', type: 'action', data: { 
    assignee: 'Nikita Tyukalo',
    priority: 'High',
    status: 'In Progress'
  }},
  { id: 'action-2', label: 'Equity Distribution', type: 'action', data: { 
    assignee: 'Avraham Adler',
    priority: 'High',
    status: 'Pending'
  }},
  { id: 'action-3', label: 'Peptide Production Setup', type: 'action', data: { 
    assignee: 'Shane Fox',
    priority: 'Medium',
    status: 'Planning'
  }},
];

const sampleLinks: GraphLink[] = [
  // Person to Company
  { source: 'person-1', target: 'company-1', type: 'works_at', label: 'CEO' },
  { source: 'person-2', target: 'company-1', type: 'works_at', label: 'CTO' },
  { source: 'person-3', target: 'company-2', type: 'leads', label: 'Founder' },
  { source: 'person-2', target: 'company-3', type: 'leads', label: 'Founder' },
  
  // Person to Person
  { source: 'person-1', target: 'person-2', type: 'collaborates', strength: 0.9 },
  { source: 'person-1', target: 'person-3', type: 'collaborates', strength: 0.8 },
  { source: 'person-1', target: 'person-4', type: 'collaborates', strength: 0.6 },
  { source: 'person-2', target: 'person-5', type: 'met_with', strength: 0.5 },
  { source: 'person-2', target: 'person-6', type: 'met_with', strength: 0.5 },
  { source: 'person-1', target: 'person-8', type: 'collaborates', strength: 0.4 },
  
  // Person to Deal
  { source: 'person-3', target: 'deal-1', type: 'leads', label: 'Owner' },
  { source: 'person-1', target: 'deal-2', type: 'oversees', label: 'Sponsor' },
  { source: 'person-1', target: 'deal-3', type: 'leads', label: 'Lead' },
  { source: 'person-2', target: 'deal-4', type: 'negotiating', label: 'Buyer' },
  { source: 'person-1', target: 'deal-5', type: 'planning', label: 'Strategist' },
  
  // Person to Meeting
  { source: 'person-1', target: 'meeting-1', type: 'attended' },
  { source: 'person-2', target: 'meeting-1', type: 'attended' },
  { source: 'person-3', target: 'meeting-1', type: 'attended' },
  { source: 'person-4', target: 'meeting-1', type: 'attended' },
  { source: 'person-2', target: 'meeting-2', type: 'attended' },
  { source: 'person-5', target: 'meeting-2', type: 'attended' },
  { source: 'person-2', target: 'meeting-3', type: 'attended' },
  { source: 'person-6', target: 'meeting-3', type: 'attended' },
  
  // Meeting to Topic
  { source: 'meeting-1', target: 'topic-1', type: 'discussed', strength: 0.9 },
  { source: 'meeting-1', target: 'topic-2', type: 'discussed', strength: 0.8 },
  { source: 'meeting-1', target: 'topic-3', type: 'discussed', strength: 0.7 },
  { source: 'meeting-1', target: 'topic-4', type: 'discussed', strength: 0.6 },
  { source: 'meeting-1', target: 'topic-5', type: 'discussed', strength: 0.8 },
  { source: 'meeting-1', target: 'topic-6', type: 'discussed', strength: 0.5 },
  { source: 'meeting-2', target: 'topic-7', type: 'discussed', strength: 0.9 },
  { source: 'meeting-2', target: 'topic-8', type: 'discussed', strength: 0.8 },
  
  // Deal to Topic
  { source: 'deal-1', target: 'topic-1', type: 'related', strength: 0.9 },
  { source: 'deal-1', target: 'topic-5', type: 'related', strength: 0.8 },
  { source: 'deal-2', target: 'topic-2', type: 'related', strength: 0.9 },
  { source: 'deal-3', target: 'topic-2', type: 'related', strength: 0.9 },
  { source: 'deal-3', target: 'topic-3', type: 'related', strength: 0.7 },
  
  // Company to Deal
  { source: 'company-2', target: 'deal-1', type: 'owns' },
  { source: 'company-4', target: 'deal-3', type: 'owns' },
  
  // Person to Action
  { source: 'person-2', target: 'action-1', type: 'assigned' },
  { source: 'person-1', target: 'action-2', type: 'assigned' },
  { source: 'person-3', target: 'action-3', type: 'assigned' },
  
  // Meeting to Action
  { source: 'meeting-1', target: 'action-1', type: 'generated' },
  { source: 'meeting-1', target: 'action-2', type: 'generated' },
  { source: 'meeting-1', target: 'action-3', type: 'generated' },
];

// Action items extracted from meetings
const actionItems = [
  { id: 1, task: 'Optimize software demo for mobile', assignee: 'Nikita Tyukalo', meeting: 'Strategy Session', priority: 'High', status: 'In Progress', dueDate: '2026-01-20' },
  { id: 2, task: 'Finalize team onboarding and equity distribution', assignee: 'Avraham Adler', meeting: 'Strategy Session', priority: 'High', status: 'Pending', dueDate: '2026-01-22' },
  { id: 3, task: 'Lead peptide product development', assignee: 'Shane Fox', meeting: 'Strategy Session', priority: 'Medium', status: 'Planning', dueDate: '2026-02-01' },
  { id: 4, task: 'Develop AI-powered dating app', assignee: 'Nikita Tyukalo', meeting: 'Strategy Session', priority: 'Medium', status: 'Backlog', dueDate: '2026-03-01' },
  { id: 5, task: 'Create Signal group chat', assignee: 'Nikita Tyukalo', meeting: 'Strategy Session', priority: 'Low', status: 'Done', dueDate: '2026-01-17' },
  { id: 6, task: 'Set up phone controller system', assignee: 'Dug Dugmor', meeting: 'VA Phone Control', priority: 'High', status: 'In Progress', dueDate: '2026-01-18' },
  { id: 7, task: 'Provide licensing options', assignee: 'Dug Dugmor', meeting: 'VA Phone Control', priority: 'Medium', status: 'Done', dueDate: '2026-01-17' },
  { id: 8, task: 'Review device list and pricing', assignee: 'Dan', meeting: 'Snapchat Demo', priority: 'High', status: 'Pending', dueDate: '2026-01-18' },
];

// Meeting insights
const meetingInsights = [
  { 
    id: '01KF584XB4MJGF2ZSKG21V657N',
    title: 'Strategy Session',
    date: '2026-01-17',
    duration: '109 min',
    participants: ['Avraham Adler', 'Nikita Tyukalo', 'Shane Fox', 'Andrew Godfrey'],
    keywords: ['Peptides', 'Tokenization', 'Stablecoin', 'Modeling Agency', 'Regenerative Medicine'],
    summary: 'Strategic plan to launch healthcare division with peptide therapies and fintech ecosystem for asset tokenization.',
    sentiment: 'Positive',
    actionCount: 15
  },
  {
    id: '01KF21Y2ZWJ48PKVTVQQ2CN5C2',
    title: 'VA Phone Control Setup',
    date: '2026-01-16',
    duration: '12 min',
    participants: ['Nikita Tyukalo', 'Dug Dugmor'],
    keywords: ['Phone controller', 'Remote desktop', 'Virtual Assistant', 'API integration'],
    summary: 'Multi-VA remote phone control system setup with Rust Desk for managing 15 phones from one computer.',
    sentiment: 'Neutral',
    actionCount: 6
  },
  {
    id: '01KEZJV19ES9J6HDD22KBY05DX',
    title: 'Snapchat Demo',
    date: '2026-01-15',
    duration: '11 min',
    participants: ['Nikita Tyukalo', 'Dan'],
    keywords: ['Snapchat automation', 'setup fee', 'remote access', 'iPhone integration'],
    summary: '$40,000 setup fee for 20 iPhone remote management system via AnyDesk.',
    sentiment: 'Positive',
    actionCount: 5
  },
];

export default function KnowledgeGraphPage() {
  const [activeTab, setActiveTab] = useState('graph');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<typeof meetingInsights[0] | null>(null);

  const handleNodeClick = (node: GraphNode) => {
    console.log('Node clicked:', node);
  };

  const handleNodeDoubleClick = (node: GraphNode) => {
    console.log('Node double-clicked:', node);
  };

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const stats = {
    totalNodes: sampleNodes.length,
    totalConnections: sampleLinks.length,
    people: sampleNodes.filter(n => n.type === 'person').length,
    companies: sampleNodes.filter(n => n.type === 'company').length,
    deals: sampleNodes.filter(n => n.type === 'deal').length,
    meetings: sampleNodes.filter(n => n.type === 'meeting').length,
    topics: sampleNodes.filter(n => n.type === 'topic').length,
    actions: sampleNodes.filter(n => n.type === 'action').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Network className="w-6 h-6 text-primary" />
                Knowledge Graph
              </h1>
              <p className="text-muted-foreground text-sm">
                Obsidian-style visualization of your CRM relationships and meeting insights
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Sync Fireflies
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          {[
            { label: 'Nodes', value: stats.totalNodes, icon: Network, color: 'text-slate-600' },
            { label: 'Connections', value: stats.totalConnections, icon: Share2, color: 'text-slate-600' },
            { label: 'People', value: stats.people, icon: Users, color: 'text-sky-500' },
            { label: 'Companies', value: stats.companies, icon: Building2, color: 'text-sky-600' },
            { label: 'Deals', value: stats.deals, icon: Briefcase, color: 'text-sky-500' },
            { label: 'Meetings', value: stats.meetings, icon: Calendar, color: 'text-sky-400' },
            { label: 'Topics', value: stats.topics, icon: Tag, color: 'text-slate-500' },
            { label: 'Actions', value: stats.actions, icon: MessageSquare, color: 'text-slate-600' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-xl font-bold mt-1">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Graph View
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Meeting Insights
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Action Items
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Connections
            </TabsTrigger>
          </TabsList>

          <TabsContent value="graph" className="mt-4">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-[600px]">
                <KnowledgeGraph
                  nodes={sampleNodes}
                  links={sampleLinks}
                  onNodeClick={handleNodeClick}
                  onNodeDoubleClick={handleNodeDoubleClick}
                  className="w-full h-full"
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="meetings" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Meeting List */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Recent Meetings
                </h3>
                {meetingInsights.map((meeting) => (
                  <motion.div
                    key={meeting.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all border-0 shadow-sm hover:shadow-md ${
                        selectedMeeting?.id === meeting.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedMeeting(meeting)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{meeting.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Clock className="w-3 h-3" />
                              {meeting.date} · {meeting.duration}
                            </div>
                          </div>
                          <Badge variant={meeting.sentiment === 'Positive' ? 'default' : 'secondary'}>
                            {meeting.sentiment}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {meeting.keywords.slice(0, 3).map((kw) => (
                            <Badge key={kw} variant="outline" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                          {meeting.keywords.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{meeting.keywords.length - 3}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            {meeting.participants.length} participants
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {meeting.actionCount} actions
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Meeting Detail */}
              <div className="lg:col-span-2">
                {selectedMeeting ? (
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{selectedMeeting.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4" />
                            {selectedMeeting.date} · {selectedMeeting.duration}
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                          <ArrowUpRight className="w-4 h-4 mr-2" />
                          Open in Fireflies
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Summary */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Summary</h4>
                        <p className="text-muted-foreground">{selectedMeeting.summary}</p>
                      </div>

                      {/* Participants */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Participants</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedMeeting.participants.map((p) => (
                            <Badge key={p} variant="secondary" className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {p}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Keywords */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Key Topics</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedMeeting.keywords.map((kw) => (
                            <Badge key={kw} variant="outline">
                              <Tag className="w-3 h-3 mr-1" />
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Action Items from this meeting */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Action Items ({selectedMeeting.actionCount})</h4>
                        <div className="space-y-2">
                          {actionItems
                            .filter(a => a.meeting === selectedMeeting.title)
                            .map((action) => (
                              <div 
                                key={action.id}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <CheckCircle2 className={`w-4 h-4 ${
                                    action.status === 'Done' ? 'text-sky-500' : 'text-slate-300'
                                  }`} />
                                  <div>
                                    <p className="text-sm font-medium">{action.task}</p>
                                    <p className="text-xs text-muted-foreground">{action.assignee}</p>
                                  </div>
                                </div>
                                <Badge variant={
                                  action.priority === 'High' ? 'destructive' :
                                  action.priority === 'Medium' ? 'default' : 'secondary'
                                }>
                                  {action.priority}
                                </Badge>
                              </div>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-0 shadow-lg h-full flex items-center justify-center">
                    <CardContent className="text-center py-12">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium">Select a Meeting</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Click on a meeting to view details and insights
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Action Items from Meetings
                </CardTitle>
                <CardDescription>
                  Extracted action items from your Fireflies meeting transcripts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {actionItems.map((action, i) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <CheckCircle2 className={`w-5 h-5 ${
                          action.status === 'Done' ? 'text-sky-500' :
                          action.status === 'In Progress' ? 'text-sky-500' : 'text-slate-300'
                        }`} />
                        <div>
                          <p className="font-medium">{action.task}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {action.assignee}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {action.meeting}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Due: {action.dueDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          action.status === 'Done' ? 'default' :
                          action.status === 'In Progress' ? 'secondary' : 'outline'
                        }>
                          {action.status}
                        </Badge>
                        <Badge variant={
                          action.priority === 'High' ? 'destructive' :
                          action.priority === 'Medium' ? 'default' : 'secondary'
                        }>
                          {action.priority}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleNodes.filter(n => n.type === 'person').map((person, i) => {
                const connections = sampleLinks.filter(l => {
                  const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
                  const targetId = typeof l.target === 'string' ? l.target : l.target.id;
                  return sourceId === person.id || targetId === person.id;
                });
                
                return (
                  <motion.div
                    key={person.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold">
                            {person.label.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-medium">{person.label}</h4>
                            <p className="text-xs text-muted-foreground">{person.data?.role}</p>
                          </div>
                        </div>
                        
                        {person.data?.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Mail className="w-4 h-4" />
                            {person.data.email}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            {connections.length} connections
                          </span>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            View Profile
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
