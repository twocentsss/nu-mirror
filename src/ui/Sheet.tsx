"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 safe-bottom"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
          >
            <div className="mx-auto w-full max-w-[520px] px-4">
              <div className="rounded-[28px] bg-white/80 backdrop-blur-[18px] border border-black/5 shadow-[0_20px_60px_rgba(0,0,0,0.12)] overflow-hidden">
                {/* drag handle */}
                <div className="flex justify-center pt-3">
                  <div className="h-1.5 w-12 rounded-full bg-black/10" />
                </div>

                {title && (
                  <div className="px-5 pt-4 pb-2">
                    <div className="text-[16px] font-semibold tracking-[-0.01em]">
                      {title}
                    </div>
                  </div>
                )}

                <div className="px-5 pb-5 pt-2">{children}</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
