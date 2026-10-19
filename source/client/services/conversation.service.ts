import { API_ENDPOINTS } from "@/api/apiEndpoints";
import axiosClient from "@/api/axiosClient";
import {
  ApiResponse,
  PageResponse,
  ConversationDetailResponse,
  CreateConversationRequest,
  AvatarUploadResponse,
} from "@/types";

export const conversationService = {
  getMyConversations: async (
    page: number = 1,
    size: number = 20,
  ): Promise<ApiResponse<PageResponse<ConversationDetailResponse>>> => {
    const response = await axiosClient.get<
      ApiResponse<PageResponse<ConversationDetailResponse>>
    >(API_ENDPOINTS.CONVERSATIONS.MY_CONVERSATIONS, { params: { page, size } });
    return response.data;
  },

  createConversation: async (
    data: CreateConversationRequest,
  ): Promise<ApiResponse<ConversationDetailResponse>> => {
    const response = await axiosClient.post<
      ApiResponse<ConversationDetailResponse>
    >(API_ENDPOINTS.CONVERSATIONS.CREATE, data);
    return response.data;
  },

  uploadAvatar: async (
    file: File,
  ): Promise<ApiResponse<AvatarUploadResponse>> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axiosClient.post<ApiResponse<AvatarUploadResponse>>(
      API_ENDPOINTS.CONVERSATIONS.UPLOAD_AVATAR,
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
