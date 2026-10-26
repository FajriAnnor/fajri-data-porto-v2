import type { ReactNode } from "react";

type Props = {
  id?: string;
  children: ReactNode;
  action?: ReactNode;
  level?: "h2" | "h3";
};

/** Compact uppercase section label with an optional right-aligned action. */
export function SectionHeading({ id, children, action, level = "h2" }: Props) {
  const Tag = level;
  return (
    <div className="section-heading">
      <Tag id={id} className="section-heading__title">
        {children}
      </Tag>
      {action}
    </div>
  );
}
