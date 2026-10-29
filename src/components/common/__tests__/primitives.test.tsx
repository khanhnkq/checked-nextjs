import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrimaryButton } from '../PrimaryButton';
import { CircleIconButton } from '../CircleIconButton';
import { CustomTextField } from '../CustomTextField';
import { SkeletonBone } from '../SkeletonBone';

describe('UI Primitives (Zero Border, Zero Blur, Zero Shadow, Mechanical Tactile)', () => {
  describe('PrimaryButton', () => {
    it('renders with children and handles click event', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      render(<PrimaryButton onClick={handleClick}>Tiếp tục</PrimaryButton>);

      const button = screen.getByRole('button', { name: 'Tiếp tục' });
      expect(button).toBeInTheDocument();
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows loading indicator and becomes disabled when isLoading is true', () => {
      render(<PrimaryButton isLoading>Tiếp tục</PrimaryButton>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Xử lý...')).toBeInTheDocument();
    });

    it('strictly has no border, blur or shadow classes in DOM', () => {
      const { container } = render(<PrimaryButton>Button</PrimaryButton>);
      const html = container.innerHTML;
      expect(html).not.toMatch(/border/);
      expect(html).not.toMatch(/shadow-/);
      expect(html).not.toMatch(/blur-/);
    });
  });

  describe('CircleIconButton', () => {
    it('renders and displays numeric badge when provided', () => {
      render(
        <CircleIconButton badge={5} aria-label="Thông báo">
          <span>🔔</span>
        </CircleIconButton>
      );

      expect(screen.getByRole('button', { name: 'Thông báo' })).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays 99+ when badge exceeds 99', () => {
      render(
        <CircleIconButton badge={120} aria-label="Thông báo">
          <span>🔔</span>
        </CircleIconButton>
      );

      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('strictly has no border, blur or shadow classes in DOM', () => {
      const { container } = render(
        <CircleIconButton aria-label="Nút icon">
          <span>+</span>
        </CircleIconButton>
      );
      const html = container.innerHTML;
      expect(html).not.toMatch(/border/);
      expect(html).not.toMatch(/shadow-/);
      expect(html).not.toMatch(/blur-/);
    });
  });

  describe('CustomTextField', () => {
    it('renders label and handles typing', async () => {
      const user = userEvent.setup();
      render(<CustomTextField label="Email" placeholder="test@checked.app" />);

      expect(screen.getByText('Email')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('test@checked.app');
      await user.type(input, 'hello@checked.app');
      expect(input).toHaveValue('hello@checked.app');
    });

    it('toggles password visibility when eye button is clicked', () => {
      render(<CustomTextField label="Mật khẩu" type="password" placeholder="Pass" />);

      const input = screen.getByPlaceholderText('Pass');
      expect(input).toHaveAttribute('type', 'password');

      const toggleBtn = screen.getByLabelText('Hiện mật khẩu');
      fireEvent.click(toggleBtn);
      expect(input).toHaveAttribute('type', 'text');

      const hideBtn = screen.getByLabelText('Ẩn mật khẩu');
      fireEvent.click(hideBtn);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders error message when error prop is passed', () => {
      render(
        <CustomTextField
          label="Mã OTP"
          error="Mã OTP không hợp lệ"
          placeholder="123456"
        />
      );

      expect(screen.getByText('Mã OTP không hợp lệ')).toBeInTheDocument();
    });

    it('strictly has no border, blur or shadow classes in DOM', () => {
      const { container } = render(
        <CustomTextField label="Username" placeholder="khanh" />
      );
      const html = container.innerHTML;
      expect(html).not.toMatch(/border/);
      expect(html).not.toMatch(/shadow-/);
      expect(html).not.toMatch(/blur-/);
    });
  });

  describe('SkeletonBone', () => {
    it('renders circle, line, and card variants', () => {
      const { rerender } = render(<SkeletonBone variant="circle" width={40} height={40} />);
      let el = screen.getByRole('status');
      expect(el).toHaveClass('rounded-full');

      rerender(<SkeletonBone variant="line" />);
      el = screen.getByRole('status');
      expect(el).toHaveClass('rounded-md');

      rerender(<SkeletonBone variant="card" />);
      el = screen.getByRole('status');
      expect(el).toHaveClass('rounded-2xl');
    });

    it('strictly has no border, blur or shadow classes in DOM', () => {
      const { container } = render(<SkeletonBone variant="card" />);
      const html = container.innerHTML;
      expect(html).not.toMatch(/border/);
      expect(html).not.toMatch(/shadow-/);
      expect(html).not.toMatch(/blur-/);
    });
  });
});
