export async function syncSessionCookies(
  accessToken: string,
  refreshToken?: string
): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, refreshToken }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearSessionCookies(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}
