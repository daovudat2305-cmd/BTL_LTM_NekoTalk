# 📋 KẾ HOẠCH TRIỂN KHAI & PHÁT TRIỂN DỰ ÁN NEKOTALK
### Bài Tập Lớn Môn Lập Trình Mạng — Nhóm NekoTalk

> [!IMPORTANT]
> **TÀI LIỆU NỘI BỘ DÀNH CHO CÁC THÀNH VIÊN TRONG NHÓM (PARTNERS):**  
> - File này ghi nhận toàn bộ lộ trình phát triển, phân chia nhiệm vụ và hướng dẫn kỹ thuật chi tiết để các thành viên phối hợp code ăn khớp với nhau.
> - **Lưu ý khi nộp bài:** File này có thể được **xóa bỏ** (hoặc lưu trữ nội bộ) trước khi nộp đồ án cho giảng viên nhằm giữ cấu trúc repository bám sát 100% theo quy định tại [INSTRUCTION.md](./INSTRUCTION.md).

---

## 👥 1. BẢNG PHÂN CHIA NHIỆM VỤ THÀNH VIÊN (NHÓM 2 THÀNH VIÊN)

| STT | Thành viên | MSSV | Mảng phụ trách chính | Nhiệm vụ cụ thể theo mã nguồn | Trạng thái |
|:---:|------------|:----:|----------------------|--------------------------------|:---:|
| **1** | **Đào Vũ Đạt** | B23DCCN127 | **Fullstack Core Architecture, Socket Server & DevOps** | • **Hạ tầng & DevOps:** Khởi tạo kiến trúc dự án, Docker Compose đa tầng (client, server, MySQL), cấu hình mạng bridge LAN và múi giờ.<br>• **Backend Core & Security:** Thiết kế CSDL MySQL 8.0, Spring Data JPA, đánh chỉ mục tối ưu truy vấn chat, xác thực phân tán JWT Stateless.<br>• **Socket Server (Client-Server):** Xây dựng STOMP Message Broker (`/topic`, `/queue`), Chat realtime, Typing indicator, Read receipts, User Presence (Online/Offline/Last active).<br>• **Game Socket:** Thiết kế In-memory TicTacToe/Gomoku 15x15 Session Manager và tích hợp bàn cờ cờ ca-rô realtime.<br>• **Frontend Core:** Khởi tạo kiến trúc Next.js 16, layout chat workspace, Zustand state, Axios client, quản lý nhóm chat và upload avatar. | 🟢 Đã hoàn thành 100% |
| **2** | **Bùi Hồng Phong** | B23DCCN641 | **WebRTC P2P Media Stream, Signaling & Session Security** | • **Truyền thông P2P:** Tích hợp WebRTC (`RTCPeerConnection`), Google STUN (NAT Traversal), xử lý luồng MediaStream âm thanh/hình ảnh.<br>• **Signaling Server:** Xây dựng bộ điều khiển và xử lý tín hiệu bắt tay SDP Offer/Answer, ICE Candidate qua STOMP (`CallSignalingController`, `CallService`).<br>• **Đàm thoại nhóm đa điểm:** Xây dựng phân hệ Group Call ở cả backend (`GroupCallService`) và frontend (`GroupCallProvider`).<br>• **Giao diện cuộc gọi:** Xây dựng UI đàm thoại Voice Call, Video Call, hộp thoại chuông reo cuộc gọi đến và thanh điều khiển thiết bị Mic/Cam.<br>• **Bảo mật phiên & Tinh gọn Client:** Hiện thực cơ chế thu hồi Refresh Token khi đăng xuất (Revoked Token lưu CSDL), trang hồ sơ cá nhân và dọn dẹp các thành phần UI thừa. | 🟢 Đã hoàn thành 100% |

---

## 📊 2. PHÂN TÍCH HIỆN TRẠNG DỰ ÁN

### Stack Công Nghệ Hiện Tại
| Thành phần | Công nghệ sử dụng | Phiên bản | Ghi chú |
|---|---|---|---|
| **Backend** | Spring Boot, Java, Spring Security, Spring WebSocket (STOMP), Spring Data JPA | Java 21, Spring Boot 4.1.0 | REST API + STOMP Broker |
| **Frontend** | Next.js (App Router), React, TypeScript, Tailwind CSS v4, Zustand, shadcn/ui | Next.js 16.3, React 19 | Client UI + STOMP Client |
| **Database** | MySQL Server | MySQL 8.0 | Lưu trữ người dùng, hội thoại, tin nhắn |
| **Realtime** | WebSocket + STOMP Protocol | `@stomp/stompjs` v7.3 | Trao đổi tin nhắn tức thì |
| **Signaling** | Spring WebSocket Simple Broker | `/topic`, `/queue` | Chuyển tiếp tín hiệu WebRTC |
| **Media Stream** | WebRTC (RTCPeerConnection) | Native Browser API | Voice & Video Call P2P |
| **DevOps** | Docker & Docker Compose | Multi-stage build | Tự động hóa khởi chạy 3 containers |

### Tính Năng Đã Hoàn Thành ✅
- [x] **Cấu trúc thư mục:** Chuẩn hóa thư mục gốc theo `INSTRUCTION.md` (`source/client`, `source/server`, `statics/`).
- [x] **Docker Containerization:** Dockerfile multi-stage cho cả client/server, `docker-compose.yml` với healthcheck MySQL, mạng LAN và múi giờ.
- [x] **Xác thực & Bảo mật:** Đăng ký, đăng nhập cấp JWT Access/Refresh Token, bảo vệ REST API và WebSocket Handshake.
- [x] **Bảo mật phiên đăng xuất:** Cơ chế thu hồi Refresh Token (Revoked Token) lưu CSDL tránh rò rỉ phiên.
- [x] **Quản lý hội thoại & Nhóm:** Tạo cuộc trò chuyện 1-1, tạo nhóm chat kèm upload avatar nhóm, tìm kiếm người dùng qua username.
- [x] **Nhắn tin văn bản Realtime:** Gửi/nhận tin nhắn qua REST API + STOMP broadcast `/queue/messages`.
- [x] **Đính kèm đa phương tiện:** Hỗ trợ lưu trữ thông tin ảnh/file đính kèm qua `MessageMedia`.
- [x] **Phân trang & Sắp xếp tin nhắn:** Pagination tải tin nhắn cũ, sắp xếp hội thoại theo tin nhắn mới nhất, date dividers, timestamp.
- [x] **Typing Indicator (Đang nhập văn bản...):** Gửi event realtime khi đối phương đang gõ phím kèm debounce.
- [x] **Read Receipts (Đã nhận / Đã xem):** Cập nhật trạng thái tin nhắn đã đọc realtime.
- [x] **Trạng thái trực tuyến (User Presence):** Theo dõi realtime trạng thái Online/Offline và thời gian hoạt động cuối (Last active).
- [x] **Hồ sơ người dùng & Avatar:** Trang cá nhân, cập nhật thông tin và upload avatar đại diện.
- [x] **Đàm thoại P2P 1-1 & Nhóm (WebRTC):** Gọi thoại (Voice Call), gọi hình ảnh (Video Call) và phòng gọi nhóm (Group Call) qua kết nối P2P và Signaling Server STOMP.
- [x] **Mini-game Gomoku/Caro 15x15 Realtime:** Socket session quản lý nước đi, kiểm tra thắng thua và tích hợp modal bàn cờ ngay trong khung chat.
- [x] **Dữ liệu mẫu (`statics/dataset_sample.csv`):** Cung cấp sample dataset phục vụ chấm thi.
- [x] **Tài liệu kỹ thuật:** Báo cáo giao thức mạng (`NETWORK_REPORT.md`), kế hoạch triển khai (`PLAN.md`) và hướng dẫn chi tiết (`README.md`).

---

## 🗂️ 3. LỘ TRÌNH TRIỂN KHAI CHI TIẾT (PHASE BY PHASE)

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Tái cấu trúc & Dockerize (ĐÃ XONG 100% ✅)                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Phase 2: Hoàn thiện tính năng Chat nâng cao (ĐÃ XONG 100% ✅)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Phase 3: Tính năng Gọi Thoại & Video Call (ĐÃ XONG 100% ✅)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ Phase 4: Kiểm thử, Dữ liệu mẫu & Báo cáo Vấn đáp (ĐÃ XONG 100% ✅)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 🟢 PHASE 1 — TÁI CẤU TRÚC & DOCKERIZE (ĐÃ HOÀN THÀNH ✅)
- [x] Di chuyển mã nguồn vào `source/client` và `source/server`.
- [x] Viết `Dockerfile` tối ưu multi-stage build cho Spring Boot (Alpine JRE 21) và Next.js (Node 20 Alpine).
- [x] Viết file `docker-compose.yml` định nghĩa mạng nội bộ `nekotalk-network`, kết nối DB có healthcheck tự động.
- [x] Viết file `source/server/README.md` và `source/client/README.md`.
- [x] Cập nhật tài liệu tổng quan tại `README.md` ở root.

---

### 🟢 PHASE 2 — HOÀN THIỆN TÍNH NĂNG CHAT NÂNG CAO (ĐÃ HOÀN THÀNH ✅)

#### 2.1 Backend — Typing Indicator
*Mục tiêu:* Cho phép client gửi sự kiện "đang gõ..." để server chuyển tiếp đến người cùng phòng chat.
- **Tạo controller:** `source/server/src/main/java/com/nekotalk/controller/TypingController.java`
  - Mapping: `@MessageMapping("/chat.typing")`
  - Nhận payload gồm: `conversationId`, `isTyping`
  - Chuyển tiếp tới: `/topic/conversation/{conversationId}/typing` hoặc tới trực tiếp các thành viên qua `SimpMessagingTemplate.convertAndSendToUser(...)`.
- **Tạo DTO:**
  - `source/server/src/main/java/com/nekotalk/dto/request/TypingRequest.java`
  - `source/server/src/main/java/com/nekotalk/dto/response/TypingResponse.java`

#### 2.2 Backend — Read Receipts (Trạng thái đã đọc)
*Mục tiêu:* Xác nhận người nhận đã mở tin nhắn xem.
- **Cập nhật Entity:** Thêm trường `readAt` (LocalDateTime) trong `ChatMessage.java`.
- **Thêm API / WebSocket Endpoint:**
  - REST: `PATCH /api/chat-messages/conversations/{id}/read`
  - Hoặc STOMP: `@MessageMapping("/chat.read")`
- **Broadcast:** Bắn thông báo cập nhật tới người gửi tin nhắn để hiển thị dấu tick đã xem trên UI.

#### 2.3 Backend — Cập nhật Profile Người Dùng
- **Thêm API trong `UserController.java`:**
  - `PUT /api/users/profile`: Cập nhật bio, hiển thị tên.
  - `POST /api/users/avatar`: Cập nhật ảnh đại diện.

#### 2.4 Frontend — Tích hợp Typing Indicator UI
- **Tạo component:** `source/client/components/chat/TypingIndicator.tsx` (hiển thị hiệu ứng 3 dấu chấm nhảy nhẹ nhàng khi có người đang gõ).
- **Cập nhật `ChatInput.tsx`:**
  - Thêm sự kiện `onKeyDown`: Gửi STOMP frame báo `isTyping = true` với kỹ thuật debounce (tự động chuyển thành `false` sau 2.5s không gõ thêm).
- **Cập nhật Zustand store `useChatStore.ts`:** Thêm state `typingUsers: Record<string, boolean>`.

#### 2.5 Frontend — Hiển thị trạng thái tin nhắn (Sent / Delivered / Read)
- **Cập nhật component `MessageItem.tsx`:** Thêm biểu tượng tick đơn (Đã gửi) và tick đôi xanh (Đã xem).

---

### 🟢 PHASE 3 — TÍNH NĂNG GỌI THOẠI & VIDEO CALL (WEBRTC P2P) (ĐÃ HOÀN THÀNH ✅)

> [!NOTE]
> **Kiến trúc WebRTC trong dự án:**
> - Luồng dữ liệu media (âm thanh, hình ảnh) truyền **trực tiếp P2P** giữa 2 trình duyệt qua giao thức UDP/RTP, không tốn băng thông server.
> - Server Spring Boot đóng vai trò **Signaling Server** (bộ chuyển tiếp tín hiệu cuộc gọi, SDP Offer/Answer và ICE Candidate) sử dụng giao thức STOMP trên kênh WebSocket đã có sẵn.

#### Sơ đồ trình tự thiết lập cuộc gọi (WebRTC Signaling Flow):
```
Client A (Người gọi)         Spring Boot (Signaling Server)        Client B (Người nhận)
     │                                     │                                    │
     │── 1. Gửi Yêu cầu gọi ──────────────>│── 2. Đổ chuông cuộc gọi đến ──────>│
     │   (/app/call.request)               │   (/user/{B}/queue/call.incoming)  │
     │                                     │                                    │
     │                                     │<── 3. Chấp nhận nghe máy ──────────│
     │<── 4. Thông báo đã nghe máy ────────│   (/app/call.accept)               │
     │   (/user/{A}/queue/call.accepted)   │                                    │
     │                                     │                                    │
     │── 5. Gửi SDP Offer ────────────────>│── 6. Chuyển tiếp SDP Offer ───────>│
     │   (/app/call.sdp)                   │   (/user/{B}/queue/call.sdp)       │
     │                                     │                                    │
     │                                     │<── 7. Gửi SDP Answer ──────────────│
     │<── 8. Chuyển tiếp SDP Answer ───────│   (/app/call.sdp)                  │
     │   (/user/{A}/queue/call.sdp)        │                                    │
     │                                     │                                    │
     │── 9. Gửi ICE Candidates ───────────>│── 10. Chuyển tiếp ICE Candidates ─>│
     │<── 12. Nhận ICE Candidates ─────────│<── 11. Gửi ICE Candidates ─────────│
     │                                     │                                    │
     │══════════════════════════════════════════════════════════════════════════│
     │   13. KẾT NỐI P2P THÀNH CÔNG (Truyền tải âm thanh/hình ảnh trực tiếp)    │
     │══════════════════════════════════════════════════════════════════════════│
```

#### 3.1 Backend — Kênh Signaling Server (`source/server`)
Các file cần tạo mới:
1. `controller/CallSignalingController.java`:
   ```java
   @Controller
   @RequiredArgsConstructor
   public class CallSignalingController {
       private final SimpMessagingTemplate messagingTemplate;

       @MessageMapping("/call.request")
       public void handleCallRequest(@Payload CallRequest request, Principal principal) {
           messagingTemplate.convertAndSendToUser(
               request.targetUserId(), "/queue/call.incoming",
               new CallNotificationResponse(principal.getName(), request.callType())
           );
       }

       @MessageMapping("/call.accept")
       public void handleCallAccept(@Payload CallAcceptRequest request, Principal principal) {
           messagingTemplate.convertAndSendToUser(
               request.callerId(), "/queue/call.accepted",
               new CallAcceptedResponse(principal.getName())
           );
       }

       @MessageMapping("/call.reject")
       public void handleCallReject(@Payload CallRejectRequest request, Principal principal) {
           messagingTemplate.convertAndSendToUser(
               request.callerId(), "/queue/call.rejected",
               new CallRejectedResponse(principal.getName(), request.reason())
           );
       }

       @MessageMapping("/call.sdp")
       public void handleSdp(@Payload SdpMessage message, Principal principal) {
           messagingTemplate.convertAndSendToUser(
               message.targetUserId(), "/queue/call.sdp", message
           );
       }

       @MessageMapping("/call.ice")
       public void handleIceCandidate(@Payload IceCandidateMessage message, Principal principal) {
           messagingTemplate.convertAndSendToUser(
               message.targetUserId(), "/queue/call.ice", message
           );
       }
   }
   ```
2. Các DTO trong `dto/request/` và `dto/response/`:
   - `CallRequest.java` (chứa `targetUserId`, `callType: VOICE | VIDEO`)
   - `SdpMessage.java` (chứa `targetUserId`, `sdp`, `type: offer | answer`)
   - `IceCandidateMessage.java` (chứa `targetUserId`, `candidate`, `sdpMid`, `sdpMLineIndex`)

#### 3.2 Frontend — WebRTC Hook & Service (`source/client`)
Các file cần tạo mới:
1. `services/webrtc.service.ts`: Khởi tạo `RTCPeerConnection` cấu hình Google STUN public server:
   ```typescript
   export const ICE_CONFIG: RTCConfiguration = {
     iceServers: [
       { urls: 'stun:stun.l.google.com:19302' },
       { urls: 'stun:stun1.l.google.com:19302' }
     ]
   };
   ```
2. `store/useCallStore.ts`: Zustand store quản lý:
   - Trạng thái cuộc gọi: `idle` | `calling` | `ringing` | `connected` | `ended`
   - Loại cuộc gọi: `voice` | `video`
   - Streams: `localStream: MediaStream | null`, `remoteStream: MediaStream | null`
   - Tùy chọn thiết bị: `isMuted: boolean`, `isVideoEnabled: boolean`
3. `components/call/IncomingCallModal.tsx`: Hộp thoại chuông cuộc gọi đến (chấp nhận / từ chối).
4. `components/call/VideoCallModal.tsx`: Giao diện video 2 khung hình (Local PIP nhỏ ở góc, Remote lớn toàn màn hình) cùng các nút điều khiển Micro/Camera/Kết thúc cuộc gọi.
5. `components/call/VoiceCallModal.tsx`: Giao diện gọi thoại đơn giản kèm sóng âm thanh (Audio visualizer).

---

### 🟢 PHASE 4 — TÀI LIỆU, DATASET & CHUẨN BỊ BÁO CÁO VẤN ĐÁP (ĐÃ HOÀN THÀNH ✅)

#### 4.1 Cung cấp Dataset mẫu (`statics/dataset_sample.csv`)
Tạo file dữ liệu mẫu gồm 10 người dùng mẫu, 5 hội thoại mẫu và danh sách tin nhắn để giảng viên có thể kiểm tra cấu trúc dữ liệu ngay trong thư mục `statics/`.

#### 4.2 Cập nhật Sơ đồ kiến trúc (`statics/diagram.png`)
Bổ sung luồng kết nối WebRTC P2P và STOMP Signaling vào sơ đồ kiến trúc tổng thể.

#### 4.3 Chuẩn bị nội dung vấn đáp bảo vệ bài tập lớn
Xem chi tiết bộ câu hỏi và đáp án chuẩn lý thuyết mạng tại file [PROJECT_DETAILS.md](./PROJECT_DETAILS.md).

---

## 🛠️ 4. HƯỚNG DẪN TEST TÍNH NĂNG NHANH CHO CẢ NHÓM

### Test Chat Realtime:
1. Mở 2 cửa sổ trình duyệt (1 cửa sổ thường và 1 cửa sổ Ẩn danh - Incognito).
2. Cửa sổ 1 đăng ký tài khoản `userA`, cửa sổ 2 đăng ký tài khoản `userB`.
3. `userA` tìm kiếm `userB` và tạo hội thoại 1-1.
4. Gửi tin nhắn qua lại và quan sát tốc độ nhận tin tức thì không cần reload trang.

### Test Video/Audio Call:
1. Ở cửa sổ `userA`, bấm vào biểu tượng Camera/Micro ở thanh tiêu đề chat với `userB`.
2. Trình duyệt sẽ yêu cầu cấp quyền Camera/Microphone -> Chọn **Allow**.
3. Cửa sổ `userB` sẽ hiện modal chuông reo "Cuộc gọi đến từ userA" -> Bấm **Chấp nhận**.
4. Hai bên sẽ nhìn thấy và nghe thấy âm thanh của nhau truyền trực tiếp qua WebRTC P2P.

---

## 📋 5. CHECKLIST TIẾN ĐỘ THÀNH VIÊN THEO DÕI

- [x] **Setup & Cấu trúc**
  - [x] Tạo cấu trúc `source/client` và `source/server`
  - [x] Cấu hình Docker Compose đa tầng & LAN network
  - [x] Viết hướng dẫn `README.md`
- [x] **Tính năng Chat hoàn thiện**
  - [x] Typing Indicator (Backend STOMP endpoint + Frontend UI debounce)
  - [x] Read Receipts (Backend DB + Socket + Frontend status tick)
  - [x] Trạng thái trực tuyến Presence (Online/Offline realtime)
  - [x] Quản lý nhóm chat & Upload avatar
- [x] **WebRTC Voice & Video Call**
  - [x] Backend Signaling Controller (`/app/call.*`, `CallService`)
  - [x] Phân hệ đàm thoại nhóm đa điểm (`GroupCallService` & `GroupCallProvider`)
  - [x] Frontend WebRTC Service (`RTCPeerConnection` + Google STUN)
  - [x] UI Cuộc gọi đến (Incoming Modal) & Voice/Video Call Screens
- [x] **Tính năng Mở rộng (Bonus)**
  - [x] Mini-game Caro / Gomoku 15x15 Socket Session realtime
  - [x] Cơ chế thu hồi Refresh Token (Revoke token logout)
  - [x] Trang xem thông tin cá nhân (Profile page)
- [x] **Hoàn thiện đồ án**
  - [x] Tạo dataset mẫu `statics/dataset_sample.csv`
  - [x] Soạn tài liệu kiến trúc & kiến thức Lập trình mạng [PROJECT_DETAILS.md](./PROJECT_DETAILS.md) và [NETWORK_REPORT.md](./NETWORK_REPORT.md)
  - [x] Kiểm thử toàn diện trên môi trường Docker sạch (`docker compose down -v && docker compose up --build`)
