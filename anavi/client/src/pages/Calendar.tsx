// DashboardLayout is now handled by App.tsx ProtectedRoute
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar as CalendarIcon, Plus, Clock, MapPin, Users, Video,
  ChevronLeft, ChevronRight, Check, X, Bell, Briefcase,
  ExternalLink, MoreHorizontal
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    location: "",
    meetingLink: "",
    startTime: "",
    endTime: "",
    eventType: "meeting" as const,
  });

  const { data: events, refetch } = trpc.calendar.events.useQuery({
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
      refetch();
    },
    onError: () => {
      toast.error("Failed to create event");
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

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i),
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding
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
                            className={`text-xs p-1 mb-1 truncate border-l-2 ${colors.bg} ${colors.text} ${colors.border}`}
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {connections?.map((conn: any) => (
                  <div key={conn.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 ${conn.isActive ? "bg-sky-500" : "bg-neutral-300"}`} />
                      <span className="text-sm capitalize">{conn.provider}</span>
                    </div>
                    <Check className="w-4 h-4 text-sky-500" />
                  </div>
                ))}
                {(!connections || connections.length === 0) && (
                  <div className="text-center py-4">
                    <CalendarIcon className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400">No calendars connected</p>
                    <Button variant="outline" size="sm" className="mt-3 text-xs">
                      Connect Calendar
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Upcoming Reminders */}
            <motion.div variants={itemVariants} className="border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium uppercase tracking-wider">Reminders</h3>
                <Bell className="w-4 h-4 text-neutral-400" />
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
                        className={`p-3 border-l-2 ${colors.bg} ${colors.border}`}
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
      </motion.div>
  );
}
