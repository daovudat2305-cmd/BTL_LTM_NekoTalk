import { useState, useEffect, useRef, useCallback } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import { useChatStore } from "@/store/useChatStore";
import { ChatMessageResponse } from "@/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080/ws";

export const useWebSocket = () => {
  const stompClient = useRef<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const receiveMessage = useChatStore((s) => s.receiveMessage);

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
      },
      onStompError: (frame) => {
        console.error(
          "[WebSocket] Lỗi STOMP Broker:",
          frame.headers["message"],
          frame.body,
        );
      },
      onWebSocketClose: () => {
        setIsConnected(false);
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
      console.log("[WebSocket] Đã ngắt kết nối WebSocket.");
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    client: stompClient.current,
    reconnect: connect,
    disconnect,
  };
};
