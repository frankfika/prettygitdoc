import type { PrecacheEntry } from "@serwist/precaching";
import { installSerwist } from "@serwist/sw";
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from "@serwist/strategies";
import { registerRoute } from "@serwist/routing";
import { CacheableResponsePlugin } from "@serwist/cacheable-response";
import { ExpirationPlugin } from "@serwist/expiration";

declare global {
  interface ServiceWorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Install Serwist with precaching
installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
});

// Cache GitHub API responses (rate limit info, repo data)
registerRoute(
  ({ url }) => url.hostname === "api.github.com",
  new NetworkFirst({
    cacheName: "github-api-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Cache raw GitHub content (markdown files) - long term cache
registerRoute(
  ({ url }) => url.hostname === "raw.githubusercontent.com",
  new CacheFirst({
    cacheName: "github-raw-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 500,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache images from GitHub - use StaleWhileRevalidate for faster loading
registerRoute(
  ({ url }) =>
    url.hostname === "raw.githubusercontent.com" ||
    url.hostname === "camo.githubusercontent.com",
  new StaleWhileRevalidate({
    cacheName: "github-images-cache",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Fallback for navigation when offline - use Serwist's setCatchHandler instead
// Navigation fallback is handled by installSerwist's navigationPreload option
