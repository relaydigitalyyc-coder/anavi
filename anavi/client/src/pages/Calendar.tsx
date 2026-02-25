// DashboardLayout is now handled by App.tsx ProtectedRoute
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, Plus, Clock, MapPin, Users, Video,
  ChevronLeft, ChevronRight, Check, X, Bell, Briefcase,
  ExternalLink, MoreHorizontal, Trash2, Pencil, Unplug, Link2
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

const eventVariants = {
  hidden: { opacity: 0, x: -10, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    x: 10,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

const eventTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  meeting: { bg: "bg-[#C9A962]/10", text: "text-[#C9A962]", border: "border-[#C9A962]" },
  call: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-400" },
  follow_up: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-400" },
  due_diligence: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-400" },
  pitch: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-400" },
  closing: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-400" },
  reminder: { bg: "bg-neutral-100", text: "text-neutral-600", border: "border-neutral-400" },
  other: { bg: "bg-neutral-50", text: "text-neutral-500", border: "border-neutral-300" },
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    meetingLink: "",
    startTime: "",
    endTime: "",
    eventType: "meeting" as const,
  });
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location: "",
    startTime: "",
    endTime: "",
    notes: "",
  });
  const [reminderForm, setReminderForm] = useState({
    title: "",
    notes: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    dueDate: "",
  });

  const utils = trpc.useUtils();

  const { data: events } = trpc.calendar.events.useQuery({
    startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
    endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString(),
  });

  const { data: connections } = trpc.calendar.connections.useQuery();
  const { data: reminders } = trpc.calendar.reminders.useQuery({ status: "pending", limit: 10 });

  const createEvent = trpc.calendar.createEvent.useMutation({
    onSuccess: () => {
      toast.success("Event created successfully");
      setShowEventDialog(false);
      setNewEvent({
        title: "",
        description: "",
        location: "",
        meetingLink: "",
        startTime: "",
        endTime: "",
        eventType: "meeting",
      });
      utils.calendar.events.invalidate();
    },
    onError: () => {
      toast.error("Failed to create event");
    },
  });

  const updateEvent = trpc.calendar.updateEvent.useMutation({
    onSuccess: () => {
      toast.success("Event updated");
      setShowEditDialog(false);
      setEditingEvent(null);
      utils.calendar.events.invalidate();
    },
    onError: () => {
      toast.error("Failed to update event");
    },
  });

  const deleteEvent = trpc.calendar.deleteEvent.useMutation({
    onSuccess: () => {
      toast.success("Event deleted");
      setShowEditDialog(false);
      setEditingEvent(null);
      utils.calendar.events.invalidate();
    },
    onError: () => {
      toast.error("Failed to delete event");
    },
  });

  const connectCalendar = trpc.calendar.connect.useMutation({
    onSuccess: () => {
      toast.success("Calendar connected");
      utils.calendar.connections.invalidate();
    },
    onError: () => {
      toast.error("Failed to connect calendar");
    },
  });

  const disconnectCalendar = trpc.calendar.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Calendar disconnected");
      utils.calendar.connections.invalidate();
    },
    onError: () => {
      toast.error("Failed to disconnect calendar");
    },
  });

  const createReminder = trpc.calendar.createReminder.useMutation({
    onSuccess: () => {
      toast.success("Reminder created");
      setShowReminderDialog(false);
      setReminderForm({ title: "", notes: "", priority: "medium", dueDate: "" });
      utils.calendar.reminders.invalidate();
    },
    onError: () => {
      toast.error("Failed to create reminder");
    },
  });

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  const getEventsForDate = (date: Date) => {
    if (!events) return [];
    return events.filter((event: any) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      toast.error("Please fill in required fields");
      return;
    }
    createEvent.mutate(newEvent);
  };

  const openEditDialog = (event: any) => {
    setEditingEvent(event);
    const toLocal = (iso: string) => {
      const d = new Date(iso);
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };
    setEditForm({
      title: event.title ?? "",
      description: event.description ?? "",
      location: event.location ?? "",
      startTime: event.startTime ? toLocal(event.startTime) : "",
      endTime: event.endTime ? toLocal(event.endTime) : "",
      notes: event.notes ?? "",
    });
    setShowEditDialog(true);
  };

  const handleUpdateEvent = () => {
    if (!editingEvent) return;
    updateEvent.mutate({
      eventId: editingEvent.id,
      title: editForm.title || undefined,
      description: editForm.description || undefined,
      location: editForm.location || undefined,
      startTime: editForm.startTime || undefined,
      endTime: editForm.endTime || undefined,
      notes: editForm.notes || undefined,
    });
  };

  const handleDeleteEvent = () => {
    if (!editingEvent) return;
    deleteEvent.mutate({ eventId: editingEvent.id });
  };

  const handleCreateReminder = () => {
    if (!reminderForm.title || !reminderForm.dueDate) {
      toast.error("Title and due date are required");
      return;
    }
    createReminder.mutate({
      targetType: "deal",
      targetId: 0,
      title: reminderForm.title,
      notes: reminderForm.notes || undefined,
      priority: reminderForm.priority,
      dueDate: new Date(reminderForm.dueDate).toISOString(),
    });
  };

  return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-8 space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-2">Schedule</p>
            <h1 className="text-4xl font-light tracking-tight">Calendar</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* View Selector */}
            <div className="flex gap-1 p-1 bg-neutral-100">
              {(["month", "week", "day"] as const).map((v) => (
                <motion.button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                    view === v
                      ? "bg-black text-white"
                      : "text-neutral-500 hover:text-black"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {v}
                </motion.button>
              ))}
            </div>

            <Button
              onClick={() => setShowEventDialog(true)}
              className="bg-black text-white hover:bg-neutral-800 px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-4 gap-6">
          {/* Main Calendar */}
          <motion.div variants={itemVariants} className="col-span-3 border border-neutral-200">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-neutral-100 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <h2 className="text-xl font-light min-w-[200px] text-center">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <motion.button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-neutral-100 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
              <motion.button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 text-xs uppercase tracking-wider border border-neutral-200 hover:border-black transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Today
              </motion.button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 border-b border-neutral-200">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="p-4 text-center text-xs uppercase tracking-wider text-neutral-400"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDate(day.date);
                const isSelected = selectedDate?.toDateString() === day.date.toDateString();

                return (
                  <motion.div
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`min-h-[100px] p-2 border-b border-r border-neutral-100 cursor-pointer transition-colors ${
                      !day.isCurrentMonth ? "bg-neutral-50" : ""
                    } ${isSelected ? "bg-[#C9A962]/5" : "hover:bg-neutral-50"}`}
                    whileHover={{ scale: 1.01 }}
                  >
                    <div className={`text-sm mb-2 ${
                      isToday(day.date)
                        ? "w-7 h-7 bg-black text-white flex items-center justify-center"
                        : !day.isCurrentMonth
                        ? "text-neutral-300"
                        : ""
                    }`}>
                      {day.date.getDate()}
                    </div>
                    <AnimatePresence>
                      {dayEvents.slice(0, 3).map((event: any, eventIndex: number) => {
                        const colors = eventTypeColors[event.eventType] || eventTypeColors.other;
                        return (
                          <motion.div
                            key={event.id || eventIndex}
                            variants={eventVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className={`text-xs p-1 mb-1 truncate border-l-2 cursor-pointer hover:opacity-80 ${colors.bg} ${colors.text} ${colors.border}`}
                            onClick={(e) => { e.stopPropagation(); openEditDialog(event); }}
                          >
                            {event.title}
                          </motion.div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-neutral-400">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connected Calendars */}
            <motion.div variants={itemVariants} className="border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium uppercase tracking-wider">Connections</h3>
              </div>
              <div className="space-y-3">
                {connections?.map((conn: any) => (
                  <div key={conn.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 ${conn.isActive ? "bg-sky-500" : "bg-neutral-300"}`} />
                      <span className="text-sm capitalize">{conn.provider}</span>
                    </div>
                    <button
                      onClick={() => disconnectCalendar.mutate({ connectionId: conn.id })}
                      className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                      title="Disconnect"
                    >
                      <Unplug className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(!connections || connections.length === 0) && (
                  <div className="text-center py-4">
                    <CalendarIcon className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400">No calendars connected</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs mt-2"
                  disabled={connectCalendar.isPending}
                  onClick={() => connectCalendar.mutate({ provider: "google" })}
                >
                  <Link2 className="w-3.5 h-3.5 mr-1.5" />
                  {connectCalendar.isPending ? "Connecting…" : "Connect Google Calendar"}
                </Button>
              </div>
            </motion.div>

            {/* Upcoming Reminders */}
            <motion.div variants={itemVariants} className="border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium uppercase tracking-wider">Reminders</h3>
                <button
                  onClick={() => setShowReminderDialog(true)}
                  className="p-1 hover:bg-neutral-100 transition-colors rounded"
                  title="Add Reminder"
                >
                  <Plus className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
              <div className="space-y-3">
                {reminders?.slice(0, 5).map((reminder: any) => (
                  <motion.div
                    key={reminder.id}
                    className="p-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    <p className="text-sm font-medium truncate">{reminder.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 ${
                        reminder.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                        reminder.priority === 'high' ? 'bg-sky-100 text-sky-600' :
                        'bg-neutral-200 text-neutral-500'
                      }`}>
                        {reminder.priority}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {(!reminders || reminders.length === 0) && (
                  <p className="text-xs text-neutral-400 text-center py-4">No pending reminders</p>
                )}
              </div>
            </motion.div>

            {/* Selected Date Events */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-neutral-200 p-6"
              >
                <h3 className="text-sm font-medium uppercase tracking-wider mb-4">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map((event: any) => {
                    const colors = eventTypeColors[event.eventType] || eventTypeColors.other;
                    return (
                      <div
                        key={event.id}
                        className={`p-3 border-l-2 cursor-pointer hover:opacity-80 ${colors.bg} ${colors.border}`}
                        onClick={() => openEditDialog(event)}
                      >
                        <p className="text-sm font-medium">{event.title}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                          <Clock className="w-3 h-3" />
                          {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {getEventsForDate(selectedDate).length === 0 && (
                    <p className="text-xs text-neutral-400 text-center py-4">No events</p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Create Event Dialog */}
        <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
          <DialogContent className="sm:max-w-[500px] rounded-none border-neutral-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-light">New Event</DialogTitle>
              <DialogDescription className="sr-only">Create a new calendar event</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Title</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Event title"
                  className="rounded-none border-neutral-200"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Type</label>
                <Select
                  value={newEvent.eventType}
                  onValueChange={(value: any) => setNewEvent({ ...newEvent, eventType: value })}
                >
                  <SelectTrigger className="rounded-none border-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="due_diligence">Due Diligence</SelectItem>
                    <SelectItem value="pitch">Pitch</SelectItem>
                    <SelectItem value="closing">Closing</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Start</label>
                  <Input
                    type="datetime-local"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="rounded-none border-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">End</label>
                  <Input
                    type="datetime-local"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="rounded-none border-neutral-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Location</label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Location or address"
                  className="rounded-none border-neutral-200"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Meeting Link</label>
                <Input
                  value={newEvent.meetingLink}
                  onChange={(e) => setNewEvent({ ...newEvent, meetingLink: e.target.value })}
                  placeholder="Zoom, Google Meet, etc."
                  className="rounded-none border-neutral-200"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Description</label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event details..."
                  className="rounded-none border-neutral-200 min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEventDialog(false)}
                  className="rounded-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateEvent}
                  disabled={createEvent.isPending}
                  className="bg-black text-white hover:bg-neutral-800 rounded-none"
                >
                  {createEvent.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={showEditDialog} onOpenChange={(open) => { if (!open) { setShowEditDialog(false); setEditingEvent(null); } }}>
          <DialogContent className="sm:max-w-[500px] rounded-none border-neutral-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-light">Edit Event</DialogTitle>
              <DialogDescription className="sr-only">Edit or delete this calendar event</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Title</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="rounded-none border-neutral-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Start</label>
                  <Input
                    type="datetime-local"
                    value={editForm.startTime}
                    onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                    className="rounded-none border-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">End</label>
                  <Input
                    type="datetime-local"
                    value={editForm.endTime}
                    onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                    className="rounded-none border-neutral-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Location</label>
                <Input
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="rounded-none border-neutral-200"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Description</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="rounded-none border-neutral-200 min-h-[80px]"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Notes</label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Post-meeting notes, outcomes…"
                  className="rounded-none border-neutral-200 min-h-[60px]"
                />
              </div>
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handleDeleteEvent}
                  disabled={deleteEvent.isPending}
                  className="rounded-none text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteEvent.isPending ? "Deleting…" : "Delete"}
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => { setShowEditDialog(false); setEditingEvent(null); }}
                    className="rounded-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateEvent}
                    disabled={updateEvent.isPending}
                    className="bg-black text-white hover:bg-neutral-800 rounded-none"
                  >
                    {updateEvent.isPending ? "Saving…" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Reminder Dialog */}
        <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
          <DialogContent className="sm:max-w-[420px] rounded-none border-neutral-200">
            <DialogHeader>
              <DialogTitle className="text-xl font-light">New Reminder</DialogTitle>
              <DialogDescription className="sr-only">Create a follow-up reminder</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Title</label>
                <Input
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                  placeholder="Reminder title"
                  className="rounded-none border-neutral-200"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Due Date</label>
                <Input
                  type="datetime-local"
                  value={reminderForm.dueDate}
                  onChange={(e) => setReminderForm({ ...reminderForm, dueDate: e.target.value })}
                  className="rounded-none border-neutral-200"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Priority</label>
                <Select
                  value={reminderForm.priority}
                  onValueChange={(v: any) => setReminderForm({ ...reminderForm, priority: v })}
                >
                  <SelectTrigger className="rounded-none border-neutral-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">Notes</label>
                <Textarea
                  value={reminderForm.notes}
                  onChange={(e) => setReminderForm({ ...reminderForm, notes: e.target.value })}
                  placeholder="Optional notes…"
                  className="rounded-none border-neutral-200 min-h-[60px]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowReminderDialog(false)}
                  className="rounded-none"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateReminder}
                  disabled={createReminder.isPending}
                  className="bg-black text-white hover:bg-neutral-800 rounded-none"
                >
                  {createReminder.isPending ? "Creating…" : "Create Reminder"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
  );
}
