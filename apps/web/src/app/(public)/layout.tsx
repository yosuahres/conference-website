import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

/**
 * Public pages read their content from the database so the committee can edit
 * it in the admin. Rendering them dynamically keeps those edits live and means
 * a build no longer needs database access. Swap to `revalidate` + explicit
 * `revalidatePath` calls if traffic ever justifies the cache.
 */
export const dynamic = "force-dynamic";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
