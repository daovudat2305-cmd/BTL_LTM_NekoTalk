import { create } from "zustand";
import { Client } from "@stomp/stompjs";
import {
  ConversationDetailResponse,
  ChatMessageResponse,
  MessageType,
} from "@/types";
import { conversationService } from "@/services/conversation.service";
import { messageService } from "@/services/message.service";
import { parseDate } from "@/lib/date";

// Map lưu timer tự động hủy trạng thái typing cho từng user trong từng phòng chat
const typingTimeouts = new Map<string, NodeJS.Timeout>();

// Helper sắp xếp: Ưu tiên lastMessageTime, nếu chưa có tin nhắn thì dùng createdAt
const sortConversationsList = (list: ConversationDetailResponse[]) => {
  return [...list].sort((a, b) => {
    const timeA = parseDate(a.lastMessageTime || a.createdAt)?.getTime() || 0;
    const timeB = parseDate(b.lastMessageTime || b.createdAt)?.getTime() || 0;
    return timeB - timeA;
  });
};

interface ChatState {
  conversations: ConversationDetailResponse[];
  activeConversation: ConversationDetailResponse | null;
  messages: Record<string, ChatMessageResponse[]>; //cache tin nhắn theo conversationId
  loadingConversations: boolean;
  loadingMessages: boolean;
  sending: boolean;
  typingUsers: Record<string, string[]>;
  stompClient: Client | null;

  lastChatId: string | null;
  setLastChatId: (id: string | null) => void;
  fetchConversations: () => Promise<void>;
  setActiveConversation: (
    conversation: ConversationDetailResponse | null,
  ) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  receiveMessage: (message: ChatMessageResponse) => void;
  addConversation: (conversation: ConversationDetailResponse) => void;
  setStompClient: (client: Client | null) => void;
  setTypingUser: (
    conversationId: string,
    username: string,
    isTyping: boolean,
  ) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  loadingConversations: false,
  loadingMessages: false,
  sending: false,
  typingUsers: {},
  stompClient: null,
  lastChatId: null,

  addConversation: (newConv) => {
    set((state) => {
      const exists = state.conversations.some((c) => c.id === newConv.id);
      if (exists) {
        return {
          conversations: sortConversationsList(
            state.conversations.map((c) =>
              c.id === newConv.id ? { ...c, ...newConv } : c,
            ),
          ),
        };
      }

      return {
        conversations: sortConversationsList([newConv, ...state.conversations]),
      };
    });
  },

  setLastChatId: (id) => {
    set({ lastChatId: id });
  },

  setStompClient: (client) => {
    set({ stompClient: client });
  },

  sendTyping: (conversationId, isTyping) => {
    const client = get().stompClient;
    if (client && client.connected) {
      console.log(`[Typing] 📤 Gửi frame /app/chat.typing:`, {
        conversationId,
        isTyping,
      });
      client.publish({
        destination: "/app/chat.typing",
        body: JSON.stringify({ conversationId, isTyping }),
      });
    } else {
      console.warn(
        "[Typing] ⚠️ STOMP client chưa sẵn sàng hoặc mất kết nối:",
        client,
      );
    }
  },

  fetchConversations: async () => {
    try {
      set({ loadingConversations: true });
      const response = await conversationService.getMyConversations();

      if (response.data?.content) {
        set({ conversations: sortConversationsList(response.data.content) });
      }
    } catch (error) {
      console.error("Lỗi xảy ra khi tải danh sách hội thoại: ", error);
    } finally {
      set({ loadingConversations: false });
    }
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation });
  },

  fetchMessages: async (conversationId: string) => {
    try {
      set({ loadingMessages: true });
      const response = await messageService.getMessages(conversationId);
      if (response.data?.content) {
        const list = [...response.data.content].reverse();
        set((state) => ({
          messages: { ...state.messages, [conversationId]: list },
        }));
      }
    } catch (error) {
      console.error("Lỗi khi tải tin nhắn:", error);
    } finally {
      set({ loadingMessages: false });
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      set({ sending: true });
      const response = await messageService.sendMessage({
        conversationId,
        content: trimmed,
        messageType: MessageType.TEXT,
      });

      if (response.data) {
        const newMsg = response.data;

        set((state) => {
          const currentMsgs = state.messages[conversationId] || [];

          const updatedConversations = state.conversations.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                lastMessageId: newMsg.id,
                lastMessageContent: newMsg.content,
                lastMessageTime: newMsg.createdAt,
              };
            }
            return c;
          });

          return {
            messages: {
              ...state.messages,
              [conversationId]: [...currentMsgs, newMsg],
            },
            // Sắp xếp lại danh sách để cuộc trò chuyện vừa nhắn nhảy lên đầu
            conversations: sortConversationsList(updatedConversations),
          };
        });
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      throw error;
    } finally {
      set({ sending: false });
    }
  },

  receiveMessage: (newMsg) => {
    console.log("[Store receiveMessage] nhận tin nhắn:", {
      id: newMsg.id,
      conversationId: newMsg.conversationId,
      content: newMsg.content,
    });

    set((state) => {
      const conversationId = newMsg.conversationId;
      const currentMsgs = state.messages[conversationId] || [];

      // Tránh duplicate tin nhắn (nếu đã có id hoặc tempId này)
      const exist = currentMsgs.some(
        (m) => m.id === newMsg.id || (m.tempId && m.tempId === newMsg.tempId),
      );
      if (exist) return state;

      // 1. Cập nhật danh sách tin nhắn của phòng chat
      const updatedMessages = {
        ...state.messages,
        [conversationId]: [...currentMsgs, newMsg],
      };

      // 2. Cập nhật lastMessage và đưa cuộc trò chuyện lên đầu danh sách
      let found = false;
      const updatedConversations = state.conversations.map((c) => {
        if (c.id === conversationId) {
          found = true;
          return {
            ...c,
            lastMessageId: newMsg.id,
            lastMessageContent: newMsg.content,
            lastMessageTime: newMsg.createdAt,
          };
        }
        return c;
      });

      // Nếu cuộc trò chuyện này là mới (chưa có trong sidebar):
      if (!found) {
        get().fetchConversations(); //tải lại danh sách
      }

      return {
        messages: updatedMessages,
        conversations: sortConversationsList(updatedConversations),
      };
    });
  },

  setTypingUser: (conversationId, username, isTyping) => {
    const timerKey = `${conversationId}:${username}`;

    // Xóa timeout cũ nếu có
    if (typingTimeouts.has(timerKey)) {
      clearTimeout(typingTimeouts.get(timerKey)!);
      typingTimeouts.delete(timerKey);
    }

    if (isTyping) {
      // Đặt Fail-Safe Timeout: Sau 3.5s tự động xóa nếu không nhận thêm tín hiệu
      const timeout = setTimeout(() => {
        get().setTypingUser(conversationId, username, false);
        typingTimeouts.delete(timerKey);
      }, 3500);

      typingTimeouts.set(timerKey, timeout);
    }

    set((state) => {
      const currentList = state.typingUsers[conversationId] || [];
      let updatedList: string[];
      if (isTyping) {
        updatedList = currentList.includes(username)
          ? currentList
          : [...currentList, username];
      } else {
        updatedList = currentList.filter((u) => u !== username);
      }
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updatedList,
        },
      };
    });
  },
}));
