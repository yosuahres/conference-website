import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import { getActiveConference } from "@/server/conference/queries";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export async function generateMetadata(): Promise<Metadata> {
  const conference = await getActiveConference();
  return {
    title: {
      default: conference?.name ?? "Conference",
      template: `%s · ${conference?.shortName ?? conference?.name ?? "Conference"}`,
    },
    description: conference?.tagline ?? conference?.description ?? undefined,
    metadataBase: process.env.NEXT_PUBLIC_APP_URL
      ? new URL(process.env.NEXT_PUBLIC_APP_URL)
      : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
