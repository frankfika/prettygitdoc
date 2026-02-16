"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Download,
  Loader2,
  FileText,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface DocumentViewerProps {
  rawUrl: string;
  fileName: string;
  fileType: "pdf" | "document";
  size: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDocLabel(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "pdf":
      return "PDF 文档";
    case "docx":
    case "doc":
      return "Word 文档";
    case "pptx":
    case "ppt":
      return "PowerPoint 演示文稿";
    case "xlsx":
    case "xls":
      return "Excel 表格";
    default:
      return "文档";
  }
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

// PDF Viewer: react-pdf with page-by-page rendering, zoom, and navigation
function PdfViewer({
  rawUrl,
  size,
}: Omit<DocumentViewerProps, "fileType">) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [fitWidth, setFitWidth] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Measure container width for fit-width mode
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(el);
    setContainerWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Track which page is most visible via IntersectionObserver
  useEffect(() => {
    if (numPages === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let visiblePage = currentPage;
        for (const entry of entries) {
          const pageNum = Number(
            (entry.target as HTMLElement).dataset.pageNumber
          );
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            visiblePage = pageNum;
          }
        }
        if (maxRatio > 0) {
          setCurrentPage(visiblePage);
        }
      },
      {
        root: scrollRef.current,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    pageRefs.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [numPages]); // eslint-disable-line react-hooks/exhaustive-deps

  function onDocumentLoadSuccess({ numPages: n }: { numPages: number }) {
    setNumPages(n);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    setError(err.message || "PDF 加载失败");
    setLoading(false);
  }

  function goToPage(page: number) {
    const clamped = Math.max(1, Math.min(page, numPages));
    setCurrentPage(clamped);
    const el = pageRefs.current.get(clamped);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function zoomIn() {
    const next = ZOOM_STEPS.find((s) => s > scale);
    if (next) {
      setScale(next);
      setFitWidth(false);
    }
  }

  function zoomOut() {
    const prev = [...ZOOM_STEPS].reverse().find((s) => s < scale);
    if (prev) {
      setScale(prev);
      setFitWidth(false);
    }
  }

  function toggleFitWidth() {
    setFitWidth(!fitWidth);
    if (!fitWidth) setScale(1);
  }

  // Calculate the width to pass to react-pdf Page
  const pageWidth = fitWidth ? containerWidth - 2 : undefined; // -2 for border

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      )
        return;

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }); // intentionally no deps — uses latest scale

  // Register page ref for intersection observer
  const setPageRef = useCallback(
    (pageNum: number, el: HTMLDivElement | null) => {
      if (el) {
        pageRefs.current.set(pageNum, el);
        observerRef.current?.observe(el);
      } else {
        const prev = pageRefs.current.get(pageNum);
        if (prev) observerRef.current?.unobserve(prev);
        pageRefs.current.delete(pageNum);
      }
    },
    []
  );

  return (
    <div ref={containerRef} className="space-y-0">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-800/80 backdrop-blur-xl rounded-t-2xl border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          {/* Page navigation */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
            title="上一页"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-[13px]">
            <input
              type="number"
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              className="w-12 text-center bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg px-1 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min={1}
              max={numPages}
            />
            <span className="text-gray-500 dark:text-gray-400">
              / {numPages || "—"}
            </span>
          </div>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
            title="下一页"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button
            onClick={zoomOut}
            disabled={scale <= ZOOM_STEPS[0]}
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
            title="缩小 (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-gray-600 dark:text-gray-400 w-12 text-center tabular-nums">
            {fitWidth ? "适宽" : `${Math.round(scale * 100)}%`}
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
            title="放大 (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFitWidth}
            className={`p-2 rounded-xl transition-colors ${
              fitWidth
                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                : "hover:bg-gray-200 dark:hover:bg-white/10"
            }`}
            title="适应宽度"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <span className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

          {/* Download */}
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            title={`下载 PDF (${formatFileSize(size)})`}
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* PDF Pages - continuous scroll */}
      <div
        ref={scrollRef}
        className="overflow-auto bg-gray-300 dark:bg-gray-700 border-x border-b border-gray-200/50 dark:border-gray-700/50 rounded-b-2xl"
        style={{ maxHeight: "calc(100vh - 320px)", minHeight: "500px" }}
      >
        <Document
          file={rawUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p>正在加载 PDF...</p>
              <p className="text-sm mt-1">{formatFileSize(size)}</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <AlertCircle className="w-10 h-10 mb-3 text-orange-500" />
              <p className="font-semibold text-gray-900 dark:text-white">
                PDF 加载失败
              </p>
              <p className="text-sm mt-1">{error}</p>
              <a
                href={rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-[13px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                下载 PDF
              </a>
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              ref={(el) => setPageRef(pageNum, el)}
              data-page-number={pageNum}
              className="flex justify-center py-2 first:pt-4 last:pb-4"
            >
              <div className="shadow-lg">
                <Page
                  pageNumber={pageNum}
                  width={fitWidth ? pageWidth : undefined}
                  scale={fitWidth ? undefined : scale}
                  loading={
                    <div
                      className="flex items-center justify-center bg-white"
                      style={{
                        width: pageWidth || 600,
                        height: (pageWidth || 600) * 1.414,
                      }}
                    >
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  }
                />
              </div>
            </div>
          ))}
        </Document>
      </div>

      {/* Loading overlay when no pages yet */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p>正在加载 PDF...</p>
          <p className="text-sm mt-1">{formatFileSize(size)}</p>
        </div>
      )}
    </div>
  );
}

// Word Viewer: fetch .docx → mammoth.js convert to HTML → render
function WordViewer({
  rawUrl,
  fileName,
  size,
}: Omit<DocumentViewerProps, "fileType">) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocx = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(rawUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();

      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setHtml(result.value);

      if (result.messages.length > 0) {
        console.warn("mammoth warnings:", result.messages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [rawUrl]);

  useEffect(() => {
    loadDocx();
  }, [loadDocx]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p>正在加载 Word 文档...</p>
        <p className="text-sm mt-1">{formatFileSize(size)}</p>
      </div>
    );
  }

  if (error || html === null) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
        <AlertCircle className="w-10 h-10 mb-3 text-orange-500" />
        <p className="font-semibold text-gray-900 dark:text-white">
          文档加载失败
        </p>
        <p className="text-sm mt-1">{error}</p>
        <div className="flex gap-3 mt-4">
          <button
            onClick={loadDocx}
            className="px-4 py-2 text-[13px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Download className="w-4 h-4" />
            下载文档
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="markdown-body bg-white dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6 sm:p-8 lg:p-10"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="flex items-center justify-center">
        <a
          href={rawUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
        >
          <Download className="w-4 h-4" />
          下载{getDocLabel(fileName)} ({formatFileSize(size)})
        </a>
      </div>
    </div>
  );
}

// Fallback for unsupported binary types (PPT, Excel, etc.)
function BinaryFallback({
  rawUrl,
  fileName,
  size,
}: Omit<DocumentViewerProps, "fileType">) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-4">
        <FileText className="w-8 h-8 text-orange-500" />
      </div>
      <p className="font-semibold text-gray-900 dark:text-white mb-1">
        {getDocLabel(fileName)}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {fileName} · {formatFileSize(size)}
      </p>
      <a
        href={rawUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
      >
        <Download className="w-4 h-4" />
        下载文件
      </a>
    </div>
  );
}

export function DocumentViewer({
  rawUrl,
  fileName,
  fileType,
  size,
}: DocumentViewerProps) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (fileType === "pdf") {
    return <PdfViewer rawUrl={rawUrl} fileName={fileName} size={size} />;
  }

  if (ext === "docx") {
    return <WordViewer rawUrl={rawUrl} fileName={fileName} size={size} />;
  }

  // PPT, Excel, old .doc — no good client-side renderer, show download
  return <BinaryFallback rawUrl={rawUrl} fileName={fileName} size={size} />;
}
