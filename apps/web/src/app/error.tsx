"use client";

import { useEffect } from "react";

import { Button } from "@shared/ui/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The error has been logged. Try again, and contact the organising
        committee if it keeps happening.
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          {error.digest}
        </p>
      ) : null}
      <Button onClick={reset} className="mt-8">
        Try again
      </Button>
    </div>
  );
}
