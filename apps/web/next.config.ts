import path from "node:path";

import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Set by scripts/build-static.sh. See the `output` note below.
const isStatic = process.env.STATIC_EXPORT === "1";

// The API lives on its own origin, so it has to be named in connect-src or the
// browser blocks every call the dashboard makes.
//
// headers() is evaluated at BUILD time and baked into routes-manifest.json, so
// this reads the same NEXT_PUBLIC_API_URL that CI inlines into the bundle and
// needs nothing extra in the cPanel runtime environment. The consequence is
// that changing the API origin needs a rebuild, exactly like the other
// NEXT_PUBLIC_* values -- restarting the app will not pick it up.
//
// The https: fallback covers the build running without the variable set, where
// pinning connect-src to localhost would ship a site whose dashboard cannot
// reach its own API. Looser than intended, but a silent outage is worse than a
// CSP that is merely unhelpful.
const apiConnectSrc = (() => {
  const configured = process.env.NEXT_PUBLIC_API_URL;

  if (!configured) return isDev ? "http://localhost:3333" : "https:";

  try {
    return new URL(configured).origin;
  } catch {
    return isDev ? "http://localhost:3333" : "https:";
  }
})();

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is load-bearing, not an oversight: the App Router streams
  // its payload through inline self.__next_f.push(...) scripts. Removing it
  // means per-request nonces from middleware, which forces dynamic rendering
  // on what is otherwise a fully static marketing site. The trade is
  // deliberate -- this app renders no user-supplied HTML, so the XSS surface
  // it protects is small, while the directive still blocks script loads from
  // any third-party origin. 'unsafe-eval' is dev-only, for React Refresh.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // Tailwind and Next both emit inline style attributes.
  "style-src 'self' 'unsafe-inline'",
  // next/font/google self-hosts at build time, so no external font origin.
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${apiConnectSrc}${isDev ? " ws: http://localhost:*" : ""}`,
  // The venue page embeds a Google Maps iframe.
  "frame-src 'self' https://maps.google.com https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  // Blocks a classic CSRF trick: a form on our page POSTing to someone else's.
  "form-action 'self'",
  // The modern X-Frame-Options; keeps the site out of a phishing iframe.
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Belt and braces for browsers predating frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  // Stops a .pdf upload being sniffed and executed as HTML.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Only meaningful over TLS; setting it in dev would pin localhost to https
  // in the developer's browser for two years.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
];

const nextConfig: NextConfig = {
  // Two shapes, because the host decides which one is possible.
  //
  // standalone: a self-contained Node server with only the modules the app
  // actually imports. The whole app, dashboard and admin included. Needs a
  // plan that can run Node.
  //
  // export: plain HTML, CSS and JS that any Apache can serve, which is all a
  // DomaiNesia Nimbus One plan offers. The public pages prerender to static
  // HTML either way, so nothing about them changes; what it costs is every
  // route that needs a server at request time. scripts/build-static.sh removes
  // those before building, and next.config's headers() has no effect here, so
  // ops/htaccess carries the same security headers for Apache to set.
  ...(isStatic
    ? { output: "export" as const, images: { unoptimized: true } }
    : { output: "standalone" as const }),
  // pnpm workspace: without this Next traces from apps/web and misses the
  // hoisted node_modules at the repo root, producing a standalone build that
  // crashes on first require.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@shared/ui"],
  serverExternalPackages: ["postgres"],
  // Version and framework fingerprints are free reconnaissance.
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  // A static export has no server to set these, and Next errors if headers()
  // is declared alongside output:"export". ops/htaccess is the counterpart
  // that hands the same list to Apache; change one and change the other.
  ...(isStatic
    ? {}
    : {
        async headers() {
          return [{ source: "/:path*", headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
