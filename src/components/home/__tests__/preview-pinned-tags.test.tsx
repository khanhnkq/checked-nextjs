import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewPinnedTags } from '../PreviewPinnedTags';

describe('PreviewPinnedTags Component (1:1 iOS Pinned Tags)', () => {
  it('renders all four pinned tags when enabled', () => {
    render(
      <PreviewPinnedTags
        locationName="Phở Thìn Lò Đúc"
        dishName="Phở Bò Tái Nạm"
        priceText="75.000 đ"
        calorieText="620 kcal"
      />
    );

    expect(screen.getByTestId('preview-pinned-tags')).toBeInTheDocument();
    expect(screen.getByText('Phở Thìn Lò Đúc')).toBeInTheDocument();
    expect(screen.getByText('Phở Bò Tái Nạm')).toBeInTheDocument();
    expect(screen.getByText('75.000 đ')).toBeInTheDocument();
    expect(screen.getByText('620 kcal')).toBeInTheDocument();
  });

  it('hides individual tags when is*Pinned is false', () => {
    render(
      <PreviewPinnedTags
        locationName="Phở Thìn Lò Đúc"
        isLocationPinned={false}
        dishName="Phở Bò Tái Nạm"
        isFoodPinned={true}
        priceText="75.000 đ"
        isPricePinned={false}
        calorieText="620 kcal"
        isCaloriePinned={true}
      />
    );

    expect(screen.queryByText('Phở Thìn Lò Đúc')).not.toBeInTheDocument();
    expect(screen.getByText('Phở Bò Tái Nạm')).toBeInTheDocument();
    expect(screen.queryByText('75.000 đ')).not.toBeInTheDocument();
    expect(screen.getByText('620 kcal')).toBeInTheDocument();
  });

  it('returns null if no tags are visible', () => {
    const { container } = render(
      <PreviewPinnedTags
        isLocationPinned={false}
        isFoodPinned={false}
        isPricePinned={false}
        isCaloriePinned={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('triggers callbacks when tags are clicked', async () => {
    const user = userEvent.setup();
    const handleLocation = vi.fn();
    const handleFood = vi.fn();
    const handlePrice = vi.fn();
    const handleCalorie = vi.fn();

    render(
      <PreviewPinnedTags
        locationName="Hà Nội"
        onLocationClick={handleLocation}
        dishName="Bún Chả"
        onFoodClick={handleFood}
        priceText="50.000 đ"
        onPriceClick={handlePrice}
        calorieText="450 kcal"
        onCalorieClick={handleCalorie}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Địa điểm: Hà Nội' }));
    expect(handleLocation).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Món ăn: Bún Chả' }));
    expect(handleFood).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Giá tiền: 50.000 đ' }));
    expect(handlePrice).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Lượng calo: 450 kcal' }));
    expect(handleCalorie).toHaveBeenCalledTimes(1);
  });

  it('strictly conforms to zero border, blur, shadow rule', () => {
    const { container } = render(
      <PreviewPinnedTags
        locationName="Hà Nội"
        dishName="Bún Chả"
        priceText="50.000 đ"
        calorieText="450 kcal"
      />
    );

    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);
  });
});
