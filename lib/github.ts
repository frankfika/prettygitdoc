import { RepoConfig, GitHubFile, Article, ArticleTree, FileType } from "@/types";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";

// Supported code file extensions → highlight.js language name
const CODE_EXTENSIONS: Record<string, string> = {
  '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
  '.ts': 'typescript', '.tsx': 'typescript', '.mts': 'typescript',
  '.py': 'python', '.pyw': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c', '.h': 'c',
  '.cpp': 'cpp', '.cc': 'cpp', '.cxx': 'cpp', '.hpp': 'cpp', '.hxx': 'cpp',
  '.cs': 'csharp',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin', '.kts': 'kotlin',
  '.scala': 'scala',
  '.sh': 'bash', '.bash': 'bash', '.zsh': 'bash',
  '.yml': 'yaml', '.yaml': 'yaml',
  '.json': 'json',
  '.xml': 'xml',
  '.html': 'html', '.htm': 'html',
  '.css': 'css',
  '.scss': 'scss', '.less': 'less',
  '.sql': 'sql',
  '.graphql': 'graphql', '.gql': 'graphql',
  '.proto': 'protobuf',
  '.toml': 'toml',
  '.ini': 'ini', '.cfg': 'ini',
  '.vue': 'xml',
  '.svelte': 'xml',
  '.r': 'r', '.R': 'r',
  '.lua': 'lua',
  '.dart': 'dart',
  '.zig': 'zig',
  '.ex': 'elixir', '.exs': 'elixir',
  '.erl': 'erlang',
  '.hs': 'haskell',
  '.ml': 'ocaml',
  '.clj': 'clojure', '.cljs': 'clojure',
  '.dockerfile': 'dockerfile',
  '.tf': 'hcl',
  '.cmake': 'cmake',
  '.makefile': 'makefile',
  '.pl': 'perl', '.pm': 'perl',
};

// Special filenames without extensions that we treat as code/text
const SPECIAL_FILENAMES: Record<string, string> = {
  'dockerfile': 'dockerfile',
  'makefile': 'makefile',
  'gnumakefile': 'makefile',
  'cmakelists.txt': 'cmake',
  'gemfile': 'ruby',
  'rakefile': 'ruby',
  'vagrantfile': 'ruby',
  '.gitignore': 'bash',
  '.gitattributes': 'bash',
  '.editorconfig': 'ini',
  '.env': 'bash',
  '.env.local': 'bash',
  '.env.example': 'bash',
  '.babelrc': 'json',
  '.eslintrc': 'json',
  '.prettierrc': 'json',
  '.npmrc': 'ini',
};

// Text files that should be displayed as markdown (rich text)
const MARKDOWN_FILENAMES = new Set([
  'readme', 'readme.txt',
  'license', 'license.txt',
  'changelog', 'changelog.txt',
  'contributing', 'contributing.txt',
  'authors', 'authors.txt',
  'todo', 'todo.txt',
]);

// Binary document extensions
const PDF_EXTENSIONS = new Set(['.pdf']);
const DOCUMENT_EXTENSIONS = new Set(['.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls']);

// Max file size for code files (200KB) to avoid fetching huge files
const MAX_CODE_FILE_SIZE = 200 * 1024;
// Max file size for binary documents (50MB)
const MAX_BINARY_FILE_SIZE = 50 * 1024 * 1024;

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot).toLowerCase();
}

export function isMarkdownFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  if (ext === '.md' || ext === '.markdown') return true;

  // README, LICENSE etc. without extensions → treat as markdown
  const baseName = (fileName.split('/').pop() || '').toLowerCase();
  return MARKDOWN_FILENAMES.has(baseName);
}

export function isCodeFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  if (ext in CODE_EXTENSIONS) return true;

  // Special filenames like Dockerfile, Makefile
  const baseName = (fileName.split('/').pop() || '').toLowerCase();
  return baseName in SPECIAL_FILENAMES;
}

export function isPdfFile(fileName: string): boolean {
  return PDF_EXTENSIONS.has(getFileExtension(fileName));
}

export function isDocumentFile(fileName: string): boolean {
  return DOCUMENT_EXTENSIONS.has(getFileExtension(fileName));
}

export function isBinaryFile(fileName: string): boolean {
  return isPdfFile(fileName) || isDocumentFile(fileName);
}

export function isSupportedFile(fileName: string): boolean {
  return isMarkdownFile(fileName) || isCodeFile(fileName) || isBinaryFile(fileName);
}

export function getFileType(fileName: string): FileType {
  if (isMarkdownFile(fileName)) return 'markdown';
  if (isPdfFile(fileName)) return 'pdf';
  if (isDocumentFile(fileName)) return 'document';
  return 'code';
}

export function getRawUrl(config: RepoConfig, filePath: string): string {
  // Encode each path segment for URL (handle Chinese characters)
  const encodedPath = filePath.split('/').map(s => encodeURIComponent(s)).join('/');
  return `${GITHUB_RAW_BASE}/${config.owner}/${config.repo}/${config.branch}/${encodedPath}`;
}

export function getLanguage(fileName: string): string {
  // Handle special filenames first
  const baseName = (fileName.split('/').pop() || '').toLowerCase();
  if (baseName in SPECIAL_FILENAMES) return SPECIAL_FILENAMES[baseName];

  const ext = getFileExtension(fileName);
  return CODE_EXTENSIONS[ext] || 'text';
}

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

// Helper: Format filename to title
function formatFileNameToTitle(fileName: string): string {
  if (isMarkdownFile(fileName)) {
    // Markdown: "my-doc.md" -> "My Doc"
    return fileName
      .replace(/\.(md|markdown)$/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
  // Code files: keep original filename
  return fileName;
}

// Helper: Generate article ID from file path
function generateArticleId(repoId: string, filePath: string): string {
  const cleanPath = isMarkdownFile(filePath)
    ? filePath.replace(/\.(md|markdown)$/i, "")
    : filePath;
  return `${repoId}-${cleanPath.replace(/\//g, "-")}`;
}

// Helper: Generate slug from file path
function generateSlug(filePath: string): string {
  const cleanPath = isMarkdownFile(filePath)
    ? filePath.replace(/\.(md|markdown)$/i, "")
    : filePath;
  return cleanPath.replace(/\//g, "-");
}

async function fetchGitHub<T>(url: string, etag?: string): Promise<{ data: T; etag?: string }> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };

  // Support GitHub Token for private repos
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('github-token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  if (etag) {
    headers["If-None-Match"] = etag;
  }

  const response = await fetch(url, { headers });

  if (response.status === 304) {
    return { data: null as T, etag };
  }

  if (response.status === 403) {
    const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
    const rateLimitReset = response.headers.get("X-RateLimit-Reset");
    if (rateLimitRemaining === "0" && rateLimitReset) {
      const resetDate = new Date(parseInt(rateLimitReset) * 1000);
      throw new GitHubError(
        `Rate limit exceeded. Resets at ${resetDate.toLocaleString()}`,
        403,
        response
      );
    }
  }

  if (!response.ok) {
    throw new GitHubError(
      `GitHub API error: ${response.statusText}`,
      response.status,
      response
    );
  }

  const data = await response.json();
  const newEtag = response.headers.get("ETag") || undefined;

  return { data, etag: newEtag };
}

export async function getRepoFiles(
  config: RepoConfig,
  currentPath?: string
): Promise<GitHubFile[]> {
  const { owner, repo, branch, path } = config;
  const targetPath = currentPath || path || "";
  // Encode path for API request (handle Chinese characters)
  const encodedPath = targetPath.split('/').map(encodeURIComponent).join('/');
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`;

  const { data } = await fetchGitHub<GitHubFile[] | GitHubFile>(url);

  if (Array.isArray(data)) {
    return data;
  }

  return data ? [data] : [];
}

export async function getFileContent(
  config: RepoConfig,
  filePath: string,
  knownSha?: string,
  knownSize?: number
): Promise<{ content: string; sha: string; size: number }> {
  const { owner, repo, branch } = config;

  // Directly use raw.githubusercontent.com — no rate limit, no API quota
  const encodedPath = filePath.split('/').map(s => encodeURIComponent(s)).join('/');
  const rawUrl = `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${encodedPath}`;
  const response = await fetch(rawUrl);

  if (!response.ok) {
    throw new GitHubError(
      `Failed to fetch raw content: ${response.statusText}`,
      response.status,
      response
    );
  }

  const content = await response.text();

  return {
    content,
    sha: knownSha || "",
    size: knownSize || content.length,
  };
}

export function parseFileTree(files: GitHubFile[]): ArticleTree[] {
  const tree: ArticleTree[] = [];

  // Sort files: directories first, then files
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === "dir" ? -1 : 1;
  });

  for (const file of sortedFiles) {
    if (file.type === "dir") {
      tree.push({
        name: file.name,
        path: file.path,
        type: "dir",
        children: [],
      });
    } else if (isSupportedFile(file.name)) {
      const title = formatFileNameToTitle(file.name);
      const fileType = getFileType(file.name);

      tree.push({
        name: file.name,
        path: file.path,
        type: "file",
        article: {
          id: "",
          slug: generateSlug(file.path),
          title,
          content: "",
          path: file.path,
          sha: file.sha,
          size: file.size,
          updatedAt: new Date().toISOString(),
          repoId: "",
          repoName: "",
          fileType,
          language: fileType === 'code' ? getLanguage(file.name) : undefined,
        },
      });
    }
  }

  return tree;
}

interface GitTreeItem {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
  url: string;
}

// Use Git Trees API to get all files in one request (saves API calls)
async function getRepoTree(config: RepoConfig): Promise<GitTreeItem[]> {
  const { owner, repo, branch, path } = config;

  // First get the branch sha
  const branchUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/branches/${branch}`;
  const { data: branchData } = await fetchGitHub<{ commit: { sha: string } }>(branchUrl);
  const treeSha = branchData.commit.sha;

  // Get recursive tree (all files in one request!)
  const treeUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`;
  const { data: treeData } = await fetchGitHub<{ tree: GitTreeItem[] }>(treeUrl);

  let files = treeData.tree.filter((item) => item.type === "blob");
  console.log('[getRepoTree] Total blobs:', files.length, 'Config path:', path);

  // Filter by path if specified
  // Note: GitHub Tree API returns decoded paths (actual Chinese characters, not URL-encoded)
  // Ensure the path is decoded for comparison
  if (path) {
    let decodedPath = path;
    try {
      decodedPath = decodeURIComponent(path);
    } catch {
      // Path is already decoded or not encoded
    }
    const prefix = decodedPath.endsWith("/") ? decodedPath : decodedPath + "/";
    console.log('[getRepoTree] Filtering by prefix:', prefix);
    files = files.filter((item) => {
      const matches = item.path.startsWith(prefix);
      console.log('[getRepoTree] Checking:', item.path, 'matches:', matches);
      return matches;
    });
    console.log('[getRepoTree] After filtering:', files.length);
  }

  return files;
}

export async function fetchAllFiles(
  config: RepoConfig,
  onProgress?: (current: number, total: number) => void
): Promise<Article[]> {
  const articles: Article[] = [];
  const errors: string[] = [];

  try {
    // Use tree API to get all files in ONE request (saves API calls)
    const allFiles = await getRepoTree(config);

    // Filter supported files, skip oversized files
    const supportedFiles = allFiles.filter((f) => {
      const fileName = f.path.split("/").pop() || "";
      console.log('[fetchAllFiles] Checking file:', f.path, 'size:', f.size, 'name:', fileName);
      if (!isSupportedFile(fileName)) {
        console.log('[fetchAllFiles] Skipping (not supported):', fileName);
        return false;
      }
      if (isCodeFile(fileName) && f.size && f.size > MAX_CODE_FILE_SIZE) {
        console.log('[fetchAllFiles] Skipping (code file too large):', fileName);
        return false;
      }
      if (isBinaryFile(fileName) && f.size && f.size > MAX_BINARY_FILE_SIZE) {
        console.log('[fetchAllFiles] Skipping (binary too large):', fileName);
        return false;
      }
      console.log('[fetchAllFiles] Including:', fileName);
      return true;
    });
    console.log('[fetchAllFiles] Total files from API:', allFiles.length, 'Supported:', supportedFiles.length);

    onProgress?.(0, supportedFiles.length);

    // Fetch content for each file
    for (let i = 0; i < supportedFiles.length; i++) {
      const file = supportedFiles[i];
      try {
        // Decode path for display (handle Chinese characters)
        const decodedPath = decodeURIComponent(file.path);
        const fileName = decodedPath.split("/").pop() || "";
        const title = formatFileNameToTitle(fileName);
        const fileType = getFileType(fileName);

        if (isBinaryFile(fileName)) {
          // Binary files: store URL reference only, don't fetch content
          articles.push({
            id: generateArticleId(config.id, decodedPath),
            slug: generateSlug(decodedPath),
            title,
            content: '',
            path: decodedPath,
            sha: file.sha,
            size: file.size || 0,
            updatedAt: new Date().toISOString(),
            repoId: config.id,
            repoName: config.name,
            fileType,
            rawUrl: getRawUrl(config, file.path), // Use encoded path for URL
          });
        } else {
          // Text files: fetch content
          const { content } = await getFileContent(config, file.path, file.sha, file.size);

          articles.push({
            id: generateArticleId(config.id, decodedPath),
            slug: generateSlug(decodedPath),
            title,
            content,
            path: decodedPath,
            sha: file.sha,
            size: file.size || content.length,
            updatedAt: new Date().toISOString(),
            repoId: config.id,
            repoName: config.name,
            fileType,
            language: fileType === 'code' ? getLanguage(fileName) : undefined,
          });
        }

        onProgress?.(i + 1, supportedFiles.length);
      } catch (error) {
        errors.push(`Failed to fetch ${file.path}: ${error}`);
      }
    }
  } catch (error) {
    // Fallback: if tree API fails (e.g., repo too big), use recursive traversal
    console.warn("Tree API failed, falling back to recursive traversal:", error);
    return fetchAllFilesFallback(config, onProgress);
  }

  if (errors.length > 0) {
    console.warn(`[fetchAllFiles] ${errors.length} errors during sync:`, errors);
  }

  return articles;
}

// Keep old name as alias for backward compatibility
export const fetchAllMarkdownFiles = fetchAllFiles;

// Fallback: recursive traversal (original method)
async function fetchAllFilesFallback(
  config: RepoConfig,
  onProgress?: (current: number, total: number) => void
): Promise<Article[]> {
  const articles: Article[] = [];
  const errors: string[] = [];

  async function traverse(path?: string) {
    try {
      const files = await getRepoFiles(config, path);

      const supportedFiles = files.filter(
        (f) => f.type === "file" && isSupportedFile(f.name) &&
               !(isCodeFile(f.name) && f.size > MAX_CODE_FILE_SIZE) &&
               !(isBinaryFile(f.name) && f.size > MAX_BINARY_FILE_SIZE)
      );
      const dirs = files.filter((f) => f.type === "dir");

      for (let i = 0; i < supportedFiles.length; i++) {
        const file = supportedFiles[i];
        try {
          // Decode path for display (handle Chinese characters)
          const decodedPath = decodeURIComponent(file.path);
          const title = formatFileNameToTitle(file.name);
          const fileType = getFileType(file.name);

          if (isBinaryFile(file.name)) {
            articles.push({
              id: generateArticleId(config.id, decodedPath),
              slug: generateSlug(decodedPath),
              title,
              content: '',
              path: decodedPath,
              sha: file.sha,
              size: file.size,
              updatedAt: new Date().toISOString(),
              repoId: config.id,
              repoName: config.name,
              fileType,
              rawUrl: getRawUrl(config, file.path), // Use encoded path for URL
            });
          } else {
            const { content } = await getFileContent(config, file.path, file.sha, file.size);

            articles.push({
              id: generateArticleId(config.id, decodedPath),
              slug: generateSlug(decodedPath),
              title,
              content,
              path: decodedPath,
              sha: file.sha,
              size: file.size || content.length,
              updatedAt: new Date().toISOString(),
              repoId: config.id,
              repoName: config.name,
              fileType,
              language: fileType === 'code' ? getLanguage(file.name) : undefined,
            });
          }

          onProgress?.(articles.length, supportedFiles.length + dirs.length);
        } catch (error) {
          errors.push(`Failed to fetch ${file.path}: ${error}`);
        }
      }

      for (const dir of dirs) {
        await traverse(dir.path);
      }
    } catch (error) {
      errors.push(`Failed to traverse ${path}: ${error}`);
    }
  }

  await traverse(config.path);

  return articles;
}

export function convertImagePaths(content: string, config: RepoConfig): string {
  const { owner, repo, branch } = config;

  return content.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, src) => {
      if (src.startsWith("http")) return match;

      // Handle absolute paths
      const cleanSrc = src.startsWith("/") ? src.slice(1) : src;
      const rawUrl = `${GITHUB_RAW_BASE}/${owner}/${repo}/${branch}/${cleanSrc}`;
      return `![${alt}](${rawUrl})`;
    }
  );
}

export function extractTitleFromContent(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}
