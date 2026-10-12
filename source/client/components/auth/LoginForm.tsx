"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { LoginFormData, loginSchema } from "@/lib/validations/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch (error) {}
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="w-full max-w-[480px] mx-auto p-7 sm:p-9 rounded-[32px] sm:rounded-[36px] bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md border border-pink-300/30 dark:border-pink-500/20 shadow-[0_20px_40px_-15px_rgba(236,72,153,0.15)] ring-1 ring-white/60 dark:ring-white/10 text-left transition-all"
      aria-labelledby="login-title"
    >
      {error && (
        <Alert
          variant="destructive"
          className="mb-5 rounded-2xl border-rose-200 bg-rose-50/90 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 py-3"
        >
          <AlertCircle className="size-4 text-rose-600 dark:text-rose-400" />
          <AlertDescription className="text-sm font-medium">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4.5">
        {/* Email Field  */}
        <div className="grid gap-2">
          <Label
            htmlFor="login-email"
            className="text-[#4b3e52] dark:text-zinc-200 text-sm font-semibold cursor-pointer"
          >
            Email
          </Label>
          <div className="relative flex items-center">
            <Mail className="absolute left-4 size-5 text-pink-500/70 pointer-events-none" />
            <Input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              {...register("email")}
              className="h-12.5 rounded-full pl-11 pr-4 bg-white/75 dark:bg-zinc-800/75 border-[#f2e2ee] dark:border-zinc-700 focus-visible:border-pink-500 focus-visible:ring-pink-500/20 text-[#3b203c] dark:text-zinc-100 placeholder:text-[#bfa3bb] dark:placeholder:text-zinc-400"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-rose-500 font-medium pl-3 animate-in fade-in-50">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field  */}
        <div className="grid gap-2">
          <Label
            htmlFor="login-password"
            className="text-[#4b3e52] dark:text-zinc-200 text-sm font-semibold cursor-pointer"
          >
            Mật khẩu
          </Label>
          <div className="relative flex items-center">
            <LockKeyhole className="absolute left-4 size-5 text-pink-500/70 pointer-events-none" />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              {...register("password")}
              className="h-12.5 rounded-full pl-11 pr-11 bg-white/75 dark:bg-zinc-800/75 border-[#f2e2ee] dark:border-zinc-700 focus-visible:border-pink-500 focus-visible:ring-pink-500/20 text-[#3b203c] dark:text-zinc-100 placeholder:text-[#bfa3bb] dark:placeholder:text-zinc-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-4 text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 transition-colors cursor-pointer focus:outline-none"
            >
              {showPassword ? (
                <Eye className="size-5" />
              ) : (
                <EyeOff className="size-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-500 font-medium pl-3 animate-in fade-in-50">
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-12.5 mt-6 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white font-bold text-base shadow-[0_8px_24px_rgba(236,72,153,0.32)] hover:opacity-95 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin mr-2" /> Đang đăng nhập...
          </>
        ) : (
          <>
            Đăng nhập <ArrowRight className="size-5 ml-1" />
          </>
        )}
      </Button>

      <p className="mt-6 pt-4.5 border-t border-[#f5e4f0] dark:border-zinc-800 text-center text-sm text-[#7f6a7d] dark:text-zinc-400">
        Bạn chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="text-fuchsia-500 dark:text-fuchsia-400 font-bold hover:text-fuchsia-600 dark:hover:text-fuchsia-300 hover:underline ml-1"
        >
          Đăng ký ngay
        </Link>
      </p>
    </form>
  );
}
