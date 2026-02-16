"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { useReaderStore } from "@/lib/store";
import { getCachedArticle } from "@/lib/cache";
import { Sidebar, Header, Navigation, ArticleBreadcrumb, TableOfContents, MarkdownSkeleton } from "@/components/reader";
import { MarkdownRenderer, CodeFileRenderer } from "@/components/markdown";
import dynamic from "next/dynamic";
import { convertImagePaths } from "@/lib/github";

const DocumentViewer = dynamic(
  () => import("@/components/markdown/DocumentViewer").then((mod) => mod.DocumentViewer),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div> }
);

export default function ArticlePage() {
  const params = useParams();
  const id = params?.slug as string;
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [isArticleLoading, setIsArticleLoading] = useState(true);

  const {
    currentArticle,
    setCurrentArticle,
    settings,
    updateReadingProgress,
  } = useReaderStore();

  useEffect(() => {
    let isStale = false;
    setIsArticleLoading(true);

    async function loadArticle() {
      const decodedId = decodeURIComponent(id);
      let article = null;

      article = await getCachedArticle(decodedId);
      if (!article && decodedId !== id) {
        article = await getCachedArticle(id);
      }

      if (!article) {
        const { articles: storeArticles, loadArticles } = useReaderStore.getState();

        let searchPool = storeArticles;
        if (searchPool.length === 0) {
          await loadArticles();
          searchPool = useReaderStore.getState().articles;
        }

        article = searchPool.find((a) => a.id === decodedId) ||
                  searchPool.find((a) => a.id === id) ||
                  null;
      }

      if (!isStale) {
        setCurrentArticle(article || null);
        setIsArticleLoading(false);

        if (!article) {
          const allArticles = useReaderStore.getState().articles;
          console.warn('[ArticlePage] Article not found', {
            urlSlug: id,
            decoded: decodedId,
            storeCount: allArticles.length,
            sampleIds: allArticles.slice(0, 3).map((a) => a.id),
          });
        }
      }
    }

    loadArticle();

    return () => {
      isStale = true;
    };
  }, [id, setCurrentArticle]);

  const handleScroll = useCallback(() => {
    if (!contentRef.current || !currentArticle) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!contentRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const scrollable = scrollHeight - clientHeight;
      if (scrollable <= 0) return;
      const progress = Math.min(scrollTop / scrollable, 1);
      updateReadingProgress(id, progress);
    }, 100);
  }, [id, currentArticle, updateReadingProgress]);

  useEffect(() => {
    const content = contentRef.current;
    if (content) {
      content.addEventListener("scroll", handleScroll);
      return () => {
        content.removeEventListener("scroll", handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }
  }, [handleScroll]);

  useEffect(() => {
    if (currentArticle?.readingProgress && contentRef.current) {
      const content = contentRef.current;
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const { scrollHeight, clientHeight } = content;
          content.scrollTop =
            currentArticle.readingProgress! * (scrollHeight - clientHeight);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [currentArticle]);

  const repoConfig = React.useMemo(() => {
    if (!currentArticle) return null;
    return settings.repos.find((r) => r.id === currentArticle.repoId);
  }, [currentArticle, settings.repos]);

  if (isArticleLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50 dark:bg-black">
          <Header />
          <main className="flex-1 p-6 sm:p-8 lg:p-10">
            <div className="max-w-3xl mx-auto">
              <MarkdownSkeleton />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!currentArticle) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50 dark:bg-black">
          <Header />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center px-4">
              <p className="text-gray-900 dark:text-white font-semibold text-xl mb-2">Article not found</p>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 mb-6">This article may not have been synced yet, or has been removed.</p>
              <div className="flex items-center justify-center gap-3">
                <a href="/" className="text-[15px] px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 font-medium shadow-apple">Home</a>
                <a href="/settings" className="text-[15px] px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-white/5 transition-all duration-200 font-medium">Settings</a>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const isCodeFile = currentArticle.fileType === 'code';
  const isBinaryFile = currentArticle.fileType === 'pdf' || currentArticle.fileType === 'document';
  const processedContent = (!isCodeFile && !isBinaryFile && repoConfig)
    ? convertImagePaths(currentArticle.content, repoConfig)
    : currentArticle.content;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-gray-50/50 dark:bg-black">
        <Header />

        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto"
          style={(isCodeFile || isBinaryFile) ? undefined : {
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
          }}
        >
          <div className={`mx-auto px-6 sm:px-8 lg:px-10 py-10 ${(isCodeFile || isBinaryFile) ? 'max-w-7xl' : 'max-w-5xl'}`}>
            {/* Breadcrumb */}
            <div className="mb-8">
              <ArticleBreadcrumb
                repoName={currentArticle.repoName}
                articleTitle={currentArticle.title}
                articlePath={currentArticle.path}
              />
            </div>

            <div className="flex gap-10">
              {/* Main Content */}
              <article className="flex-1 min-w-0">
                {/* Article Header */}
                <header className="mb-10 pb-6 border-b border-gray-200/50 dark:border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
                      {currentArticle.title}
                    </h1>
                    {isCodeFile && currentArticle.language && (
                      <span className="px-2.5 py-1 text-[11px] font-medium uppercase text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 rounded-lg">
                        {currentArticle.language}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-4 text-[13px] text-gray-400 dark:text-gray-500">
                    <span>{currentArticle.path}</span>
                    <span className="text-gray-300 dark:text-gray-700">·</span>
                    <span>{(currentArticle.size / 1024).toFixed(1)} KB</span>
                    {isCodeFile && (
                      <>
                        <span className="text-gray-300 dark:text-gray-700">·</span>
                        <span>{processedContent.split('\n').length} lines</span>
                      </>
                    )}
                    {currentArticle.readingProgress !== undefined &&
                      currentArticle.readingProgress > 0 && (
                        <>
                          <span className="text-gray-300 dark:text-gray-700">·</span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {Math.round(currentArticle.readingProgress * 100)}% read
                          </span>
                        </>
                      )}
                  </div>
                </header>

                {/* Content */}
                {isBinaryFile && currentArticle.rawUrl ? (
                  <DocumentViewer
                    rawUrl={currentArticle.rawUrl}
                    fileName={currentArticle.path.split('/').pop() || ''}
                    fileType={currentArticle.fileType as 'pdf' | 'document'}
                    size={currentArticle.size}
                  />
                ) : isCodeFile ? (
                  <CodeFileRenderer
                    content={processedContent}
                    language={currentArticle.language}
                    fileName={currentArticle.path.split('/').pop()}
                  />
                ) : (
                  <MarkdownRenderer content={processedContent} />
                )}

                <div className="h-20" />
              </article>

              {/* Table of Contents */}
              {!isCodeFile && !isBinaryFile && (
                <aside className="hidden xl:block w-64 flex-shrink-0">
                  <div className="sticky top-24">
                    <TableOfContents contentRef={contentRef} />
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>

        <Navigation currentId={id} contentRef={contentRef} />
      </div>
    </div>
  );
}
