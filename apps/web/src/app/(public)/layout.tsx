import { SiteCopyright } from "@/components/site-copyright";
import { SiteHeader } from "@/components/site-header";

export const revalidate = 3600;

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="site-ground flex min-h-screen flex-col font-sans">
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteCopyright />
    </div>
  );
}
