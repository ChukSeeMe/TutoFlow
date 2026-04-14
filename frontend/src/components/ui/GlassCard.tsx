"use client";

import React from "react";
import { motion, type MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GlowVariant = "none" | "brand" | "rose" | "emerald" | "amber";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: GlowVariant;
  /** Subtle gradient overlay in the top-left corner */
  gradient?: boolean;
  /** Renders as a Framer Motion div with hover scale */
  interactive?: boolean;
  onClick?: () => void;
}

const glowMap: Record<GlowVariant, string> = {
  none:    "",
  brand:   "dark:shadow-glow",
  rose:    "dark:shadow-glow-rose",
  emerald: "dark:shadow-glow-emerald",
  amber:   "dark:shadow-[0_0_24px_-4px_rgba(245,158,11,0.4)]",
};

const gradientMap: Record<GlowVariant, string> = {
  none:    "",
  brand:   "before:bg-gradient-to-br before:from-brand-500/10 before:to-brand-400/5",
  rose:    "before:bg-gradient-to-br before:from-rose-500/10 before:to-rose-600/5",
  emerald: "before:bg-gradient-to-br before:from-emerald-500/10 before:to-emerald-600/5",
  amber:   "before:bg-gradient-to-br before:from-amber-500/10 before:to-amber-600/5",
};

export function GlassCard({
  children,
  className,
  glow = "none",
  gradient = false,
  interactive = false,
  onClick,
}: GlassCardProps) {
  const base = cn(
    // Structure
    "relative overflow-hidden rounded-2xl",
    // card-surface handles bg in both modes (exempt from global .dark .bg-white override)
    "card-surface border border-gray-200/80 shadow-glass-light",
    // Dark mode — borders + shadow (bg handled by .card-surface in globals.css)
    "dark:border-white/[0.07] dark:shadow-glass-dark",
    // Inner highlight (subtle top edge)
    "dark:shadow-inner-dark",
    // Optional glow
    glowMap[glow],
    // Optional gradient overlay
    gradient && glow !== "none" && [
      "before:absolute before:inset-0 before:pointer-events-none",
      "dark:before:opacity-100 before:opacity-0",
      "before:rounded-2xl",
      gradientMap[glow],
    ],
    // Interactive states
    interactive && [
      "cursor-pointer",
      "transition-all duration-200",
      "hover:border-gray-300/80 dark:hover:border-white/[0.12]",
      "hover:shadow-glass-light dark:hover:shadow-glass-dark",
    ],
    className
  );

  if (interactive) {
    return (
      <motion.div
        className={base}
        onClick={onClick}
        whileHover={{ scale: 1.01, y: -2 }}
        whileTap={{ scale: 0.995 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={base}>{children}</div>;
}

/** Motion-wrapped card with animation variants for stagger parents */
const MotionGlassCardInner = React.forwardRef(function MotionGlassCardInner(
  { children, className, glow = "none", gradient = false, interactive = false, onClick, ...rest }: GlassCardProps & MotionProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <GlassCard
      className={className}
      glow={glow}
      gradient={gradient}
      interactive={interactive}
      onClick={onClick}
    >
      {children}
    </GlassCard>
  );
});
MotionGlassCardInner.displayName = "MotionGlassCardInner";
export const MotionGlassCard = motion.create(MotionGlassCardInner);
