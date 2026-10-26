"use client";

import { Mail } from "lucide-react";
import { contact, siteConfig, ui } from "@/data/portfolio";
import { useLang } from "@/lib/language";
import { GithubIcon, LinkedinIcon } from "@/components/ui/icons";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>
          © {siteConfig.year} {siteConfig.name}. {t(ui.rights)}
        </p>
        <div className="site-footer__connect">
          <span>{t(ui.connect)}</span>
          <ul>
            <li>
              <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn ${t(ui.opens)}`}>
                <LinkedinIcon size={15} />
              </a>
            </li>
            <li>
              <a href={contact.github} target="_blank" rel="noopener noreferrer" aria-label={`GitHub ${t(ui.opens)}`}>
                <GithubIcon size={15} />
              </a>
            </li>
            <li>
              <a href={`mailto:${contact.email}`} aria-label={`Email ${contact.email}`}>
                <Mail size={15} aria-hidden="true" />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
