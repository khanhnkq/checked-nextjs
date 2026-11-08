import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generateSw, generateServiceWorkerContent } from '../generate-sw.mjs';

const isVitest = Boolean(process.env.VITEST);

const runner = isVitest ? await import('vitest') : await import('node:test');
const { describe, it, beforeEach, afterEach } = runner;

describe('generate-sw script', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pwa-test-'));
    fs.mkdirSync(path.join(tempDir, 'public'), { recursive: true });
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('tạo ra public/version.json chứa version, builtAt, gitCommit', () => {
    const customSha = 'abcdef1234567890';
    const result = generateSw({ rootDir: tempDir, envSha: customSha });

    const versionFilePath = path.join(tempDir, 'public', 'version.json');
    assert.ok(fs.existsSync(versionFilePath), 'public/version.json phải tồn tại');

    const content = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
    assert.ok(content.version, 'version phải tồn tại');
    assert.ok(content.builtAt, 'builtAt phải tồn tại');
    assert.strictEqual(content.gitCommit, customSha, 'gitCommit phải khớp với customSha');
    assert.ok(!isNaN(Date.parse(content.builtAt)), 'builtAt phải là chuỗi ngày hợp lệ');
    assert.strictEqual(result.version, content.version);
  });

  it('sinh version với timestamp fallback khi không có VERCEL_GIT_COMMIT_SHA', () => {
    const result = generateSw({ rootDir: tempDir, envSha: '' });

    const versionFilePath = path.join(tempDir, 'public', 'version.json');
    const content = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));

    assert.match(content.version, /^build-\d+$/);
    assert.ok(content.gitCommit);
  });

  it('tạo ra public/sw.js chứa CACHE_NAME duy nhất, skipWaiting(), clients.claim() và xử lý cleanResponse cho redirect iOS WebKit', () => {
    const customSha = 'test-sha-999';
    generateSw({ rootDir: tempDir, envSha: customSha });

    const swFilePath = path.join(tempDir, 'public', 'sw.js');
    assert.ok(fs.existsSync(swFilePath), 'public/sw.js phải tồn tại');

    const swContent = fs.readFileSync(swFilePath, 'utf8');

    // Kiểm tra CACHE_NAME có chứa version
    assert.ok(
      swContent.includes(`CACHE_NAME = 'checked-pwa-test-sha-999'`) ||
      swContent.includes(`CACHE_NAME = "checked-pwa-test-sha-999"`) ||
      swContent.includes('checked-pwa-test-sha-999'),
      'sw.js phải chứa CACHE_NAME với version tương ứng'
    );

    // Kiểm tra skipWaiting() và clients.claim()
    assert.ok(swContent.includes('skipWaiting()'), 'sw.js phải có skipWaiting()');
    assert.ok(swContent.includes('clients.claim()'), 'sw.js phải có clients.claim()');

    // Kiểm tra tối ưu hóa cho iOS WebKit (xử lý response.redirected trả về cleanResponse)
    assert.ok(
      swContent.includes('redirected') && swContent.includes('cleanResponse'),
      'sw.js phải xử lý bỏ qua lỗi cache redirect trên iOS WebKit với cleanResponse'
    );
  });

  it('không chứa "/" trong PRECACHE_ASSETS nhưng vẫn chứa /offline, manifest và icons', () => {
    const swContent = generateServiceWorkerContent('test-version', new Date().toISOString());

    // Trích xuất mảng PRECACHE_ASSETS từ nội dung swContent
    const precacheMatch = swContent.match(/const\s+PRECACHE_ASSETS\s*=\s*\[([\s\S]*?)\];/);
    assert.ok(precacheMatch, 'sw.js phải định nghĩa PRECACHE_ASSETS');

    const precacheBlock = precacheMatch[1];
    const precacheItems = precacheBlock
      .split('\n')
      .map((line) => line.trim().replace(/^['"]|['"],?$/g, ''))
      .filter((line) => line.length > 0 && !line.startsWith('//'));

    // Kiểm tra KHÔNG chứa '/'
    assert.ok(
      !precacheItems.includes('/'),
      'PRECACHE_ASSETS KHÔNG được chứa "/" để tránh cache nhầm private home shell'
    );
    assert.ok(
      !swContent.includes("  '/',") && !swContent.includes('  "/",'),
      'swContent không được chứa dòng precache "/"'
    );

    // Kiểm tra PHẢI chứa '/offline', '/manifest.webmanifest' và icons
    assert.ok(precacheItems.includes('/offline'), 'PRECACHE_ASSETS phải chứa "/offline"');
    assert.ok(precacheItems.includes('/manifest.webmanifest'), 'PRECACHE_ASSETS phải chứa "/manifest.webmanifest"');
    assert.ok(precacheItems.includes('/icons/icon-192x192.png'), 'PRECACHE_ASSETS phải chứa icon 192');
    assert.ok(precacheItems.includes('/icons/icon-512x512.png'), 'PRECACHE_ASSETS phải chứa icon 512');
  });

  it('có thể chạy độc lập như một CLI script (node scripts/generate-sw.mjs)', () => {
    const scriptDir = path.dirname(fileURLToPath(import.meta.url));
    const scriptPath = path.resolve(scriptDir, '../generate-sw.mjs');

    const output = execSync(`node ${scriptPath}`, {
      cwd: tempDir,
      env: { ...process.env, VERCEL_GIT_COMMIT_SHA: 'cli-test-sha' },
    }).toString();

    assert.ok(output.includes('Generated') || output.includes('checked-pwa'), 'CLI phải log thông báo thành công');

    const versionPath = path.join(tempDir, 'public', 'version.json');
    const swPath = path.join(tempDir, 'public', 'sw.js');

    assert.ok(fs.existsSync(versionPath), 'public/version.json phải tồn tại sau khi chạy CLI');
    assert.ok(fs.existsSync(swPath), 'public/sw.js phải tồn tại sau khi chạy CLI');

    const versionJson = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    assert.strictEqual(versionJson.gitCommit, 'cli-test-sha');
  });
});
