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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Trash2,
  Eye,
  Activity,
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [detailTargetId, setDetailTargetId] = useState<number | null>(null);
  const [newTarget, setNewTarget] = useState({
    familyOfficeId: 0,
    priority: "medium" as "low" | "medium" | "high" | "critical",
    notes: "",
    primaryContactName: "",
    primaryContactTitle: "",
  });
  const [newActivity, setNewActivity] = useState({
    activityType: "email_sent" as const,
    subject: "",
    description: "",
    outcome: "",
  });

  const utils = trpc.useUtils();

  const { data: targetsData } = trpc.targeting.list.useQuery({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });
  const { data: stats } = trpc.targeting.stats.useQuery();

  const { data: detailData } = trpc.targeting.get.useQuery(
    { id: detailTargetId! },
    { enabled: !!detailTargetId }
  );

  const { data: activities } = trpc.targeting.getActivities.useQuery(
    { targetId: detailTargetId! },
    { enabled: !!detailTargetId && detailSheetOpen }
  );
  
  const updateTarget = trpc.targeting.update.useMutation({
    onSuccess: () => {
      utils.targeting.list.invalidate();
      utils.targeting.get.invalidate();
      toast.success("Target updated");
    },
  });

  const createTarget = trpc.targeting.create.useMutation({
    onSuccess: () => {
      utils.targeting.list.invalidate();
      utils.targeting.stats.invalidate();
      setCreateDialogOpen(false);
      setNewTarget({ familyOfficeId: 0, priority: "medium", notes: "", primaryContactName: "", primaryContactTitle: "" });
      toast.success("Target created");
    },
    onError: () => {
      toast.error("Failed to create target");
    },
  });

  const deleteTarget = trpc.targeting.delete.useMutation({
    onSuccess: () => {
      utils.targeting.list.invalidate();
      utils.targeting.stats.invalidate();
      setDetailSheetOpen(false);
      setDetailTargetId(null);
      toast.success("Target deleted");
    },
    onError: () => {
      toast.error("Failed to delete target");
    },
  });

  const addActivity = trpc.targeting.addActivity.useMutation({
    onSuccess: () => {
      setActivityDialogOpen(false);
      setNewActivity({ activityType: "email_sent", subject: "", description: "", outcome: "" });
      utils.targeting.getActivities.invalidate();
      toast.success("Activity logged");
    },
  });

  const targets = targetsData?.data || [];

  const handleRowClick = (targetId: number) => {
    setDetailTargetId(targetId);
    setDetailSheetOpen(true);
  };

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
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Target
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Target</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-stone-700">Family Office ID *</label>
                <Input
                  className="mt-1"
                  type="number"
                  value={newTarget.familyOfficeId || ""}
                  onChange={(e) => setNewTarget({ ...newTarget, familyOfficeId: parseInt(e.target.value) || 0 })}
                  placeholder="Enter family office ID"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">Contact Name</label>
                <Input
                  className="mt-1"
                  value={newTarget.primaryContactName}
                  onChange={(e) => setNewTarget({ ...newTarget, primaryContactName: e.target.value })}
                  placeholder="Primary contact name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">Contact Title</label>
                <Input
                  className="mt-1"
                  value={newTarget.primaryContactTitle}
                  onChange={(e) => setNewTarget({ ...newTarget, primaryContactTitle: e.target.value })}
                  placeholder="e.g. Chief Investment Officer"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">Priority</label>
                <Select
                  value={newTarget.priority}
                  onValueChange={(value) => setNewTarget({ ...newTarget, priority: value as any })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">Notes</label>
                <Textarea
                  className="mt-1"
                  value={newTarget.notes}
                  onChange={(e) => setNewTarget({ ...newTarget, notes: e.target.value })}
                  placeholder="Any initial notes..."
                />
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (!newTarget.familyOfficeId) {
                    toast.error("Family Office ID is required");
                    return;
                  }
                  createTarget.mutate({
                    familyOfficeId: newTarget.familyOfficeId,
                    priority: newTarget.priority,
                    notes: newTarget.notes || undefined,
                    primaryContactName: newTarget.primaryContactName || undefined,
                    primaryContactTitle: newTarget.primaryContactTitle || undefined,
                  });
                }}
                disabled={createTarget.isPending}
              >
                Create Target
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
              className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-stone-100 hover:bg-stone-50 transition-colors items-center cursor-pointer"
              onClick={() => handleRowClick(item.target.id)}
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
              
              <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
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
              
              <div className="col-span-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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

      {/* Detail Sheet */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-full sm:w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle className="text-xl font-serif font-light">
              {detailData?.familyOffice?.name || "Target Details"}
            </SheetTitle>
          </SheetHeader>
          
          {detailData && (
            <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
              <div className="space-y-6">
                {/* Target Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-stone-100">
                    <span className="text-sm text-stone-500">Status</span>
                    <Badge className={statusColors[detailData.target.status || "identified"]}>
                      {statusLabels[detailData.target.status || "identified"]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-stone-100">
                    <span className="text-sm text-stone-500">Priority</span>
                    <Badge className={priorityColors[detailData.target.priority || "medium"]}>
                      {(detailData.target.priority || "medium").charAt(0).toUpperCase() + (detailData.target.priority || "medium").slice(1)}
                    </Badge>
                  </div>
                  {detailData.target.primaryContactName && (
                    <div className="flex items-center justify-between py-2 border-b border-stone-100">
                      <span className="text-sm text-stone-500">Contact</span>
                      <span className="text-sm font-medium">{detailData.target.primaryContactName}</span>
                    </div>
                  )}
                  {detailData.target.primaryContactTitle && (
                    <div className="flex items-center justify-between py-2 border-b border-stone-100">
                      <span className="text-sm text-stone-500">Title</span>
                      <span className="text-sm">{detailData.target.primaryContactTitle}</span>
                    </div>
                  )}
                  {detailData.target.notes && (
                    <div className="py-2">
                      <span className="text-sm text-stone-500">Notes</span>
                      <p className="text-sm mt-1">{detailData.target.notes}</p>
                    </div>
                  )}
                  {detailData.target.lastContactDate && (
                    <div className="flex items-center justify-between py-2 border-b border-stone-100">
                      <span className="text-sm text-stone-500">Last Contact</span>
                      <span className="text-sm">{new Date(detailData.target.lastContactDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Activity Log */}
                <div>
                  <h4 className="text-sm font-medium text-stone-700 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Activity Log
                  </h4>
                  {activities && activities.length > 0 ? (
                    <div className="space-y-3">
                      {activities.map((act: any) => (
                        <div key={act.id} className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {(act.activityType || "").replace(/_/g, " ")}
                            </Badge>
                            <span className="text-xs text-stone-400">
                              {act.createdAt ? new Date(act.createdAt).toLocaleDateString() : ""}
                            </span>
                          </div>
                          {act.subject && <p className="text-sm font-medium">{act.subject}</p>}
                          {act.description && <p className="text-xs text-stone-500 mt-1">{act.description}</p>}
                          {act.outcome && (
                            <p className="text-xs text-stone-600 mt-1">
                              <span className="font-medium">Outcome:</span> {act.outcome}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-stone-400 text-center py-4">No activities logged yet</p>
                  )}
                </div>

                {/* Delete Target */}
                <div className="pt-4 border-t border-stone-200">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Target
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this target?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove this target and all associated data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            if (detailTargetId) {
                              deleteTarget.mutate({ id: detailTargetId });
                            }
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
