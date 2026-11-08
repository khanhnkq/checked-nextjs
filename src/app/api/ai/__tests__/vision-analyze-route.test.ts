import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../vision-analyze/route';

// Mock @google/generative-ai
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

describe('POST /api/ai/vision-analyze Route Handler', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'test-gemini-key',
      GEMINI_MODEL: 'gemini-3.5-flash-lite',
      GEMINI_TEMPERATURE: '0.2',
      AI_VISION_LANGUAGE: 'vi',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 400 when imageBase64 is empty or missing', async () => {
    const request = new Request('http://localhost:3000/api/ai/vision-analyze', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: '' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.errorCode).toBe('INVALID_IMAGE');
  });

  it('returns MISSING_API_KEY when GEMINI_API_KEY is not defined', async () => {
    delete process.env.GEMINI_API_KEY;

    const request = new Request('http://localhost:3000/api/ai/vision-analyze', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: 'mockbase64string' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(false);
    expect(json.errorCode).toBe('MISSING_API_KEY');
    expect(json.error).toContain('Chưa cấu hình GEMINI_API_KEY');
  });

  it('returns MISSING_API_KEY when GEMINI_MODEL is not defined', async () => {
    delete process.env.GEMINI_MODEL;

    const request = new Request('http://localhost:3000/api/ai/vision-analyze', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: 'mockbase64string' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(false);
    expect(json.errorCode).toBe('MISSING_API_KEY');
    expect(json.error).toContain('Chưa cấu hình GEMINI_MODEL');
  });

  it('returns MISSING_API_KEY when GEMINI_TEMPERATURE is not defined', async () => {
    delete process.env.GEMINI_TEMPERATURE;

    const request = new Request('http://localhost:3000/api/ai/vision-analyze', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: 'mockbase64string' }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(false);
    expect(json.errorCode).toBe('MISSING_API_KEY');
    expect(json.error).toContain('Chưa cấu hình GEMINI_TEMPERATURE');
  });

  it('successfully analyzes food image and parses payload', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';

    const mockPayload = {
      is_food: true,
      dish_name: 'Phở Bò Tái Lăn',
      category: 'Phở/Bún/Mì',
      category_icon: 'Utensils',
      emoji: '🍜',
      confidence: 0.96,
      calories: 580,
      serving_size: '1 tô vừa',
      is_bill: false,
      total_amount_str: '',
      merchant_name: '',
      scene_label: 'Ẩm thực Việt',
      suggested_caption: '🍜 Phở Bò Tái Lăn thơm lừng',
    };

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(mockPayload),
      },
    });

    const request = new Request('http://localhost:3000/api/ai/vision-analyze', {
      method: 'POST',
      body: JSON.stringify({
        imageBase64: 'data:image/jpeg;base64,mockrawimagebytes',
        targetLanguage: 'vi',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.dish_name).toBe('Phở Bò Tái Lăn');
    expect(json.data.calories).toBe(580);
    expect(json.data.is_food).toBe(true);
  });

  it('successfully analyzes bill and parses numeric amount', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';

    const mockPayload = {
      is_food: false,
      dish_name: '',
      category: 'Hóa đơn',
      category_icon: 'Receipt',
      emoji: '🧾',
      confidence: 0.98,
      calories: null,
      serving_size: null,
      is_bill: true,
      total_amount_str: '135.000đ',
      merchant_name: 'Phúc Long Coffee',
      items: [{ name: 'Trà sen vàng', price: 65000, quantity: 1 }],
      scene_label: 'Thanh toán',
      suggested_caption: '🧾 Phúc Long Coffee · 135.000đ',
    };

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(mockPayload),
      },
    });

    const request = new Request('http://localhost:3000/api/ai/vision-analyze', {
      method: 'POST',
      body: JSON.stringify({
        imageBase64: 'mockbillbase64',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.is_bill).toBe(true);
    expect(json.data.total_amount_str).toBe('135.000đ');
    expect(json.data.total_amount_num).toBe(135000);
    expect(json.data.merchant_name).toBe('Phúc Long Coffee');
  });

  it('handles rate limit error gracefully', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';

    mockGenerateContent.mockRejectedValueOnce({
      status: 429,
      message: 'Resource has been exhausted (e.g. check quota)',
    });

    const request = new Request('http://localhost:3000/api/ai/vision-analyze', {
      method: 'POST',
      body: JSON.stringify({
        imageBase64: 'mockimagebase64',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(false);
    expect(json.errorCode).toBe('RATE_LIMIT');
  });

  it('triggers resilient fallback when dev mode or local key encounters auth/model error', async () => {
    process.env.GEMINI_API_KEY = 'AQ.Ab8RN6Jx0OvhZgkBqqUByShhH4K2oPDliurx3lhkNgaac8bnQw';
    process.env.DEV_MODE_ENABLED = 'true';

    mockGenerateContent.mockRejectedValueOnce({
      status: 401,
      message: 'API key not valid. Please pass a valid API key. ACCESS_TOKEN_TYPE_UNSUPPORTED',
    });

    const request = new Request('http://localhost:3000/api/ai/vision-analyze', {
      method: 'POST',
      body: JSON.stringify({
        imageBase64: 'data:image/jpeg;base64,mockrawimagebytes',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.is_food).toBe(true);
    expect(json.data.dish_name).toBe('Cơm tấm sườn nướng Checked');
    expect(json.data.calories).toBe(580);
  });
});
