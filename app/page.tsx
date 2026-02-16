"use client";

import { useEffect } from "react";
import { useReaderStore } from "@/lib/store";
import { Sidebar, HeaderWithSuspense, ArticleList } from "@/components/reader";

export default function Home() {
  const loadArticles = useReaderStore((state) => state.loadArticles);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50 dark:bg-black">
        <HeaderWithSuspense />

        <main className="flex-1 p-6 sm:p-8 lg:p-10">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
                Files
              </h1>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-1.5">
                Documents synced from GitHub repositories
              </p>
            </div>

            <ArticleList />
          </div>
        </main>
      </div>
    </div>
  );
}
