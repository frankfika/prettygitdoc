"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Plus, Github, ArrowRight } from "lucide-react";

interface ExampleRepo {
  name: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
  description: string;
}

interface EmptyStateProps {
  type: "articles" | "sidebar" | "repo";
  onAddRepo?: (repo?: ExampleRepo) => void;
}

const exampleRepos = [
  {
    name: "React Docs",
    owner: "facebook",
    repo: "react",
    branch: "main",
    path: "docs",
    description: "React official documentation",
  },
  {
    name: "Vue.js Core",
    owner: "vuejs",
    repo: "core",
    branch: "main",
    path: "packages/compiler-core",
    description: "Vue.js core compiler source",
  },
  {
    name: "TypeScript Handbook",
    owner: "microsoft",
    repo: "TypeScript",
    branch: "main",
    path: "doc",
    description: "TypeScript official docs",
  },
];

export function EmptyState({ type, onAddRepo }: EmptyStateProps) {
  if (type === "articles") {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-white/10 dark:to-white/5 flex items-center justify-center">
          <BookOpen className="w-7 h-7 text-gray-400 dark:text-gray-500" />
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No articles yet
        </h3>
        <p className="text-[15px] text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
          Add a GitHub repository to sync markdown documents for reading.
        </p>

        <div className="flex items-center justify-center mb-12">
          <Link
            href="/settings"
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 text-[15px] font-medium shadow-apple"
          >
            <Plus className="w-4 h-4" />
            Add repository
          </Link>
        </div>

        <div className="max-w-md mx-auto">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wide">
            Popular repositories
          </p>
          <div className="space-y-2">
            {exampleRepos.map((repo) => (
              <button
                key={repo.name}
                onClick={() => onAddRepo?.(repo)}
                className="flex items-center gap-4 w-full p-4 text-left rounded-2xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-gray-800/60 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-apple transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                  <Github className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-[15px] font-medium text-gray-700 dark:text-gray-300 block">
                    {repo.owner}/{repo.repo}
                  </span>
                  <span className="text-[13px] text-gray-400">
                    {repo.path}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === "sidebar") {
    return (
      <div className="text-center py-10 px-4">
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-1 font-medium">
          No repositories
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Add a GitHub repo to get started
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-[13px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
        >
          Go to settings
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  if (type === "repo") {
    return (
      <div className="text-center py-6 px-4">
        <p className="text-[13px] text-gray-400 dark:text-gray-500">
          No files synced. Click sync above.
        </p>
      </div>
    );
  }

  return null;
}
