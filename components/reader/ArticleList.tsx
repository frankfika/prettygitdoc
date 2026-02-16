"use client";

import React from "react";
import { useReaderStore } from "@/lib/store";
import Link from "next/link";
import { FileText, FileCode2, ChevronRight } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { ArticleListSkeleton } from "./Skeleton";
import { RepoConfig } from "@/types";

export function ArticleList() {
  const { articles, isLoading, repoArticleTrees, addRepo, syncArticles } = useReaderStore();

  const sortedArticles = React.useMemo(() => {
    return [...articles].sort((a, b) => {
      if (a.repoId !== b.repoId) {
        return a.repoName.localeCompare(b.repoName);
      }
      return a.path.localeCompare(b.path);
    });
  }, [articles]);

  const articlesByRepo = React.useMemo(() => {
    const grouped = new Map<string, typeof sortedArticles>();
    for (const article of sortedArticles) {
      const repoArticles = grouped.get(article.repoId) || [];
      repoArticles.push(article);
      grouped.set(article.repoId, repoArticles);
    }
    return grouped;
  }, [sortedArticles]);

  const handleAddExampleRepo = async (repoData?: { name: string; owner: string; repo: string; branch: string; path: string }) => {
    if (!repoData) return;

    const newRepo: RepoConfig = {
      id: `repo-${Date.now()}`,
      name: repoData.name,
      owner: repoData.owner,
      repo: repoData.repo,
      branch: repoData.branch,
      path: repoData.path,
    };

    addRepo(newRepo);
    await syncArticles(newRepo);
  };

  if (isLoading) {
    return <ArticleListSkeleton />;
  }

  if (sortedArticles.length === 0) {
    return (
      <EmptyState
        type="articles"
        onAddRepo={handleAddExampleRepo}
      />
    );
  }

  return (
    <div className="space-y-10">
      {repoArticleTrees.map((repoTree) => {
        const repoArticles = articlesByRepo.get(repoTree.repoId) || [];
        if (repoArticles.length === 0) return null;

        return (
          <div key={repoTree.repoId}>
            <div className="flex items-center gap-3 mb-4 px-1">
              <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {repoTree.repoName}
              </h2>
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                {repoArticles.length}
              </span>
            </div>

            <div className="grid gap-2">
              {repoArticles.map((article) => {
                const isCode = article.fileType === 'code';
                const FileIcon = isCode ? FileCode2 : FileText;

                return (
                <Link
                  key={article.id}
                  href={`/article/${article.id}`}
                  className="group flex items-center gap-4 p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-apple transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                    <FileIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors truncate">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-[13px] text-gray-500 dark:text-gray-500">
                      <span className="truncate">{decodeURIComponent(article.path)}</span>
                      <span className="text-gray-300 dark:text-gray-700">·</span>
                      <span className="flex-shrink-0">{(article.size / 1024).toFixed(1)} KB</span>
                      {article.readingProgress !== undefined && article.readingProgress > 0 && (
                        <>
                          <span className="text-gray-300 dark:text-gray-700">·</span>
                          <span className="text-blue-600 dark:text-blue-400">{Math.round(article.readingProgress * 100)}% read</span>
                        </>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors flex-shrink-0" />
                </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
