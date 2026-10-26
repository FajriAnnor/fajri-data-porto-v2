"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { ChartColumn, Building2, FolderKanban, Workflow, type LucideIcon } from "lucide-react";
import { stats, type StatIcon } from "@/data/portfolio";
import { useLang } from "@/lib/language";
import { EASE } from "@/components/motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";

const icons: Record<StatIcon, LucideIcon> = {
  projects: FolderKanban,
  bi: ChartColumn,
  branches: Building2,
  pipeline: Workflow,
};

/** Counts up from 0 once visible. Real values only; the final value is what's server-rendered. */
function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [n, setN] = useState(value);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, { duration: 1.1, ease: EASE, onUpdate: (v) => setN(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return <span ref={ref}>{String(n).padStart(2, "0")}</span>;
}

export function StatsStrip() {
  const { t } = useLang();
  return (
    <section className="stats panel" aria-label="Key facts">
      <StaggerContainer className="stats__grid" stagger={0.1}>
        {stats.map((stat) => {
          const Icon = icons[stat.icon];
          return (
            <StaggerItem key={stat.icon} className="stat" distance={16}>
              <Icon className="stat__icon" size={26} strokeWidth={1.1} aria-hidden="true" />
              <p className="stat__value">
                <CountUp value={stat.value} />
              </p>
              <p className="stat__label">{t(stat.label)}</p>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </section>
  );
}
