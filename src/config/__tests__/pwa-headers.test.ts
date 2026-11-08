import { describe, it, expect } from 'vitest';
import nextConfig from '../../../next.config';

describe('next.config.ts PWA headers', () => {
  it('should define an async headers function', () => {
    expect(nextConfig.headers).toBeDefined();
    expect(typeof nextConfig.headers).toBe('function');
  });

  it('should return no-cache headers for /sw.js', async () => {
    if (!nextConfig.headers) {
      throw new Error('nextConfig.headers is not defined');
    }

    const headersList = await nextConfig.headers();
    const swHeaderConfig = headersList.find((item) => item.source === '/sw.js');

    expect(swHeaderConfig).toBeDefined();
    expect(swHeaderConfig?.headers).toEqual(
      expect.arrayContaining([
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Pragma', value: 'no-cache' },
        { key: 'Expires', value: '0' },
        { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
      ])
    );
  });

  it('should return no-cache headers for /version.json', async () => {
    if (!nextConfig.headers) {
      throw new Error('nextConfig.headers is not defined');
    }

    const headersList = await nextConfig.headers();
    const versionHeaderConfig = headersList.find((item) => item.source === '/version.json');

    expect(versionHeaderConfig).toBeDefined();
    expect(versionHeaderConfig?.headers).toEqual(
      expect.arrayContaining([
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Pragma', value: 'no-cache' },
        { key: 'Expires', value: '0' },
      ])
    );
  });
});
