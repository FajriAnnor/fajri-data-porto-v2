"use client";

import { ArrowUpRight } from "lucide-react";
import { featuredProjects, siteConfig, workSection } from "@/data/portfolio";
import { useLang } from "@/lib/language";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";

export function FeaturedWork() {
  const { t } = useLang();
  return (
    <section id="work" className="work" aria-labelledby="work-title">
      <ScrollReveal distance={18}>
        <SectionHeading
          id="work-title"
          action={
            <a className="text-link" href={siteConfig.allProjectsUrl} target="_blank" rel="noopener noreferrer">
              {t(workSection.all)} <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          }
        >
          {t(workSection.title)}
        </SectionHeading>
      </ScrollReveal>

      <StaggerContainer className="project-grid" stagger={0.11}>
        {featuredProjects.map((project, i) => (
          <StaggerItem key={project.slug} distance={26} scale={0.985}>
            <ProjectCard project={project} priority={i === 0} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      <p className="work__note">{t(workSection.note)}</p>
    </section>
  );
}
