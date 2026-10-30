'use client';

import { useState, useCallback, useRef } from 'react';
import type { GeminiVisionAnalysisPayload, VisionAnalyzeResponse } from '@/lib/ai';

export interface UseVisionAnalysisOptions {
  targetLanguage?: string;
  onSuccess?: (result: GeminiVisionAnalysisPayload) => void;
  onError?: (error: string) => void;
}

export interface UseVisionAnalysisReturn {
  isAnalyzing: boolean;
  result: GeminiVisionAnalysisPayload | null;
  error: string | null;
  analyzeImage: (source: string | Blob) => Promise<GeminiVisionAnalysisPayload | null>;
  reset: () => void;
}

/**
 * Nén và hạ tỷ lệ ảnh xuống 800x800 JPEG chất lượng 0.82 để gửi lên Gemini Vision siêu tốc (<150KB)
 */
export async function downscaleImageForVision(
  source: string | Blob,
  targetSize = 800,
  quality = 0.82
): Promise<string> {
  // Trong môi trường Node/JSDOM hoặc khi không hỗ trợ Canvas đầy đủ:
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    process.env.NODE_ENV === 'test'
  ) {
    if (typeof source === 'string') {
      return source;
    }
    return 'data:image/jpeg;base64,mock';
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    // Thêm safety timeout 3s để không bao giờ bị treo
    const timeout = setTimeout(() => {
      resolve(typeof source === 'string' ? source : 'data:image/jpeg;base64,mock');
    }, 3000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext ? canvas.getContext('2d') : null;

        if (!ctx) {
          resolve(typeof source === 'string' ? source : 'data:image/jpeg;base64,mock');
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Tính toán cắt vuông tâm 1:1
        const minDim = Math.min(img.width || targetSize, img.height || targetSize);
        const startX = Math.floor(((img.width || targetSize) - minDim) / 2);
        const startY = Math.floor(((img.height || targetSize) - minDim) / 2);

        ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
        const compressedDataUrl = canvas.toDataURL ? canvas.toDataURL('image/jpeg', quality) : '';
        resolve(compressedDataUrl || (typeof source === 'string' ? source : 'data:image/jpeg;base64,mock'));
      } catch (err) {
        console.warn('Lỗi khi nén ảnh canvas cho Vision:', err);
        resolve(typeof source === 'string' ? source : 'data:image/jpeg;base64,mock');
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(typeof source === 'string' ? source : 'data:image/jpeg;base64,mock');
    };

    if (typeof source === 'string') {
      img.src = source;
    } else if (typeof URL !== 'undefined' && URL.createObjectURL) {
      img.src = URL.createObjectURL(source);
    } else {
      clearTimeout(timeout);
      resolve('data:image/jpeg;base64,mock');
    }
  });
}

/**
 * useVisionAnalysis
 * Hook phân tích thị giác hình ảnh tích hợp Google Gemini Flash.
 * Đồng bộ với VisionServiceCoordinator.swift trên Checked iOS.
 */
export function useVisionAnalysis(options: UseVisionAnalysisOptions = {}): UseVisionAnalysisReturn {
  const { targetLanguage = 'vi', onSuccess, onError } = options;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GeminiVisionAnalysisPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Lưu callbacks và targetLanguage trong ref để giữ định danh analyzeImage ổn định tuyệt đối (chống vòng lặp vô hạn)
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const targetLanguageRef = useRef(targetLanguage);
  targetLanguageRef.current = targetLanguage;

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    setResult(null);
    setError(null);
  }, []);

  const analyzeImage = useCallback(
    async (source: string | Blob): Promise<GeminiVisionAnalysisPayload | null> => {
      // Hủy request đang chạy trước đó nếu có
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setIsAnalyzing(true);
      setError(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const base64DataUrl = await downscaleImageForVision(source, 800, 0.82);
        if (!base64DataUrl) {
          throw new Error('Không thể xử lý định dạng ảnh');
        }

        const response = await fetch('/api/ai/vision-analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageBase64: base64DataUrl,
            targetLanguage: targetLanguageRef.current,
          }),
          signal: controller.signal,
        });

        const data = (await response.json()) as VisionAnalyzeResponse;

        if (!data.success || !data.data) {
          const errMsg = data.error || 'Phân tích ảnh không thành công';
          setError(errMsg);
          if (onErrorRef.current) onErrorRef.current(errMsg);
          return null;
        }

        setResult(data.data);
        if (onSuccessRef.current) onSuccessRef.current(data.data);
        return data.data;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return null;
        }
        const errMsg = err?.message || 'Có lỗi xảy ra khi phân tích ảnh';
        setError(errMsg);
        if (onErrorRef.current) onErrorRef.current(errMsg);
        return null;
      } finally {
        setIsAnalyzing(false);
        abortControllerRef.current = null;
      }
    },
    [] // Ổn định xuyên suốt các lần render, không bao giờ thay đổi tham chiếu
  );

  return {
    isAnalyzing,
    result,
    error,
    analyzeImage,
    reset,
  };
}
