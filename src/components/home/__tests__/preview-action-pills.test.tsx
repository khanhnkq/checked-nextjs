import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewActionPills } from '../PreviewActionPills';

describe('PreviewActionPills Component (1:1 iOS Action Pills Row)', () => {
  it('renders analyzing state when isAnalyzing is true', () => {
    render(<PreviewActionPills isAnalyzing={true} />);

    expect(screen.getByTestId('action-pills-analyzing')).toBeInTheDocument();
    expect(screen.getByText('AI đang phân tích...')).toBeInTheDocument();
    expect(screen.queryByTestId('preview-action-pills')).not.toBeInTheDocument();
  });

  it('renders all default action pills and handles toggle clicks', async () => {
    const user = userEvent.setup();
    const handleToggleFood = vi.fn();
    const handleToggleCalorie = vi.fn();
    const handleTogglePrice = vi.fn();
    const handleToggleLocation = vi.fn();

    render(
      <PreviewActionPills
        hasFood={true}
        isFoodPinned={true}
        onToggleFood={handleToggleFood}
        hasCalories={true}
        isCaloriePinned={false}
        onToggleCalorie={handleToggleCalorie}
        hasPrice={true}
        isPricePinned={true}
        onTogglePrice={handleTogglePrice}
        isLocationPinned={true}
        onToggleLocation={handleToggleLocation}
      />
    );

    expect(screen.getByTestId('preview-action-pills')).toBeInTheDocument();

    // Food button is active (bg-[#D4EB70])
    const foodBtn = screen.getByRole('button', { name: 'Ẩn tag món' });
    expect(foodBtn).toHaveClass('bg-[#D4EB70]');
    await user.click(foodBtn);
    expect(handleToggleFood).toHaveBeenCalledTimes(1);

    // Calorie button is inactive (bg-white)
    const calBtn = screen.getByRole('button', { name: 'Ghim tag calo' });
    expect(calBtn).toHaveClass('bg-white');
    await user.click(calBtn);
    expect(handleToggleCalorie).toHaveBeenCalledTimes(1);

    // Price button is active
    const priceBtn = screen.getByRole('button', { name: 'Ẩn tag giá' });
    expect(priceBtn).toHaveClass('bg-[#D4EB70]');
    await user.click(priceBtn);
    expect(handleTogglePrice).toHaveBeenCalledTimes(1);

    // Location button is active
    const locBtn = screen.getByRole('button', { name: 'Ẩn tag vị trí' });
    expect(locBtn).toHaveClass('bg-[#D4EB70]');
    await user.click(locBtn);
    expect(handleToggleLocation).toHaveBeenCalledTimes(1);
  });

  it('renders bill buttons when isBill is true', async () => {
    const user = userEvent.setup();
    const handleToggleBill = vi.fn();
    const handleEditBill = vi.fn();

    render(
      <PreviewActionPills
        isBill={true}
        isBillPinned={true}
        onToggleBill={handleToggleBill}
        onEditBill={handleEditBill}
      />
    );

    const billBtn = screen.getByRole('button', { name: 'Ẩn tag bill' });
    expect(billBtn).toBeInTheDocument();
    await user.click(billBtn);
    expect(handleToggleBill).toHaveBeenCalledTimes(1);

    const editBillBtn = screen.getByRole('button', { name: 'Sửa chi tiết bill' });
    expect(editBillBtn).toBeInTheDocument();
    await user.click(editBillBtn);
    expect(handleEditBill).toHaveBeenCalledTimes(1);
  });

  it('strictly conforms to zero border, blur, shadow rule', () => {
    const { container } = render(
      <PreviewActionPills
        hasFood={true}
        hasCalories={true}
        isLocationPinned={true}
      />
    );

    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);
  });
});
