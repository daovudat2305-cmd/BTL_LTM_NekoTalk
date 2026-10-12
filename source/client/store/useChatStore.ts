import { create } from "zustand";
import {
  ConversationDetailResponse,
  ChatMessageResponse,
  MessageType,
} from "@/types";
import { conversationService } from "@/services/conversation.service";
import { messageService } from "@/services/message.service";

interface ChatState {
  conversations: ConversationDetailResponse[];
  activeConversation: ConversationDetailResponse | null;
  messages: Record<string, ChatMessageResponse[]>; //cache tin nhắn theo conversationId
  loadingConversations: boolean;
  loadingMessages: boolean;
  sending: boolean;

  fetchConversations: () => Promise<void>;
  setActiveConversation: (
    conversation: ConversationDetailResponse | null,
  ) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  receiveMessage: (message: ChatMessageResponse) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  loadingConversations: false,
  loadingMessages: false,
  sending: false,

  fetchConversations: async () => {
    try {
      set({ loadingConversations: true });
      const response = await conversationService.getMyConversations();

      if (response.data?.content) {
        set({ conversations: response.data.content });
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
            conversations: updatedConversations,
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

      // Sắp xếp lại danh sách: cuộc trò chuyện có tin nhắn mới nhất lên trên cùng
      updatedConversations.sort((a, b) => {
        const timeA = a.lastMessageTime
          ? new Date(a.lastMessageTime).getTime()
          : 0;
        const timeB = b.lastMessageTime
          ? new Date(b.lastMessageTime).getTime()
          : 0;
        return timeB - timeA;
      });
      return {
        messages: updatedMessages,
        conversations: updatedConversations,
      };
    });
  },
}));
