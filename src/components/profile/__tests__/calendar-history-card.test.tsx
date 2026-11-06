import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CalendarHistoryCard } from '../CalendarHistoryCard';
import { haptics } from '@/lib/utils/haptics';
import { formatCurrentMonthVi } from '@/lib/utils/formatters';
import { DayCalendarData } from '@/types/profile';

vi.mock('@/lib/utils/haptics', () => ({
  haptics: {
    click: vi.fn(),
  },
}));

describe('CalendarHistoryCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCalendarData: Record<number, DayCalendarData> = {
    5: {
      latestImageUrl: 'https://example.com/photo-5.jpg',
      latestDate: new Date('2026-10-05T12:00:00Z'),
      postCount: 1,
    },
    12: {
      latestImageUrl: 'https://example.com/photo-12.jpg',
      latestDate: new Date('2026-10-12T18:00:00Z'),
      postCount: 14,
    },
    20: {
      latestImageUrl: 'https://example.com/photo-20.jpg',
      latestDate: new Date('2026-10-20T08:00:00Z'),
      postCount: 0,
    },
  };

  it('render đúng tiêu đề tháng truyền vào và tổng số ngày trong lưới', () => {
    render(
      <CalendarHistoryCard
        currentMonthTitle="Tháng 10 2026"
        daysInMonth={31}
        dayCalendarData={{}}
      />
    );

    expect(screen.getByText('Tháng 10 2026')).toBeInTheDocument();
    // Kiểm tra có ô ngày 1 và ngày 31
    expect(screen.getByTestId('day-number-1')).toHaveTextContent('1');
    expect(screen.getByTestId('day-number-31')).toHaveTextContent('31');
  });

  it('sử dụng formatCurrentMonthVi() khi không truyền currentMonthTitle', () => {
    render(
      <CalendarHistoryCard
        daysInMonth={30}
        dayCalendarData={{}}
      />
    );

    const expectedTitle = formatCurrentMonthVi();
    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
  });

  it('hiển thị số ngày mờ cho các ô chưa có ảnh/bài đăng', () => {
    render(
      <CalendarHistoryCard
        daysInMonth={30}
        dayCalendarData={mockCalendarData}
      />
    );

    // Ngày 1 chưa có ảnh -> hiển thị số 1 với text mờ
    const day1Text = screen.getByTestId('day-number-1');
    expect(day1Text).toHaveTextContent('1');
    expect(day1Text).toHaveClass('text-text-secondary/40');
  });

  it('render ảnh thumbnail và dot badge Matcha Glow khi ngày có bài đăng', () => {
    render(
      <CalendarHistoryCard
        daysInMonth={31}
        dayCalendarData={mockCalendarData}
      />
    );

    // Ngày 5 có ảnh thumbnail
    const imageDay5 = screen.getByAltText('Bài đăng ngày 5');
    expect(imageDay5).toBeInTheDocument();
    expect(imageDay5).toHaveAttribute('src', 'https://example.com/photo-5.jpg');

    // Ngày 5 có 1 post -> Dot badge hình tròn có số "1"
    const badgeDay5 = screen.getByTestId('day-badge-5');
    expect(badgeDay5).toHaveClass('bg-primary');
    expect(badgeDay5).toHaveTextContent('1');

    // Ngày 12 có 14 posts -> Dot badge dạng capsule có số "14"
    const badgeDay12 = screen.getByTestId('day-badge-12');
    expect(badgeDay12).toHaveClass('bg-primary');
    expect(badgeDay12).toHaveTextContent('14');
  });

  it('không hiển thị dot badge nếu postCount = 0', () => {
    render(
      <CalendarHistoryCard
        daysInMonth={31}
        dayCalendarData={mockCalendarData}
      />
    );

    // Ngày 20 có ảnh nhưng postCount = 0 -> không có day-badge-20
    expect(screen.queryByTestId('day-badge-20')).not.toBeInTheDocument();
  });

  it('gọi haptics.click và callback onClick khi click vào thẻ', () => {
    const handleClick = vi.fn();
    render(
      <CalendarHistoryCard
        daysInMonth={30}
        dayCalendarData={{}}
        onClick={handleClick}
      />
    );

    const card = screen.getByRole('button', { name: 'Thẻ lịch sử tháng' });
    fireEvent.click(card);

    expect(haptics.click).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('gọi onDayClick khi click vào một ô ngày cụ thể và ngăn chặn bubbling', () => {
    const handleCardClick = vi.fn();
    const handleDayClick = vi.fn();

    render(
      <CalendarHistoryCard
        daysInMonth={31}
        dayCalendarData={mockCalendarData}
        onClick={handleCardClick}
        onDayClick={handleDayClick}
      />
    );

    // Click vào ô ngày 5
    const day5Cell = screen.getByTestId('calendar-cell-5');
    fireEvent.click(day5Cell);

    expect(haptics.click).toHaveBeenCalledTimes(1);
    expect(handleDayClick).toHaveBeenCalledWith(5, mockCalendarData[5]);
    expect(handleCardClick).not.toHaveBeenCalled();
  });

  it('hỗ trợ điều khiển bàn phím (phím Enter và Space)', () => {
    const handleClick = vi.fn();
    render(
      <CalendarHistoryCard
        daysInMonth={30}
        dayCalendarData={{}}
        onClick={handleClick}
      />
    );

    const card = screen.getByRole('button', { name: 'Thẻ lịch sử tháng' });

    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('áp dụng custom className khi được truyền', () => {
    render(
      <CalendarHistoryCard
        daysInMonth={30}
        dayCalendarData={{}}
        className="custom-calendar-class"
      />
    );

    const card = screen.getByRole('button', { name: 'Thẻ lịch sử tháng' });
    expect(card).toHaveClass('custom-calendar-class');
  });
});
