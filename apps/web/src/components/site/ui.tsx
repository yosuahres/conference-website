import Link from "next/link";

import { Icon, type IconName } from "./icon";

export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-6 md:px-10 ${className}`}>
      {children}
    </div>
  );
}

export function Section({
  id,
  tint = false,
  surface = "light",
  className = "",
  children,
}: {
  id?: string;
  tint?: boolean;
  surface?: "dark" | "light";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 border-t border-line py-20 md:py-28 xl:scroll-mt-36 ${
        surface === "light" ? "surface-light" : ""
      } ${tint ? "bg-mist" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  titleLead,
  titleTail,
  intro,
  className = "",
}: {
  eyebrow: string;
  titleLead: string;
  titleTail?: string;
  intro?: string | null;
  className?: string;
}) {
  return (
    <header className={`max-w-3xl ${className}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-5 text-balance font-display text-[clamp(2rem,4.6vw,3.25rem)] font-semibold leading-[1.04] tracking-[-0.03em]">
        {titleLead}
        {titleTail ? (
          <>
            {" "}
            <span className="text-beam">{titleTail}</span>
          </>
        ) : null}
      </h2>
      {intro ? (
        <p className="mt-6 max-w-2xl text-[0.975rem] leading-[1.75] text-subtle">
          {intro}
        </p>
      ) : null}
    </header>
  );
}

type ButtonVariant = "solid" | "outline" | "ghost";

const variantClass: Record<ButtonVariant, string> = {
  solid:
    "bg-ink text-paper border-ink hover:bg-navy hover:border-navy disabled:hover:bg-ink",
  outline: "bg-paper text-ink border-line hover:border-ink",
  ghost: "bg-transparent text-ink border-transparent hover:bg-shell",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-[0.85rem] font-medium transition-colors";

function isInternal(href: string) {
  return (
    href.startsWith("/") &&
    !href.startsWith("//") &&
    !/\.[a-z0-9]{2,5}$/i.test(href)
  );
}

export function LinkButton({
  href,
  variant = "solid",
  icon,
  className = "",
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  icon?: IconName;
  className?: string;
  children: React.ReactNode;
}) {
  const content = (
    <>
      {children}
      {icon ? <Icon name={icon} className="size-[15px]" /> : null}
    </>
  );
  const classes = `${base} ${variantClass[variant]} ${className}`;

  return isInternal(href) ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <a href={href} className={classes}>
      {content}
    </a>
  );
}

export function StubButton({
  variant = "outline",
  icon,
  className = "",
  children,
}: {
  variant?: ButtonVariant;
  icon?: IconName;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Coming soon. This destination has not been published yet"
      className={`${base} ${variantClass[variant]} cursor-not-allowed opacity-55 ${className}`}
    >
      {children}
      {icon ? <Icon name={icon} className="size-[15px]" /> : null}
      <span className="rounded-full bg-shell px-1.5 py-px text-[0.6rem] font-semibold uppercase tracking-wider text-subtle">
        Soon
      </span>
    </button>
  );
}

export function StubLink({ children }: { children: React.ReactNode }) {
  return (
    <span
      title="Coming soon. This destination has not been published yet"
      className="inline-flex cursor-not-allowed items-center gap-1.5 text-subtle/60"
    >
      {children}
      <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-faint">
        Soon
      </span>
    </span>
  );
}

export function PageHeader({
  eyebrow,
  titleLead,
  titleTail,
  intro,
  children,
}: {
  eyebrow: string;
  titleLead: string;
  titleTail?: string;
  intro?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <header className="surface-light border-b border-line bg-mist">
      <Container className="py-16 md:py-20">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 max-w-3xl text-balance font-display text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.035em]">
          {titleLead}
          {titleTail ? (
            <>
              {" "}
              <span className="text-beam">{titleTail}</span>
            </>
          ) : null}
        </h1>
        {intro ? (
          <p className="mt-6 max-w-2xl text-[0.975rem] leading-[1.75] text-subtle">
            {intro}
          </p>
        ) : null}
        {children}
      </Container>
    </header>
  );
}
