"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { hero, siteConfig } from "@/data/portfolio";
import { useLang } from "@/lib/language";
import { AnimatedHeadline } from "@/components/motion/AnimatedHeadline";
import { EASE } from "@/components/motion/ScrollReveal";
import { Sparkle } from "@/components/ui/Sparkle";

const fade = (delay: number, y = 18) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.75, delay, ease: EASE },
});

export function Hero() {
  const { t } = useLang();

  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true" />

      {/* Decorative orbit (behind the portrait, in front of the background) */}
      <motion.svg
        data-reveal
        className="hero__orbit"
        viewBox="0 0 600 600"
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, delay: 1.0, ease: EASE }}
      >
        <defs>
          <linearGradient id="orbit-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d7d8dc" stopOpacity="0.1" />
            <stop offset="0.5" stopColor="#d7d8dc" stopOpacity="0.5" />
            <stop offset="1" stopColor="#d7d8dc" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <circle cx="300" cy="300" r="298" fill="none" stroke="url(#orbit-stroke)" strokeWidth="1.2" />
      </motion.svg>

      <div className="container hero__layout">
        <div className="hero__top">
          <motion.p className="eyebrow" data-reveal {...fade(0.05, 10)}>
            {t(hero.eyebrow)}
          </motion.p>
          <AnimatedHeadline id="hero-title" lines={hero.lines} className="hero__headline" lineClassName="hero__line" delay={0.2} />
        </div>

        <motion.figure
          data-reveal
          className="hero__portrait"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.0, delay: 0.55, ease: EASE }}
        >
          <Image
            src="/images/profile/hero-cutout.webp"
            alt={t(hero.portraitAlt)}
            width={671}
            height={896}
            priority
            sizes="(max-width: 760px) 90vw, 46vw"
          />
        </motion.figure>

        <motion.span
          data-reveal
          className="hero__sparkle"
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 1.2, ease: EASE }}
        >
          <Sparkle size={26} />
        </motion.span>

        <div className="hero__bottom">
          <motion.p className="hero__desc" data-reveal {...fade(0.95)}>
            {t(hero.description)}
          </motion.p>
          <motion.div className="hero__actions" data-reveal {...fade(1.05)}>
            <a className="btn btn--primary" href="#work">
              <span>{t(hero.primaryCta)}</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            <a className="btn btn--ghost" href={siteConfig.cv} download>
              <span>{t(hero.secondaryCta)}</span>
              <ArrowDown size={14} aria-hidden="true" />
            </a>
          </motion.div>

          <motion.a className="hero__availability" href="#contact" data-reveal {...fade(1.15)}>
            <span className="hero__availability-label">{t(hero.availability.label)}</span>
            <span className="hero__availability-title">{t(hero.availability.title)}</span>
            <span className="hero__availability-link">
              {t(hero.availability.link)} <ArrowUpRight size={12} aria-hidden="true" />
            </span>
          </motion.a>
        </div>
      </div>
    </section>
  );
}
