/**
 * Haptic Feedback Engine đa nền tảng
 * - Android / Thiết bị hỗ trợ: Gọi navigator.vibrate()
 * - iOS Safari: Web Audio API sinh âm thanh click cơ học cực nhẹ 20ms tạo cảm giác bấm phím thật
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (typeof window === 'undefined') return;

  // 1. Thử rung bằng Web Vibration API
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      const duration = type === 'light' ? 15 : type === 'medium' ? 25 : 45;
      const success = navigator.vibrate(duration);
      if (success) return;
    } catch {
      // Bỏ qua nếu trình duyệt chặn
    }
  }

  // 2. Fallback âm thanh click cơ học siêu nhẹ cho iOS Safari
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'light' ? 1800 : 1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.02);

      gain.gain.setValueAtTime(type === 'light' ? 0.06 : 0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.025);
    }
  } catch {
    // Không làm gián đoạn UI nếu audio bị chặn
  }
}

export const haptics = {
  click: () => triggerHaptic('light'),
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  success: () => triggerHaptic('light'),
  error: () => triggerHaptic('heavy'),
};
