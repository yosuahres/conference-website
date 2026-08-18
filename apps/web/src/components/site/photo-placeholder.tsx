export function PhotoPlaceholder({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl border border-line bg-mist ${className}`}
    >
      <svg
        viewBox="0 0 120 120"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full text-line"
        aria-hidden="true"
      >
        <path
          d="M-40 120 L80 0 M-10 120 L110 0 M20 120 L140 0 M50 120 L170 0"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <p className="relative px-4 text-center text-[0.62rem] font-semibold uppercase tracking-[0.11em] text-faint">
        <span className="sr-only">{label}: </span>
        Photo pending
      </p>
    </div>
  );
}
