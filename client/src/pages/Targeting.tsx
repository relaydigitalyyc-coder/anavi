import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Target,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Linkedin,
  Calendar,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Pause,
  ArrowUpRight,
} from "lucide-react";

const statusColors: Record<string, string> = {
  identified: "bg-slate-100 text-slate-700",
  researching: "bg-blue-100 text-blue-700",
  outreach_planned: "bg-purple-100 text-purple-700",
  contacted: "bg-sky-100 text-sky-700",
  in_conversation: "bg-sky-100 text-sky-700",
  meeting_scheduled: "bg-cyan-100 text-cyan-700",
  proposal_sent: "bg-indigo-100 text-indigo-700",
  negotiating: "bg-orange-100 text-orange-700",
  converted: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
  on_hold: "bg-gray-100 text-gray-700",
};

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-sky-100 text-sky-600",
  critical: "bg-red-100 text-red-600",
};

const statusLabels: Record<string, string> = {
  identified: "Identified",
  researching: "Researching",
  outreach_planned: "Outreach Planned",
  contacted: "Contacted",
  in_conversation: "In Conversation",
  meeting_scheduled: "Meeting Scheduled",
  proposal_sent: "Proposal Sent",
  negotiating: "Negotiating",
  converted: "Converted",
  declined: "Declined",
  on_hold: "On Hold",
};

export default function Targeting() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activityType: "email_sent" as const,
    subject: "",
    description: "",
    outcome: "",
  });

  const { data: targetsData, refetch } = trpc.targeting.list.useQuery({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });
  const { data: stats } = trpc.targeting.stats.useQuery();
  
  const updateTarget = trpc.targeting.update.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Target updated");
    },
  });

  const addActivity = trpc.targeting.addActivity.useMutation({
    onSuccess: () => {
      setActivityDialogOpen(false);
      setNewActivity({ activityType: "email_sent", subject: "", description: "", outcome: "" });
      toast.success("Activity logged");
    },
  });

  const targets = targetsData?.data || [];

  // Group targets by status for Kanban view
  const targetsByStatus = targets.reduce((acc, item) => {
    const status = item.target.status || "identified";
    if (!acc[status]) acc[status] = [];
    acc[status].push(item);
    return acc;
  }, {} as Record<string, typeof targets>);

  const handleStatusChange = (targetId: number, newStatus: string) => {
    updateTarget.mutate({ id: targetId, status: newStatus as any });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-light text-stone-900 tracking-tight">
            Targeting
          </h1>
          <p className="text-stone-500 mt-1">
            Manage your prospecting pipeline and track outreach
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-sky-600" />
            </div>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Total Targets</span>
          </div>
          <p className="text-2xl font-light text-stone-900">{targetsData?.total || 0}</p>
        </div>
        
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-sky-600" />
            </div>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">In Conversation</span>
          </div>
          <p className="text-2xl font-light text-stone-900">
            {stats?.byStatus?.find(s => s.status === "in_conversation")?.count || 0}
          </p>
        </div>
        
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Converted</span>
          </div>
          <p className="text-2xl font-light text-stone-900">
            {stats?.byStatus?.find(s => s.status === "converted")?.count || 0}
          </p>
        </div>
        
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Pipeline Value</span>
          </div>
          <p className="text-2xl font-light text-stone-900">
            ${Number(stats?.totalEstimatedValue || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input placeholder="Search targets..." className="pl-10" />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Targets List */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-stone-50 border-b border-stone-200 text-xs font-medium text-stone-500 uppercase tracking-wider">
          <div className="col-span-4">Target</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-2">Last Contact</div>
          <div className="col-span-2">Actions</div>
        </div>
        
        {targets.length === 0 ? (
          <div className="p-12 text-center">
            <Target className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No targets yet</p>
            <p className="text-sm text-stone-400 mt-1">
              Add family offices to your targeting list from the Family Offices page
            </p>
          </div>
        ) : (
          targets.map((item) => (
            <div
              key={item.target.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-stone-100 hover:bg-stone-50 transition-colors items-center"
            >
              <div className="col-span-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">
                      {item.familyOffice?.name || "Unknown"}
                    </p>
                    {item.target.primaryContactName && (
                      <p className="text-sm text-stone-500">
                        {item.target.primaryContactName}
                        {item.target.primaryContactTitle && ` · ${item.target.primaryContactTitle}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="col-span-2">
                <Select
                  value={item.target.status || "identified"}
                  onValueChange={(value) => handleStatusChange(item.target.id, value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <Badge className={statusColors[item.target.status || "identified"]}>
                      {statusLabels[item.target.status || "identified"]}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Badge className={priorityColors[item.target.priority || "medium"]}>
                  {(item.target.priority || "medium").charAt(0).toUpperCase() + (item.target.priority || "medium").slice(1)}
                </Badge>
              </div>
              
              <div className="col-span-2 text-sm text-stone-500">
                {item.target.lastContactDate
                  ? new Date(item.target.lastContactDate).toLocaleDateString()
                  : "Never"}
              </div>
              
              <div className="col-span-2 flex items-center gap-2">
                {item.target.primaryContactEmail && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={`mailto:${item.target.primaryContactEmail}`}>
                      <Mail className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                {item.target.primaryContactLinkedIn && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={item.target.primaryContactLinkedIn} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                <Dialog open={activityDialogOpen && selectedTarget === item.target.id} onOpenChange={(open) => {
                  setActivityDialogOpen(open);
                  if (open) setSelectedTarget(item.target.id);
                }}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8">
                      <Plus className="w-4 h-4 mr-1" />
                      Log
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log Activity</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm font-medium text-stone-700">Activity Type</label>
                        <Select
                          value={newActivity.activityType}
                          onValueChange={(value) => setNewActivity({ ...newActivity, activityType: value as any })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email_sent">Email Sent</SelectItem>
                            <SelectItem value="email_received">Email Received</SelectItem>
                            <SelectItem value="call_made">Call Made</SelectItem>
                            <SelectItem value="call_received">Call Received</SelectItem>
                            <SelectItem value="linkedin_connection">LinkedIn Connection</SelectItem>
                            <SelectItem value="linkedin_message">LinkedIn Message</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                            <SelectItem value="video_call">Video Call</SelectItem>
                            <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                            <SelectItem value="follow_up">Follow Up</SelectItem>
                            <SelectItem value="note_added">Note Added</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-stone-700">Subject</label>
                        <Input
                          className="mt-1"
                          value={newActivity.subject}
                          onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })}
                          placeholder="Brief subject line"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-stone-700">Description</label>
                        <Textarea
                          className="mt-1"
                          value={newActivity.description}
                          onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                          placeholder="What happened?"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-stone-700">Outcome</label>
                        <Input
                          className="mt-1"
                          value={newActivity.outcome}
                          onChange={(e) => setNewActivity({ ...newActivity, outcome: e.target.value })}
                          placeholder="Result or next step"
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          if (selectedTarget) {
                            addActivity.mutate({
                              targetId: selectedTarget,
                              ...newActivity,
                            });
                          }
                        }}
                        disabled={addActivity.isPending}
                      >
                        Log Activity
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
