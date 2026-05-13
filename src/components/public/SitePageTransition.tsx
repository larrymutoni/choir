"use client";

import { motion } from "framer-motion";

export function SitePageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-1/2 z-[9999] h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d8bf7a]"
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: [0, 1.2, 40], opacity: [1, 0.95, 0] }}
        transition={{
          duration: 0.75,
          ease: [0.22, 1, 0.36, 1],
          times: [0, 0.3, 1],
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{
          duration: 0.5,
          delay: 0.16,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    </>
  );
}
