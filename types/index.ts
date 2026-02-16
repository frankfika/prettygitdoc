export interface RepoConfig {
  id: string;
  name: string;
  owner: string;
  repo: string;
  branch: string;
  path?: string;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: "file" | "dir";
  content?: string;
  encoding?: string;
}

export type FileType = 'markdown' | 'code' | 'pdf' | 'document';

export interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  path: string;
  sha: string;
  size: number;
  updatedAt: string;
  readingProgress?: number;
  repoId: string;
  repoName: string;
  fileType: FileType;
  language?: string;
  rawUrl?: string; // For binary files (PDF, Word) that can't be stored as text
}

export interface ArticleTree {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: ArticleTree[];
  article?: Article;
}

export interface RepoArticleTree {
  repoId: string;
  repoName: string;
  tree: ArticleTree[];
  expanded?: boolean;
}

export interface SyncResult {
  added: number;
  updated: number;
  removed: number;
  errors: string[];
}

export interface AppSettings {
  repos: RepoConfig[];
  theme: "light" | "dark" | "system";
  fontSize: number;
  lineHeight: number;
  lastSyncAt?: string;
  activeRepoId?: string;
}
