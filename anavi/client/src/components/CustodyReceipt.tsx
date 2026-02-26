// client/src/components/CustodyReceipt.tsx
// Full-screen custody receipt moment — triggers after first relationship is submitted in onboarding.

import { motion } from "framer-motion";
import { Shield, Clock } from "lucide-react";
import { CUSTODY_RECEIPT } from "@/lib/copy";

interface CustodyReceiptProps {
  relationshipName: string;
  timestamp: string;
  hash: string;
  trustDelta: number;
  onContinue: () => void;
}

export function CustodyReceipt({
  relationshipName,
  timestamp,
  hash,
  trustDelta,
  onContinue,
}: CustodyReceiptProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#060A12] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: "oklch(0.65 0.19 230 / 0.08)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-lg w-full mx-4">
        <motion.div
          className="glass-dark rounded-2xl p-10 border border-sky-500/30 text-center"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
        >
          {/* Pulsing shield icon */}
          <motion.div
            className="w-20 h-20 rounded-full border border-sky-500/40 bg-sky-500/10 flex items-center justify-center mx-auto mb-8"
            animate={{
              boxShadow: [
                "0 0 20px oklch(0.65 0.19 230 / 0.15)",
                "0 0 50px oklch(0.65 0.19 230 / 0.3)",
                "0 0 20px oklch(0.65 0.19 230 / 0.15)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="w-10 h-10 text-sky-500" />
          </motion.div>

          <motion.h2
            className="text-3xl font-serif text-white mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {CUSTODY_RECEIPT.title}
          </motion.h2>

          <motion.p
            className="text-sm text-white/60 mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {CUSTODY_RECEIPT.body}
          </motion.p>

          {/* Receipt details */}
          <motion.div
            className="bg-white/5 rounded-lg p-5 mb-8 text-left space-y-3 border border-white/10 font-mono text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex justify-between">
              <span className="text-white/40 uppercase tracking-wider">Relationship</span>
              <span className="text-white">{relationshipName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Timestamp
              </span>
              <span className="text-[#22D4F5]">{timestamp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 uppercase tracking-wider">Custody Hash</span>
              <span className="text-white/70">{hash}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 uppercase tracking-wider">Trust Delta</span>
              <span className="text-[#059669]">+{trustDelta} pts</span>
            </div>
          </motion.div>

          <motion.button
            onClick={onContinue}
            className="w-full py-4 bg-[#C4972A] text-[#060A12] font-semibold text-sm uppercase tracking-widest cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
          >
            {CUSTODY_RECEIPT.cta}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
