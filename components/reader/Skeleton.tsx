"use client";

import React from "react";

export function ArticleSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  );
}

export function ArticleListSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-24 animate-pulse" />
        </div>
        <div className="border border-gray-100 dark:border-gray-800/50 rounded-lg divide-y divide-gray-100 dark:divide-gray-800/50">
          <ArticleSkeleton />
          <ArticleSkeleton />
          <ArticleSkeleton />
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-20 animate-pulse" />
        </div>
        <div className="border border-gray-100 dark:border-gray-800/50 rounded-lg divide-y divide-gray-100 dark:divide-gray-800/50">
          <ArticleSkeleton />
          <ArticleSkeleton />
        </div>
      </div>
    </div>
  );
}

export function TreeNodeSkeleton({ depth = 0 }: { depth?: number }) {
  return (
    <div
      className="flex items-center gap-2 py-1.5 px-3"
      style={{ paddingLeft: `${depth * 12 + 12}px` }}
    >
      <div className="w-3.5 h-3.5 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-24 animate-pulse" />
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-3 py-2">
      <div>
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-20 animate-pulse" />
        </div>
        <div className="space-y-0.5">
          <TreeNodeSkeleton depth={0} />
          <TreeNodeSkeleton depth={1} />
          <TreeNodeSkeleton depth={1} />
          <TreeNodeSkeleton depth={0} />
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-16 animate-pulse" />
        </div>
        <div className="space-y-0.5">
          <TreeNodeSkeleton depth={0} />
          <TreeNodeSkeleton depth={0} />
        </div>
      </div>
    </div>
  );
}

export function MarkdownSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
      <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />

      <div className="space-y-2.5 pt-4">
        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-full" />
        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-full" />
        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
      </div>

      <div className="space-y-2.5 pt-4">
        <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-full" />
        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-full" />
        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-4/5" />
      </div>

      <div className="space-y-2.5 pt-4">
        <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-full" />
        <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
      </div>
    </div>
  );
}
