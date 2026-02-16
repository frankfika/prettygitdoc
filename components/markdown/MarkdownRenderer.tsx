"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkToc from "remark-toc";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Components } from "react-markdown";
import { CodeBlock } from "./CodeBlock";
import "highlight.js/styles/github-dark.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const components: Components = useMemo(
    () => ({
      code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || "");
        const language = match ? match[1] : "";
        const isInline = !className;

        if (isInline) {
          return (
            <code
              className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        }

        return (
          <CodeBlock language={language} {...props}>
            {String(children).replace(/\n$/, "")}
          </CodeBlock>
        );
      },

      pre({ children }) {
        return <>{children}</>;
      },

      h1({ children, ...props }) {
        return (
          <h1
            className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100 border-b pb-2"
            {...props}
          >
            {children}
          </h1>
        );
      },

      h2({ children, ...props }) {
        return (
          <h2
            className="text-2xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200"
            {...props}
          >
            {children}
          </h2>
        );
      },

      h3({ children, ...props }) {
        return (
          <h3
            className="text-xl font-semibold mt-5 mb-2 text-gray-800 dark:text-gray-200"
            {...props}
          >
            {children}
          </h3>
        );
      },

      h4({ children, ...props }) {
        return (
          <h4
            className="text-lg font-medium mt-4 mb-2 text-gray-700 dark:text-gray-300"
            {...props}
          >
            {children}
          </h4>
        );
      },

      p({ children, ...props }) {
        return (
          <p className="my-4 leading-relaxed text-gray-700 dark:text-gray-300" {...props}>
            {children}
          </p>
        );
      },

      ul({ children, ...props }) {
        return (
          <ul className="my-4 ml-6 list-disc text-gray-700 dark:text-gray-300" {...props}>
            {children}
          </ul>
        );
      },

      ol({ children, ...props }) {
        return (
          <ol className="my-4 ml-6 list-decimal text-gray-700 dark:text-gray-300" {...props}>
            {children}
          </ol>
        );
      },

      li({ children, ...props }) {
        return (
          <li className="my-1" {...props}>
            {children}
          </li>
        );
      },

      a({ children, href, ...props }) {
        return (
          <a
            href={href}
            className="text-blue-600 dark:text-blue-400 hover:underline"
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            {...props}
          >
            {children}
          </a>
        );
      },

      blockquote({ children, ...props }) {
        return (
          <blockquote
            className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-gray-600 dark:text-gray-400"
            {...props}
          >
            {children}
          </blockquote>
        );
      },

      hr({ ...props }) {
        return (
          <hr
            className="my-8 border-gray-300 dark:border-gray-600"
            {...props}
          />
        );
      },

      table({ children, ...props }) {
        return (
          <div className="overflow-x-auto my-4">
            <table
              className="min-w-full border-collapse border border-gray-300 dark:border-gray-600"
              {...props}
            >
              {children}
            </table>
          </div>
        );
      },

      thead({ children, ...props }) {
        return (
          <thead className="bg-gray-100 dark:bg-gray-800" {...props}>
            {children}
          </thead>
        );
      },

      th({ children, ...props }) {
        return (
          <th
            className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold"
            {...props}
          >
            {children}
          </th>
        );
      },

      td({ children, ...props }) {
        return (
          <td
            className="border border-gray-300 dark:border-gray-600 px-4 py-2"
            {...props}
          >
            {children}
          </td>
        );
      },

      img({ src, alt, ...props }) {
        // Security: Validate image URL to prevent XSS
        const isValidImageUrl = (url: string): boolean => {
          if (!url) return false;
          // Allow only http:, https:, and relative URLs
          return (
            url.startsWith("http://") ||
            url.startsWith("https://") ||
            url.startsWith("/") ||
            url.startsWith("./") ||
            url.startsWith("../")
          );
        };

        // Sanitize src to prevent javascript: protocol and other XSS vectors
        const sanitizedSrc =
          typeof src === "string" && isValidImageUrl(src) ? src : "";

        if (!sanitizedSrc) {
          return (
            <div className="my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              [图片加载失败: 不安全的图片地址]
            </div>
          );
        }

        return (
          <img
            src={sanitizedSrc}
            alt={alt || ""}
            className="max-w-full h-auto my-4 rounded-lg"
            loading="lazy"
            {...props}
          />
        );
      },
    }),
    []
  );

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          [remarkToc, { maxDepth: 3, heading: "目录" }],
        ]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          rehypeHighlight,
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
