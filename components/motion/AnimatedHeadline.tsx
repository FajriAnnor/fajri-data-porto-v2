"use client";

import { motion } from "motion/react";
import { EASE } from "./ScrollReveal";

type Props = {
  lines: readonly string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  as?: "h1" | "h2";
  id?: string;
};

/** Line-by-line headline: each line slides up out of a clipping mask. No per-letter effects. */
export function AnimatedHeadline({ lines, className, lineClassName, delay = 0, as = "h1", id }: Props) {
  const Tag = as === "h1" ? motion.h1 : motion.h2;
  return (
    <Tag id={id} className={className} aria-label={lines.join(" ")}>
      {lines.map((line, i) => (
        <span key={line} className="headline-mask" aria-hidden="true">
          <motion.span
            data-reveal
            className={lineClassName}
            style={{ display: "block" }}
            initial={{ y: "105%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.85, delay: delay + i * 0.12, ease: EASE }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
