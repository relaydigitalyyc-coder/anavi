import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

interface AuthDialogProps {
  title?: string;
  logo?: string;
  open?: boolean;
  onLogin: () => void;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export function AuthDialog({
  title = "Welcome to @navi",
  logo,
  open = false,
  onLogin,
  onOpenChange,
  onClose,
}: AuthDialogProps) {
  const [internalOpen, setInternalOpen] = useState(open);

  useEffect(() => {
    if (!onOpenChange) {
      setInternalOpen(open);
    }
  }, [open, onOpenChange]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(nextOpen);
    } else {
      setInternalOpen(nextOpen);
    }

    if (!nextOpen) {
      onClose?.();
    }
  };

  return (
    <Dialog
      open={onOpenChange ? open : internalOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="py-5 bg-[#2D3748] rounded-[20px] w-[400px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.3)] border border-sky-500/20 backdrop-blur-2xl p-0 gap-0 text-center overflow-hidden">
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: "radial-gradient(circle at 50% 0%, oklch(0.72 0.14 220), transparent 70%)"
          }}
          animate={{
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="flex flex-col items-center gap-4 p-6 pt-12 relative z-10">
          {/* Logo with glow effect */}
          <motion.div 
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {logo ? (
              <div className="w-16 h-16 bg-[#1a202c] rounded-xl border border-sky-500/30 flex items-center justify-center shadow-lg shadow-sky-500/10">
                <img
                  src={logo}
                  alt="Logo"
                  className="w-10 h-10 rounded-md"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-[#1a202c] rounded-xl border border-sky-500/30 flex items-center justify-center shadow-lg shadow-sky-500/10">
                <span className="text-2xl font-light text-white">@</span>
                <span className="text-2xl font-medium text-white">navi</span>
              </div>
            )}
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-sky-400 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <DialogTitle className="text-xl font-semibold text-white leading-[26px] tracking-[-0.44px]">
              {title}
            </DialogTitle>
          </motion.div>
          
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <DialogDescription className="text-sm text-gray-400 leading-5 tracking-[-0.154px]">
              Access the private market operating system
            </DialogDescription>
          </motion.div>
        </div>

        <DialogFooter className="px-6 py-6 relative z-10">
          <motion.div
            className="w-full"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Button
              onClick={onLogin}
              className="w-full h-12 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-medium leading-5 tracking-[-0.154px] transition-all duration-300 shadow-lg shadow-sky-500/30 hover:shadow-sky-400/40 group"
            >
              <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
              Enter @navi
            </Button>
          </motion.div>
          
          <motion.p
            className="text-xs text-gray-500 mt-3 w-full text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            Exclusive access for verified members
          </motion.p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Keep backward compatibility
export { AuthDialog as ManusDialog };
