import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { event } from "@/content/site";

export const alt = `${event.shortName} ${event.edition} · ${event.fullName}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Site palette, hard-coded because satori cannot read CSS custom properties. */
const PAPER = "#0e0e43";
const INK = "#ffffff";
const ACCENT = "#a9a9f0";

async function readLogo(): Promise<string | null> {
  try {
    const bytes = await readFile(
      join(process.cwd(), "public", "brand", "isphoa-logo.jpg"),
    );
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  } catch {
    // A card without the mark still beats a failed build.
    return null;
  }
}

export default async function OpengraphImage() {
  const logo = await readLogo();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: PAPER,
          backgroundImage: `radial-gradient(circle at 85% 12%, rgba(169,169,240,0.22), rgba(14,14,67,0) 55%)`,
          color: INK,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              width={96}
              height={96}
              style={{ borderRadius: 12 }}
            />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                fontSize: 22,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: ACCENT,
              }}
            >
              6th Biennial Seminar
            </div>
            <div style={{ fontSize: 26, color: "rgba(255,255,255,0.72)" }}>
              {event.fullName}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 132,
              fontWeight: 700,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            {`${event.shortName} ${event.edition}`}
          </div>
          <div style={{ fontSize: 40, color: ACCENT, letterSpacing: -1 }}>
            {event.theme}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            paddingTop: 28,
            borderTop: "2px solid rgba(169,169,240,0.35)",
            fontSize: 26,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          <span>{event.dates}</span>
          <span style={{ color: ACCENT }}>·</span>
          <span>{event.venue}</span>
          <span style={{ color: ACCENT }}>·</span>
          <span>{`${event.city}, ${event.country}`}</span>
        </div>
      </div>
    ),
    size,
  );
}
