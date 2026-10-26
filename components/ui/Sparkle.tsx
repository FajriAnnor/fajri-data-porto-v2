export function Sparkle({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 0c.55 7 5 11.45 12 12-7 .55-11.45 5-12 12-.55-7-5-11.45-12-12C7 11.45 11.45 7 12 0z" />
    </svg>
  );
}
