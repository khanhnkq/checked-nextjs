import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '../login/page';
import RegisterPage from '../register/page';
import VerifyOtpPage from '../verify-otp/page';
import CompleteProfilePage from '../complete-profile/page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithClient(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

vi.mock('@/lib/api/generated/endpoints', () => ({
  useLogin: () => ({ mutate: vi.fn(), isPending: false }),
  useRegister: () => ({ mutate: vi.fn(), isPending: false }),
  useVerify: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateCurrentUserAvatar: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateCurrentUserProfile: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/lib/api/auth-api', () => ({
  resendOtp: vi.fn(),
}));

describe('Auth Pages Full-Bleed Background', () => {
  it('LoginPage renders with full-width bg-[#EDE9DF] and no bg-[#FAF8F5]', () => {
    const { container } = renderWithClient(<LoginPage />);
    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv.className).toContain('w-full');
    expect(outerDiv.className).toContain('bg-[#EDE9DF]');
    expect(outerDiv.className).not.toContain('bg-[#FAF8F5]');
  });

  it('RegisterPage renders with full-width bg-[#EDE9DF] and no bg-[#FAF8F5]', () => {
    const { container } = renderWithClient(<RegisterPage />);
    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv.className).toContain('w-full');
    expect(outerDiv.className).toContain('bg-[#EDE9DF]');
    expect(outerDiv.className).not.toContain('bg-[#FAF8F5]');
  });

  it('VerifyOtpPage renders with full-width bg-[#EDE9DF]', () => {
    const { container } = renderWithClient(<VerifyOtpPage />);
    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv.className).toContain('w-full');
    expect(outerDiv.className).toContain('bg-[#EDE9DF]');
  });

  it('CompleteProfilePage renders with full-width bg-[#EDE9DF]', () => {
    const { container } = renderWithClient(<CompleteProfilePage />);
    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv.className).toContain('w-full');
    expect(outerDiv.className).toContain('bg-[#EDE9DF]');
  });
});
