import { describe, it, expect } from 'vitest';

function buildTargetUrl(rawBaseUrl: string, url: string): URL {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return new URL(url);
  }

  const base = rawBaseUrl.replace(/\/+$/, '');
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;

  if (base.endsWith('/api/v1') && cleanUrl.startsWith('/api/v1/')) {
    return new URL(base + cleanUrl.slice('/api/v1'.length));
  }

  return new URL(base + cleanUrl);
}

describe('buildTargetUrl deduplication', () => {
  it('deduplicates /api/v1 when both base and url contain /api/v1', () => {
    const result = buildTargetUrl(
      'https://heroku-7usd-5a73e86b5b14.herokuapp.com/api/v1',
      '/api/v1/auth/login'
    );
    expect(result.toString()).toBe(
      'https://heroku-7usd-5a73e86b5b14.herokuapp.com/api/v1/auth/login'
    );
  });

  it('keeps /api/v1 when base has no prefix', () => {
    const result = buildTargetUrl(
      'https://heroku-7usd-5a73e86b5b14.herokuapp.com',
      '/api/v1/auth/login'
    );
    expect(result.toString()).toBe(
      'https://heroku-7usd-5a73e86b5b14.herokuapp.com/api/v1/auth/login'
    );
  });

  it('works with localhost:8080 and /api/v1', () => {
    const result = buildTargetUrl('http://localhost:8080/api/v1', '/api/v1/users/me');
    expect(result.toString()).toBe('http://localhost:8080/api/v1/users/me');
  });

  it('handles absolute URLs directly', () => {
    const result = buildTargetUrl(
      'http://localhost:8080/api/v1',
      'https://external.service.com/webhook'
    );
    expect(result.toString()).toBe('https://external.service.com/webhook');
  });
});

describe('params serialization and flattening', () => {
  function serializeParamsToUrl(baseUrl: string, url: string, params?: any): URL {
    const targetUrl = buildTargetUrl(baseUrl, url);
    if (params) {
      const appendParam = (key: string, value: any) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (v !== undefined && v !== null) {
              targetUrl.searchParams.append(key, String(v));
            }
          });
        } else if (typeof value === 'object' && !(value instanceof Date)) {
          Object.entries(value).forEach(([subKey, subVal]) => {
            appendParam(subKey, subVal);
          });
        } else {
          targetUrl.searchParams.append(key, String(value));
        }
      };

      Object.entries(params).forEach(([key, value]) => {
        appendParam(key, value);
      });
    }
    return targetUrl;
  }

  it('flattens nested pageable object into page and size query parameters', () => {
    const url = serializeParamsToUrl(
      'https://heroku-7usd-5a73e86b5b14.herokuapp.com/api/v1',
      '/photos/feed',
      {
        friendId: 'f-123',
        pageable: { page: 0, size: 50 },
      }
    );
    expect(url.searchParams.get('friendId')).toBe('f-123');
    expect(url.searchParams.get('page')).toBe('0');
    expect(url.searchParams.get('size')).toBe('50');
    expect(url.searchParams.get('pageable')).toBeNull();
  });

  it('omits undefined or null parameters safely', () => {
    const url = serializeParamsToUrl(
      'https://heroku-7usd-5a73e86b5b14.herokuapp.com/api/v1',
      '/photos/feed',
      {
        friendId: undefined,
        pageable: { page: 1, size: 20 },
      }
    );
    expect(url.searchParams.has('friendId')).toBe(false);
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('size')).toBe('20');
  });
});
