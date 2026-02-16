"use client";

import React, { useState, useEffect } from "react";
import { useReaderStore } from "@/lib/store";
import { Sidebar, Header } from "@/components/reader";
import { RepoConfig } from "@/types";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Check,
  RefreshCw,
  Github,
} from "lucide-react";
import Link from "next/link";
import { useToastStore } from "@/lib/toastStore";
import { ConfirmModal } from "@/components/ui/Modal";

interface RepoFormData {
  name: string;
  owner: string;
  repo: string;
  branch: string;
  path: string;
  url: string;
}

const defaultFormData: RepoFormData = {
  name: "",
  owner: "",
  repo: "",
  branch: "main",
  path: "",
  url: "",
};

function parseGitHubUrl(url: string): { owner: string; repo: string; branch: string; path: string } | null {
  // Decode URL to handle Chinese characters
  const decodedUrl = decodeURIComponent(url);

  const patterns = [
    /github\.com\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)(?:\/(.+))?/,
    /github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)(?:\/(.+))?/,
    /github\.com\/([^\/]+)\/([^\/?]+)/,
  ];

  for (const pattern of patterns) {
    const match = decodedUrl.match(pattern);
    if (match) {
      const [, owner, repo, branch = "main", path = ""] = match;
      return {
        owner: decodeURIComponent(owner),
        repo: decodeURIComponent(repo).replace(/\.git$/, ""),
        branch: decodeURIComponent(branch),
        path: path ? decodeURIComponent(path) : "",
      };
    }
  }
  return null;
}

export default function SettingsPage() {
  const {
    settings,
    addRepo,
    removeRepo,
    updateRepo,
    syncArticles,
    isSyncing,
    syncingRepoId,
    loadArticles,
  } = useReaderStore();
  const { addToast } = useToastStore();

  const repos = settings.repos || [];

  const [githubToken, setGithubToken] = useState<string>("");

  useEffect(() => {
    loadArticles();
    const token = localStorage.getItem('github-token') || '';
    setGithubToken(token);
  }, [loadArticles]);

  const [editingRepo, setEditingRepo] = useState<string | null>(null);
  const [formData, setFormData] = useState<RepoFormData>(defaultFormData);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingRepoId, setDeletingRepoId] = useState<string | null>(null);

  const handleAdd = () => {
    setIsAdding(true);
    setFormData(defaultFormData);
  };

  const handleEdit = (repo: RepoConfig) => {
    setEditingRepo(repo.id);
    setFormData({
      name: repo.name,
      owner: repo.owner,
      repo: repo.repo,
      branch: repo.branch,
      path: repo.path || "",
      url: `https://github.com/${repo.owner}/${repo.repo}/tree/${repo.branch}${repo.path ? `/${repo.path}` : ""}`,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingRepo(null);
    setFormData(defaultFormData);
  };

  const handleUrlChange = (url: string) => {
    setFormData((prev) => ({ ...prev, url }));

    const parsed = parseGitHubUrl(url);
    if (parsed) {
      setFormData((prev) => ({
        ...prev,
        url,
        owner: parsed.owner,
        repo: parsed.repo,
        branch: parsed.branch,
        path: parsed.path,
        name: prev.name || parsed.repo,
      }));
    }
  };

  const handleSaveNew = () => {
    if (!formData.owner || !formData.repo) {
      addToast({
        type: "error",
        title: "Error",
        message: "Please enter a valid GitHub repository URL",
      });
      return;
    }

    // Ensure path is decoded (handle Chinese characters)
    let decodedPath = formData.path;
    try {
      decodedPath = decodeURIComponent(formData.path);
    } catch {
      // Path is already decoded
    }

    const newRepo: RepoConfig = {
      id: `repo-${Date.now()}`,
      name: formData.name || formData.repo,
      owner: formData.owner,
      repo: formData.repo,
      branch: formData.branch || "main",
      path: decodedPath || undefined,
    };

    addRepo(newRepo);
    setIsAdding(false);
    setFormData(defaultFormData);
    addToast({
      type: "success",
      title: "Added",
      message: `Repository "${newRepo.name}" has been added`,
    });
  };

  const handleSaveEdit = () => {
    if (!editingRepo || !formData.name || !formData.owner || !formData.repo) return;

    updateRepo(editingRepo, {
      name: formData.name,
      owner: formData.owner,
      repo: formData.repo,
      branch: formData.branch,
      path: formData.path || undefined,
    });

    setEditingRepo(null);
    setFormData(defaultFormData);
    addToast({
      type: "success",
      title: "Updated",
      message: "Repository info has been updated",
    });
  };

  const handleDelete = (repoId: string) => {
    setDeletingRepoId(repoId);
  };

  const confirmDelete = () => {
    if (!deletingRepoId) return;
    const repo = repos.find((r) => r.id === deletingRepoId);
    removeRepo(deletingRepoId);
    addToast({
      type: "info",
      title: "Deleted",
      message: `Repository "${repo?.name || ""}" has been removed`,
    });
    setDeletingRepoId(null);
  };

  const handleSync = async (repo: RepoConfig) => {
    const result = await syncArticles(repo);
    if (result.errors.length > 0) {
      addToast({
        type: "error",
        title: "Sync failed",
        message: result.errors[0],
      });
    } else {
      addToast({
        type: "success",
        title: "Synced",
        message: `Added ${result.added}, updated ${result.updated} files`,
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50 dark:bg-black">
        <Header />

        <main className="flex-1 p-6 sm:p-8 lg:p-10">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
                Settings
              </h1>
              <p className="text-[15px] text-gray-500 dark:text-gray-400 mt-1.5">
                Manage repositories and reading preferences
              </p>
            </div>

            {/* Repository List */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Repositories
                </h2>
                <button
                  onClick={handleAdd}
                  disabled={isAdding}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 disabled:opacity-40 shadow-apple"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {repos.length === 0 && !isAdding && (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-[15px] bg-white dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-gray-800/60">
                    No repositories configured
                  </div>
                )}

                {repos.map((repo) => (
                  <div key={repo.id} className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5">
                    {editingRepo === repo.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                            Display name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            className="w-full px-4 py-2.5 text-[15px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                            placeholder="e.g. React Docs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                              Owner
                            </label>
                            <input
                              type="text"
                              value={formData.owner}
                              onChange={(e) =>
                                setFormData({ ...formData, owner: e.target.value })
                              }
                              className="w-full px-4 py-2.5 text-[15px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                              placeholder="e.g. facebook"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                              Repository
                            </label>
                            <input
                              type="text"
                              value={formData.repo}
                              onChange={(e) =>
                                setFormData({ ...formData, repo: e.target.value })
                              }
                              className="w-full px-4 py-2.5 text-[15px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                              placeholder="e.g. react"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                              Branch
                            </label>
                            <input
                              type="text"
                              value={formData.branch}
                              onChange={(e) =>
                                setFormData({ ...formData, branch: e.target.value })
                              }
                              className="w-full px-4 py-2.5 text-[15px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                              placeholder="main"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                              Path (optional)
                            </label>
                            <input
                              type="text"
                              value={formData.path}
                              onChange={(e) =>
                                setFormData({ ...formData, path: e.target.value })
                              }
                              className="w-full px-4 py-2.5 text-[15px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                              placeholder="docs"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={handleSaveEdit}
                            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="flex items-center gap-1.5 px-4 py-2 text-gray-500 dark:text-gray-400 text-[13px] rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-medium text-gray-900 dark:text-white truncate">
                            {repo.name}
                          </h3>
                          <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {repo.owner}/{repo.repo} · {repo.branch}
                            {repo.path && ` · ${decodeURIComponent(repo.path)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5 ml-4">
                          <button
                            onClick={() => handleSync(repo)}
                            disabled={isSyncing}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            title="Sync"
                          >
                            <RefreshCw
                              className={`w-4 h-4 ${
                                isSyncing && syncingRepoId === repo.id ? "animate-spin" : ""
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => handleEdit(repo)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(repo.id)}
                            className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add New Form */}
                {isAdding && (
                  <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5">
                    <h3 className="text-[15px] font-medium text-gray-900 dark:text-white mb-4">
                      Add repository
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          GitHub URL
                        </label>
                        <input
                          type="text"
                          value={formData.url}
                          onChange={(e) => handleUrlChange(e.target.value)}
                          className="w-full px-4 py-2.5 text-[15px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                          placeholder="https://github.com/facebook/react"
                        />
                        <p className="text-[13px] text-gray-400 dark:text-gray-500 mt-1.5">
                          Paste a repo URL or a specific folder path
                        </p>
                      </div>

                      {/* Parsed info */}
                      {(formData.owner || formData.repo) && (
                        <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl">
                          <div className="text-[15px] text-gray-900 dark:text-white font-medium">
                            {formData.owner}/{formData.repo}
                            {formData.branch !== "main" && ` · ${formData.branch}`}
                          </div>
                          <div className="text-[13px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {formData.path ? `Path: ${formData.path}` : "Entire repository"}
                          </div>
                        </div>
                      )}

                      {formData.owner && formData.repo && (
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                            Limit to path (optional)
                          </label>
                          <input
                            type="text"
                            value={formData.path}
                            onChange={(e) =>
                              setFormData({ ...formData, path: e.target.value })
                            }
                            className="w-full px-4 py-2.5 text-[15px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                            placeholder="e.g. docs"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                          Display name (optional)
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full px-4 py-2.5 text-[15px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                          placeholder={formData.repo || "e.g. React Docs"}
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={handleSaveNew}
                          disabled={!formData.owner || !formData.repo}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 disabled:opacity-40"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Add
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center gap-1.5 px-4 py-2 text-gray-500 dark:text-gray-400 text-[13px] rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Reading Preferences */}
            <section className="mb-10">
              <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Reading
              </h2>
              <div className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 space-y-6">
                <div>
                  <label className="block text-[15px] text-gray-700 dark:text-gray-300 mb-2">
                    Font size: {settings.fontSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={settings.fontSize}
                    onChange={(e) =>
                      useReaderStore.getState().updateSettings({ fontSize: parseInt(e.target.value) })
                    }
                    className="w-full accent-gray-900 dark:accent-white"
                  />
                </div>

                <div>
                  <label className="block text-[15px] text-gray-700 dark:text-gray-300 mb-2">
                    Line height: {settings.lineHeight}
                  </label>
                  <input
                    type="range"
                    min="1.2"
                    max="2.0"
                    step="0.1"
                    value={settings.lineHeight}
                    onChange={(e) =>
                      useReaderStore.getState().updateSettings({ lineHeight: parseFloat(e.target.value) })
                    }
                    className="w-full accent-gray-900 dark:accent-white"
                  />
                </div>

                {/* Preview */}
                <div className="p-4 bg-gray-100 dark:bg-white/5 rounded-xl">
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide">Preview</p>
                  <p
                    className="text-gray-900 dark:text-white"
                    style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}
                  >
                    GitHub Reader syncs Markdown documents from GitHub repositories for offline reading with a clean, minimal interface.
                  </p>
                </div>

                <div>
                  <label className="block text-[15px] text-gray-700 dark:text-gray-300 mb-2">
                    Theme
                  </label>
                  <select
                    value={settings.theme}
                    onChange={(e) =>
                      useReaderStore.getState().updateSettings({
                        theme: e.target.value as "light" | "dark" | "system",
                      })
                    }
                    className="w-full px-4 py-2.5 text-[15px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
            </section>

            {/* GitHub Token */}
            <section className="mb-10">
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer select-none text-[15px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  <Github className="w-4 h-4" />
                  GitHub Token (optional, for private repos)
                </summary>
                <div className="mt-4 space-y-3">
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => {
                      const token = e.target.value;
                      setGithubToken(token);
                      if (token) {
                        localStorage.setItem('github-token', token);
                      } else {
                        localStorage.removeItem('github-token');
                      }
                    }}
                    className="w-full px-4 py-2.5 text-[15px] border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-black text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  />
                  <p className="text-[13px] text-gray-400 dark:text-gray-500">
                    Public repos don&apos;t need a token. Create one at{" "}
                    <a href="https://github.com/settings/tokens" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">
                      GitHub Settings
                    </a>
                    . Stored locally only.
                  </p>
                </div>
              </details>
            </section>

            {/* Info */}
            <section className="text-[13px] text-gray-400 dark:text-gray-500 space-y-1">
              <p>Supports Markdown, code files, PDF, and Office documents.</p>
              <p>All content is cached locally for offline reading.</p>
              <p>Each repository&apos;s data is stored independently.</p>
            </section>
          </div>
        </main>
      </div>

      <ConfirmModal
        isOpen={!!deletingRepoId}
        onClose={() => setDeletingRepoId(null)}
        onConfirm={confirmDelete}
        title="Delete repository"
        message={`Are you sure you want to delete "${repos.find((r) => r.id === deletingRepoId)?.name || ""}"? All synced data will be removed.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
