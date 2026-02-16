"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, Copy } from "lucide-react";
import hljs from "highlight.js";

interface CodeFileRendererProps {
  content: string;
  language?: string;
  fileName?: string;
  className?: string;
}

export function CodeFileRenderer({
  content,
  language = "text",
  fileName,
  className = "",
}: CodeFileRendererProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute("data-highlighted");
      try {
        hljs.highlightElement(codeRef.current);
      } catch {
        // Skip if language not supported
      }
    }
  }, [content, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const lines = content.split("\n");
  const lineCount = lines.length;
  const lineNumberWidth = String(lineCount).length;

  return (
    <div className={`code-file-renderer rounded-xl overflow-hidden bg-[#0d1117] border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          {fileName && (
            <span className="text-sm text-gray-400 font-mono">{fileName}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-mono uppercase">
            {language}
          </span>
          <span className="text-xs text-gray-600">
            {lineCount} 行
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-400 hover:text-white transition-colors rounded-md hover:bg-gray-700/50"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>复制</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code content with line numbers gutter */}
      <div className="flex overflow-x-auto">
        {/* Line numbers gutter */}
        <div className="flex-shrink-0 select-none text-right py-4 pr-3 pl-4 border-r border-gray-800/50 bg-[#0d1117] sticky left-0 z-10">
          {lines.map((_, index) => (
            <div
              key={index}
              className="text-gray-600 font-mono text-sm leading-6"
              style={{ minWidth: `${lineNumberWidth}ch` }}
            >
              {index + 1}
            </div>
          ))}
        </div>

        {/* Code */}
        <div className="flex-1 py-4 pl-4 pr-4 min-w-0">
          <pre className="m-0 p-0">
            <code
              ref={codeRef}
              className={`language-${language} text-sm font-mono leading-6 !bg-transparent !p-0`}
            >
              {content}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
