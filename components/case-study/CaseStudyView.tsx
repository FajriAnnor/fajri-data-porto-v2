"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChartColumn,
  Database,
  Eraser,
  FileSpreadsheet,
  FileText,
  Layers,
  LayoutDashboard,
  Server,
  ShieldCheck,
  X,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";
import { caseStudies, type Block, type CaseStudy, type Figure, type WorkflowIcon } from "@/data/caseStudies";
import { ui } from "@/data/portfolio";
import { useLang } from "@/lib/language";
import { ScrollReveal, EASE } from "@/components/motion/ScrollReveal";
import { StaggerContainer, StaggerItem } from "@/components/motion/StaggerContainer";
import { motion } from "motion/react";

const copy = {
  back: { en: "BACK TO PROJECTS", id: "KEMBALI KE PROYEK" },
  next: { en: "NEXT PROJECT", id: "PROYEK BERIKUTNYA" },
  enlarge: { en: "Enlarge screenshot", id: "Perbesar tangkapan layar" },
  close: { en: "Close preview", id: "Tutup pratinjau" },
};

const workflowIcons: Record<WorkflowIcon, LucideIcon> = {
  collect: Database,
  prepare: Eraser,
  storage: Server,
  chart: ChartColumn,
  dashboard: LayoutDashboard,
  file: FileText,
  validate: ShieldCheck,
  aggregate: Layers,
  spreadsheet: FileSpreadsheet,
};

type Open = (figure: Figure, trigger: HTMLButtonElement) => void;

function FigureView({ figure, onOpen, priority = false }: { figure: Figure; onOpen: Open; priority?: boolean }) {
  const { t } = useLang();
  return (
    <figure className="cs-figure">
      <button
        type="button"
        className="cs-figure__button"
        onClick={(e) => onOpen(figure, e.currentTarget)}
        aria-label={`${t(copy.enlarge)}: ${t(figure.caption)}`}
      >
        <Image
          src={figure.src}
          alt={t(figure.alt)}
          width={figure.width}
          height={figure.height}
          priority={priority}
          sizes="(max-width: 900px) 100vw, 1100px"
        />
        <span className="cs-figure__zoom" aria-hidden="true">
          <ZoomIn size={14} />
        </span>
      </button>
      <figcaption>{t(figure.caption)}</figcaption>
    </figure>
  );
}

function Blocks({ blocks, onOpen }: { blocks: Block[]; onOpen: Open }) {
  const { t } = useLang();
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "figure":
            return (
              <ScrollReveal key={i} className={block.narrow ? "cs-block cs-block--narrow" : "cs-block"} distance={22}>
                <FigureView figure={block.figure} onOpen={onOpen} />
              </ScrollReveal>
            );
          case "figures":
            return (
              <ScrollReveal key={i} className="cs-block cs-pair" distance={22}>
                {block.figures.map((f) => (
                  <FigureView key={f.src} figure={f} onOpen={onOpen} />
                ))}
              </ScrollReveal>
            );
          case "split":
            return (
              <ScrollReveal key={i} className={`cs-block cs-split${block.side === "left" ? " cs-split--rev" : ""}`} distance={22}>
                <FigureView figure={block.figure} onOpen={onOpen} />
                <div className="cs-split__side">
                  <Blocks blocks={block.blocks} onOpen={onOpen} />
                </div>
              </ScrollReveal>
            );
          case "metrics":
            return (
              <ScrollReveal key={i} className={`cs-block cs-metrics${block.cols ? ` cs-metrics--${block.cols}` : ""}`} distance={18}>
                {block.items.map((m) => (
                  <div className="cs-metric panel panel--soft" key={m.label.en}>
                    <span>{t(m.label)}</span>
                    <strong>{t(m.value)}</strong>
                    {m.note && <p>{t(m.note)}</p>}
                  </div>
                ))}
              </ScrollReveal>
            );
          case "workflow":
            return (
              <StaggerContainer key={i} className="cs-block cs-workflow process__panel panel" stagger={0.1}>
                <ol className="process__list">
                  {block.items.map((step, n) => {
                    const Icon = workflowIcons[step.icon];
                    return (
                      <li key={step.title.en}>
                        <StaggerItem className="step" distance={16}>
                          <p className="step__head">
                            <span className="step__n">{String(n + 1).padStart(2, "0")}</span>
                            <span className="step__title">{t(step.title)}</span>
                          </p>
                          {step.text && <p className="step__text">{t(step.text)}</p>}
                          <Icon className="step__icon" size={30} strokeWidth={1.1} aria-hidden="true" />
                        </StaggerItem>
                      </li>
                    );
                  })}
                </ol>
              </StaggerContainer>
            );
          case "rank":
            return (
              <ScrollReveal key={i} className="cs-block" distance={16}>
                <ol className="cs-rank panel panel--soft">
                  {block.items.map((r, n) => (
                    <li key={r.label}>
                      <span>{String(n + 1).padStart(2, "0")}</span>
                      <strong>{r.label}</strong>
                      <b>{r.value}</b>
                    </li>
                  ))}
                </ol>
              </ScrollReveal>
            );
          case "cards":
            return (
              <ScrollReveal key={i} className={`cs-block cs-cards cs-cards--${block.cols ?? 2}`} distance={18}>
                {block.items.map((c, n) => (
                  <article className="cs-card panel panel--soft" key={c.title.en}>
                    <p className="cs-card__head">
                      <span>{String(n + 1).padStart(2, "0")}</span>
                      {c.tag && <code>{c.tag}</code>}
                    </p>
                    <h3>{t(c.title)}</h3>
                    {c.text && <p>{t(c.text)}</p>}
                    {c.figure && <FigureView figure={c.figure} onOpen={onOpen} />}
                  </article>
                ))}
              </ScrollReveal>
            );
          case "steps":
            return (
              <ScrollReveal key={i} className="cs-block" distance={16}>
                <ol className="cs-steps">
                  {block.items.map((s, n) => (
                    <li key={s.en}>
                      <span>{String(n + 1).padStart(2, "0")}</span>
                      {t(s)}
                    </li>
                  ))}
                </ol>
              </ScrollReveal>
            );
          case "chips":
            return (
              <ScrollReveal key={i} className="cs-block" distance={14}>
                <ul className="cs-chips">
                  {block.items.map((c) => (
                    <li key={c.en}>{t(c)}</li>
                  ))}
                </ul>
              </ScrollReveal>
            );
          case "list":
            return (
              <ScrollReveal key={i} className="cs-block" distance={16}>
                <ul className="cs-list">
                  {block.items.map((item) => (
                    <li key={item.en}>
                      <Check size={15} aria-hidden="true" />
                      {t(item)}
                    </li>
                  ))}
                </ul>
              </ScrollReveal>
            );
          case "callout":
            return (
              <ScrollReveal key={i} className="cs-block" distance={16}>
                <p className="cs-callout panel panel--soft">
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>{t(block.text)}</span>
                </p>
              </ScrollReveal>
            );
          case "code":
            return (
              <ScrollReveal key={i} className="cs-block" distance={16}>
                <div className="cs-code panel panel--soft">
                  <p>{block.label}</p>
                  <pre>
                    <code>{block.text}</code>
                  </pre>
                </div>
              </ScrollReveal>
            );
          case "link":
            return (
              <ScrollReveal key={i} className="cs-block" distance={12}>
                <a className="text-link cs-link" href={block.href} target="_blank" rel="noopener noreferrer">
                  {t(block.label)} <ArrowUpRight size={14} aria-hidden="true" />
                  <span className="sr-only"> {t(ui.opens)}</span>
                </a>
              </ScrollReveal>
            );
        }
      })}
    </>
  );
}

export function CaseStudyView({ study }: { study: CaseStudy }) {
  const { t } = useLang();
  const next = caseStudies.find((c) => c.slug === study.next);
  const [lightbox, setLightbox] = useState<Figure | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const open: Open = (figure, trigger) => {
    triggerRef.current = trigger;
    setLightbox(figure);
  };
  const close = useCallback(() => {
    setLightbox(null);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [lightbox, close]);

  return (
    <article className="cs">
      <header className="cs-hero container">
        <Link className="text-link cs-back" href="/#work">
          <ArrowLeft size={14} aria-hidden="true" /> {t(copy.back)}
        </Link>

        <motion.p
          data-reveal
          className="eyebrow cs-eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {t(study.eyebrow)}
        </motion.p>
        <motion.h1
          data-reveal
          className="cs-title"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
        >
          {t(study.title)}
        </motion.h1>
        <motion.div
          data-reveal
          className="cs-hero__lead"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.2, ease: EASE }}
        >
          <p>{t(study.intro)}</p>
          <ul className="cs-chips">
            {study.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
          <a className="btn btn--primary" href={study.cta.href} target="_blank" rel="noopener noreferrer">
            <span>{t(study.cta.label)}</span>
            <ArrowUpRight size={14} aria-hidden="true" />
            <span className="sr-only"> {t(ui.opens)}</span>
          </a>
        </motion.div>

        <ScrollReveal className="cs-hero__fig" distance={26}>
          <FigureView figure={study.heroFigure} onOpen={open} priority />
        </ScrollReveal>

        <dl className="cs-meta panel">
          {study.meta.map((m) => (
            <div key={m.label.en}>
              <dt>{t(m.label)}</dt>
              <dd>{t(m.value)}</dd>
            </div>
          ))}
        </dl>

        <p className="cs-notice panel panel--soft">
          <CheckCircle2 size={18} aria-hidden="true" />
          <span>{t(study.notice)}</span>
        </p>
      </header>

      <div className="cs-body container">
        {study.sections.map((section, i) => (
          <section className="cs-section" key={section.title.en} aria-labelledby={`cs-s${i}`}>
            <ScrollReveal className="cs-section__head" distance={22}>
              <span className="cs-section__n">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h2 id={`cs-s${i}`}>{t(section.title)}</h2>
                {section.body?.map((p) => (
                  <p key={p.en}>{t(p)}</p>
                ))}
              </div>
            </ScrollReveal>
            <div className="cs-section__content">
              <Blocks blocks={section.blocks} onOpen={open} />
            </div>
          </section>
        ))}

        <ScrollReveal className="cs-final panel" distance={24}>
          <p className="eyebrow">{t(study.final.eyebrow)}</p>
          <h2>{t(study.final.title)}</h2>
          <div className="cs-final__actions">
            <a className="btn btn--primary" href={study.cta.href} target="_blank" rel="noopener noreferrer">
              <span>{t(study.final.cta ?? study.cta.label)}</span>
              <ArrowUpRight size={14} aria-hidden="true" />
              <span className="sr-only"> {t(ui.opens)}</span>
            </a>
            <Link className="btn btn--ghost" href="/#work">
              <ArrowLeft size={14} aria-hidden="true" />
              <span>{t(copy.back)}</span>
            </Link>
            {next && (
              <Link className="btn btn--ghost" href={`/projects/${next.slug}`}>
                <span>
                  {t(copy.next)}: {next.title.en}
                </span>
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            )}
          </div>
        </ScrollReveal>
      </div>

      {lightbox && (
        <div
          className="cs-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t(lightbox.caption)}
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <div className="cs-lightbox__panel">
            <div className="cs-lightbox__bar">
              <span>{t(lightbox.caption)}</span>
              <button ref={closeRef} type="button" onClick={close} aria-label={t(copy.close)}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="cs-lightbox__img">
              <Image src={lightbox.src} alt={t(lightbox.alt)} width={lightbox.width} height={lightbox.height} sizes="96vw" />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
