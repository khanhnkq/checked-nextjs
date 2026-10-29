import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OTPInput } from '../OTPInput';

describe('OTPInput Component', () => {
  it('renders 6 inputs by default with numeric inputMode', () => {
    render(<OTPInput value="" onChange={vi.fn()} />);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
    inputs.forEach((input) => {
      expect(input).toHaveAttribute('inputmode', 'numeric');
    });
  });

  it('triggers onChange and moves focus when entering digits', () => {
    const handleChange = vi.fn();
    render(<OTPInput value="" onChange={handleChange} />);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '9' } });

    expect(handleChange).toHaveBeenCalledWith('9');
  });

  it('calls onComplete when full 6 digits are provided', () => {
    const handleComplete = vi.fn();
    const handleChange = vi.fn();
    render(
      <OTPInput
        value=""
        onChange={handleChange}
        onComplete={handleComplete}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    const pasteEvent = {
      clipboardData: {
        getData: () => '123456',
      },
      preventDefault: vi.fn(),
    };

    fireEvent.paste(inputs[0], pasteEvent);
    expect(handleChange).toHaveBeenCalledWith('123456');
    expect(handleComplete).toHaveBeenCalledWith('123456');
  });

  it('strictly contains no blur or shadow classes in DOM', () => {
    const { container } = render(<OTPInput value="123" onChange={vi.fn()} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/shadow-/);
    expect(html).not.toMatch(/blur-/);
  });
});
