"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useReaderStore } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  List,
  X,
  FileText,
  FileCode2,
  File,
  Share2,
} from "lucide-react";
import { useToastStore } from "@/lib/toastStore";

interface NavigationProps {
  currentId: string;
  contentRef?: React.RefObject<HTMLDivElement | null>;
}

function getFileIcon(fileType?: string) {
  switch (fileType) {
    case "code":
      return <FileCode2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />;
    case "pdf":
    case "document":
      return <File className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />;
    default:
      return <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />;
  }
}

export function Navigation({ currentId, contentRef }: NavigationProps) {
  const router = useRouter();
  const { articles, getAdjacentArticles } = useReaderStore();
  const { addToast } = useToastStore();
  const { prev, next } = getAdjacentArticles(currentId);
  const [chapterListOpen, setChapterListOpen] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const chapterRef = useRef<HTMLDivElement>(null);

  const currentArticle = articles.find((a) => a.id === currentId);
  const repoArticles = articles
    .filter((a) => a.repoId === currentArticle?.repoId)
    .sort((a, b) => a.path.localeCompare(b.path));
  const currentIndex = repoArticles.findIndex((a) => a.id === currentId);

  useEffect(() => {
    const el = contentRef?.current;
    if (!el) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const scrollable = scrollHeight - clientHeight;
      if (scrollable <= 0) {
        setReadingProgress(1);
        return;
      }
      setReadingProgress(Math.min(scrollTop / scrollable, 1));
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [contentRef]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === "ArrowLeft" && prev) {
        const el = e.target as HTMLElement;
        if (el.closest("pre") || el.closest(".code-file-renderer")) return;
        e.preventDefault();
        router.push(`/article/${prev.id}`);
      } else if (e.key === "ArrowRight" && next) {
        const el = e.target as HTMLElement;
        if (el.closest("pre") || el.closest(".code-file-renderer")) return;
        e.preventDefault();
        router.push(`/article/${next.id}`);
      } else if (e.key === "Escape" && chapterListOpen) {
        setChapterListOpen(false);
      }
    },
    [prev, next, router, chapterListOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!chapterListOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (chapterRef.current && !chapterRef.current.contains(e.target as Node)) {
        setChapterListOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [chapterListOpen]);

  useEffect(() => {
    if (chapterListOpen && chapterRef.current) {
      const activeEl = chapterRef.current.querySelector("[data-active='true']");
      if (activeEl) {
        activeEl.scrollIntoView({ block: "center", behavior: "instant" });
      }
    }
  }, [chapterListOpen]);

  const share = useCallback(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = currentArticle?.title || "Pretty GitDoc";
    if (navigator.share) {
      navigator
        .share({ title, url })
        .catch(() => {});
    } else if (navigator.clipboard && url) {
      navigator.clipboard.writeText(url).then(() => {
        addToast({
          type: "success",
          title: "链接已复制",
          message: "发送给对方即可在线查看",
        });
      });
    }
  }, [currentArticle, addToast]);

  return (
    <>
      {/* Reading progress bar */}
      <div className="fixed top-14 left-0 right-0 z-40 h-px bg-transparent">
        <div
          className="h-full bg-gray-300 dark:bg-gray-600 transition-[width] duration-150 ease-out"
          style={{ width: `${readingProgress * 100}%` }}
        />
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:left-72">
        <div className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm border-t border-gray-100 dark:border-gray-800/50">
          <div className="max-w-7xl mx-auto flex items-center h-11 px-4">
            {prev ? (
              <Link
                href={`/article/${prev.id}`}
                className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors min-w-0 flex-shrink"
              >
                <ChevronLeft className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate max-w-[140px] hidden sm:inline">{prev.title}</span>
                <span className="sm:hidden">Prev</span>
              </Link>
            ) : (
              <div className="flex-shrink" />
            )}

            <div className="flex-1 flex items-center justify-center gap-3 min-w-0 px-2">
              <div className="relative" ref={chapterRef}>
                <button
                  onClick={() => setChapterListOpen(!chapterListOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>
                    {Math.max(currentIndex + 1, 1)}/{repoArticles.length}
                  </span>
                </button>

                {chapterListOpen && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 max-h-[60vh] bg-white dark:bg-gray-950 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-[13px] font-medium text-gray-900 dark:text-white">
                        {currentArticle?.repoName || "Files"}
                      </span>
                      <button
                        onClick={() => setChapterListOpen(false)}
                        className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                    <div className="overflow-y-auto overscroll-contain">
                      {repoArticles.map((article, idx) => {
                        const isActive = article.id === currentId;
                        return (
                          <Link
                            key={article.id}
                            href={`/article/${article.id}`}
                            data-active={isActive}
                            onClick={() => setChapterListOpen(false)}
                            className={`flex items-center gap-2 px-3 py-2 text-[13px] transition-colors ${
                              isActive
                                ? "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            }`}
                          >
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 w-4 text-right flex-shrink-0 tabular-nums">
                              {idx + 1}
                            </span>
                            {getFileIcon(article.fileType)}
                            <span className="truncate">{article.title}</span>
                            {article.readingProgress !== undefined &&
                              article.readingProgress > 0 &&
                              article.readingProgress < 1 && (
                                <span className="ml-auto text-[11px] text-gray-400 flex-shrink-0 tabular-nums">
                                  {Math.round(article.readingProgress * 100)}%
                                </span>
                              )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
                {Math.round(readingProgress * 100)}%
              </span>
              <button
                onClick={share}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title="分享"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              <button
                onClick={share}
                className="sm:hidden inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {next ? (
              <Link
                href={`/article/${next.id}`}
                className="flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors min-w-0 flex-shrink"
              >
                <span className="truncate max-w-[140px] hidden sm:inline">{next.title}</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              </Link>
            ) : (
              <div className="flex-shrink" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
