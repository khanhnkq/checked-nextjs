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
