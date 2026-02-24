// DashboardLayout is now handled by App.tsx ProtectedRoute
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, DollarSign, Clock, Target, 
  BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight,
  Calendar, Users, Briefcase, Zap
} from "lucide-react";
import { useState } from "react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

const chartVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.8,
    },
  },
};

const numberVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

// Animated number component
function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {prefix}{value.toLocaleString()}{suffix}
    </motion.span>
  );
}

// Mini bar chart component
function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((value, index) => (
        <motion.div
          key={index}
          className="flex-1 rounded-sm"
          style={{ backgroundColor: color }}
          initial={{ height: 0 }}
          animate={{ height: `${(value / max) * 100}%` }}
          transition={{ 
            duration: 0.6, 
            delay: index * 0.05,
             
          }}
        />
      ))}
    </div>
  );
}

// Donut chart component
function DonutChart({ segments, size = 120 }: { segments: { value: number; color: string; label: string }[]; size?: number }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let currentAngle = -90;
  
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((segment, index) => {
          const percentage = total > 0 ? segment.value / total : 0;
          const strokeDasharray = `${circumference * percentage} ${circumference}`;
          const strokeDashoffset = -segments.slice(0, index).reduce((sum, s) => sum + (total > 0 ? (s.value / total) * circumference : 0), 0);
          
          return (
            <motion.circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="16"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray }}
              transition={{ duration: 1, delay: index * 0.2,  }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span 
          className="text-2xl font-light"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {total}
        </motion.span>
      </div>
    </div>
  );
}

// Funnel chart component
function FunnelChart({ stages }: { stages: { name: string; value: number; color: string }[] }) {
  const max = Math.max(...stages.map(s => s.value), 1);
  
  return (
    <div className="space-y-3">
      {stages.map((stage, index) => (
        <motion.div
          key={stage.name}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="relative"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs uppercase tracking-wider text-neutral-500">{stage.name}</span>
            <span className="text-sm font-medium">{stage.value}</span>
          </div>
          <div className="h-2 bg-neutral-100 overflow-hidden">
            <motion.div
              className="h-full"
              style={{ backgroundColor: stage.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(stage.value / max) * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.1,  }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  
  const { data: analytics, isLoading } = trpc.analytics.calculate.useQuery();
  const { data: summary } = trpc.analytics.dashboardSummary.useQuery();

  // Sample data for visualizations
  const weeklyDeals = [3, 5, 2, 8, 4, 6, 7];
  const monthlyRevenue = [45000, 62000, 38000, 71000, 55000, 89000];
  
  const dealStages = [
    { name: "Lead", value: analytics?.dealsByStage?.lead || 12, color: "#C9A962" },
    { name: "Qualification", value: analytics?.dealsByStage?.qualification || 8, color: "#A68B4B" },
    { name: "Due Diligence", value: analytics?.dealsByStage?.due_diligence || 5, color: "#8B7355" },
    { name: "Negotiation", value: analytics?.dealsByStage?.negotiation || 4, color: "#6B5B47" },
    { name: "Closing", value: analytics?.dealsByStage?.closing || 2, color: "#4A4035" },
  ];

  const sourceBreakdown = [
    { value: 35, color: "#C9A962", label: "Direct" },
    { value: 28, color: "#1a1a1a", label: "Referral" },
    { value: 22, color: "#6B5B47", label: "Network" },
    { value: 15, color: "#d4d4d4", label: "Other" },
  ];

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
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-2">Performance</p>
            <h1 className="text-4xl font-light tracking-tight">Analytics</h1>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-1 p-1 bg-neutral-100">
            {(["7d", "30d", "90d", "1y"] as const).map((range) => (
              <motion.button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                  timeRange === range
                    ? "bg-black text-white"
                    : "text-neutral-500 hover:text-black"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {range}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Key Metrics Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-4 gap-6">
          {/* Total Pipeline */}
          <motion.div 
            className="bg-black text-white p-6 group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between mb-6">
              <DollarSign className="w-5 h-5 text-[#C9A962]" />
              <motion.div 
                className="flex items-center gap-1 text-sky-400 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <ArrowUpRight className="w-3 h-3" />
                <span>+12.5%</span>
              </motion.div>
            </div>
            <motion.p 
              className="text-3xl font-light mb-1"
              variants={numberVariants}
            >
              $<AnimatedNumber value={analytics?.totalPipelineValue || 2450000} />
            </motion.p>
            <p className="text-xs uppercase tracking-wider text-neutral-400">Total Pipeline</p>
          </motion.div>

          {/* Conversion Rate */}
          <motion.div 
            className="border border-neutral-200 p-6 group hover:border-[#C9A962] transition-colors"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between mb-6">
              <Target className="w-5 h-5 text-neutral-400 group-hover:text-[#C9A962] transition-colors" />
              <motion.div 
                className="flex items-center gap-1 text-sky-500 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <ArrowUpRight className="w-3 h-3" />
                <span>+3.2%</span>
              </motion.div>
            </div>
            <motion.p 
              className="text-3xl font-light mb-1"
              variants={numberVariants}
            >
              <AnimatedNumber value={Number(analytics?.conversionRate) || 24} suffix="%" />
            </motion.p>
            <p className="text-xs uppercase tracking-wider text-neutral-400">Conversion Rate</p>
          </motion.div>

          {/* Avg Deal Cycle */}
          <motion.div 
            className="border border-neutral-200 p-6 group hover:border-[#C9A962] transition-colors"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between mb-6">
              <Clock className="w-5 h-5 text-neutral-400 group-hover:text-[#C9A962] transition-colors" />
              <motion.div 
                className="flex items-center gap-1 text-sky-500 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <ArrowDownRight className="w-3 h-3" />
                <span>-5 days</span>
              </motion.div>
            </div>
            <motion.p 
              className="text-3xl font-light mb-1"
              variants={numberVariants}
            >
              <AnimatedNumber value={analytics?.avgDealCycleTime || 42} /> <span className="text-lg text-neutral-400">days</span>
            </motion.p>
            <p className="text-xs uppercase tracking-wider text-neutral-400">Avg Deal Cycle</p>
          </motion.div>

          {/* Active Deals */}
          <motion.div 
            className="border border-neutral-200 p-6 group hover:border-[#C9A962] transition-colors"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between mb-6">
              <Briefcase className="w-5 h-5 text-neutral-400 group-hover:text-[#C9A962] transition-colors" />
              <MiniBarChart data={weeklyDeals} color="#C9A962" />
            </div>
            <motion.p 
              className="text-3xl font-light mb-1"
              variants={numberVariants}
            >
              <AnimatedNumber value={analytics?.activeDeals || 18} />
            </motion.p>
            <p className="text-xs uppercase tracking-wider text-neutral-400">Active Deals</p>
          </motion.div>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Conversion Funnel */}
          <motion.div 
            variants={chartVariants}
            className="col-span-2 border border-neutral-200 p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-1">Pipeline</p>
                <h3 className="text-lg font-light">Conversion Funnel</h3>
              </div>
              <BarChart3 className="w-5 h-5 text-neutral-300" />
            </div>
            <FunnelChart stages={dealStages} />
          </motion.div>

          {/* Deal Sources */}
          <motion.div 
            variants={chartVariants}
            className="border border-neutral-200 p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-1">Sources</p>
                <h3 className="text-lg font-light">Deal Origins</h3>
              </div>
              <PieChart className="w-5 h-5 text-neutral-300" />
            </div>
            <div className="flex items-center justify-center mb-6">
              <DonutChart segments={sourceBreakdown} size={140} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sourceBreakdown.map((source) => (
                <div key={source.label} className="flex items-center gap-2">
                  <div className="w-2 h-2" style={{ backgroundColor: source.color }} />
                  <span className="text-xs text-neutral-500">{source.label}</span>
                  <span className="text-xs font-medium ml-auto">{source.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Top Relationship Sources */}
          <motion.div 
            variants={chartVariants}
            className="border border-neutral-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-1">Network</p>
                <h3 className="text-lg font-light">Top Sources</h3>
              </div>
              <Users className="w-5 h-5 text-neutral-300" />
            </div>
            <div className="space-y-4">
              {[
                { name: "Walton Family Office", deals: 8, value: 12500000 },
                { name: "Koch Industries", deals: 5, value: 8200000 },
                { name: "Mars Family", deals: 4, value: 6100000 },
                { name: "Gates Foundation", deals: 3, value: 4500000 },
              ].map((source, index) => (
                <motion.div
                  key={source.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{source.name}</p>
                    <p className="text-xs text-neutral-400">{source.deals} deals</p>
                  </div>
                  <p className="text-sm text-[#C9A962]">${(source.value / 1000000).toFixed(1)}M</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div 
            variants={chartVariants}
            className="border border-neutral-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-1">Schedule</p>
                <h3 className="text-lg font-light">Upcoming</h3>
              </div>
              <Calendar className="w-5 h-5 text-neutral-300" />
            </div>
            <div className="space-y-3">
              {(summary?.upcomingEvents || []).slice(0, 4).map((event: any, index: number) => (
                <motion.div
                  key={event.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="p-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                >
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    {new Date(event.startTime).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
              {(!summary?.upcomingEvents || summary.upcomingEvents.length === 0) && (
                <p className="text-sm text-neutral-400 text-center py-8">No upcoming events</p>
              )}
            </div>
          </motion.div>

          {/* Pending Reminders */}
          <motion.div 
            variants={chartVariants}
            className="border border-neutral-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-1">Tasks</p>
                <h3 className="text-lg font-light">Follow-ups</h3>
              </div>
              <Zap className="w-5 h-5 text-neutral-300" />
            </div>
            <div className="space-y-3">
              {(summary?.pendingReminders || []).slice(0, 4).map((reminder: any, index: number) => (
                <motion.div
                  key={reminder.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="p-3 border-l-2 border-[#C9A962] bg-neutral-50"
                >
                  <p className="text-sm font-medium truncate">{reminder.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 ${
                      reminder.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                      reminder.priority === 'high' ? 'bg-sky-100 text-sky-600' :
                      'bg-neutral-100 text-neutral-500'
                    }`}>
                      {reminder.priority}
                    </span>
                    <span className="text-xs text-neutral-400">
                      Due {new Date(reminder.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))}
              {(!summary?.pendingReminders || summary.pendingReminders.length === 0) && (
                <p className="text-sm text-neutral-400 text-center py-8">No pending reminders</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Performance Summary */}
        <motion.div 
          variants={chartVariants}
          className="bg-gradient-to-r from-black to-neutral-900 text-white p-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-2">This Period</p>
              <h3 className="text-2xl font-light mb-4">Performance Summary</h3>
              <div className="flex gap-12">
                <div>
                  <p className="text-4xl font-light text-[#C9A962]">
                    <AnimatedNumber value={analytics?.closedDeals || 7} />
                  </p>
                  <p className="text-xs uppercase tracking-wider text-neutral-400 mt-1">Deals Closed</p>
                </div>
                <div>
                  <p className="text-4xl font-light">
                    $<AnimatedNumber value={analytics?.closedValue || 1250000} />
                  </p>
                  <p className="text-xs uppercase tracking-wider text-neutral-400 mt-1">Revenue Generated</p>
                </div>
                <div>
                  <p className="text-4xl font-light">
                    <AnimatedNumber value={analytics?.recentDeals || 12} />
                  </p>
                  <p className="text-xs uppercase tracking-wider text-neutral-400 mt-1">New Opportunities</p>
                </div>
              </div>
            </div>
            <motion.div 
              className="w-32 h-32 border border-[#C9A962]/30 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Activity className="w-12 h-12 text-[#C9A962]" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
  );
}
