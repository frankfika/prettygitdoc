import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.SITE_URL || "http://localhost:3002";
const OUT = path.resolve("docs/assets");
fs.mkdirSync(OUT, { recursive: true });

async function snap(page, url, file, opts = {}) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(opts.delay ?? 800);
  await page.screenshot({
    path: path.join(OUT, file),
    fullPage: true,
  });
  console.log("✓", file, url);
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 首页 + 安装横幅
  await snap(page, `${BASE}/?share=1`, "home.png");

  // 设置页
  await snap(page, `${BASE}/settings`, "settings.png");

  // 安装横幅细节（裁切顶部 400px）
  await page.goto(`${BASE}/?share=1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const banner = await page.locator("text=安装 Pretty GitDoc 到设备").first();
  if (await banner.isVisible().catch(() => false)) {
    const box = await banner.boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(OUT, "pwa-install.png"),
        clip: {
          x: 0,
          y: 0,
          width: 1280,
          height: Math.min(400, page.viewportSize().height),
        },
      });
      console.log("✓ pwa-install.png");
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

