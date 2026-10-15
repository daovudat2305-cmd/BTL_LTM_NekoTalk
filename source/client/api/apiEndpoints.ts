export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REFRESH: "/api/auth/refresh",
    // Endpoint thu hồi refresh token khi đăng xuất.
    LOGOUT: "/api/auth/logout",
  },
  USERS: {
    CREATE: "/api/users",
    // Endpoint hồ sơ cá nhân; backend xác định user từ access token.
    MY_INFO: "/api/users/my-info",
    SEARCH: "/api/users/search",
  },
  CONVERSATIONS: {
    CREATE: "/api/conversations",
    MY_CONVERSATIONS: "/api/conversations/my-conversation",
  },
  MESSAGES: {
    SEND: "/api/chat-messages",
    GET_BY_CONVERSATION: (conversationId: string) =>
      `/api/chat-messages/conversations/${conversationId}/messages`,
  },
} as const;
