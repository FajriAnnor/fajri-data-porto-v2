import type { Metadata, Viewport } from "next";
import { Anton, Cormorant_Garamond, Inter } from "next/font/google";
import { Providers } from "@/lib/language";
import "./globals.css";
import "./case-study.css";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-display", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fajri — Data Analyst Portfolio",
  description:
    "Data analyst portfolio: operational reporting, interactive dashboards, and business intelligence built with Excel, Tableau, SQL, and JavaScript.",
};

export const viewport: Viewport = {
  themeColor: "#1c1d26",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable} ${cormorant.variable}`}>
      <body>
        {/* Without JavaScript the entrance animations never run — keep all content visible. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
