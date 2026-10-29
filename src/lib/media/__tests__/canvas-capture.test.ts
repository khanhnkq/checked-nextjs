import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateSquareCrop,
  captureVideoFrame,
  cropImageElementToSquare,
  cropImageFileToSquare,
} from '../canvas-capture';

describe('Canvas Capture & Square Crop Utility (1:1 iOS Locket Parity)', () => {
  describe('calculateSquareCrop', () => {
    it('calculates centered square crop for horizontal landscape image (1920x1080)', () => {
      const result = calculateSquareCrop(1920, 1080);
      expect(result).toEqual({
        startX: 420, // (1920 - 1080) / 2
        startY: 0,
        cropWidth: 1080,
        cropHeight: 1080,
      });
    });

    it('calculates centered square crop for vertical portrait image (1080x1920)', () => {
      const result = calculateSquareCrop(1080, 1920);
      expect(result).toEqual({
        startX: 0,
        startY: 420, // (1920 - 1080) / 2
        cropWidth: 1080,
        cropHeight: 1080,
      });
    });

    it('returns original dimensions for an already square image (1000x1000)', () => {
      const result = calculateSquareCrop(1000, 1000);
      expect(result).toEqual({
        startX: 0,
        startY: 0,
        cropWidth: 1000,
        cropHeight: 1000,
      });
    });

    it('throws descriptive error if dimensions are invalid or non-positive', () => {
      expect(() => calculateSquareCrop(0, 100)).toThrow('Kích thước ảnh không hợp lệ');
      expect(() => calculateSquareCrop(100, -50)).toThrow('Kích thước ảnh không hợp lệ');
    });
  });

  describe('captureVideoFrame', () => {
    let mockContext: any;
    let mockCanvas: any;

    beforeEach(() => {
      mockContext = {
        drawImage: vi.fn(),
      };
      mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockContext),
        toBlob: vi.fn((callback, type, quality) => {
          callback(new Blob(['fake-image-bytes'], { type: 'image/jpeg' }));
        }),
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockVideoDataUrl'),
      };
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'canvas') return mockCanvas;
        return document.createElement(tagName);
      });
    });

    it('throws error when video stream dimensions are 0 or video is not loaded', async () => {
      const mockVideo = { videoWidth: 0, videoHeight: 0 } as HTMLVideoElement;
      await expect(captureVideoFrame(mockVideo)).rejects.toThrow('Camera chưa sẵn sàng hoặc không có khung hình');
    });

    it('draws centered square crop and exports Blob and DataURL at target resolution (1080x1080)', async () => {
      const mockVideo = { videoWidth: 1280, videoHeight: 720 } as HTMLVideoElement;
      const result = await captureVideoFrame(mockVideo, { targetSize: 1080, quality: 0.92 });

      // Check canvas size set to targetSize
      expect(mockCanvas.width).toBe(1080);
      expect(mockCanvas.height).toBe(1080);

      // Check crop calculation: 1280x720 -> minDim 720 -> startX (1280-720)/2 = 280, startY = 0
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockVideo,
        280,
        0,
        720,
        720,
        0,
        0,
        1080,
        1080
      );

      expect(result.width).toBe(1080);
      expect(result.height).toBe(1080);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.dataUrl).toContain('mockVideoDataUrl');
    });
  });

  describe('cropImageElementToSquare', () => {
    let mockContext: any;
    let mockCanvas: any;

    beforeEach(() => {
      mockContext = {
        drawImage: vi.fn(),
      };
      mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockContext),
        toBlob: vi.fn((callback, type, quality) => {
          callback(new Blob(['fake-image-bytes'], { type: 'image/jpeg' }));
        }),
        toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockImageDataUrl'),
      };
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'canvas') return mockCanvas;
        return document.createElement(tagName);
      });
    });

    it('crops image element to square and returns blob with dataUrl', async () => {
      const mockImg = { width: 800, height: 1200 } as HTMLImageElement;
      const result = await cropImageElementToSquare(mockImg, { targetSize: 800 });

      // 800x1200 -> minDim 800, startX = 0, startY = (1200-800)/2 = 200
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        mockImg,
        0,
        200,
        800,
        800,
        0,
        0,
        800,
        800
      );
      expect(result.width).toBe(800);
      expect(result.height).toBe(800);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.dataUrl).toContain('mockImageDataUrl');
    });
  });
});
