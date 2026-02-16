import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Article, RepoConfig, SyncResult, ArticleTree, RepoArticleTree } from "@/types";

interface ReaderDB extends DBSchema {
  articles: {
    key: string;
    value: Article;
    indexes: { "by-path": string; "by-repo": string };
  };
  settings: {
    key: string;
    value: unknown;
  };
  metadata: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = "github-reader";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<ReaderDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ReaderDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ReaderDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Articles store
        if (!db.objectStoreNames.contains("articles")) {
          const articleStore = db.createObjectStore("articles", {
            keyPath: "id",
          });
          articleStore.createIndex("by-path", "path", { unique: false });
          articleStore.createIndex("by-repo", "repoId", { unique: false });
        } else if (oldVersion < 2) {
          // Migration: add by-repo index using the transaction parameter
          const articleStore = transaction.objectStore("articles");
          if (!articleStore.indexNames.contains("by-repo")) {
            articleStore.createIndex("by-repo", "repoId", { unique: false });
          }
        }

        // Settings store
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }

        // Metadata store
        if (!db.objectStoreNames.contains("metadata")) {
          db.createObjectStore("metadata");
        }
      },
    });
  }
  return dbPromise;
}

// Articles
export async function getCachedArticle(id: string): Promise<Article | null> {
  const db = await getDB();
  const article = await db.get("articles", id);
  return article || null;
}

export async function getCachedArticleByPath(path: string): Promise<Article | null> {
  const db = await getDB();
  const index = db.transaction("articles").store.index("by-path");
  const article = await index.get(path);
  return article || null;
}

export async function getArticlesByRepo(repoId: string): Promise<Article[]> {
  const db = await getDB();
  const index = db.transaction("articles").store.index("by-repo");
  return index.getAll(repoId);
}

export async function setCachedArticle(article: Article): Promise<void> {
  const db = await getDB();
  await db.put("articles", {
    ...article,
    updatedAt: new Date().toISOString(),
  });
}

export async function getAllCachedArticles(): Promise<Article[]> {
  const db = await getDB();
  return db.getAll("articles");
}

export async function deleteCachedArticle(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("articles", id);
}

export async function deleteArticlesByRepo(repoId: string): Promise<void> {
  const db = await getDB();
  const articles = await getArticlesByRepo(repoId);
  const tx = db.transaction("articles", "readwrite");
  for (const article of articles) {
    await tx.store.delete(article.id);
  }
  await tx.done;
}

export async function clearAllArticles(): Promise<void> {
  const db = await getDB();
  await db.clear("articles");
}

// Settings
export async function getSetting<T>(key: string, defaultValue?: T): Promise<T | undefined> {
  const db = await getDB();
  const value = await db.get("settings", key);
  return value !== undefined ? (value as T) : defaultValue;
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put("settings", value, key);
}

// Metadata
export async function getMetadata<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const value = await db.get("metadata", key);
  return value as T;
}

export async function setMetadata<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put("metadata", value, key);
}

// Sync
export async function syncArticles(
  newArticles: Article[],
  currentConfig: RepoConfig
): Promise<SyncResult> {
  const existingArticles = await getArticlesByRepo(currentConfig.id);
  const existingMap = new Map(existingArticles.map((a) => [a.id, a]));
  const newIds = new Set(newArticles.map((a) => a.id));

  const result: SyncResult = {
    added: 0,
    updated: 0,
    removed: 0,
    errors: [],
  };

  const db = await getDB();
  const tx = db.transaction("articles", "readwrite");

  // Add or update articles
  for (const article of newArticles) {
    const existing = existingMap.get(article.id);

    if (!existing) {
      await tx.store.put(article);
      result.added++;
    } else if (existing.sha !== article.sha) {
      // Preserve reading progress
      await tx.store.put({
        ...article,
        readingProgress: existing.readingProgress,
      });
      result.updated++;
    }
  }

  // Remove articles that no longer exist in this repo
  for (const existing of existingArticles) {
    if (!newIds.has(existing.id)) {
      await tx.store.delete(existing.id);
      result.removed++;
    }
  }

  await tx.done;

  // Update last sync time
  await setMetadata("lastSyncAt", new Date().toISOString());

  return result;
}

// Build article tree from flat list
export function buildArticleTree(articles: Article[], basePath?: string): ArticleTree[] {
  const root: ArticleTree[] = [];
  const map = new Map<string, ArticleTree>();

  // Strip basePath prefix from article paths for tree display
  const prefix = basePath ? (basePath.endsWith("/") ? basePath : basePath + "/") : "";

  // Sort articles by path
  const sorted = [...articles].sort((a, b) => a.path.localeCompare(b.path));

  for (const article of sorted) {
    // Remove the configured path prefix so the tree starts at the target folder
    const relativePath = prefix && article.path.startsWith(prefix)
      ? article.path.slice(prefix.length)
      : article.path;
    if (!relativePath) continue;
    const parts = relativePath.split("/");
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      const isFile = i === parts.length - 1;

      if (!map.has(currentPath)) {
        const displayName = isFile
          ? (article.fileType === 'markdown'
              ? part.replace(/\.(md|markdown)$/i, "").replace(/[-_]/g, " ")
              : part)
          : part.replace(/[-_]/g, " ");
        const node: ArticleTree = {
          name: displayName,
          path: currentPath,
          type: isFile ? "file" : "dir",
        };

        if (isFile) {
          node.article = article;
        } else {
          node.children = [];
        }

        map.set(currentPath, node);

        if (parentPath) {
          const parent = map.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(node);
          }
        } else {
          root.push(node);
        }
      }
    }
  }

  return root;
}

// Build repo article trees
export function buildRepoArticleTrees(articles: Article[], repos: RepoConfig[]): RepoArticleTree[] {
  const articlesByRepo = new Map<string, Article[]>();

  // Group articles by repo
  for (const article of articles) {
    const repoArticles = articlesByRepo.get(article.repoId) || [];
    repoArticles.push(article);
    articlesByRepo.set(article.repoId, repoArticles);
  }

  // Build trees for each repo
  return repos.map((repo) => ({
    repoId: repo.id,
    repoName: repo.name,
    tree: buildArticleTree(articlesByRepo.get(repo.id) || [], repo.path),
    expanded: true,
  }));
}

// Get current repo configs
export async function getRepoConfigs(): Promise<RepoConfig[]> {
  const configs = await getSetting<RepoConfig[]>("repos");
  return configs ?? [];
}

// Save reading progress
export async function saveReadingProgress(id: string, progress: number): Promise<void> {
  const article = await getCachedArticle(id);
  if (article) {
    article.readingProgress = progress;
    await setCachedArticle(article);
  }
}
