import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImagePreviewView, type CapturedPhotoData } from '../ImagePreviewView';
import { usePermissionStore } from '@/stores/permission-store';

describe('ImagePreviewView Component (1:1 iOS Parity Integration)', () => {
  const originalFetch = global.fetch;

  const mockPhoto: CapturedPhotoData = {
    blob: new Blob(['fake-image-bytes'], { type: 'image/jpeg' }),
    dataUrl: 'data:image/jpeg;base64,mockpreviewdata',
    width: 1080,
    height: 1080,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    usePermissionStore.getState().reset();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders all 4 zones: TopBar, 1:1 Image with tags & caption, Action pills, and Bottom controls', () => {
    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        onDismiss={vi.fn()}
        initialLocationName="Phở Thìn Lò Đúc"
        initialDishName="Phở Bò Tái Nạm"
        initialPriceText="75.000 đ"
        initialCalorieText="620 kcal"
      />
    );

    // 1. TopBar
    expect(screen.getByRole('button', { name: 'Hủy và chụp lại' })).toBeInTheDocument();
    expect(screen.getByTestId('gemini-brand-pill')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tải ảnh về máy' })).toBeInTheDocument();

    // 2. Khung ảnh 1:1 với Pinned Tags & Caption Bar
    expect(screen.getByAltText('Khoảnh khắc vừa chụp')).toBeInTheDocument();
    expect(screen.getByText('Phở Thìn Lò Đúc')).toBeInTheDocument();
    expect(screen.getByText('Phở Bò Tái Nạm')).toBeInTheDocument();
    expect(screen.getByText('75.000 đ')).toBeInTheDocument();
    expect(screen.getByText('620 kcal')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nhập chú thích khoảnh khắc' })).toBeInTheDocument();

    // 3. Action Pills
    expect(screen.getByTestId('preview-action-pills')).toBeInTheDocument();

    // 4. Bottom Controls
    expect(screen.getByRole('button', { name: 'Xóa ảnh và chụp lại' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gửi khoảnh khắc' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chọn người nhận' })).toBeInTheDocument();
    expect(screen.getByText('Gửi cho bạn bè')).toBeInTheDocument();
  });

  it('toggles pinned tags when action pills are clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        onDismiss={vi.fn()}
        initialLocationName="Hà Nội"
        initialDishName="Bún Chả"
      />
    );

    expect(screen.getByText('Bún Chả')).toBeInTheDocument();

    // Click 'Ẩn tag món'
    const foodPill = screen.getByRole('button', { name: 'Ẩn tag món' });
    await user.click(foodPill);

    // Food tag should now be unpinned
    expect(screen.queryByText('Bún Chả')).not.toBeInTheDocument();

    // Click 'Ghim tag món' again
    const ghimPill = screen.getByRole('button', { name: 'Ghim tag món' });
    await user.click(ghimPill);

    // Food tag reappears
    expect(screen.getByText('Bún Chả')).toBeInTheDocument();
  });

  it('generates smart AI caption when sparkles button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        onDismiss={vi.fn()}
        initialLocationName="Phở Thìn Lò Đúc"
        initialDishName="Phở Bò"
        initialCalorieText="550 kcal"
      />
    );

    const input = screen.getByRole('textbox', { name: 'Nhập chú thích khoảnh khắc' });
    expect(input).toHaveValue('');

    const sparklesBtn = screen.getByRole('button', { name: 'Gợi ý caption' });
    await user.click(sparklesBtn);

    expect(input).toHaveValue('🍲 Phở Bò · 550 kcal');
  });

  it('submits tagged metadata when send button is clicked', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();

    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        onDismiss={vi.fn()}
        onSend={handleSend}
        initialLocationName="Quán Ăn Ngon"
        initialDishName="Cơm Tấm"
        initialPriceText="65.000 đ"
        initialCalorieText="600 kcal"
      />
    );

    const sendBtn = screen.getByRole('button', { name: 'Gửi khoảnh khắc' });
    await user.click(sendBtn);

    expect(handleSend).toHaveBeenCalledTimes(1);
    expect(handleSend).toHaveBeenCalledWith({
      caption: '',
      locationName: 'Quán Ăn Ngon',
      dishName: 'Cơm Tấm',
      priceText: '65.000 đ',
      calorieText: '600 kcal',
      amount: 65000,
      calories: 600,
      latitude: undefined,
      longitude: undefined,
      recipientScope: 'ALL_FRIENDS',
      recipientIds: undefined,
      isBill: false,
      category: 'Món ăn',
      billItems: undefined,
    });
  });

  it('opens AudienceSelectSheet when clicking users button, selects friends, and shows indicator dot', async () => {
    const user = userEvent.setup();
    const handleSend = vi.fn();
    const mockFriends = [
      { id: 'f1', name: 'Minh Trí' },
      { id: 'f2', name: 'Lan Anh' },
    ];

    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        friends={mockFriends}
        onDismiss={vi.fn()}
        onSend={handleSend}
      />
    );

    // Initial microcopy
    expect(screen.getByText('Gửi cho bạn bè')).toBeInTheDocument();
    expect(screen.queryByTestId('selected-audience-dot')).not.toBeInTheDocument();

    // Click audience button
    const audienceBtn = screen.getByRole('button', { name: 'Chọn người nhận' });
    await user.click(audienceBtn);

    // AudienceSelectSheet opens
    expect(screen.getByRole('dialog', { name: 'Người nhận ảnh' })).toBeInTheDocument();

    // Select "Bạn cụ thể"
    const specificScopeBtn = screen.getByRole('button', { name: /Bạn cụ thể/i });
    await user.click(specificScopeBtn);

    // Select Minh Trí
    const triFriendBtn = screen.getByRole('button', { name: /Minh Trí/i });
    await user.click(triFriendBtn);

    // Confirm selection
    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận & Cập nhật' });
    await user.click(confirmBtn);

    // Indicator dot appears and microcopy updates
    expect(screen.getByTestId('selected-audience-dot')).toBeInTheDocument();
    expect(screen.getByText('1 người nhận')).toBeInTheDocument();

    // Clicking send sends recipientScope and recipientIds
    const sendBtn = screen.getByRole('button', { name: 'Gửi khoảnh khắc' });
    await user.click(sendBtn);

    expect(handleSend).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientScope: 'SELECTED_FRIENDS',
        recipientIds: ['f1'],
      })
    );
  });

  it('disables send button and displays loader when isSending is true', () => {
    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        isSending={true}
        onDismiss={vi.fn()}
      />
    );

    const sendBtn = screen.getByRole('button', { name: 'Gửi khoảnh khắc' });
    expect(sendBtn).toBeDisabled();
    expect(sendBtn.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('opens LocationEditSheet when clicking location tag and updates location', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        onDismiss={vi.fn()}
        initialLocationName="Hồ Gươm"
      />
    );

    const locTag = screen.getByRole('button', { name: 'Địa điểm: Hồ Gươm' });
    await user.click(locTag);

    expect(screen.getByRole('dialog', { name: 'Vị trí & Địa điểm' })).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: 'Tên quán hoặc địa điểm' });
    await user.clear(input);
    await user.type(input, 'Phở Bát Đàn');

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận & Cập nhật' });
    await user.click(confirmBtn);

    expect(screen.getByText('Phở Bát Đàn')).toBeInTheDocument();
  });

  it('opens FoodEditSheet when clicking food tag and updates dish name', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        onDismiss={vi.fn()}
        initialDishName="Bún Bò"
      />
    );

    const foodTag = screen.getByRole('button', { name: 'Món ăn: Bún Bò' });
    await user.click(foodTag);

    expect(screen.getByRole('dialog', { name: 'Món ăn & Đồ uống' })).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: 'Tên món ăn' });
    await user.clear(input);
    await user.type(input, 'Bún Riêu Cua');

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận & Cập nhật' });
    await user.click(confirmBtn);

    expect(screen.getByText('Bún Riêu Cua')).toBeInTheDocument();
  });

  it('opens PriceEditSheet when clicking price tag and updates price', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        onDismiss={vi.fn()}
        initialPriceText="50.000 đ"
        isBill={false}
      />
    );

    const priceTag = screen.getByRole('button', { name: 'Giá tiền: 50.000 đ' });
    await user.click(priceTag);

    expect(screen.getByRole('dialog', { name: 'Giá tiền & Chi phí' })).toBeInTheDocument();
    const preset100k = screen.getByRole('button', { name: '100k' });
    await user.click(preset100k);

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận & Cập nhật' });
    await user.click(confirmBtn);

    expect(screen.getByText(/100\.000\s*đ/)).toBeInTheDocument();
  });

  it('opens BillDetailSheet when isBillMode is true and updates bill details', async () => {
    const user = userEvent.setup();
    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        onDismiss={vi.fn()}
        initialLocationName="The Coffee House"
        initialPriceText="65.000 đ"
        isBill={true}
      />
    );

    // In bill mode, clicking the bill tag opens BillDetailSheet
    const billTag = screen.getByRole('button', { name: 'Hóa đơn: 65.000 đ' });
    await user.click(billTag);

    expect(screen.getByRole('dialog', { name: 'Chi tiết Hóa đơn' })).toBeInTheDocument();
    const amountInput = screen.getByRole('textbox', { name: 'Tổng tiền thanh toán' });
    await user.clear(amountInput);
    await user.type(amountInput, '120000');

    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận & Cập nhật' });
    await user.click(confirmBtn);

    expect(screen.getByText(/120\.000\s*đ/)).toBeInTheDocument();
  });

  it('triggers autoAnalyze on mount and updates metadata from Gemini Vision response', async () => {
    const user = userEvent.setup();
    const mockAiResponse = {
      is_food: true,
      dish_name: 'Bún Bò Huế',
      category: 'Phở/Bún/Mì',
      emoji: '🍜',
      confidence: 0.98,
      calories: 620,
      is_bill: false,
      scene_label: 'Ẩm thực',
      suggested_caption: '🍜 Bún Bò Huế đậm đà chuẩn vị',
    };

    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: mockAiResponse }),
    });

    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={true}
        onDismiss={vi.fn()}
      />
    );

    // Initially Gemini brand pill shows analyzing state
    expect(screen.getByTestId('gemini-brand-pill')).toBeInTheDocument();

    // After fetch resolves, tags are populated
    await waitFor(() => {
      expect(screen.getByText('Bún Bò Huế')).toBeInTheDocument();
      expect(screen.getByText('620 kcal')).toBeInTheDocument();
      expect(screen.getByDisplayValue('🍜 Bún Bò Huế đậm đà chuẩn vị')).toBeInTheDocument();
    });

    // Clicking sparkles button preserves AI suggested caption and does NOT jump to fallback
    const sparklesBtn = screen.getByRole('button', { name: 'Gợi ý caption' });
    const input = screen.getByRole('textbox', { name: 'Nhập chú thích khoảnh khắc' });
    await user.clear(input);
    await user.click(sparklesBtn);
    expect(input).toHaveValue('🍜 Bún Bò Huế đậm đà chuẩn vị');
  });

  it('renders with cached location and coords from permissionStore without prompting geolocation', async () => {
    const mockGetCurrentPosition = vi.fn();
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });

    usePermissionStore.getState().setCachedLocation({
      coords: { latitude: 10.7769, longitude: 106.7009, accuracy: 5 },
      locationName: 'Landmark 81, Bình Thạnh',
      timestamp: Date.now(),
    });

    const handleSend = vi.fn();
    const user = userEvent.setup();

    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        onDismiss={vi.fn()}
        onSend={handleSend}
      />
    );

    // Location tag should show cached location
    expect(screen.getByText('Landmark 81, Bình Thạnh')).toBeInTheDocument();

    // Geolocation API should NOT have been invoked automatically
    expect(mockGetCurrentPosition).not.toHaveBeenCalled();

    // Clicking send includes cached latitude & longitude
    const sendBtn = screen.getByRole('button', { name: 'Gửi khoảnh khắc' });
    await user.click(sendBtn);

    expect(handleSend).toHaveBeenCalledWith(
      expect.objectContaining({
        locationName: 'Landmark 81, Bình Thạnh',
        latitude: 10.7769,
        longitude: 106.7009,
      })
    );
  });

  it('allows manual location refresh via LocationEditSheet when clicking location tag', async () => {
    const mockGetCurrentPosition = vi.fn();
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });

    const user = userEvent.setup();
    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        onDismiss={vi.fn()}
        initialLocationName="Hồ Gươm"
      />
    );

    const locTag = screen.getByRole('button', { name: 'Địa điểm: Hồ Gươm' });
    await user.click(locTag);

    expect(screen.getByRole('dialog', { name: 'Vị trí & Địa điểm' })).toBeInTheDocument();

    const refreshBtn = screen.getByRole('button', { name: 'Cập nhật lại GPS hiện tại' });
    await user.click(refreshBtn);

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it('does NOT aggressively auto-prompt geolocation on mount when no cached location exists and permission is prompt', () => {
    const mockGetCurrentPosition = vi.fn();
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      configurable: true,
      writable: true,
    });

    render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        onDismiss={vi.fn()}
      />
    );

    expect(mockGetCurrentPosition).not.toHaveBeenCalled();
  });

  it('strictly conforms to zero border, blur, shadow rule', () => {
    const { container } = render(
      <ImagePreviewView
        photo={mockPhoto}
        autoAnalyze={false}
        onDismiss={vi.fn()}
        initialLocationName="Quán Ăn Ngon"
      />
    );

    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bblur\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
