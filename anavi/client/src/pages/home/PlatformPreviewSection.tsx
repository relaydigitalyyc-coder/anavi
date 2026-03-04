import { motion } from "framer-motion";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { GradientText } from "@/components/PremiumAnimations";

function DashboardMockup() {
  return (
    <div className="w-full h-full bg-[#F3F7FC] rounded-2xl overflow-hidden flex">
      {/* Sidebar */}
      <div className="w-[180px] bg-white border-r border-[#D1DCF0]/60 p-4 hidden md:flex flex-col shrink-0">
        <div className="flex items-center gap-1.5 mb-6">
          <span className="text-sm font-semibold text-[#0A1628]">@</span>
          <span className="text-sm font-serif italic text-[#0A1628]">navi</span>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 -mt-2" />
        </div>
        {[
          { label: "Dashboard", active: true },
          { label: "Relationships", active: false },
          { label: "Matching", active: false },
          { label: "Deal Rooms", active: false },
          { label: "Verification", active: false },
          { label: "Analytics", active: false },
          { label: "Compliance", active: false },
        ].map(item => (
          <div
            key={item.label}
            className={`px-3 py-2 rounded-lg text-xs mb-0.5 ${
              item.active
                ? "bg-[#0A1628] text-white font-medium"
                : "text-[#1E3A5F]/60 hover:bg-[#F3F7FC]"
            }`}
          >
            {item.label}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-5 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#1E3A5F]/40">
              Welcome back
            </p>
            <p className="text-sm font-semibold text-[#0A1628]">
              Originator Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#C4972A]/10 flex items-center justify-center">
              <span className="text-[8px] font-bold text-[#C4972A]">JH</span>
            </div>
          </div>
        </div>

        {/* Trust Score + Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-3 md:mb-4">
          {/* Trust Score */}
          <div className="bg-white rounded-xl p-3 border border-[#D1DCF0]/50 col-span-1">
            <p className="text-[8px] uppercase tracking-wider text-[#1E3A5F]/40 mb-1">
              Trust Score
            </p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-serif text-[#0A1628]">84</span>
              <span className="text-[8px] text-[#059669] mb-1">+3</span>
            </div>
            {/* Mini ring */}
            <svg width="40" height="40" viewBox="0 0 40 40" className="mt-1">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="#D1DCF0"
                strokeWidth="3"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="#C4972A"
                strokeWidth="3"
                strokeDasharray={`${84 * 1.005} 100.5`}
                strokeLinecap="round"
                transform="rotate(-90 20 20)"
              />
            </svg>
          </div>

          {/* Stats */}
          {[
            {
              label: "Relationships",
              value: "847",
              sub: "+12 this month",
              color: "#2563EB",
            },
            {
              label: "Blind Matches",
              value: "23",
              sub: "5 pending",
              color: "#9B7CF8",
            },
            {
              label: "Attribution",
              value: "$1.2M",
              sub: "Lifetime value",
              color: "#C4972A",
            },
          ].map(s => (
            <div
              key={s.label}
              className="bg-white rounded-xl p-3 border border-[#D1DCF0]/50"
            >
              <p className="text-[8px] uppercase tracking-wider text-[#1E3A5F]/40 mb-1">
                {s.label}
              </p>
              <p className="text-lg font-semibold text-[#0A1628]">{s.value}</p>
              <p className="text-[8px] mt-0.5" style={{ color: s.color }}>
                {s.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Deal Flow + Activity */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3">
          {/* Deal Flow Chart */}
          <div className="md:col-span-3 bg-white rounded-xl p-3 border border-[#D1DCF0]/50">
            <p className="text-[8px] uppercase tracking-wider text-[#1E3A5F]/40 mb-2">
              Deal Flow
            </p>
            <svg
              width="100%"
              height="80"
              viewBox="0 0 300 80"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,60 Q30,55 60,48 T120,35 T180,25 T240,18 T300,12 L300,80 L0,80 Z"
                fill="url(#chart-fill)"
              />
              <path
                d="M0,60 Q30,55 60,48 T120,35 T180,25 T240,18 T300,12"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2"
              />
              {[
                [0, 60],
                [60, 48],
                [120, 35],
                [180, 25],
                [240, 18],
                [300, 12],
              ].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill="#2563EB" />
              ))}
            </svg>
          </div>

          {/* Recent Activity */}
          <div className="md:col-span-2 bg-white rounded-xl p-3 border border-[#D1DCF0]/50">
            <p className="text-[8px] uppercase tracking-wider text-[#1E3A5F]/40 mb-2">
              Activity
            </p>
            <div className="space-y-2">
              {[
                { label: "Blind match found", time: "2m", dot: "#9B7CF8" },
                { label: "Deal room opened", time: "1h", dot: "#059669" },
                { label: "KYB verified", time: "3h", dot: "#22D4F5" },
                { label: "Attribution credited", time: "1d", dot: "#C4972A" },
              ].map(a => (
                <div key={a.label} className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: a.dot }}
                  />
                  <span className="text-[9px] text-[#0A1628]/70 flex-1 truncate">
                    {a.label}
                  </span>
                  <span className="text-[8px] text-[#1E3A5F]/30 shrink-0">
                    {a.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PlatformPreviewSection() {
  return (
    <section className="bg-canvas-deep relative overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <p className="text-xs uppercase tracking-[0.3em] text-[#22D4F5] mb-4 md:mb-6">
              Platform Preview
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif text-white leading-[0.95]">
              Built for the
              <br />
              <GradientText>$13 Trillion Private Market</GradientText>
            </h2>
          </>
        }
      >
        <motion.div
          className="w-full h-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <DashboardMockup />
        </motion.div>
      </ContainerScroll>
    </section>
  );
}
