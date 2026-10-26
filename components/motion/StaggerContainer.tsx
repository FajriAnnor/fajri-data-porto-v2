"use client";

import { motion, type HTMLMotionProps, type Variants } from "motion/react";
import { EASE } from "./ScrollReveal";

type ContainerProps = HTMLMotionProps<"div"> & { stagger?: number; delay?: number };

const itemVariants = (distance: number, scale: number): Variants => ({
  hidden: { opacity: 0, y: distance, scale },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.65, ease: EASE } },
});

/** Reveals its <StaggerItem> children one after another when scrolled into view. */
export function StaggerContainer({ stagger = 0.1, delay = 0, children, ...rest }: ContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

type ItemProps = HTMLMotionProps<"div"> & { distance?: number; scale?: number };

export function StaggerItem({ distance = 24, scale = 1, children, ...rest }: ItemProps) {
  return (
    <motion.div data-reveal variants={itemVariants(distance, scale)} {...rest}>
      {children}
    </motion.div>
  );
}
