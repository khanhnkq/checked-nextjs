import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePhotoUpload, determineMealType, type UploadPhotoPayload } from '../usePhotoUpload';
import * as customFetcherModule from '@/lib/api/custom-fetcher';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('determineMealType helper', () => {
  it('determines BREAKFAST between 05:00 and 10:30', () => {
    const morning = new Date(2026, 9, 30, 8, 30);
    expect(determineMealType(morning)).toBe('BREAKFAST');
  });

  it('determines LUNCH between 10:30 and 14:00', () => {
    const noon = new Date(2026, 9, 30, 12, 15);
    expect(determineMealType(noon)).toBe('LUNCH');
  });

  it('determines SNACK between 14:00 and 17:30', () => {
    const afternoon = new Date(2026, 9, 30, 15, 0);
    expect(determineMealType(afternoon)).toBe('SNACK');
  });

  it('determines DINNER between 17:30 and 22:00', () => {
    const evening = new Date(2026, 9, 30, 19, 45);
    expect(determineMealType(evening)).toBe('DINNER');
  });

  it('determines SNACK late at night between 22:00 and 05:00', () => {
    const midnight = new Date(2026, 9, 30, 23, 30);
    expect(determineMealType(midnight)).toBe('SNACK');
  });
});

describe('usePhotoUpload hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('uploads photo successfully with metadata and invalidates cache', async () => {
    const mockResponse = {
      id: 'photo-123',
      imageUrl: 'https://cdn.checked.com/photo-123.jpg',
      caption: 'Bún bò ngon',
      amount: 65000,
      dishName: 'Bún Bò',
      calories: 620,
    };

    const fetcherSpy = vi
      .spyOn(customFetcherModule, 'customFetcher')
      .mockResolvedValue(mockResponse);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const onSuccess = vi.fn();

    const { result } = renderHook(() => usePhotoUpload({ onSuccess }), { wrapper });

    const payload: UploadPhotoPayload = {
      file: new Blob(['fake-image'], { type: 'image/jpeg' }),
      caption: 'Bún bò ngon',
      amount: 65000,
      dishName: 'Bún Bò',
      calories: 620,
      locationName: 'Quán Cô Như',
      latitude: 10.7769,
      longitude: 106.7009,
    };

    let res;
    await act(async () => {
      res = await result.current.uploadPhoto(payload);
    });

    expect(res).toEqual(mockResponse);
    expect(fetcherSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/v1/photos',
        method: 'POST',
      })
    );

    // Verify FormData entries
    const calledData = fetcherSpy.mock.calls[0][0].data as FormData;
    expect(calledData.get('caption')).toBe('Bún bò ngon');
    expect(calledData.get('amount')).toBe('65000');
    expect(calledData.get('transactionType')).toBe('EXPENSE');
    expect(calledData.get('dishName')).toBe('Bún Bò');
    expect(calledData.get('calories')).toBe('620');
    expect(calledData.get('locationName')).toBe('Quán Cô Như');
    expect(calledData.get('recipientScope')).toBe('ALL_FRIENDS');

    expect(toast.success).toHaveBeenCalledWith('Đã gửi khoảnh khắc ✨');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['/api/v1/photos'] });
    expect(onSuccess).toHaveBeenCalledWith(mockResponse);
  });

  it('handles error gracefully when upload fails', async () => {
    vi.spyOn(customFetcherModule, 'customFetcher').mockRejectedValue(
      new Error('Mạng không ổn định')
    );

    const onError = vi.fn();
    const { result } = renderHook(() => usePhotoUpload({ onError }), { wrapper });

    const payload: UploadPhotoPayload = {
      file: new Blob(['fake-image'], { type: 'image/jpeg' }),
    };

    let res;
    await act(async () => {
      res = await result.current.uploadPhoto(payload);
    });

    expect(res).toBeNull();
    expect(result.current.error?.message).toBe('Mạng không ổn định');
    expect(toast.error).toHaveBeenCalledWith('Mạng không ổn định');
    expect(onError).toHaveBeenCalled();
  });
});
