"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle2, CircleUser, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { useUserStore } from "@/store/useUserStore";
import { useChatStore } from "@/store/useChatStore";
import { UserDetailResponse } from "@/types";
import { userService } from "@/services/user.service";

export default function ProfilePage() {
  const lastChatId = useChatStore((state) => state.lastChatId);
  const chatHref = lastChatId ? `/chat/${lastChatId}` : "/chat";
  const storedUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [user, setProfileUser] = useState<UserDetailResponse | null>(
    storedUser,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const updateAvatar = useUserStore((state) => state.updateAvatar);

  useEffect(() => {
    let active = true;

    // Tải hồ sơ từ API khi mở trang và đồng bộ dữ liệu mới nhất vào store.
    const loadProfile = async () => {
      try {
        const response = await authService.myInfo();
        if (!response.data) {
          throw new Error("Không nhận được thông tin người dùng.");
        }

        if (active) {
          setProfileUser(response.data);
          setUser(response.data);
        }
      } catch (loadError: unknown) {
        if (active) {
          const apiError = loadError as {
            response?: { data?: { message?: string } };
          };
          setError(
            apiError.response?.data?.message ||
              (loadError instanceof Error
                ? loadError.message
                : "Không thể tải thông tin người dùng."),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadProfile();
    return () => {
      active = false;
    };
  }, [setUser]);

  const initial = user?.username?.trim().charAt(0).toUpperCase() || "?";

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate kích thước 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh tối đa là 5MB.");
      setSuccess(null);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setSuccess(null);

      // Gọi API qua userService
      const res = await userService.uploadAvatar(file);
      if (res.data?.avatarUrl) {
        updateAvatar(res.data.avatarUrl);
        // Cập nhật avatar local state
        setProfileUser((prev) =>
          prev ? { ...prev, avatarUrl: res.data.avatarUrl } : null,
        );
        setSuccess("Cập nhật ảnh đại diện thành công!");
      }
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string } };
      };
      setError(
        apiError.response?.data?.message ||
          (err instanceof Error
            ? err.message
            : "Không thể tải ảnh đại diện lên."),
      );
      setSuccess(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-gray-50">
      <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
        <Link
          href={chatHref}
          aria-label="Quay lại đoạn chat"
          title="Quay lại đoạn chat"
        >
          <Button variant="ghost" size="icon" aria-label="Quay lại đoạn chat">
            <ArrowLeft />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Thông tin người dùng
          </h1>
          <p className="text-sm text-gray-500">Hồ sơ tài khoản</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8">
        {error && (
          <Alert variant="destructive" className="mb-5">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-5 border-emerald-200 bg-emerald-50 text-emerald-800">
            <AlertDescription className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-4 text-emerald-600" />
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="border-y border-gray-200 bg-white px-5 py-6 sm:px-7">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
            {/* Avatar có thể click để tải ảnh lên */}
            <div
              className="group relative size-16 shrink-0 cursor-pointer"
              onClick={() => !isUploading && fileInputRef.current?.click()}
              title="Nhấn để đổi ảnh đại diện"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if (!isUploading) fileInputRef.current?.click();
                }
              }}
            >
              <Avatar className="size-16 border border-pink-200 bg-pink-100 text-pink-700">
                <AvatarImage
                  src={user?.avatarUrl}
                  alt={user?.username || "Avatar"}
                  className="aspect-square size-full object-cover"
                />
                <AvatarFallback className="bg-pink-100 text-xl font-semibold text-pink-700">
                  {initial}
                </AvatarFallback>
              </Avatar>

              {/* Lớp phủ Camera icon hoặc Loading spinner */}
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 transition-opacity ${
                  isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {isUploading ? (
                  <Loader2 className="size-5 animate-spin text-white" />
                ) : (
                  <Camera className="size-5 text-white" />
                )}
              </div>

              {/* Input file ẩn */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-gray-900">
                {user?.username ||
                  (loading ? "Đang tải hồ sơ..." : "Chưa có tên người dùng")}
              </h2>
              <p className="truncate text-sm text-gray-500">
                {user?.email || ""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Nhấn vào ảnh để thay đổi (tối đa 5MB: JPG, PNG, WEBP)
              </p>
            </div>
          </div>

          {loading && !user ? (
            <div
              className="flex items-center gap-2 py-6 text-sm text-gray-500"
              role="status"
            >
              <Loader2 className="size-4 animate-spin" />
              Đang tải thông tin...
            </div>
          ) : (
            <dl className="divide-y divide-gray-100">
              <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
                <dt className="text-sm text-gray-500">Tên người dùng</dt>
                <dd className="break-words text-sm font-medium text-gray-900">
                  {user?.username || "Chưa có thông tin"}
                </dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="break-all text-sm font-medium text-gray-900">
                  {user?.email || "Chưa có thông tin"}
                </dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
                <dt className="text-sm text-gray-500">Mã người dùng</dt>
                <dd className="break-all font-mono text-sm text-gray-700">
                  {user?.userId || "Chưa có thông tin"}
                </dd>
              </div>
            </dl>
          )}

          {!user && !loading && error && (
            <div className="flex items-center gap-2 pt-2 text-sm text-gray-500">
              <CircleUser className="size-4" />
              Hãy thử tải lại trang sau khi kiểm tra kết nối.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
