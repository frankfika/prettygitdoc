<div align="center">
  <h1>Pretty GitDoc</h1>
  <p>GitHub 仓库即知识库 · 优雅阅读 · 一键安装 PWA · 多端发行</p>
</div>

## 特性
- 仓库即内容源：输入仓库或子目录 URL，自动解析与建树
- 优雅阅读：Markdown/Toc/代码高亮，PDF 内嵌预览，DOCX 转 HTML
- 离线可用：生产版启用 PWA 缓存策略（Serwist）
- 分享便捷：Web Share，不支持时自动复制链接
- 轻配置：Zustand 状态、IndexedDB 本地缓存；无后端即可起步

## 在线体验 & 安装
- 本地生产预览：http://localhost:3002/
- 生产部署：建议 Vercel，一键导入仓库即可
- 安装为 App：浏览器地址栏或“Install”按钮添加到设备（iOS 使用“添加到主屏幕”）

## 快速开始
```bash
# 开发
npm install
npm run dev   # http://localhost:3001/

# 生产构建与启动
npm run build
PORT=3002 npm run start
```

可选：若访问私有仓库，可在浏览器 LocalStorage 填入 `github-token`。

## 目录结构（要点）
```
app/                     # Next.js App Router 页面
components/              # UI 组件（reader、markdown）
lib/                     # GitHub 抓取与本地缓存
public/                  # 静态资源与 PWA manifest
docs/                    # 项目文档（产品、技能等）
  ├─ product.md          # 体系化产品文档（纲要）
  └─ skills/
     └─ claude-code/
        └─ prettygitdoc.skill.yaml
```

## 构建与发布
- Web：Vercel 导入仓库 → 自动构建（Next.js）
- Android：PWA → TWA（PWABuilder/Bubblewrap），需配置 `/.well-known/assetlinks.json`
- iOS：可直接 A2HS；若上架，建议 Capacitor 封装
- 桌面（macOS/Windows）：建议 Tauri 封装，GitHub Actions 发布到 Releases

## CI/CD
- 持续集成：push/pull request 到 main 自动执行 Lint/类型检查/构建（见 `.github/workflows/ci.yml`）
- 版本发布：打 `v*.*.*` 标签将自动创建 Release 草稿并附上构建产物（见 `.github/workflows/release.yml`）

## 截图
> 将截图放入 `docs/assets/`，下方路径为占位，可替换为你的实际文件。
- 首页与目录：`docs/assets/home.png`
- PDF/Docx 预览：`docs/assets/preview.png`
- PWA 安装引导：`docs/assets/pwa-install.png`

## 文档与路线
- 产品文档：[docs/product.md](./docs/product.md)
- Claude Code Skill（骨架）：[docs/skills/claude-code/prettygitdoc.skill.yaml](./docs/skills/claude-code/prettygitdoc.skill.yaml)

## 开源许可
MIT
