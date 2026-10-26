"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ui, type FeaturedProject } from "@/data/portfolio";
import { useLang } from "@/lib/language";

export function ProjectCard({ project, priority = false }: { project: FeaturedProject; priority?: boolean }) {
  const { t } = useLang();
  const category = t(project.category).split(" / ");

  return (
    <article className="project-card">
      <Image
        className="project-card__image"
        src={project.image}
        alt={t(project.imageAlt)}
        fill
        priority={priority}
        sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw"
        style={{ objectPosition: project.imagePosition }}
      />
      <div className="project-card__shade" aria-hidden="true" />

      <ul className="project-card__links">
        {project.extraLinks.map((link) => (
          <li key={link.href}>
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              {t(link.label)} <ArrowUpRight size={11} aria-hidden="true" />
              <span className="sr-only"> {t(ui.opens)}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="project-card__body">
        <h3 className="project-card__title">
          <Link className="project-card__main" href={project.caseStudyUrl}>
            {project.title.map((line) => (
              <span key={line}>{line}</span>
            ))}
            <span className="sr-only">
              {" "}
              — {t(ui.caseStudy)}
            </span>
          </Link>
        </h3>
        <p className="project-card__category">
          {category.map((part) => (
            <span key={part}>{part}</span>
          ))}
        </p>
      </div>

      <span className="project-card__arrow" aria-hidden="true">
        <ArrowUpRight size={20} strokeWidth={1.4} />
      </span>
    </article>
  );
}
