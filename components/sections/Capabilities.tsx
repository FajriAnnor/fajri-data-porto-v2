"use client";

import type { CSSProperties } from "react";
import {
  ChartLine,
  ClipboardList,
  Database,
  Eraser,
  LayoutDashboard,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { about, capabilities, learning, tools, toolsSection, type CapabilityIcon } from "@/data/portfolio";
import { useLang } from "@/lib/language";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { ToolIcon } from "@/components/ui/ToolIcon";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";

const icons: Record<CapabilityIcon, LucideIcon> = {
  analysis: ChartLine,
  cleaning: Eraser,
  bi: LayoutDashboard,
  sql: Database,
  automation: RefreshCw,
  reporting: ClipboardList,
};

export function Capabilities() {
  const { lang, t } = useLang();
  return (
    <>
      <section id="capabilities" className="split" aria-label="Capabilities and tools">
        <div className="split__col">
          <ScrollReveal distance={18}>
            <h2 className="column-title">{lang === "en" ? "CORE CAPABILITIES" : "KEAHLIAN UTAMA"}</h2>
          </ScrollReveal>
          <StaggerContainer className="cap-grid" stagger={0.07}>
            {capabilities.map((cap) => {
              const Icon = icons[cap.icon];
              return (
                <StaggerItem key={cap.icon} className="cap" distance={16}>
                  <Icon className="cap__icon" size={34} strokeWidth={1} aria-hidden="true" />
                  <div>
                    <h3 className="cap__title">{t(cap.title)}</h3>
                    <p className="cap__text">{t(cap.text)}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>

        <div className="split__col split__col--tools">
          <ScrollReveal distance={18}>
            <h2 className="column-title column-title--plain">{t(toolsSection.title)}</h2>
          </ScrollReveal>
          <StaggerContainer className="tools panel panel--soft" stagger={0.05}>
            {tools.map((tool) => (
              <StaggerItem key={tool.id} className="tool" distance={12} style={{ "--tint": tool.tint } as CSSProperties}>
                <span className="tool__mark" aria-hidden="true">
                  <ToolIcon id={tool.id} size={24} />
                </span>
                <span className="tool__name">{tool.name}</span>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <ScrollReveal className="learning panel panel--soft" distance={16} delay={0.1}>
            <div className="learning__head">
              <h3>{t(toolsSection.learningTitle)}</h3>
              <span>{t(toolsSection.learningBadge)}</span>
            </div>
            <ul>
              {learning.map((item) => (
                <li key={item.icon} className="learning__item" style={{ "--tint": item.tint } as CSSProperties}>
                  <span className="tool__mark tool__mark--sm" aria-hidden="true">
                    <ToolIcon id={item.icon} size={17} />
                  </span>
                  <span>
                    <strong>{t(item.title)}</strong>
                    <small>{t(item.meta)}</small>
                  </span>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      <ScrollReveal id="about" className="about panel panel--soft" distance={20}>
        <h2 className="about__label">{t(about.title)}</h2>
        <p>{t(about.body)}</p>
      </ScrollReveal>
    </>
  );
}
