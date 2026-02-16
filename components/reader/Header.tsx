"use client";

import React from "react";
import { useReaderStore } from "@/lib/store";
import { Menu, RefreshCw, Settings, Moon, Sun, Monitor, Search } from "lucide-react";
import Link from "next/link";
import { SearchModal, useSearchShortcut } from "./SearchModal";

export function Header() {
  const { sidebarOpen, setSidebarOpen, isSyncing, syncAllArticles, syncProgress, settings, updateSettings } = useReaderStore();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [isMac, setIsMac] = React.useState(true);

  React.useEffect(() => {
    setIsMac(navigator.platform?.toUpperCase().includes("MAC") ?? /Mac/i.test(navigator.userAgent));
  }, []);

  useSearchShortcut(() => setSearchOpen(true));

  const nextThemeMap: Record<string, "light" | "dark" | "system"> = {
    light: "dark",
    dark: "system",
    system: "light",
  };

  const toggleTheme = () => {
    updateSettings({ theme: nextThemeMap[settings.theme] });
  };

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (settings.theme === "system") {
        if (mediaQuery.matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (settings.theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      handleChange();
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [settings.theme]);

  const ThemeIcon = () => {
    switch (settings.theme) {
      case "dark":
        return <Moon className="w-4 h-4" />;
      case "light":
        return <Sun className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 rounded-xl bg-gray-100/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[11px] text-gray-400 bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-gray-700 rounded-md font-mono">
                {isMac ? "⌘" : "Ctrl+"}K
              </kbd>
            </button>

            <button
              onClick={syncAllArticles}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-600 dark:text-gray-400 rounded-xl bg-gray-100/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{isSyncing ? "Syncing..." : "Sync"}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <ThemeIcon />
            </button>

            <Link
              href="/settings"
              className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Sync progress */}
        {isSyncing && syncProgress && (
          <div className="h-0.5 bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full bg-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${(syncProgress.current / Math.max(syncProgress.total, 1)) * 100}%` }}
            />
          </div>
        )}
      </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
