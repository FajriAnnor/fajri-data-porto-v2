"use client";

import { motion, type HTMLMotionProps } from "motion/react";

export const EASE = [0.22, 1, 0.36, 1] as const;

type Props = HTMLMotionProps<"div"> & {
  delay?: number;
  distance?: number;
};

/** Fade + rise into place the first time the element enters the viewport. */
export function ScrollReveal({ delay = 0, distance = 28, children, ...rest }: Props) {
  return (
    <motion.div
      data-reveal
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
