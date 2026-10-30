import { describe, it, expect } from 'vitest';
import manifest from '../manifest';

describe('Web App Manifest', () => {
  it('returns valid PWA manifest object with required standalone configuration', () => {
    const config = manifest();

    expect(config.name).toBe('Checked - Chia sẻ khoảnh khắc & tài chính');
    expect(config.short_name).toBe('Checked');
    expect(config.start_url).toBe('/');
    expect(config.display).toBe('standalone');
    expect(config.background_color).toBe('#EDE9DF');
    expect(config.theme_color).toBe('#EDE9DF');
    expect(config.orientation).toBe('portrait');

    expect(config.icons).toBeDefined();
    expect(config.icons?.length).toBeGreaterThanOrEqual(3);

    // Verify presence of 192, 512, and maskable icons
    const icon192 = config.icons?.find((icon) => icon.sizes === '192x192');
    const icon512 = config.icons?.find((icon) => icon.sizes === '512x512' && icon.purpose !== 'maskable');
    const maskable512 = config.icons?.find((icon) => icon.purpose === 'maskable');

    expect(icon192).toBeDefined();
    expect(icon512).toBeDefined();
    expect(maskable512).toBeDefined();
  });
});
