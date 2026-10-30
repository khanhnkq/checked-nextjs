/**
 * Gemini Vision Type Definitions
 * Chuẩn hóa kiểu dữ liệu phản hồi từ Google Gemini Flash Vision API.
 * Đồng bộ 100% với GeminiVisionDTO.swift trên Checked iOS.
 */

export type VisionClassificationType = 'BILL' | 'FOOD' | 'NORMAL';

export interface BillItemDTO {
  name: string;
  price: number;
  quantity: number;
}

export interface GeminiVisionAnalysisPayload {
  // 1. Phân loại Món ăn & Đồ uống
  is_food: boolean;
  dish_name: string;
  category: string;
  category_icon?: string;
  emoji: string;
  confidence: number;

  // 2. Dinh dưỡng & Calo (khi is_food = true, chỉ lưu calo theo chuẩn Backend)
  calories?: number | null;
  serving_size?: string | null;

  // 3. Hóa đơn & Biên lai (khi is_bill = true)
  is_bill: boolean;
  total_amount_str?: string | null;
  total_amount_num?: number | null;
  merchant_name?: string | null;
  items?: BillItemDTO[];

  // 4. Nhãn cảnh & Caption mạng xã hội gợi ý
  scene_label: string;
  suggested_caption: string;
}

export interface VisionAnalyzeRequest {
  imageBase64: string;
  mimeType?: string;
  targetLanguage?: string;
}

export interface VisionAnalyzeResponse {
  success: boolean;
  data?: GeminiVisionAnalysisPayload;
  error?: string;
  errorCode?:
    | 'MISSING_API_KEY'
    | 'RATE_LIMIT'
    | 'SERVICE_UNAVAILABLE'
    | 'INVALID_IMAGE'
    | 'PARSE_ERROR'
    | 'UNKNOWN';
}
