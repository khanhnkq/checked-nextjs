'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, Lock, User as UserIcon } from 'lucide-react';
import { useLogin } from '@/lib/api/generated/endpoints';
import { useAuthStore } from '@/stores/auth-store';
import { isTokenExpired } from '@/lib/auth/jwt';
import { CustomTextField, PrimaryButton } from '@/components/common';
import type { User } from '@/types/user';

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Nhập email hoặc username')
    .transform((val) => val.trim()),
  password: z.string().min(6, 'Tối thiểu 6 ký tự'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Lấy đường dẫn chuyển tiếp an toàn (chống open redirect)
  const redirectTarget = searchParams?.get('redirect') || '/';
  const safeRedirect = redirectTarget.startsWith('/') ? redirectTarget : '/';

  // Nếu người dùng đã có token hợp lệ -> Chuyển thẳng về trang đích
  useEffect(() => {
    if (isHydrated && isAuthenticated && accessToken && !isTokenExpired(accessToken)) {
      router.replace(safeRedirect);
    }
  }, [isHydrated, isAuthenticated, accessToken, router, safeRedirect]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: async (data) => {
        const email = data.email || '';

        // Kiểm tra bước xác thực tài khoản
        if (data.isVerified === false) {
          toast.info('Vui lòng xác minh OTP');
          router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
          return;
        }

        const token = data.token || '';
        const user: User = {
          id: data.id || '',
          email,
          username: data.username || '',
          displayName: data.displayName || data.username || '',
          avatarUrl: data.avatarUrl || null,
          isVerified: Boolean(data.isVerified),
          profileCompleted: Boolean(data.profileCompleted),
          isGoldMember: false,
        };

        // Lưu session vào store & cookie
        setSession(user, token);

        toast.success('Đăng nhập thành công');

        // Điều hướng thông minh: nếu chưa hoàn thiện hồ sơ thì vào complete-profile, ngược lại vào safeRedirect
        if (!data.profileCompleted) {
          router.push('/complete-profile');
        } else {
          router.replace(safeRedirect);
        }
      },
      onError: (err: any) => {
        const status = err?.status || err?.response?.status;
        if (status === 401) {
          toast.error('Tài khoản hoặc mật khẩu không chính xác');
        } else if (status === 429) {
          toast.error('Quá nhiều lần thử, vui lòng đợi ít phút');
        } else {
          const message =
            err?.data?.message ||
            err?.response?.data?.message ||
            err?.message ||
            'Đăng nhập thất bại';
          toast.error(message);
        }
      },
    },
  });

  const onSubmit = (formData: LoginFormData) => {
    loginMutation.mutate({ data: formData });
  };

  // Tránh flash form khi đã đăng nhập hợp lệ
  if (isHydrated && isAuthenticated && accessToken && !isTokenExpired(accessToken)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAF8F5]">
        <div className="w-16 h-16 rounded-3xl bg-[#D4EB70] flex items-center justify-center animate-pulse">
          <Camera size={30} className="text-[#141613]" strokeWidth={2.2} />
        </div>
      </div>
    );
  }

  const registerHref =
    safeRedirect !== '/'
      ? `/register?redirect=${encodeURIComponent(safeRedirect)}`
      : '/register';

  return (
    <div className="flex flex-col items-center justify-between min-h-screen px-6 py-10 max-w-md mx-auto pt-safe pb-safe bg-[#FAF8F5]">
      {/* Top Branding */}
      <div className="flex flex-col items-center mt-6 gap-3">
        <div className="w-20 h-20 rounded-3xl bg-[#D4EB70] flex items-center justify-center transition-transform active:scale-95">
          <Camera size={36} className="text-[#141613]" strokeWidth={2.2} />
        </div>
        <h1 className="text-3xl font-extrabold font-display text-[#141613] tracking-tight">
          Đăng nhập
        </h1>
        <p className="text-sm font-medium text-[#63685F] tracking-tight">
          Chia sẻ khoảnh khắc & tài chính
        </p>
      </div>

      {/* Form Fields */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col gap-4 my-auto"
      >
        <CustomTextField
          label="Tài khoản"
          placeholder="Email hoặc username"
          autoComplete="username"
          leftIcon={<UserIcon size={18} />}
          disabled={loginMutation.isPending}
          error={errors.identifier?.message}
          {...register('identifier')}
        />

        <CustomTextField
          label="Mật khẩu"
          type="password"
          placeholder="Mật khẩu"
          autoComplete="current-password"
          leftIcon={<Lock size={18} />}
          disabled={loginMutation.isPending}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="pt-2">
          <PrimaryButton
            type="submit"
            isLoading={loginMutation.isPending}
            disabled={loginMutation.isPending}
          >
            Đăng nhập
          </PrimaryButton>
        </div>
      </form>

      {/* Bottom Switch to Register */}
      <div className="w-full flex justify-center pb-2">
        <Link
          href={registerHref}
          className="text-sm font-semibold text-[#63685F] hover:text-[#141613] transition-colors"
        >
          Chưa có tài khoản?{' '}
          <span className="text-[#141613] font-bold underline">Tạo ngay</span>
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAF8F5]">
          <div className="w-16 h-16 rounded-3xl bg-[#D4EB70] flex items-center justify-center animate-pulse">
            <Camera size={30} className="text-[#141613]" strokeWidth={2.2} />
          </div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
