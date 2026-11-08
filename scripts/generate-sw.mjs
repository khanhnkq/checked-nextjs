import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Lấy git commit SHA hiện tại nếu có git
 */
function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'development';
  }
}

/**
 * Sinh nội dung template Service Worker với version và tối ưu WebKit iOS/Android
 */
export function generateServiceWorkerContent(version, builtAt) {
  return `/**
 * Checked Service Worker (Native PWA - Zero-Dependency)
 * Generated at: ${builtAt}
 * Version: ${version}
 * Tối ưu hóa cho Next.js 15 & React 19 trên cả iOS Standalone và Android.
 */

const CACHE_NAME = 'checked-pwa-${version}';

const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon-32x32.png',
  '/logo.png',
  '/gemini.svg',
];

// 1. Cài đặt Service Worker và Precache các tài nguyên thiết yếu
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 2. Kích hoạt và dọn dẹp các cache phiên bản cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 3. Xử lý yêu cầu mạng với chiến lược Cache thông minh
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bỏ qua các request không phải GET hoặc extension trình duyệt
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Bỏ qua sw.js và version.json để luôn fetch trực tiếp từ server
  if (url.pathname === '/sw.js' || url.pathname === '/version.json') {
    return;
  }

  // A. Yêu cầu API & Realtime (WebSocket/STOMP): Luôn luôn Network-Only để đảm bảo tính thời gian thực
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws')) {
    return;
  }

  // B. Điều hướng trang chính (HTML Navigation): Network-First, fallback về Offline Page nếu mất mạng
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Bỏ qua cache redirect lỗi trên iOS: if response.redirected return cleanResponse
          if (response.redirected) {
            const cleanResponse = new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
            return cleanResponse;
          }

          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const offlineFallback = await caches.match('/offline');
          return offlineFallback || new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // C. Static chunks của Next.js (/_next/static/*) và Icons: Cache-First
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          // Bỏ qua cache redirect lỗi trên iOS: if response.redirected return cleanResponse
          if (networkResponse.redirected) {
            const cleanResponse = new Response(networkResponse.body, {
              status: networkResponse.status,
              statusText: networkResponse.statusText,
              headers: networkResponse.headers,
            });
            return cleanResponse;
          }

          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // D. Các tài nguyên khác (Stale-While-Revalidate): Ưu tiên tốc độ, ngầm cập nhật
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          // Bỏ qua cache redirect lỗi trên iOS: if response.redirected return cleanResponse
          if (networkResponse.redirected) {
            const cleanResponse = new Response(networkResponse.body, {
              status: networkResponse.status,
              statusText: networkResponse.statusText,
              headers: networkResponse.headers,
            });
            return cleanResponse;
          }

          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
`;
}

/**
 * Main generator function
 */
export function generateSw(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const publicDir = path.join(rootDir, 'public');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const envSha = options.envSha !== undefined ? options.envSha : process.env.VERCEL_GIT_COMMIT_SHA;
  const hasSha = typeof envSha === 'string' && envSha.trim().length > 0;

  const gitCommit = hasSha ? envSha.trim() : getGitCommit();
  const version = hasSha ? envSha.trim() : `build-${Date.now()}`;
  const builtAt = new Date().toISOString();

  // 1. Ghi file public/version.json
  const versionData = {
    version,
    builtAt,
    gitCommit,
  };
  const versionFilePath = path.join(publicDir, 'version.json');
  fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2) + '\n', 'utf8');

  // 2. Ghi file public/sw.js
  const swContent = generateServiceWorkerContent(version, builtAt);
  const swFilePath = path.join(publicDir, 'sw.js');
  fs.writeFileSync(swFilePath, swContent, 'utf8');

  console.log(`[PWA] Generated sw.js & version.json (version: ${version}, cache: checked-pwa-${version})`);

  return {
    version,
    builtAt,
    gitCommit,
    versionFilePath,
    swFilePath,
  };
}

// Chạy trực tiếp qua CLI (ví dụ: node scripts/generate-sw.mjs)
const isDirectRun = process.argv[1] && (
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href ||
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
);

if (isDirectRun) {
  generateSw();
}
