"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, FileText, FileCode2, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useReaderStore } from "@/lib/store";
import { Article } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  article: Article;
  matches: {
    title: boolean;
    content: boolean;
    excerpt?: string;
  };
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;

  const splitRegex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  const parts = text.split(splitRegex);

  return parts.map((part, index) => {
    const testRegex = new RegExp(`^${escapeRegExp(query)}$`, "i");
    return testRegex.test(part) ? (
      <mark
        key={index}
        className="bg-blue-500/20 dark:bg-blue-400/20 text-gray-900 dark:text-white rounded px-0.5 font-medium"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    );
  });
}

function escapeRegExp(string: string): string {
  return string.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function getContentExcerpt(
  content: string,
  query: string,
  maxLength: number = 100
): string {
  if (!query.trim()) return content.slice(0, maxLength) + "...";

  const index = content.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return content.slice(0, maxLength) + "...";

  const start = Math.max(0, index - 40);
  const end = Math.min(content.length, index + query.length + 40);

  let excerpt = content.slice(start, end);
  if (start > 0) excerpt = "..." + excerpt;
  if (end < content.length) excerpt = excerpt + "...";

  return excerpt;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const { articles } = useReaderStore();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const results: SearchResult[] = useMemo(() => {
    if (!query.trim()) {
      return [...articles]
        .sort((a, b) => {
          const aRead = a.readingProgress && a.readingProgress > 0 ? 1 : 0;
          const bRead = b.readingProgress && b.readingProgress > 0 ? 1 : 0;
          if (aRead !== bRead) return bRead - aRead;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        })
        .slice(0, 10)
        .map((article) => ({
          article,
          matches: { title: false, content: false },
        }));
    }

    const lowerQuery = query.toLowerCase();
    const scored = articles.map((article) => {
      const titleMatch = article.title.toLowerCase().includes(lowerQuery);
      const contentMatch = article.content.toLowerCase().includes(lowerQuery);

      let score = 0;
      if (titleMatch) score += 10;
      if (contentMatch) score += 5;
      if (article.title.toLowerCase() === lowerQuery) score += 20;

      return {
        article,
        matches: {
          title: titleMatch,
          content: contentMatch,
          excerpt: contentMatch
            ? getContentExcerpt(article.content, query)
            : undefined,
        },
        score,
      };
    });

    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ article, matches }) => ({ article, matches }));
  }, [articles, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (results.length > 0) {
            setSelectedIndex((prev) => (prev + 1) % results.length);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (results.length > 0) {
            setSelectedIndex((prev) =>
              prev === 0 ? results.length - 1 : prev - 1
            );
          }
          break;
        case "Enter":
          e.preventDefault();
          const selected = results[selectedIndex];
          if (selected) {
            router.push(`/article/${selected.article.id}`);
            onClose();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, router, onClose]);

  useEffect(() => {
    const selectedElement = resultsRef.current?.children[
      selectedIndex
    ] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  const hasResults = results.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      showCloseButton={false}
      closeOnOverlayClick
    >
      <div className="flex flex-col">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200/50 dark:border-gray-800/50">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-[17px]"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="px-2 py-1 text-[12px] text-gray-400 bg-gray-100 dark:bg-white/5 rounded-lg font-mono">
              ESC
            </kbd>
          )}
        </div>

        {/* Results */}
        <div
          ref={resultsRef}
          className="max-h-[60vh] overflow-y-auto py-2"
        >
          {!hasResults ? (
            <div className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
              {query.trim() ? (
                <p className="text-[15px]">No results for &quot;{query}&quot;</p>
              ) : (
                <p className="text-[15px]">Type to search</p>
              )}
            </div>
          ) : (
            <>
              {!query.trim() && (
                <div className="px-5 py-2 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                  Recent
                </div>
              )}

              {results.map(({ article, matches }, index) => (
                <Link
                  key={article.id}
                  href={`/article/${article.id}`}
                  onClick={onClose}
                  className={`
                    block px-5 py-3 mx-2 rounded-xl transition-all duration-200
                    ${
                      index === selectedIndex
                        ? "bg-blue-500/10 dark:bg-blue-400/10"
                        : "hover:bg-gray-100 dark:hover:bg-white/5"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    {article.fileType === 'code' ? (
                      <FileCode2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-400" />
                    ) : (
                      <FileText className="w-5 h-5 flex-shrink-0 mt-0.5 text-gray-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[15px] truncate ${
                          index === selectedIndex
                            ? "text-gray-900 dark:text-white font-medium"
                            : "text-gray-700 dark:text-gray-300"
                        }`}>
                          {matches.title && query.trim()
                            ? highlightMatch(article.title, query)
                            : article.title}
                        </span>
                        {article.language && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 rounded">
                            {article.language}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[13px] text-gray-400 dark:text-gray-500">
                        <span className="truncate">{decodeURIComponent(article.path)}</span>
                      </div>

                      {matches.excerpt && (
                        <p className="mt-1.5 text-[13px] text-gray-500 dark:text-gray-400 line-clamp-2">
                          {highlightMatch(matches.excerpt, query)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200/50 dark:border-gray-800/50 text-[12px] text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/5 rounded-lg font-mono text-[11px]">
                ↑↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/5 rounded-lg font-mono text-[11px]">
                ↵
              </kbd>
              open
            </span>
          </div>
          <div>
            {results.length > 0 && query.trim() && (
              <span>{results.length} results</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function useSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}
