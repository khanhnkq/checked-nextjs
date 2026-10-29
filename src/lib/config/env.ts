/**
 * Quản lý và kiểm tra nghiêm ngặt biến môi trường
 * TUYỆT ĐỐI KHÔNG HARDCODE KEY / URL VÀO CODE.
 * NẾU BIẾN BỊ TRỐNG HOẶC CHƯA CẤU HÌNH -> BẮT BUỘC NÉM RA LỖI RÕ RÀNG.
 */

export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `[Config Error] Biến môi trường bắt buộc "${key}" đang bị trống hoặc chưa được cấu hình! ` +
      `Vui lòng kiểm tra và thiết lập đầy đủ trong file .env.local hoặc môi trường hiện tại.`
    );
  }
  return value.trim();
}

export function optionalEnv(key: string, defaultValue = ''): string {
  const value = process.env[key];
  return value ? value.trim() : defaultValue;
}

export const env = {
  /**
   * URL cơ sở của REST API Backend
   * Bắt buộc có NEXT_PUBLIC_API_BASE_URL, nếu trống sẽ throw Error
   */
  get apiBaseUrl(): string {
    return requireEnv('NEXT_PUBLIC_API_BASE_URL');
  },

  /**
   * URL của WebSocket STOMP Broker
   * Bắt buộc có NEXT_PUBLIC_WS_URL, nếu trống sẽ throw Error
   */
  get wsUrl(): string {
    return requireEnv('NEXT_PUBLIC_WS_URL');
  },

  /**
   * Domain của ứng dụng Web
   * Bắt buộc có NEXT_PUBLIC_APP_URL, nếu trống sẽ throw Error
   */
  get appUrl(): string {
    return requireEnv('NEXT_PUBLIC_APP_URL');
  },

  /**
   * Google Gemini API Key (Server-side only)
   * Bắt buộc có GEMINI_API_KEY, nếu trống sẽ throw Error
   */
  get geminiApiKey(): string {
    return requireEnv('GEMINI_API_KEY');
  },

  /**
   * Model Google Gemini
   */
  get geminiModel(): string {
    return optionalEnv('GEMINI_MODEL', 'gemini-2.0-flash');
  },

  /**
   * Debug Logs
   */
  get isDebug(): boolean {
    return optionalEnv('NEXT_PUBLIC_ENABLE_DEBUG_LOGS', 'false') === 'true';
  },
};
