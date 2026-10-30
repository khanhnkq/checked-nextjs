import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewCaptionBar } from '../PreviewCaptionBar';

describe('PreviewCaptionBar Component (1:1 iOS Caption Capsule)', () => {
  it('renders input with value and placeholder', () => {
    render(
      <PreviewCaptionBar
        caption="Phở Thìn ấm bụng ngày mưa"
        onCaptionChange={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox', { name: 'Nhập chú thích khoảnh khắc' });
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Phở Thìn ấm bụng ngày mưa');
  });

  it('triggers onCaptionChange when typing in the input', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <PreviewCaptionBar
        caption=""
        onCaptionChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox', { name: 'Nhập chú thích khoảnh khắc' });
    await user.type(input, 'A');
    expect(handleChange).toHaveBeenCalledWith('A');
  });

  it('renders sparkles AI button and triggers onGenerateAICaption when clicked', async () => {
    const user = userEvent.setup();
    const handleGenerate = vi.fn();

    render(
      <PreviewCaptionBar
        caption=""
        onCaptionChange={vi.fn()}
        onGenerateAICaption={handleGenerate}
      />
    );

    const sparklesBtn = screen.getByRole('button', { name: 'Gợi ý caption' });
    expect(sparklesBtn).toBeInTheDocument();

    await user.click(sparklesBtn);
    expect(handleGenerate).toHaveBeenCalledTimes(1);
  });

  it('strictly conforms to zero border, blur, shadow rule', () => {
    const { container } = render(
      <PreviewCaptionBar
        caption="Check"
        onCaptionChange={vi.fn()}
        onGenerateAICaption={vi.fn()}
      />
    );

    expect(container.innerHTML).not.toMatch(/border/);
    expect(container.innerHTML).not.toMatch(/shadow-/);
    expect(container.innerHTML).not.toMatch(/blur-/);
  });
});
