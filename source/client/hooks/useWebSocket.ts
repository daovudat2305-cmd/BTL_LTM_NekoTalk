import { useState, useEffect, useRef, useCallback } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import { useChatStore } from "@/store/useChatStore";
import {
  ChatMessageResponse,
  ConversationDetailResponse,
  ConversationType,
  TypingNotification,
  ReadReceiptNotification,
  PresenceEvent,
} from "@/types";
import { toast } from "sonner";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";

export const useWebSocket = () => {
  const stompClient = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const receiveMessage = useChatStore((s) => s.receiveMessage);
  const setTypingUser = useChatStore((s) => s.setTypingUser);

  const receiveMessageRef = useRef(receiveMessage);
  useEffect(() => {
    receiveMessageRef.current = receiveMessage;
  }, [receiveMessage]);

  const connect = useCallback(() => {
    //chỉ chạy môi trường win
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.warn("[WebSocket] Không tìm thấy access token, bỏ qua kết nối.");
      return;
    }

    //khởi tạo STOMP client
    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[STOMP Debug]:", str);
        }
      },
      onConnect: () => {
        console.log("[WebSocket] Đã kết nối STOMP thành công.");
        setIsConnected(true);
        useChatStore.getState().setStompClient(client);
        // Lắng nghe tin nhắn cá nhân từ server
        client.subscribe("/user/queue/messages", (message: IMessage) => {
          try {
            if (message.body) {
              const receivedMsg: ChatMessageResponse = JSON.parse(message.body);
              receiveMessageRef.current(receivedMsg);
            }
          } catch (error) {
            console.error("[WebSocket] Lỗi parse tin nhắn JSON:", error);
          }
        });

        // Lắng nghe cuộc trò chuyện mới (nhóm mới được tạo / thêm vào nhóm)
        client.subscribe("/user/queue/conversations", (message: IMessage) => {
          try {
            if (message.body) {
              const newConv: ConversationDetailResponse = JSON.parse(message.body);
              console.log("[WebSocket] 📥 Nhận được cuộc trò chuyện mới:", newConv);
              useChatStore.getState().addConversation(newConv);
              if (newConv.conversationType === ConversationType.GROUP) {
                toast.info(`Bạn đã được thêm vào nhóm "${newConv.name || "Nhóm trò chuyện"}"`);
              }
            }
          } catch (error) {
            console.error("[WebSocket] Lỗi parse conversation frame:", error);
          }
        });

        client.subscribe("/user/queue/typing", (message: IMessage) => {
          try {
            if (message.body) {
              const data: TypingNotification = JSON.parse(message.body);
              console.log("[Typing] 📥 Nhận được event từ server:", data);
              useChatStore
                .getState()
                .setTypingUser(data.conversationId, data.username, data.isTyping);
            }
          } catch (err) {
            console.error("[WebSocket] Lỗi parse typing frame:", err);
          }
        });

        // Lắng nghe thông báo đối phương đã đọc tin nhắn
        client.subscribe("/user/queue/read-receipts", (message: IMessage) => {
          try {
            if (message.body) {
              const receipt: ReadReceiptNotification = JSON.parse(message.body);
              console.log("[ReadReceipt] 📥 Nhận thông báo đã đọc từ server:", receipt);
            }
          } catch (err) {
            console.error("[WebSocket] Lỗi parse read-receipt frame:", err);
          }
        });

        // Lắng nghe sự kiện thay đổi trạng thái online/offline (Presence)
        client.subscribe("/topic/presence", (message: IMessage) => {
          try {
            if (message.body) {
              const presence: PresenceEvent = JSON.parse(message.body);
              console.log("[Presence] 🟢 Nhận cập nhật trạng thái từ server:", presence);
              useChatStore
                .getState()
                .updateUserPresence(presence.userId, presence.isOnline, presence.lastOnlineAt);
            }
          } catch (err) {
            console.error("[WebSocket] Lỗi parse presence frame:", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error(
          "[WebSocket] Lỗi STOMP Broker:",
          frame.headers["message"],
          frame.body,
        );
        if (frame.headers["message"]?.includes("Unauthorized")) {
          // Hủy reconnect để tránh spam
          client.deactivate();
          setIsConnected(false);
          // Xóa token hỏng và chuyển hướng người dùng nếu cần
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          document.cookie = "accessToken=; path=/; max-age=0";
          window.location.href = "/login";
        }
      },
      onWebSocketClose: () => {
        setIsConnected(false);
        useChatStore.getState().setStompClient(null);
        console.log("[WebSocket] Kết nối WebSocket đã đóng.");
      },
    });

    client.activate();
    stompClient.current = client;
  }, []);

  const disconnect = useCallback(() => {
    if (stompClient.current) {
      stompClient.current.deactivate();
      stompClient.current = null;
      setIsConnected(false);
      useChatStore.getState().setStompClient(null);
      console.log("[WebSocket] Đã ngắt kết nối WebSocket.");
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const sendTypingStatus = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.publish({
          destination: "/app/chat.typing",
          body: JSON.stringify({ conversationId, isTyping }),
        });
      }
    },
    [],
  );

  return {
    isConnected,
    client: stompClient.current,
    sendTypingStatus,
    reconnect: connect,
    disconnect,
  };
};
