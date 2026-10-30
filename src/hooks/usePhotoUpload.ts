'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { customFetcher } from '@/lib/api/custom-fetcher';
import { haptics } from '@/lib/utils/haptics';
import type { PhotoResponse } from '@/types/api.generated.ts/photoResponse';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface UploadPhotoPayload {
  file: Blob;
  caption?: string;
  amount?: number | null;
  dishName?: string | null;
  calories?: number | null;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  mealType?: MealType;
  recipientScope?: 'ALL_FRIENDS' | 'SELECTED_FRIENDS';
  recipientIds?: string[];
  takenAt?: string;
}

export interface UsePhotoUploadOptions {
  onSuccess?: (photo: PhotoResponse) => void;
  onError?: (error: Error) => void;
}

/**
 * Tự động xác định loại bữa ăn dựa theo thời gian chụp ảnh (Đồng bộ MealType.swift trên iOS)
 * - 05:00 - 10:30: BREAKFAST (Bữa sáng)
 * - 10:30 - 14:00: LUNCH (Bữa trưa)
 * - 14:00 - 17:30: SNACK (Ăn xế / Chiều)
 * - 17:30 - 22:00: DINNER (Bữa tối)
 * - 22:00 - 05:00: SNACK (Ăn đêm)
 */
export function determineMealType(date: Date = new Date()): MealType {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const time = hours + minutes / 60;

  if (time >= 5 && time < 10.5) {
    return 'BREAKFAST';
  } else if (time >= 10.5 && time < 14) {
    return 'LUNCH';
  } else if (time >= 14 && time < 17.5) {
    return 'SNACK';
  } else if (time >= 17.5 && time < 22) {
    return 'DINNER';
  }
  return 'SNACK';
}

/**
 * usePhotoUpload Hook (Đăng tải ảnh khoảnh khắc kèm metadata tài chính & dinh dưỡng)
 * - Sử dụng useMutation của TanStack Query chuẩn hóa
 * - Đóng gói FormData multipart chuẩn gửi lên POST /api/v1/photos
 * - Tự động xóa Content-Type để browser đính kèm boundary multipart
 * - TanStack Query Invalidation: Tự động invalidate và refetch lại toàn bộ dữ liệu ngay lập tức:
 *   + Feed ảnh bạn bè (/api/v1/photos/feed)
 *   + Ảnh cá nhân (/api/v1/photos/my-photos, /api/v1/photos/me)
 *   + Chi tiêu tài chính (/api/v1/expenses, /api/v1/budget, /api/v1/savings)
 * - Cung cấp phản hồi rung haptic và toast Sonner chuẩn Checked
 */
export function usePhotoUpload(options?: UsePhotoUploadOptions) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  const mutation = useMutation<PhotoResponse, Error, UploadPhotoPayload>({
    mutationFn: async (payload: UploadPhotoPayload) => {
      const formData = new FormData();
      formData.append('file', payload.file, 'photo.jpg');

      if (payload.caption && payload.caption.trim()) {
        formData.append('caption', payload.caption.trim());
      }

      if (payload.amount && payload.amount > 0) {
        formData.append('amount', String(payload.amount));
        formData.append('transactionType', 'EXPENSE');
      }

      if (payload.locationName && payload.locationName.trim()) {
        formData.append('locationName', payload.locationName.trim());
      }

      if (typeof payload.latitude === 'number') {
        formData.append('latitude', String(payload.latitude));
      }

      if (typeof payload.longitude === 'number') {
        formData.append('longitude', String(payload.longitude));
      }

      if (payload.dishName && payload.dishName.trim()) {
        formData.append('dishName', payload.dishName.trim());
      }

      if (payload.calories && payload.calories > 0) {
        formData.append('calories', String(payload.calories));
        formData.append('mealType', payload.mealType || determineMealType());
      }

      if (payload.recipientIds && payload.recipientIds.length > 0) {
        formData.append('recipientScope', 'SELECTED_FRIENDS');
        payload.recipientIds.forEach((id) => formData.append('recipientIds', id));
      } else {
        formData.append('recipientScope', payload.recipientScope || 'ALL_FRIENDS');
      }

      // Định dạng thời gian chụp chuẩn ISO LocalDateTime (yyyy-MM-dd'T'HH:mm:ss) khớp 100% với Spring Boot và iOS
      const defaultTakenAt = new Date().toISOString().slice(0, 19);
      formData.append(
        'takenAt',
        payload.takenAt ? payload.takenAt.replace('Z', '').split('.')[0] : defaultTakenAt
      );

      return customFetcher<PhotoResponse>({
        url: '/api/v1/photos',
        method: 'POST',
        data: formData,
      });
    },
    onSuccess: async (data, variables) => {
      setError(null);
      haptics.success();
      toast.success('Đã gửi khoảnh khắc ✨');

      // Dùng TanStack Query tự động invalidate và load lại dữ liệu Feed & Lịch sử
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const firstKey = query.queryKey[0];
          if (typeof firstKey !== 'string') return false;
          return (
            firstKey.startsWith('/api/v1/photos') ||
            (Boolean(variables?.amount) &&
              (firstKey.startsWith('/api/v1/expenses') ||
                firstKey.startsWith('/api/v1/budget') ||
                firstKey.startsWith('/api/v1/savings')))
          );
        },
      });

      options?.onSuccess?.(data);
    },
    onError: (err) => {
      setError(err);
      haptics.error();
      toast.error(err.message || 'Không thể đăng ảnh');
      options?.onError?.(err);
    },
  });

  return {
    isUploading: mutation.isPending,
    uploadPhoto: async (payload: UploadPhotoPayload) => {
      try {
        setError(null);
        return await mutation.mutateAsync(payload);
      } catch (err: any) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    error: error || mutation.error,
    mutation,
  };
}
