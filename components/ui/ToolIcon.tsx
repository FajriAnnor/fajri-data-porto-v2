import type { ComponentType } from "react";
import { IoLogoTableau } from "react-icons/io5";
import { PiMicrosoftExcelLogo } from "react-icons/pi";
import { SiGithub, SiGooglesheets, SiJavascript, SiPostgresql, SiPython } from "react-icons/si";
import { VscVscode } from "react-icons/vsc";
import { ChartNoAxesColumnIncreasing, Database } from "lucide-react";
import type { ToolId } from "@/data/portfolio";

type IconComponent = ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;

const icons: Record<ToolId, IconComponent> = {
  excel: PiMicrosoftExcelLogo,
  tableau: IoLogoTableau,
  "power-bi": ChartNoAxesColumnIncreasing,
  "google-sheets": SiGooglesheets,
  postgresql: SiPostgresql,
  sql: Database,
  javascript: SiJavascript,
  vscode: VscVscode,
  github: SiGithub,
  python: SiPython,
};

/** Decorative tool glyph; colour comes from the parent via `currentColor` (see .tool__mark). */
export function ToolIcon({ id, size = 24 }: { id: ToolId; size?: number }) {
  const Icon = icons[id];
  return <Icon size={size} strokeWidth={1.6} aria-hidden />;
}
