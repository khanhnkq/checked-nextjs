'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';
import { useRegister } from '@/lib/api/generated/endpoints';
import { CustomTextField, PrimaryButton } from '@/components/common';

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  username: z
    .string()
    .min(3, 'Tối thiểu 3 ký tự')
    .max(30, 'Tối đa 30 ký tự')
    .regex(/^[a-zA-Z0-9_]+$/, 'Chỉ dùng chữ, số và _'),
  password: z.string().min(6, 'Tối thiểu 6 ký tự'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();

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
        const message = err?.response?.data?.message || err?.message || 'Đăng ký thất bại';
        toast.error(message);
      },
    },
  });

  const onSubmit = (formData: RegisterFormData) => {
    registerMutation.mutate({ data: formData });
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen px-6 py-10 max-w-md mx-auto pt-safe pb-safe">
      {/* Top Branding */}
      <div className="flex flex-col items-center mt-8 gap-4">
        <div className="w-18 h-18 rounded-3xl bg-[#D4EB70] flex items-center justify-center border border-[#141613]/12">
          <Camera size={34} className="text-[#141613]" strokeWidth={2.2} />
        </div>
        <h1 className="text-3xl font-extrabold font-display text-[#141613] tracking-tight">
          Đăng ký
        </h1>
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
          error={errors.email?.message}
          {...register('email')}
        />

        <CustomTextField
          label="Username"
          placeholder="Tên người dùng"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />

        <CustomTextField
          label="Mật khẩu"
          type="password"
          placeholder="Mật khẩu"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="pt-4">
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
      <div className="w-full flex justify-center pb-4">
        <Link
          href="/login"
          className="text-sm font-semibold text-[#63685F] hover:text-[#141613] transition-colors"
        >
          Đã có tài khoản? <span className="text-[#141613] font-bold underline">Đăng nhập</span>
        </Link>
      </div>
    </div>
  );
}
