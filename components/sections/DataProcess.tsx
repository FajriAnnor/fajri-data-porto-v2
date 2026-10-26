"use client";

import { Database, Eraser, Presentation, Search, Shuffle, type LucideIcon } from "lucide-react";
import { processSteps, processSection, type ProcessIcon } from "@/data/portfolio";
import { useLang } from "@/lib/language";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";

const icons: Record<ProcessIcon, LucideIcon> = {
  collect: Database,
  clean: Eraser,
  transform: Shuffle,
  analyze: Search,
  present: Presentation,
};

export function DataProcess() {
  const { t } = useLang();
  return (
    <section className="process" aria-labelledby="process-title">
      <ScrollReveal distance={18}>
        <h2 id="process-title" className="column-title column-title--plain">
          {t(processSection.title)}
        </h2>
      </ScrollReveal>
      <StaggerContainer className="process__panel panel" stagger={0.12}>
        <ol className="process__list">
          {processSteps.map((step) => {
            const Icon = icons[step.icon];
            return (
              <li key={step.n}>
                <StaggerItem className="step" distance={18}>
                  <p className="step__head">
                    <span className="step__n">{step.n}</span>
                    <span className="step__title">{t(step.title)}</span>
                  </p>
                  <p className="step__text">{t(step.text)}</p>
                  <Icon className="step__icon" size={30} strokeWidth={1.1} aria-hidden="true" />
                </StaggerItem>
              </li>
            );
          })}
        </ol>
      </StaggerContainer>
    </section>
  );
}
