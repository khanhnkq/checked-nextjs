import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ProfileStatsFooter } from '../ProfileStatsFooter';

describe('ProfileStatsFooter Component', () => {
  it('hiển thị khung skeleton khi isLoading=true và checkedCount=0', () => {
    render(
      <ProfileStatsFooter checkedCount={0} streakDays={0} isLoading={true} />
    );

    expect(screen.getByTestId('stats-footer-skeleton')).toBeInTheDocument();
    expect(screen.queryByText(/Checked/)).not.toBeInTheDocument();
  });

  it('hiển thị đúng số lượng checkedCount và streakDays khi có dữ liệu', () => {
    render(<ProfileStatsFooter checkedCount={12} streakDays={5} />);

    expect(screen.getByText(/12 Checked/)).toBeInTheDocument();
    expect(screen.getByText(/5d chuỗi/)).toBeInTheDocument();
    expect(screen.queryByTestId('stats-footer-skeleton')).not.toBeInTheDocument();
  });

  it('vẫn hiển thị nội dung nếu isLoading=true nhưng checkedCount > 0 (không hiển thị skeleton)', () => {
    render(
      <ProfileStatsFooter checkedCount={4} streakDays={2} isLoading={true} />
    );

    expect(screen.getByText(/4 Checked/)).toBeInTheDocument();
    expect(screen.getByText(/2d chuỗi/)).toBeInTheDocument();
    expect(screen.queryByTestId('stats-footer-skeleton')).not.toBeInTheDocument();
  });

  it('hiển thị 0 Checked và 0d chuỗi khi người dùng mới (isLoading=false, checkedCount=0)', () => {
    render(
      <ProfileStatsFooter checkedCount={0} streakDays={0} isLoading={false} />
    );

    expect(screen.getByText(/0 Checked/)).toBeInTheDocument();
    expect(screen.getByText(/0d chuỗi/)).toBeInTheDocument();
    expect(screen.queryByTestId('stats-footer-skeleton')).not.toBeInTheDocument();
  });

  it('có đầy đủ các icon Trái tim (Heart) và Ngọn lửa (Flame) cùng aria-label chuẩn tiếp cận', () => {
    const { container } = render(
      <ProfileStatsFooter checkedCount={8} streakDays={3} />
    );

    const svgIcons = container.querySelectorAll('svg');
    expect(svgIcons.length).toBe(2);

    const pill = screen.getByLabelText('Thành tích: 8 Checked, chuỗi 3 ngày');
    expect(pill).toBeInTheDocument();
  });

  it('áp dụng custom className khi được truyền', () => {
    const { container } = render(
      <ProfileStatsFooter
        checkedCount={5}
        streakDays={1}
        className="my-custom-footer"
      />
    );

    expect(container.firstChild).toHaveClass('my-custom-footer');
  });
});
