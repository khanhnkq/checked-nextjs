import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CloseFriendsQuotaBar } from '../CloseFriendsQuotaBar';
import type { CloseFriendsQuota } from '@/types/friendship';

describe('CloseFriendsQuotaBar Component (1:1 iOS Parity)', () => {
  const baseQuota: CloseFriendsQuota = {
    currentCount: 8,
    maxLimit: 20,
    isGoldMember: false,
    isNearLimit: false,
    isAtLimit: false,
    progress: 0.4,
  };

  it('renders normal quota state for regular user', () => {
    render(<CloseFriendsQuotaBar quota={baseQuota} />);

    expect(screen.getByText('BẠN BÈ THÂN THIẾT')).toBeInTheDocument();
    expect(screen.queryByText('GOLD')).not.toBeInTheDocument();
    expect(screen.getByText('8/20')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Nâng cấp/i })).not.toBeInTheDocument();

    const progressBar = screen.getByTestId('quota-progress-bar');
    expect(progressBar).toHaveStyle({ width: '40%' });
    expect(progressBar.className).toMatch(/bg-(primary|\[#BFDD4A\])/);
  });

  it('renders near-limit state with upgrade button and orange progress', async () => {
    const handleUpgrade = vi.fn();
    const nearLimitQuota: CloseFriendsQuota = {
      currentCount: 16,
      maxLimit: 20,
      isGoldMember: false,
      isNearLimit: true,
      isAtLimit: false,
      progress: 0.8,
    };

    const user = userEvent.setup();
    render(<CloseFriendsQuotaBar quota={nearLimitQuota} onUpgradeTap={handleUpgrade} />);

    expect(screen.getByText('16/20')).toBeInTheDocument();
    const upgradeBtn = screen.getByRole('button', { name: /Nâng cấp/i });
    expect(upgradeBtn).toBeInTheDocument();

    await user.click(upgradeBtn);
    expect(handleUpgrade).toHaveBeenCalledTimes(1);

    const progressBar = screen.getByTestId('quota-progress-bar');
    expect(progressBar.className).toContain('bg-[#FF9500]');
    expect(progressBar).toHaveStyle({ width: '80%' });
  });

  it('renders at-limit state with red text and red progress', () => {
    const atLimitQuota: CloseFriendsQuota = {
      currentCount: 20,
      maxLimit: 20,
      isGoldMember: false,
      isNearLimit: true,
      isAtLimit: true,
      progress: 1.0,
    };

    render(<CloseFriendsQuotaBar quota={atLimitQuota} />);

    const countText = screen.getByText('20/20');
    expect(countText.className).toContain('text-error');

    const progressBar = screen.getByTestId('quota-progress-bar');
    expect(progressBar.className).toContain('bg-[#FF6954]');
    expect(progressBar).toHaveStyle({ width: '100%' });
    expect(screen.getByRole('button', { name: /Nâng cấp/i })).toBeInTheDocument();
  });

  it('renders gold member state with GOLD badge and custom title', () => {
    const goldQuota: CloseFriendsQuota = {
      currentCount: 85,
      maxLimit: 100,
      isGoldMember: true,
      isNearLimit: false,
      isAtLimit: false,
      progress: 0.85,
    };

    render(<CloseFriendsQuotaBar quota={goldQuota} />);

    expect(screen.getByText('BẠN BÈ GOLD')).toBeInTheDocument();
    expect(screen.getByText('GOLD')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
    // Gold members never see the upgrade button
    expect(screen.queryByRole('button', { name: /Nâng cấp/i })).not.toBeInTheDocument();
  });

  it('handles compact mode styling', () => {
    const { container } = render(<CloseFriendsQuotaBar quota={baseQuota} isCompact={true} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('p-3');
  });

  it('enforces minimum 6% progress width for visibility', () => {
    const emptyQuota: CloseFriendsQuota = {
      currentCount: 0,
      maxLimit: 20,
      isGoldMember: false,
      isNearLimit: false,
      isAtLimit: false,
      progress: 0,
    };

    render(<CloseFriendsQuotaBar quota={emptyQuota} />);
    const progressBar = screen.getByTestId('quota-progress-bar');
    expect(progressBar).toHaveStyle({ width: '6%' });
  });

  it('strictly adheres to zero border, zero shadow rule', () => {
    const { container } = render(<CloseFriendsQuotaBar quota={baseQuota} />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/\bborder\b/);
    expect(html).not.toMatch(/\bshadow\b/);
  });
});
