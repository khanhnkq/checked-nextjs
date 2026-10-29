/**
 * Canvas Capture & Square Crop Utility
 * Tái hiện 100% logic crop ảnh vuông 1:1 từ Checked iOS (UIImage+SquareCrop.swift)
 */

export interface SquareCropCoordinates {
  startX: number;
  startY: number;
  cropWidth: number;
  cropHeight: number;
}

export interface CaptureOptions {
  targetSize?: number; // Mặc định 1080px chuẩn Retina Instagram/Locket
  quality?: number; // Chất lượng nén JPEG (0.0 -> 1.0, mặc định 0.92)
}

export interface CapturedPhoto {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Tính toán tọa độ và kích thước cắt hình vuông 1:1 chuẩn tâm
 */
export function calculateSquareCrop(width: number, height: number): SquareCropCoordinates {
  if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error('Kích thước ảnh không hợp lệ');
  }

  const minDimension = Math.min(width, height);
  const startX = Math.floor((width - minDimension) / 2);
  const startY = Math.floor((height - minDimension) / 2);

  return {
    startX,
    startY,
    cropWidth: minDimension,
    cropHeight: minDimension,
  };
}

/**
 * Trích xuất frame hình hiện tại từ thẻ HTMLVideoElement, cắt vuông 1:1 và xuất file JPEG
 */
export async function captureVideoFrame(
  video: HTMLVideoElement,
  options: CaptureOptions = {}
): Promise<CapturedPhoto> {
  const { videoWidth, videoHeight } = video;

  if (!videoWidth || !videoHeight) {
    throw new Error('Camera chưa sẵn sàng hoặc không có khung hình');
  }

  const { targetSize = 1080, quality = 0.92 } = options;
  const { startX, startY, cropWidth, cropHeight } = calculateSquareCrop(videoWidth, videoHeight);

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Không thể khởi tạo Canvas 2D context');
  }

  // Cấu hình khử răng cưa chất lượng cao
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Vẽ vùng tâm vuông 1:1 từ video vào canvas
  ctx.drawImage(
    video,
    startX,
    startY,
    cropWidth,
    cropHeight,
    0,
    0,
    targetSize,
    targetSize
  );

  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error('Xuất file ảnh Blob từ Canvas thất bại'));
        }
      },
      'image/jpeg',
      quality
    );
  });

  return {
    blob,
    dataUrl,
    width: targetSize,
    height: targetSize,
  };
}

/**
 * Cắt một đối tượng ảnh HTMLImageElement hoặc ImageBitmap thành hình vuông 1:1
 */
export async function cropImageElementToSquare(
  image: HTMLImageElement | ImageBitmap,
  options: CaptureOptions = {}
): Promise<CapturedPhoto> {
  const width = image.width;
  const height = image.height;

  if (!width || !height) {
    throw new Error('Kích thước ảnh không hợp lệ');
  }

  const { targetSize = Math.min(width, height), quality = 0.92 } = options;
  const { startX, startY, cropWidth, cropHeight } = calculateSquareCrop(width, height);

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Không thể khởi tạo Canvas 2D context');
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    startX,
    startY,
    cropWidth,
    cropHeight,
    0,
    0,
    targetSize,
    targetSize
  );

  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error('Xuất file ảnh Blob từ Canvas thất bại'));
        }
      },
      'image/jpeg',
      quality
    );
  });

  return {
    blob,
    dataUrl,
    width: targetSize,
    height: targetSize,
  };
}

/**
 * Đọc file ảnh người dùng tải lên từ Album (File) và tự động cắt thành hình vuông 1:1
 */
export async function cropImageFileToSquare(
  file: File,
  options: CaptureOptions = {}
): Promise<CapturedPhoto> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      try {
        const result = await cropImageElementToSquare(img, options);
        URL.revokeObjectURL(objectUrl);
        resolve(result);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không thể đọc dữ liệu file ảnh'));
    };

    img.src = objectUrl;
  });
}
