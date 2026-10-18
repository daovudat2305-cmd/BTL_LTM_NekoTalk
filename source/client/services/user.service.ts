import axiosClient from "@/api/axiosClient";
import { API_ENDPOINTS } from "@/api/apiEndpoints";
import { ApiResponse, AvatarUploadResponse, PageResponse, UserDetailResponse } from "@/types";

export const userService = {
  searchUsers: async (
    keyword: string,
    page = 1,
    size = 10,
  ): Promise<ApiResponse<PageResponse<UserDetailResponse>>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<UserDetailResponse>>
    >(API_ENDPOINTS.USERS.SEARCH, { params: { keyword, page, size } });
    return response.data;
  },

  uploadAvatar: async (
    file: File,
  ): Promise<ApiResponse<AvatarUploadResponse>> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosClient.post<ApiResponse<AvatarUploadResponse>>(
      API_ENDPOINTS.USERS.UPDATE_AVATAR,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};
