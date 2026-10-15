import { API_ENDPOINTS } from "@/api/apiEndpoints";
import axiosClient from "@/api/axiosClient";
import {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserDetailResponse,
} from "@/types";

export const authService = {
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await axiosClient.post<ApiResponse<LoginResponse>>(
      API_ENDPOINTS.AUTH.LOGIN,
      data,
    );
    return response.data;
  },

  register: async (
    data: RegisterRequest,
  ): Promise<ApiResponse<RegisterResponse>> => {
    const response = await axiosClient.post<ApiResponse<RegisterResponse>>(
      API_ENDPOINTS.USERS.CREATE,
      data,
    );
    return response.data;
  },

  // Gọi API hồ sơ hiện tại; axiosClient tự đính kèm access token.
  myInfo: async (): Promise<ApiResponse<UserDetailResponse>> => {
    const response = await axiosClient.get<ApiResponse<UserDetailResponse>>(
      API_ENDPOINTS.USERS.MY_INFO,
    );
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    // Gửi refresh token để backend đánh dấu token đã thu hồi.
    await axiosClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
  },
};
