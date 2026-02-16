# Pretty GitDoc — 产品文档（体系化草案）

## 1. 产品定位
- 面向个人与团队的「GitHub 仓库即知识库」阅读器
- 聚焦“优雅阅读、离线可用、轻分享”，走 Obsidian 风格的内容组织与沉浸体验
- 全开源，支持 Web/PWA 与多端分发

## 2. 目标用户与价值
- 开发者、技术写作者、团队文档维护者
- 价值：
  - 一键接入公开/私有仓库文档，目录自动成树
  - 在线即看，安装后离线访问常看内容
  - 跨端一致体验，便捷分享

## 3. 核心功能（MVP → v1）
- 仓库接入：输入仓库或目录 URL，自动解析 owner/repo/branch/path
- 目录树：按路径生成层级，中文路径友好展示
- 阅读器：
  - Markdown 渲染（Toc、标题锚点、高亮）
  - 代码文件只读查看
  - PDF 内嵌预览（react-pdf + pdf.js ESM worker）
  - DOCX 转 HTML 预览（mammoth）
  - 阅读进度记录
- 搜索（v1）：基于前端索引的全文检索
- 分享：Web Share / 复制链接
- 离线：Serwist 缓存策略（Raw 内容 CacheFirst、图片 StaleWhileRevalidate、API NetworkFirst）
- 设置：字体、行距、主题（浅/深/系统）

## 4. 架构与技术栈
- Web：Next.js App Router、TypeScript、Tailwind、Zustand
- PWA：@serwist/next（生产启用，开发禁用）、manifest、可安装提示
- 内容源：GitHub API + Raw 内容，支持 Token（本地存储，仅用户侧）
- 数据缓存：IndexedDB（idb），文章与阅读进度
- 结构模块：
  - app/*：页面与布局
  - components/reader/*：侧栏、导航、阅读器 UI
  - components/markdown/*：Markdown/PDF/DOCX 渲染
  - lib/github.ts：内容抓取与路径处理
  - lib/cache.ts：IndexedDB 管理与树构建

## 5. 平台发布策略
- Web：
  - CI/CD：Vercel（GitHub 导入自动部署）
  - 域名：启用 HTTPS，提供 PWA 安装提示
- Android：
  - PWA → TWA（PWABuilder/Bubblewrap 生成 APK/签名）
  - 需配置 /.well-known/assetlinks.json（域名与包名绑定）
- iOS：
  - A2HS（添加到主屏）即用
  - 上架路径：Capacitor 封装（WKWebView），构建 IPA 提交 App Store
- 桌面（macOS/Windows）：
  - Tauri（优先）或 Electron 封装 Web 端，打包 DMG/MSI/EXE

## 6. 开源与治理
- 许可证：MIT（建议）
- 贡献规范：Issue 模板、PR 模板、Commit 信息约定（Conventional Commits）
- Roadmap：docs/roadmap.md（建议）

## 7. 版本规划
- MVP（当前）：
  - 仓库接入、目录树、Markdown/PDF/DOCX 阅读、分享、PWA 安装、自动同步
- v1.0：
  - 全文搜索、收藏与最近阅读、文档内链接跳转优化、移动端交互优化
  - 私有仓库 Token 引导与最小代理支持（可选）
  - Android TWA 上架、iOS Capacitor TestFlight、桌面 Tauri Alpha

## 8. 安全与隐私
- 不收集用户数据；私有 Token 存于本地（localStorage），不上传
- 如接入代理，仅做签名转发与缓存，不持久存储私密内容

## 9. 发布流程（概览）
1) Web：合并到 main → Vercel 自动构建 → 获取预览/生产 URL
2) Android：PWABuilder 生成包 → 配置 assetlinks.json → Play Console 发布
3) iOS：Capacitor 项目打包 → Xcode 构建/上传 → App Store Connect
4) 桌面：Tauri 打包 → GitHub Actions 产出 DMG/MSI/EXE → GitHub Releases

## 10. 后续演进
- 笔记/高亮/批注（本地或云同步）
- 多源接入：GitLab、Gitea、S3/OSS 文档
- 团队协作：共享书架、只读分享 Token、空间与权限

—— 本文档为第一版纲要，随项目演进迭代完善。 
