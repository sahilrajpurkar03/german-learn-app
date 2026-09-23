"use client";

import { ErrorScreen } from "@/features/shell/error-screen";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen reset={reset} />;
}
