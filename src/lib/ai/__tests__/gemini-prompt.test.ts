import { describe, it, expect } from 'vitest';
import { buildGeminiVisionPrompt, parseCurrencyAmount } from '../gemini-prompt';

describe('Gemini Prompt Builder (iOS Parity)', () => {
  it('builds prompt for default Vietnamese language', () => {
    const prompt = buildGeminiVisionPrompt();

    expect(prompt).toContain('Vietnamese');
    expect(prompt).toContain('Phở bò tái');
    expect(prompt).toContain('is_food');
    expect(prompt).toContain('is_bill');
    expect(prompt).toContain('calories');
    expect(prompt).toContain('total_amount_str');
    expect(prompt).toContain('merchant_name');
    expect(prompt).toContain('suggested_caption');
  });

  it('builds prompt for English language', () => {
    const prompt = buildGeminiVisionPrompt({ targetLanguage: 'en' });

    expect(prompt).toContain('English');
    expect(prompt).toContain('Fried Chicken');
  });

  it('builds prompt for Japanese language', () => {
    const prompt = buildGeminiVisionPrompt({ targetLanguage: 'ja' });

    expect(prompt).toContain('Japanese');
    expect(prompt).toContain('フライドチキン');
  });

  describe('parseCurrencyAmount', () => {
    it('parses Vietnamese format with dots and đ symbol', () => {
      expect(parseCurrencyAmount('125.000đ')).toBe(125000);
      expect(parseCurrencyAmount('75.000 đ')).toBe(75000);
      expect(parseCurrencyAmount('1.250.000 VND')).toBe(1250000);
    });

    it('parses comma-separated numbers', () => {
      expect(parseCurrencyAmount('65,000')).toBe(65000);
    });

    it('returns null for empty, zero, or non-numeric strings', () => {
      expect(parseCurrencyAmount(null)).toBeNull();
      expect(parseCurrencyAmount('')).toBeNull();
      expect(parseCurrencyAmount('Chưa rõ')).toBeNull();
      expect(parseCurrencyAmount('0')).toBeNull();
    });
  });
});
