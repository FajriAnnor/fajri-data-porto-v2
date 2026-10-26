"use client";

import { ArrowUpRight, Mail } from "lucide-react";
import { contact, contactBanner } from "@/data/portfolio";
import { useLang } from "@/lib/language";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { Sparkle } from "@/components/ui/Sparkle";
import { GithubIcon, LinkedinIcon } from "@/components/ui/icons";

export function ContactBanner() {
  const { lang, t } = useLang();
  const lines = contactBanner.lines[lang];

  return (
    <ScrollReveal id="contact" className="contact" distance={30}>
      <section className="contact__panel" aria-labelledby="contact-title">
        <div className="contact__headline">
          <h2 id="contact-title">
            {lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h2>
          <Sparkle className="contact__sparkle" size={22} />
        </div>

        <div className="contact__invite">
          <p>{t(contactBanner.text)}</p>
          <a className="btn btn--primary" href={`mailto:${contact.email}`}>
            <span>{t(contactBanner.cta)}</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </div>

        <ul className="contact__details">
          <li>
            <Mail size={16} strokeWidth={1.4} aria-hidden="true" />
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </li>
          <li>
            <LinkedinIcon size={15} />
            <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
              {contact.linkedinDisplay}
            </a>
          </li>
          <li>
            <GithubIcon size={15} />
            <a href={contact.github} target="_blank" rel="noopener noreferrer">
              {contact.githubDisplay}
            </a>
          </li>
        </ul>
      </section>
    </ScrollReveal>
  );
}
