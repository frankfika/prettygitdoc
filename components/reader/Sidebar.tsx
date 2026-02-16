"use client";

import React from "react";
import { useReaderStore } from "@/lib/store";
import { ArticleTree, RepoArticleTree } from "@/types";
import {
  ChevronRight,
  ChevronDown,
  FileText,
  FileCode2,
  Folder,
  FolderOpen,
  RefreshCw,
  Book,
  MoreVertical,
  Trash2,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EmptyState } from "./EmptyState";
import { SidebarSkeleton } from "./Skeleton";
import { ConfirmModal } from "@/components/ui/Modal";

interface TreeNodeProps {
  node: ArticleTree;
  depth?: number;
  repoId: string;
}

function TreeNode({ node, depth = 0, repoId }: TreeNodeProps) {
  const [expanded, setExpanded] = React.useState(false);
  const params = useParams();
  const { setSidebarOpen } = useReaderStore();
  const currentId = (params?.slug as string) || null;
  const isActive = node.article?.id === currentId;

  if (node.type === "file" && node.article) {
    const ft = node.article.fileType;
    const isCode = ft === 'code';
    const FileIcon = isCode ? FileCode2 : FileText;

    return (
      <Link
        href={`/article/${node.article.id}`}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-2 py-1.5 px-3 text-[13px] rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-gray-900/5 dark:bg-white/10 text-gray-900 dark:text-white font-medium"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-900/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200"
        }`}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        <FileIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
        <span className="truncate">{node.article.title}</span>
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 py-1.5 px-3 w-full text-[13px] text-gray-500 dark:text-gray-400 hover:bg-gray-900/5 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg transition-all duration-200"
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
        )}
        {expanded ? (
          <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
        ) : (
          <Folder className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
        )}
        <span className="truncate font-medium">{node.name}</span>
      </button>
      {expanded && node.children && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeNode key={child.path} node={child} depth={depth + 1} repoId={repoId} />
          ))}
        </div>
      )}
    </div>
  );
}

interface RepoSectionProps {
  repoTree: RepoArticleTree;
}

function RepoSection({ repoTree }: RepoSectionProps) {
  const { toggleRepoExpanded, syncArticles, isSyncing, syncingRepoId, removeRepo, syncProgress, settings } =
    useReaderStore();
  const [showMenu, setShowMenu] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Get repo config to access path
  const repoConfig = settings.repos.find((r) => r.id === repoTree.repoId);
  const folderPath = repoConfig?.path || "";
  // Extract folder name from path (e.g., "动手做AI Agent：零基础玩转智能体" from the path)
  const folderName = folderPath
    ? decodeURIComponent(folderPath.split('/').pop() || folderPath)
    : "";

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSync = async () => {
    const repo = settings.repos.find((r) => r.id === repoTree.repoId);
    if (repo) {
      await syncArticles(repo);
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const isThisRepoSyncing = isSyncing && syncingRepoId === repoTree.repoId;

  return (
    <div className="mb-2">
      {/* Repo Header */}
      <div className="flex items-center gap-1 px-3 py-2">
        <button
          onClick={() => toggleRepoExpanded(repoTree.repoId)}
          className="flex items-center gap-1.5 flex-1 min-w-0 hover:bg-gray-900/5 dark:hover:bg-white/5 rounded-lg px-1.5 py-1 -mx-1.5 -my-1 transition-colors"
          title={repoTree.expanded !== false ? "Collapse" : "Expand"}
        >
          {repoTree.expanded !== false ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          )}
          <div className="flex flex-col items-start min-w-0">
            {folderName ? (
              <>
                <span className="font-semibold text-[13px] text-gray-700 dark:text-gray-300 truncate">
                  {folderName}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                  {repoTree.repoName}
                </span>
              </>
            ) : (
              <span className="font-semibold text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate">
                {repoTree.repoName}
              </span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-0.5">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
            title="Sync"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isThisRepoSyncing ? "animate-spin" : ""}`}
            />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-apple-lg z-50 overflow-hidden">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sync Progress */}
      {isThisRepoSyncing && syncProgress && (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 mb-1.5">
            <span className="font-medium">Syncing...</span>
            <span>{syncProgress.current}/{syncProgress.total}</span>
          </div>
          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{
                width: `${(syncProgress.current / Math.max(syncProgress.total, 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Repo Content */}
      {repoTree.expanded !== false && (
        <div className="mt-0.5">
          {repoTree.tree.length === 0 ? (
            <EmptyState type="repo" />
          ) : (
            repoTree.tree.map((node) => (
              <TreeNode key={node.path} node={node} repoId={repoTree.repoId} />
            ))
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => removeRepo(repoTree.repoId)}
        title="Delete repository"
        message={`Are you sure you want to delete "${folderName || repoTree.repoName}"? All synced data will be removed.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

export function Sidebar() {
  const { repoArticleTrees, sidebarOpen, setSidebarOpen, isLoading } =
    useReaderStore();

  // Touch gesture handling for mobile
  const touchStartX = React.useRef(0);
  const touchEndX = React.useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (diff > threshold && sidebarOpen) {
      setSidebarOpen(false);
    }
    if (diff < -threshold && !sidebarOpen && touchStartX.current < 50) {
      setSidebarOpen(true);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Touch area for swipe detection */}
      <div
        className="fixed left-0 top-0 bottom-0 w-8 z-30 lg:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-2xl border-r border-gray-200/50 dark:border-gray-800/50 z-50 transform transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-5 h-16 flex items-center border-b border-gray-200/50 dark:border-gray-800/50">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 rounded-xl flex items-center justify-center shadow-sm">
                <Book className="w-4 h-4 text-white dark:text-gray-900" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white text-[15px] tracking-tight">
                GitHub Reader
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {isLoading ? (
              <SidebarSkeleton />
            ) : repoArticleTrees.length === 0 ? (
              <EmptyState type="sidebar" />
            ) : (
              repoArticleTrees.map((tree) => (
                <RepoSection key={tree.repoId} repoTree={tree} />
              ))
            )}
          </nav>

          {/* Footer */}
          <div className="px-3 py-4 border-t border-gray-200/50 dark:border-gray-800/50">
            <Link
              href="/settings"
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-900/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200 transition-all duration-200 text-[13px] font-medium"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
