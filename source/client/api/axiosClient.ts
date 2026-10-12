import { ApiResponse, LoginResponse } from "@/types";
import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const axiosClient: AxiosInstance = axios.create({
  baseURL: "http://localhost:8080", //process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

//Request interceptor
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    //get token
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Hàng đợi lưu các request bị 401 trong lúc đang chờ refresh token hoàn tất
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Hàm tiện ích xoá sạch thông tin xác thực và chuyển hướng về /login
const handleLogout = async () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    document.cookie = "accessToken=; path=/; max-age=0";
    const { useUserStore } = await import("@/store/useUserStore");
    useUserStore.getState().clearUser();
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
};

//Response interceptor
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/users");
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      // Đánh dấu request này đã được thử refresh một lần để tránh lặp vô tận
      originalRequest._retry = true;

      const refreshToken =
        typeof window !== "undefined"
          ? localStorage.getItem("refreshToken")
          : null;

      if (!refreshToken) {
        await handleLogout();
        return Promise.reject(error);
      }

      // Nếu đang có một request khác thực hiện refresh, đẩy request này vào hàng đợi chờ
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Dùng axios gốc (không dùng axiosClient) để tránh lọt vào interceptor
        const refreshUrl = `${axiosClient.defaults.baseURL || ""}/api/auth/refresh`;
        const response = await axios.post<ApiResponse<LoginResponse>>(
          refreshUrl,
          { refreshToken },
        );
        const newAccessToken = response.data.data.accessToken;
        const newRefreshToken = response.data.data.refreshToken;
        // Lưu token mới vào localStorage & cookie
        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }
        document.cookie = `accessToken=${newAccessToken}; path=/; max-age=86400; SameSite=Lax`;
        // Thông báo cho tất cả request đang xếp hàng trong failedQueue
        processQueue(null, newAccessToken);
        // Gán token mới và gửi lại request ban đầu
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
