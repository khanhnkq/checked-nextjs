import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CalorieDashboardSkeleton } from '../CalorieDashboardSkeleton';

describe('CalorieDashboardSkeleton Component', () => {
  it('render đầy đủ các khung skeleton đại diện cho Hero, Monthly Chart và 4 Meals', () => {
    render(<CalorieDashboardSkeleton />);

    expect(screen.getByTestId('calorie-dashboard-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('hero-calorie-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('monthly-chart-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('meals-skeleton')).toBeInTheDocument();
  });
});
