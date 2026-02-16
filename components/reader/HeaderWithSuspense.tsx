"use client";

import { Suspense } from "react";
import { Header } from "./Header";

export function HeaderWithSuspense() {
  return (
    <Suspense fallback={<div className="h-16 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50" />}>
      <Header />
    </Suspense>
  );
}
