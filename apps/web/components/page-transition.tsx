"use client";

import type { PropsWithChildren } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type AppState = "upload" | "interview" | "result";

interface PageTransitionProps {
  state: AppState;
}

export function PageTransition({ state, children }: PropsWithChildren<PageTransitionProps>) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
