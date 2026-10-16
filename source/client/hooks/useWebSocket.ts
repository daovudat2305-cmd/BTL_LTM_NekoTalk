import { useState, useEffect, useRef, useCallback } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import { useChatStore } from "@/store/useChatStore";
import { ChatMessageResponse, TypingNotification } from "@/types";

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
