import { authService } from "@/services/auth.service";
import { useUserStore } from "@/store/useUserStore";
import { LoginRequest, RegisterRequest } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setUser, clearUser } = useUserStore();

  const login = async (data: LoginRequest) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(data);

      if (response.data) {
        const { accessToken, refreshToken } = response.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        document.cookie = `accessToken=${accessToken}; path=/; max-age=604800; SameSite=Lax`;

        const userInfoResponse = await authService.myInfo();

        if (userInfoResponse.data) {
          setUser(userInfoResponse.data);
        }

        toast.success("Đăng nhập thành công!", {
          description: "Chào mừng bạn quay trở lại với NekoTalk!",
        });
        router.push("/chat");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        axiosErr.response?.data?.message || "Đăng nhập thất bại";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setLoading(true);
      setError(null);

      await authService.register(data);

      toast.success("Đăng ký tài khoản thành công!", {
        description: "Vui lòng đăng nhập bằng tài khoản vừa tạo.",
      });

      router.push("/login");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const errorMessage =
        axiosErr.response?.data?.message || "Đăng ký thất bại";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      // Báo backend thu hồi token trước khi xóa phiên ở client.
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (err) {
      console.warn("Không thể thu hồi refresh token trên server:", err);
    } finally {
      // Luôn xóa phiên trên trình duyệt, kể cả khi backend không phản hồi.
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      document.cookie = "accessToken=; path=/; max-age=0";
      clearUser();
      router.replace("/login");
    }
  };

  return {
    login,
    register,
    logout,
    loading,
    error,
  };
};
