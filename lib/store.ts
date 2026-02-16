import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Article, RepoConfig, AppSettings, SyncResult, RepoArticleTree } from "@/types";
import {
  getAllCachedArticles,
  syncArticles as cacheSyncArticles,
  buildRepoArticleTrees,
  getRepoConfigs,
  saveReadingProgress,
} from "./cache";
import { fetchAllFiles } from "./github";

interface SyncProgress {
  current: number;
  total: number;
}

interface ReaderState {
  // Data
  articles: Article[];
  repoArticleTrees: RepoArticleTree[];
  currentArticle: Article | null;

  // UI State
  isLoading: boolean;
  isSyncing: boolean;
  syncingRepoId: string | null;
  syncProgress: SyncProgress | null;
  error: string | null;
  sidebarOpen: boolean;

  // Settings
  settings: AppSettings;

  // Actions
  setArticles: (articles: Article[]) => void;
  setCurrentArticle: (article: Article | null) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleRepoExpanded: (repoId: string) => void;
  loadArticles: () => Promise<void>;
  syncArticles: (config: RepoConfig) => Promise<SyncResult>;
  syncAllArticles: () => Promise<void>;
  updateReadingProgress: (id: string, progress: number) => Promise<void>;
  updateSettings: (settings: Partial<AppSettings>) => void;
  addRepo: (repo: RepoConfig) => void;
  removeRepo: (repoId: string) => void;
  updateRepo: (repoId: string, repo: Partial<RepoConfig>) => void;
  getAdjacentArticles: (id: string) => { prev: Article | null; next: Article | null };
}

const defaultRepos: RepoConfig[] = [
  {
    id: "react-docs",
    name: "React 文档",
    owner: "facebook",
    repo: "react",
    branch: "main",
    path: "docs",
  },
  {
    id: "vue-docs",
    name: "Vue.js 文档",
    owner: "vuejs",
    repo: "core",
    branch: "main",
    path: "packages/compiler-core",
  },
  {
    id: "typescript-docs",
    name: "TypeScript 文档",
    owner: "microsoft",
    repo: "TypeScript",
    branch: "main",
    path: "doc",
  },
  {
    id: "rust-docs",
    name: "Rust 文档",
    owner: "rust-lang",
    repo: "rust",
    branch: "master",
    path: "src/doc",
  },
];

const defaultSettings: AppSettings = {
  repos: defaultRepos,
  theme: "system",
  fontSize: 16,
  lineHeight: 1.6,
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      // Initial state
      articles: [],
      repoArticleTrees: [],
      currentArticle: null,
      isLoading: false,
      isSyncing: false,
      syncingRepoId: null,
      syncProgress: null,
      error: null,
      sidebarOpen: false,
      settings: defaultSettings,

      // Actions
      setArticles: (articles) => {
        const { settings } = get();
        const trees = buildRepoArticleTrees(articles, settings.repos);
        set({ articles, repoArticleTrees: trees });
      },

      setCurrentArticle: (article) => {
        set({ currentArticle: article });
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      toggleRepoExpanded: (repoId) => {
        const { repoArticleTrees } = get();
        const updated = repoArticleTrees.map((tree) =>
          tree.repoId === repoId ? { ...tree, expanded: !tree.expanded } : tree
        );
        set({ repoArticleTrees: updated });
      },

      loadArticles: async () => {
        set({ isLoading: true, error: null });
        try {
          const articles = await getAllCachedArticles();
          const savedRepos = await getRepoConfigs();
          const repos = savedRepos.length > 0 ? savedRepos : get().settings.repos;

          const trees = buildRepoArticleTrees(articles, repos);

          set({
            articles,
            repoArticleTrees: trees,
            settings: {
              ...get().settings,
              repos,
            },
          });
        } catch (error) {
          set({ error: String(error) });
        } finally {
          set({ isLoading: false });
        }
      },

      syncArticles: async (config: RepoConfig) => {
        set({
          isSyncing: true,
          syncingRepoId: config.id,
          error: null,
          syncProgress: { current: 0, total: 1 },
        });

        try {
          const newArticles = await fetchAllFiles(config, (current, total) => {
            set({ syncProgress: { current, total } });
          });

          const result = await cacheSyncArticles(newArticles, config);
          const articles = await getAllCachedArticles();
          const { settings } = get();
          const trees = buildRepoArticleTrees(articles, settings.repos);

          set({ articles, repoArticleTrees: trees });
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          set({ error: errorMessage });
          return { added: 0, updated: 0, removed: 0, errors: [errorMessage] };
        } finally {
          set({ isSyncing: false, syncingRepoId: null, syncProgress: null });
        }
      },

      syncAllArticles: async () => {
        const { settings, syncArticles } = get();
        for (const repo of settings.repos) {
          await syncArticles(repo);
        }
      },

      updateReadingProgress: async (id, progress) => {
        await saveReadingProgress(id, progress);

        // Update local state
        const { articles, currentArticle } = get();
        const updatedArticles = articles.map((a) =>
          a.id === id ? { ...a, readingProgress: progress } : a
        );

        set({
          articles: updatedArticles,
          currentArticle:
            currentArticle?.id === id
              ? { ...currentArticle, readingProgress: progress }
              : currentArticle,
        });
      },

      updateSettings: (newSettings) => {
        set({ settings: { ...get().settings, ...newSettings } });
      },

      addRepo: (repo) => {
        const { settings, articles } = get();
        const updatedRepos = [...settings.repos, repo];
        const trees = buildRepoArticleTrees(articles, updatedRepos);
        set({
          settings: { ...settings, repos: updatedRepos },
          repoArticleTrees: trees,
        });
      },

      removeRepo: (repoId) => {
        const { settings, articles } = get();
        const updatedRepos = settings.repos.filter((r) => r.id !== repoId);
        const updatedArticles = articles.filter((a) => a.repoId !== repoId);
        const trees = buildRepoArticleTrees(updatedArticles, updatedRepos);
        set({
          settings: { ...settings, repos: updatedRepos },
          articles: updatedArticles,
          repoArticleTrees: trees,
        });
      },

      updateRepo: (repoId, repoUpdate) => {
        const { settings, articles } = get();
        const updatedRepos = settings.repos.map((r) =>
          r.id === repoId ? { ...r, ...repoUpdate } : r
        );
        const trees = buildRepoArticleTrees(articles, updatedRepos);
        set({
          settings: { ...settings, repos: updatedRepos },
          repoArticleTrees: trees,
        });
      },

      getAdjacentArticles: (id) => {
        const { articles } = get();
        const currentArticle = articles.find((a) => a.id === id);
        if (!currentArticle) return { prev: null, next: null };

        // Get articles from the same repo
        const repoArticles = articles
          .filter((a) => a.repoId === currentArticle.repoId)
          .sort((a, b) => a.path.localeCompare(b.path));

        const index = repoArticles.findIndex((a) => a.id === id);

        return {
          prev: index > 0 ? repoArticles[index - 1] : null,
          next: index < repoArticles.length - 1 ? repoArticles[index + 1] : null,
        };
      },
    }),
    {
      name: "reader-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings }),
      onRehydrateStorage: () => (state) => {
        // Ensure settings have all default values after rehydration
        if (state?.settings) {
          state.settings = {
            ...defaultSettings,
            ...state.settings,
            repos: state.settings.repos || defaultSettings.repos,
          };
        }
      },
    }
  )
);
