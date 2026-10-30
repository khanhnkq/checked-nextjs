import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVisionAnalysis, downscaleImageForVision } from '../useVisionAnalysis';

describe('useVisionAnalysis Hook (iOS VisionServiceCoordinator Parity)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('downscaleImageForVision handles string input safely', async () => {
    const result = await downscaleImageForVision('data:image/jpeg;base64,mock');
    expect(result).toBe('data:image/jpeg;base64,mock');
  });

  it('initializes with default idle state', () => {
    const { result } = renderHook(() => useVisionAnalysis());

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('successfully analyzes image and updates result', async () => {
    const mockData = {
      is_food: true,
      dish_name: 'Phở Bò',
      category: 'Phở/Bún/Mì',
      emoji: '🍜',
      confidence: 0.95,
      calories: 550,
      is_bill: false,
      scene_label: 'Ẩm thực',
      suggested_caption: '🍜 Phở Bò',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: mockData }),
    });
    global.fetch = mockFetch;

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useVisionAnalysis({ onSuccess }));

    let analysisResult;
    await act(async () => {
      analysisResult = await result.current.analyzeImage('data:image/jpeg;base64,sample');
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ai/vision-analyze',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.result).toEqual(mockData);
    expect(onSuccess).toHaveBeenCalledWith(mockData);
    expect(analysisResult).toEqual(mockData);
  });

  it('handles API errors gracefully without throwing', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: false, error: 'Model overloaded' }),
    });
    global.fetch = mockFetch;

    const onError = vi.fn();
    const { result } = renderHook(() => useVisionAnalysis({ onError }));

    await act(async () => {
      await result.current.analyzeImage('data:image/jpeg;base64,sample');
    });

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBe('Model overloaded');
    expect(onError).toHaveBeenCalledWith('Model overloaded');
  });

  it('clears state when reset is called', () => {
    const { result } = renderHook(() => useVisionAnalysis());

    act(() => {
      result.current.reset();
    });

    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
