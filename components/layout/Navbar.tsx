"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { nav, ui } from "@/data/portfolio";
import { useLang } from "@/lib/language";

export function Navbar() {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}${open ? " is-open" : ""}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="container site-header__bar">
        <Link className="monogram" href="/" aria-label={t(ui.home)} onClick={close}>
          FA
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <ul>
            {nav.map((item) => (
              <li key={item.id}>
                <Link href={`/${item.href}`}>{t(item.label)}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <div className="lang-toggle" role="group" aria-label={t(ui.switchLang)}>
            {(["en", "id"] as const).map((code) => (
              <button
                key={code}
                type="button"
                className={lang === code ? "is-active" : undefined}
                aria-pressed={lang === code}
                onClick={() => setLang(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          <Link className="pill-cta site-header__cta" href="/#contact">
            <span>{t(ui.letsTalk)}</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="menu-button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t(ui.closeMenu) : t(ui.menu)}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <ul>
          {nav.map((item) => (
            <li key={item.id}>
              <Link href={`/${item.href}`} onClick={close}>
                {t(item.label)}
              </Link>
            </li>
          ))}
        </ul>
        <Link className="pill-cta" href="/#contact" onClick={close}>
          <span>{t(ui.letsTalk)}</span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
