"use client";

import React from "react";
import { useReaderStore } from "@/lib/store";
import { Menu, RefreshCw, Settings, Moon, Sun, Monitor, Search, Download, Info } from "lucide-react";
import Link from "next/link";
import { SearchModal, useSearchShortcut } from "./SearchModal";
import { useToastStore } from "@/lib/toastStore";
import { useSearchParams } from "next/navigation";

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  }
}

export function Header() {
  const { sidebarOpen, setSidebarOpen, isSyncing, syncAllArticles, syncProgress, settings, updateSettings } = useReaderStore();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [isMac, setIsMac] = React.useState(true);
  const [installPrompt, setInstallPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = React.useState(false);
  const { addToast } = useToastStore();
  const searchParams = useSearchParams();
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);

  React.useEffect(() => {
    setIsMac(navigator.platform?.toUpperCase().includes("MAC") ?? /Mac/i.test(navigator.userAgent));
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream);
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
    const handleBeforeInstall = (e: Event) => {
      const ev = e as BeforeInstallPromptEvent;
      ev.preventDefault();
      setInstallPrompt(ev);
      setCanInstall(true);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setCanInstall(false);
      addToast({ type: "success", title: "已安装", message: "Pretty GitDoc 已添加到设备" });
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [addToast]);

  const triggerInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    try {
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        addToast({ type: "success", title: "安装开始", message: "稍后从主屏打开应用" });
      }
    } finally {
      setInstallPrompt(null);
      setCanInstall(false);
    }
  };

  // Install banner logic: show when用户从分享进入或首次访问，且未关闭
  React.useEffect(() => {
    const dismissed = localStorage.getItem("pgd-install-banner-dismissed") === "1";
    const fromShare = !!searchParams?.get("share");
    if (!dismissed && (fromShare || canInstall || isIOS)) {
      setShowInstallBanner(true);
    }
  }, [searchParams, canInstall, isIOS]);

  const dismissBanner = () => {
    localStorage.setItem("pgd-install-banner-dismissed", "1");
    setShowInstallBanner(false);
  };

  const iosGuide = () => {
    addToast({
      type: "info",
      title: "iOS 安装提示",
      message: "Safari 分享按钮 → 添加到主屏幕，即可离线使用",
      duration: 6000,
    });
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

            {canInstall && (
              <button
                onClick={triggerInstall}
                className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title="Install App"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

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

      {/* Install banner */}
      {showInstallBanner && (
        <div className="sticky top-16 z-30 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-b border-blue-100/60 dark:border-blue-800/50">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <Info className="w-4 h-4" />
              <span className="text-[13px] truncate">
                安装 Pretty GitDoc 到设备，离线访问更流畅
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isIOS ? (
                <button
                  onClick={iosGuide}
                  className="px-2.5 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  查看指引
                </button>
              ) : (
                <button
                  onClick={triggerInstall}
                  disabled={!canInstall}
                  className="px-2.5 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                >
                  Install
                </button>
              )}
              <button
                onClick={dismissBanner}
                className="px-2.5 py-1 text-xs rounded-md text-blue-700 dark:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
