'use client';

import React, { useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera, Mail, User as UserIcon, Lock } from 'lucide-react';
import { useRegister } from '@/lib/api/generated/endpoints';
import { useAuthStore } from '@/stores/auth-store';
import { isTokenExpired } from '@/lib/auth/jwt';
import { CustomTextField, PrimaryButton } from '@/components/common';

const registerSchema = z.object({
  email: z
    .string()
    .email('Email không hợp lệ')
    .transform((v) => v.trim().toLowerCase()),
  username: z
    .string()
    .min(3, 'Tối thiểu 3 ký tự')
    .max(30, 'Tối đa 30 ký tự')
    .regex(/^[a-zA-Z0-9_]+$/, 'Chỉ dùng chữ, số và _')
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(6, 'Tối thiểu 6 ký tự'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  const redirectTarget = searchParams?.get('redirect') || '/';
  const safeRedirect = redirectTarget.startsWith('/') ? redirectTarget : '/';

  useEffect(() => {
    if (isHydrated && isAuthenticated && accessToken && !isTokenExpired(accessToken)) {
      router.replace(safeRedirect);
    }
  }, [isHydrated, isAuthenticated, accessToken, router, safeRedirect]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
    },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (_, variables) => {
        toast.success('Đã gửi mã xác nhận');
        const email = variables.data.email;
        const username = variables.data.username;
        router.push(
          `/verify-otp?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}`
        );
      },
      onError: (err: any) => {
        const message =
          err?.data?.message ||
          err?.response?.data?.message ||
          err?.message ||
          'Đăng ký thất bại';
        toast.error(message);
      },
    },
  });

  const onSubmit = (formData: RegisterFormData) => {
    registerMutation.mutate({ data: formData });
  };

  const loginHref =
    safeRedirect !== '/'
      ? `/login?redirect=${encodeURIComponent(safeRedirect)}`
      : '/login';

  return (
    <div className="flex flex-col items-center justify-between min-h-screen px-6 py-10 max-w-md mx-auto pt-safe pb-safe bg-[#FAF8F5]">
      {/* Top Branding */}
      <div className="flex flex-col items-center mt-6 gap-3">
        <div className="w-20 h-20 rounded-3xl bg-[#D4EB70] flex items-center justify-center transition-transform active:scale-95">
          <Camera size={36} className="text-[#141613]" strokeWidth={2.2} />
        </div>
        <h1 className="text-3xl font-extrabold font-display text-[#141613] tracking-tight">
          Đăng ký
        </h1>
        <p className="text-sm font-medium text-[#63685F] tracking-tight">
          Bắt đầu ghi lại nhật ký khoảnh khắc
        </p>
      </div>

      {/* Form Fields */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full flex flex-col gap-4 my-auto"
      >
        <CustomTextField
          label="Email"
          type="email"
          placeholder="email@domain.com"
          autoComplete="email"
          leftIcon={<Mail size={18} />}
          disabled={registerMutation.isPending}
          error={errors.email?.message}
          {...register('email')}
        />

        <CustomTextField
          label="Username"
          placeholder="Tên người dùng"
          autoComplete="username"
          leftIcon={<UserIcon size={18} />}
          disabled={registerMutation.isPending}
          error={errors.username?.message}
          {...register('username')}
        />

        <CustomTextField
          label="Mật khẩu"
          type="password"
          placeholder="Mật khẩu"
          autoComplete="new-password"
          leftIcon={<Lock size={18} />}
          disabled={registerMutation.isPending}
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="pt-2">
          <PrimaryButton
            type="submit"
            isLoading={registerMutation.isPending}
            disabled={registerMutation.isPending}
          >
            Tiếp tục
          </PrimaryButton>
        </div>
      </form>

      {/* Bottom Switch to Login */}
      <div className="w-full flex justify-center pb-2">
        <Link
          href={loginHref}
          className="text-sm font-semibold text-[#63685F] hover:text-[#141613] transition-colors"
        >
          Đã có tài khoản?{' '}
          <span className="text-[#141613] font-bold underline">Đăng nhập</span>
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
      <RegisterFormContent />
    </Suspense>
  );
}
