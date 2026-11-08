'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { useVerify } from '@/lib/api/generated/endpoints';
import { resendOtp } from '@/lib/api/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { syncSessionCookies } from '@/lib/auth/session-sync';
import { CircleIconButton, PrimaryButton } from '@/components/common';
import { OTPInput } from '@/components/auth/OTPInput';
import type { User } from '@/types/user';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const username = searchParams.get('username') || '';

  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const setSession = useAuthStore((s) => s.setSession);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const verifyMutation = useVerify({
    mutation: {
      onSuccess: async (data) => {
        const token = data.token || '';
        const user: User = {
          id: data.id || '',
          email: data.email || email,
          username: data.username || username,
          displayName: data.displayName || data.username || username,
          avatarUrl: data.avatarUrl || null,
          isVerified: true,
          profileCompleted: Boolean(data.profileCompleted),
          isGoldMember: false,
        };

        setSession(user, token);
        await syncSessionCookies(token);

        toast.success('Xác minh thành công');

        if (!data.profileCompleted) {
          router.push('/complete-profile');
        } else {
          router.push('/');
        }
      },
      onError: (err: any) => {
        const message = err?.data?.message || err?.response?.data?.message || err?.message || 'Mã xác nhận không đúng';
        toast.error(message);
      },
    },
  });

  const resendMutation = useMutation({
    mutationFn: (targetEmail: string) => resendOtp({ email: targetEmail }),
    onSuccess: () => {
      toast.success('Đã gửi lại mã mới');
      setCountdown(60);
    },
    onError: (err: any) => {
      const message = err?.data?.message || err?.response?.data?.message || err?.message || 'Không thể gửi lại mã';
      toast.error(message);
    },
  });

  const handleVerify = (code: string) => {
    if (code.length !== 6) {
      toast.error('Vui lòng nhập đủ 6 số');
      return;
    }
    verifyMutation.mutate({
      data: {
        email,
        otp: code,
      },
    });
  };

  const handleResend = () => {
    if (countdown > 0 || resendMutation.isPending || !email) return;
    resendMutation.mutate(email);
  };

  return (
    <div className="w-full min-h-screen bg-[#EDE9DF] flex flex-col items-center">
      <div className="w-full max-w-md min-h-screen flex flex-col justify-between px-6 py-6 pt-safe pb-safe">
        {/* Top Header */}
        <div className="w-full flex items-center justify-between">
          <CircleIconButton
            size="sm"
            variant="surface"
            onClick={() => router.back()}
            aria-label="Quay lại"
          >
            <ArrowLeft size={18} />
          </CircleIconButton>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center my-auto w-full gap-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold font-display text-[#141613] tracking-tight mb-2">
              Nhập mã 6 số
            </h1>
            <p className="text-sm font-medium text-[#63685F] truncate max-w-xs">
              {email ? `Gửi tới: ${email}` : 'Kiểm tra hộp thư email của bạn'}
            </p>
          </div>

          {/* 6 Discrete Boxes */}
          <OTPInput
            value={otp}
            onChange={setOtp}
            onComplete={handleVerify}
            disabled={verifyMutation.isPending}
            hasError={verifyMutation.isError}
          />

          {/* Resend button */}
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || resendMutation.isPending}
            className="text-sm font-bold text-[#141613] disabled:text-[#63685F] transition-colors"
          >
            {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
          </button>
        </div>

        {/* Submit Button */}
        <div className="w-full pb-4">
          <PrimaryButton
            onClick={() => handleVerify(otp)}
            isLoading={verifyMutation.isPending}
            disabled={otp.length !== 6 || verifyMutation.isPending}
          >
            Xác nhận
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#EDE9DF]" />}>
      <VerifyOtpContent />
    </Suspense>
  );
}

