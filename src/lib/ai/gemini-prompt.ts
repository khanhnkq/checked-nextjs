/**
 * Gemini Prompt Builder
 * Tái hiện 100% logic xây dựng Structured Prompt từ GeminiPromptBuilder.swift trên Checked iOS.
 */

export interface GeminiPromptOptions {
  targetLanguage?: string;
}

/**
 * Xây dựng prompt phân tích thị giác chuyên sâu cho Google Gemini Flash
 */
export function buildGeminiVisionPrompt(options: GeminiPromptOptions = {}): string {
  const { targetLanguage = 'vi' } = options;

  let languageName = 'Vietnamese';
  let dishExample = 'Phở bò tái';
  let captionExample = '🍲 Thưởng thức Phở bò tái thơm lừng';

  switch (targetLanguage.toLowerCase()) {
    case 'en':
    case 'en-us':
    case 'en-gb':
      languageName = 'English';
      dishExample = 'Fried Chicken';
      captionExample = '🍗 Enjoying crispy Fried Chicken';
      break;
    case 'ja':
    case 'ja-jp':
      languageName = 'Japanese';
      dishExample = 'フライドチキン';
      captionExample = '🍗 サクサクのフライドチキンを楽しむ';
      break;
    case 'vi':
    case 'vi-vn':
    default:
      languageName = 'Vietnamese';
      dishExample = 'Phở bò tái';
      captionExample = '🍲 Thưởng thức Phở bò tái thơm lừng';
      break;
  }

  return `You are an expert AI Food, Nutrition & Scene Visual Analyst for the Checked social mobile app.
Analyze the image and return ONLY a valid JSON object matching the requested schema.
All text fields (dish_name, category, serving_size, scene_label, suggested_caption) MUST be written in ${languageName}.

Rules:
1. If the image depicts food, beverage, snack, dessert, or a meal:
   - set \`is_food\`: true
   - \`dish_name\`: specific, appetizing name of the food or beverage (e.g. "${dishExample}", "Cơm tấm sườn bì", "Trà sữa trân châu", "Cà phê sữa đá")
   - \`category\`: culinary category (e.g. "Phở/Bún/Mì", "Cơm", "Đồ uống/Cafe", "Món chiên & Ăn vặt", "Tráng miệng")
   - \`category_icon\`: appropriate icon name (e.g. "Utensils", "Coffee", "Wine", "Pizza")
   - \`emoji\`: single most relevant food emoji (e.g. "🍜", "🍗", "🧋", "☕️", "🍔")
   - \`confidence\`: confidence score between 0.0 and 1.0 (e.g. 0.95)
   - \`calories\`: estimate total calories in kcal (integer) for the visual portion shown in the image (e.g. 550)
   - \`serving_size\`: short concise serving description in ${languageName} (e.g. "1 tô vừa", "1 đĩa", "1 ly 500ml")
   - \`is_bill\`: false

2. If the image depicts a payment receipt, store bill, invoice, or order slip:
   - set \`is_bill\`: true
   - set \`is_food\`: false
   - \`total_amount_str\`: formatted total payment string visible on receipt (e.g. "125.000đ", "65.000đ"), or empty string "" if unclear
   - \`merchant_name\`: store or merchant name found on header of receipt (e.g. "Phúc Long Tea", "Highlands Coffee", "KFC Vietnam"), or empty string ""
   - \`items\`: array of detected items if readable [{ "name": "Trà sen vàng", "price": 65000, "quantity": 1 }]
   - \`emoji\`: "🧾"
   - \`category\`: "Hóa đơn"
   - \`category_icon\`: "Receipt"

3. If the image is neither food nor bill:
   - set \`is_food\`: false
   - set \`is_bill\`: false
   - \`dish_name\`: primary object or activity name
   - \`category\`: "Khoảnh khắc"
   - \`category_icon\`: "Sparkles"
   - \`emoji\`: "✨"

4. For all types:
   - \`scene_label\`: concise descriptive label (1-3 words)
   - \`suggested_caption\`: natural, lively social media caption with emoji (e.g. "${captionExample}")

Respond strictly with JSON schema without markdown backticks:
{
  "is_food": boolean,
  "dish_name": string,
  "category": string,
  "category_icon": string,
  "emoji": string,
  "confidence": number,
  "calories": number or null,
  "serving_size": string or null,
  "is_bill": boolean,
  "total_amount_str": string,
  "merchant_name": string,
  "items": [{"name": string, "price": number, "quantity": number}],
  "scene_label": string,
  "suggested_caption": string
}`;
}

/**
 * Trích xuất số nguyên từ chuỗi tiền tệ (ví dụ "125.000đ" -> 125000)
 */
export function parseCurrencyAmount(amountStr?: string | null): number | null {
  if (!amountStr) return null;
  const digitsOnly = amountStr.replace(/[^\d]/g, '');
  if (!digitsOnly) return null;
  const num = parseInt(digitsOnly, 10);
  return Number.isFinite(num) && num > 0 ? num : null;
}
