"use client";

import React, { useEffect, useState } from "react";
import { List, X } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export function TableOfContents({ contentRef }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const extractHeadings = () => {
      const headings = content.querySelectorAll("h2, h3, h4");
      const tocItems: TocItem[] = [];
      const usedIds = new Set<string>();

      headings.forEach((heading) => {
        let id = heading.id;

        if (!id) {
          const text = heading.textContent || "";
          let baseId = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");

          if (!baseId || baseId === "-") {
            baseId = "heading";
          }

          id = baseId;
          let counter = 1;
          while (usedIds.has(id)) {
            id = `${baseId}-${counter}`;
            counter++;
          }

          usedIds.add(id);
          heading.id = id;
        }

        tocItems.push({
          id,
          text: heading.textContent || "",
          level: parseInt(heading.tagName[1]),
        });
      });

      setItems(tocItems);
    };

    extractHeadings();

    const observer = new MutationObserver(() => {
      extractHeadings();
    });

    observer.observe(content, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [contentRef]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content || items.length === 0) return;

    const headings = content.querySelectorAll("h2, h3, h4");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        root: content,
        rootMargin: "-10% 0px -80% 0px",
        threshold: 0,
      }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [contentRef, items]);

  const scrollToHeading = (id: string) => {
    const content = contentRef.current;
    if (!content) return;

    const element = content.querySelector(`#${CSS.escape(id)}`);
    if (element) {
      const offset = 120;
      const top = element.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop - offset;
      content.scrollTo({ top, behavior: "smooth" });
      setIsOpen(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="xl:hidden fixed right-4 bottom-16 z-40 w-10 h-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        aria-label="Table of contents"
      >
        <List className="w-4 h-4" />
      </button>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="xl:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* TOC Container */}
      <nav
        className={`
          xl:block
          ${isOpen
            ? "fixed right-0 top-0 bottom-0 w-64 z-50 bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-gray-800"
            : "hidden xl:block"
          }
          xl:static xl:w-auto xl:bg-transparent xl:border-none xl:z-auto
          overflow-y-auto
          transition-transform duration-200 ease-out
        `}
      >
        <div className="p-4 xl:p-0">
          {/* Mobile Header */}
          <div className="xl:hidden flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <span className="text-[13px] font-medium text-gray-900 dark:text-white">
              Contents
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden xl:block mb-3">
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Contents
            </span>
          </div>

          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToHeading(item.id)}
                  className={`
                    w-full text-left text-[13px] py-1 px-2 rounded transition-colors
                    ${
                      activeId === item.id
                        ? "text-gray-900 dark:text-white font-medium"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }
                  `}
                  style={{ paddingLeft: `${(item.level - 2) * 12 + 8}px` }}
                >
                  <span className="line-clamp-2">{item.text}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
