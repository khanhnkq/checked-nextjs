import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MonthlyCalorieChartCard } from '../MonthlyCalorieChartCard';
import type { MonthlyCaloriePoint } from '@/types/calorie';

describe('MonthlyCalorieChartCard Component', () => {
  // Tạo dữ liệu giả lập 31 ngày
  const mockPoints: MonthlyCaloriePoint[] = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    if (day === 5) return { day, calories: 0 }; // Ngày 0 calo
    if (day === 10) return { day, calories: 2500 }; // Ngày vượt mục tiêu (2000)
    if (day === 15) return { day, calories: 1800 }; // Ngày hôm nay
    return { day, calories: 1900 };
  });

  const defaultProps = {
    points: mockPoints,
    targetCalories: 2000,
    daysOnTrack: 22,
    averageDailyCalories: 1850,
    currentDay: 15, // Ngày 15 là hôm nay
  };

  it('render đúng tiêu đề card và nhãn "X ngày đạt chuẩn"', () => {
    render(<MonthlyCalorieChartCard {...defaultProps} />);

    expect(screen.getByTestId('monthly-calorie-chart-card')).toBeInTheDocument();
    expect(screen.getByText('XU HƯỚNG NĂNG LƯỢNG THÁNG NÀY')).toBeInTheDocument();
    expect(screen.getByText('22 ngày đạt chuẩn')).toBeInTheDocument();
  });

  it('ẩn badge đạt chuẩn khi daysOnTrack = 0', () => {
    render(<MonthlyCalorieChartCard {...defaultProps} daysOnTrack={0} />);

    expect(screen.queryByTestId('days-on-track-badge')).not.toBeInTheDocument();
  });

  it('render đầy đủ 31 cột ngày trên biểu đồ', () => {
    render(<MonthlyCalorieChartCard {...defaultProps} />);

    const container = screen.getByTestId('monthly-bars-container');
    expect(container).toBeInTheDocument();

    for (let day = 1; day <= 31; day++) {
      expect(screen.getByTestId(`bar-col-${day}`)).toBeInTheDocument();
    }
  });

  it('cột ngày 0 calo hiển thị màu bg-graySubtle', () => {
    render(<MonthlyCalorieChartCard {...defaultProps} />);

    const col5 = screen.getByTestId('bar-col-5');
    const barElement = col5.firstElementChild;
    expect(barElement).toHaveClass('bg-graySubtle');
  });

  it('cột vượt mục tiêu hiển thị màu bg-error', () => {
    render(<MonthlyCalorieChartCard {...defaultProps} />);

    const col10 = screen.getByTestId('bar-col-10');
    const barElement = col10.firstElementChild;
    expect(barElement).toHaveClass('bg-error');
  });

  it('cột ngày hôm nay hiển thị màu bg-primary', () => {
    render(<MonthlyCalorieChartCard {...defaultProps} />);

    const col15 = screen.getByTestId('bar-col-15');
    const barElement = col15.firstElementChild;
    expect(barElement).toHaveClass('bg-primary');
  });

  it('render đúng chú thích mốc mục tiêu và calo trung bình ngày', () => {
    render(<MonthlyCalorieChartCard {...defaultProps} />);

    expect(screen.getByText('Mục tiêu: 2.000 kcal')).toBeInTheDocument();
    expect(screen.getByText('Trung bình: 1.850 kcal/ngày')).toBeInTheDocument();
  });

  it('click vào một cột ngày kích hoạt callback onSelectDay', () => {
    const handleSelectDay = vi.fn();
    render(<MonthlyCalorieChartCard {...defaultProps} onSelectDay={handleSelectDay} />);

    const col12 = screen.getByTestId('bar-col-12');
    fireEvent.click(col12);

    expect(handleSelectDay).toHaveBeenCalledWith(12);
  });
});
