'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { useLogin } from '@/lib/api/generated/endpoints';
import { useAuthStore } from '@/stores/auth-store';
import { syncSessionCookies } from '@/lib/auth/session-sync';
import { CustomTextField, PrimaryButton } from '@/components/common';
import type { User } from '@/types/user';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Nhập email hoặc username'),
  password: z.string().min(6, 'Tối thiểu 6 ký tự'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

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
        
        // Check verification step
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

        setSession(user, token);
        await syncSessionCookies(token);

        toast.success('Đăng nhập thành công');

        // Check profile completion
        if (!data.profileCompleted) {
          router.push('/complete-profile');
        } else {
          router.push('/');
        }
      },
      onError: (err: any) => {
        const message = err?.data?.message || err?.response?.data?.message || err?.message || 'Đăng nhập thất bại';
        toast.error(message);
      },
    },
  });

  const onSubmit = (formData: LoginFormData) => {
    loginMutation.mutate({ data: formData });
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen px-6 py-10 max-w-md mx-auto pt-safe pb-safe">
      {/* Top Branding */}
      <div className="flex flex-col items-center mt-8 gap-4">
        <div className="w-18 h-18 rounded-3xl bg-[#D4EB70] flex items-center justify-center">
          <Camera size={34} className="text-[#141613]" strokeWidth={2.2} />
        </div>
        <h1 className="text-3xl font-extrabold font-display text-[#141613] tracking-tight">
          Đăng nhập
        </h1>
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
          error={errors.identifier?.message}
          {...register('identifier')}
        />

        <CustomTextField
          label="Mật khẩu"
          type="password"
          placeholder="Mật khẩu"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="pt-4">
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
      <div className="w-full flex justify-center pb-4">
        <Link
          href="/register"
          className="text-sm font-semibold text-[#63685F] hover:text-[#141613] transition-colors"
        >
          Chưa có tài khoản? <span className="text-[#141613] font-bold underline">Tạo ngay</span>
        </Link>
      </div>
    </div>
  );
}

