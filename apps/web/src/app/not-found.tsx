import Link from "next/link";

import { Button } from "@shared/ui/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you were looking for does not exist, or is not published yet.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Back to the conference</Link>
      </Button>
    </div>
  );
}
