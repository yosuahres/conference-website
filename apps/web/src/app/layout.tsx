import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import { event, tracks } from "@/content/site";
import {
  siteDescription,
  siteName,
  siteSocialTitle,
  siteTitle,
  siteUrl,
} from "@/lib/seo";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    // The homepage inherits this; every other page fills the template.
    default: siteTitle,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  category: "science",
  keywords: [
    siteName,
    event.fullName,
    "photonics conference 2026",
    "optics seminar Indonesia",
    "SPIE proceedings",
    "call for papers photonics",
    `conference ${event.city}`,
    ...tracks.map((track) => track.title),
  ],
  authors: [{ name: `${siteName} Organizing Committee`, url: siteUrl }],
  creator: `${siteName} Organizing Committee`,
  publisher: siteName,
  openGraph: {
    type: "website",
    siteName,
    locale: "en_US",
    title: siteSocialTitle,
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: siteSocialTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${interTight.variable} font-sans`}>
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
