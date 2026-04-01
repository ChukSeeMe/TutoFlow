"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-8 w-8 rounded-lg skeleton" />;

  const isDark = theme === "dark";

  function toggle() {
    const html = document.documentElement;
    html.classList.add("transitioning");
    setTheme(isDark ? "light" : "dark");
    setTimeout(() => html.classList.remove("transitioning"), 220);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn(
        "relative h-8 w-8 rounded-lg flex items-center justify-center",
        "text-gray-500 dark:text-zinc-400",
        "hover:bg-gray-100 dark:hover:bg-white/[0.06]",
        "border border-gray-200/80 dark:border-white/[0.07]",
        "transition-colors duration-150",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
            transition={{ duration: 0.18 }}
          >
            <Moon className="h-3.5 w-3.5" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: 30, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -30, scale: 0.8 }}
            transition={{ duration: 0.18 }}
          >
            <Sun className="h-3.5 w-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
