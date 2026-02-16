"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  return (
    <nav
      className={`flex items-center gap-1 text-[13px] text-gray-400 dark:text-gray-500 ${className}`}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="w-3 h-3 text-gray-300 dark:text-gray-600 flex-shrink-0" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors truncate max-w-[150px] sm:max-w-[200px]"
            >
              {item.label}
            </Link>
          ) : (
            <span
              className="text-gray-600 dark:text-gray-300 truncate max-w-[200px] sm:max-w-[300px]"
              aria-current="page"
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

interface ArticleBreadcrumbProps {
  repoName?: string;
  articleTitle?: string;
  articlePath?: string;
}

export function ArticleBreadcrumb({
  repoName,
  articleTitle,
  articlePath,
}: ArticleBreadcrumbProps) {
  const pathParts = articlePath?.split("/").filter(Boolean) || [];

  const items: BreadcrumbItem[] = [
    {
      label: "Home",
      href: "/",
    },
  ];

  if (repoName) {
    items.push({
      label: repoName,
      href: "/",
    });
  }

  pathParts.slice(0, -1).forEach((part) => {
    items.push({
      label: part,
    });
  });

  if (articleTitle) {
    items.push({
      label: articleTitle,
    });
  }

  return <Breadcrumb items={items} />;
}
