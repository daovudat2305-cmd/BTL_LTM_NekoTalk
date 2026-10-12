export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REFRESH: "/api/auth/refresh",
  },
  USERS: {
    CREATE: "/api/users",
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
