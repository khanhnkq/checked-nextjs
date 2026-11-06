import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TopCategoriesSection } from '../TopCategoriesSection';
import type { TopCategorySpend } from '@/types/expense';

describe('TopCategoriesSection Component', () => {
  const mockCategories: TopCategorySpend[] = [
    {
      categoryId: 'cat-1',
      categoryName: 'Ăn uống',
      totalAmount: 4500000,
      percentage: 45,
    },
    {
      categoryId: 'cat-2',
      categoryName: 'Cà phê & Trà',
      totalAmount: 1800000,
      percentage: 18,
    },
    {
      categoryId: 'cat-3',
      categoryName: 'Mua sắm chợ',
      totalAmount: 2000000,
      percentage: 20,
    },
  ];

  it('ẩn hoàn toàn (trả về null) khi không có danh mục hoặc mảng rỗng', () => {
    const { container: emptyContainer } = render(<TopCategoriesSection categories={[]} />);
    expect(emptyContainer.firstChild).toBeNull();

    const { container: undefContainer } = render(<TopCategoriesSection />);
    expect(undefContainer.firstChild).toBeNull();
  });

  it('render tiêu đề "Danh mục" khi có dữ liệu', () => {
    render(<TopCategoriesSection categories={mockCategories} />);

    expect(screen.getByRole('heading', { name: 'Danh mục' })).toBeInTheDocument();
  });

  it('render đầy đủ các thẻ danh mục với tên, số tiền rút gọn và tỷ lệ phần trăm', () => {
    render(<TopCategoriesSection categories={mockCategories} />);

    // Tên danh mục
    expect(screen.getByText('Ăn uống')).toBeInTheDocument();
    expect(screen.getByText('Cà phê & Trà')).toBeInTheDocument();
    expect(screen.getByText('Mua sắm chợ')).toBeInTheDocument();

    // Số tiền formatShortCurrency
    expect(screen.getByText('4.5tr')).toBeInTheDocument();
    expect(screen.getByText('1.8tr')).toBeInTheDocument();
    expect(screen.getByText('2tr')).toBeInTheDocument();

    // Phần trăm
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('18%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('chứa cấu trúc cuộn ngang với no-scrollbar', () => {
    const { container } = render(<TopCategoriesSection categories={mockCategories} />);

    const scrollContainer = container.querySelector('.overflow-x-auto.no-scrollbar');
    expect(scrollContainer).toBeInTheDocument();
  });
});
