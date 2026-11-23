# BÀI TẬP LỚN: LẬP TRÌNH MẠNG
### HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG — KHOA CÔNG NGHỆ THÔNG TIN 1

---

## 🐾 NekoTalk – Hệ Thống Giao Tiếp Thời Gian Thực & Đàm Thoại P2P
*(Real-time Messaging & P2P Voice/Video Calling System)*

> 📘 **Giới thiệu:** NekoTalk là ứng dụng truyền thông mạng đa phương tiện kết hợp mô hình **Client-Server** (cho luồng tin nhắn, sự kiện gõ phím, trạng thái người dùng qua WebSocket/STOMP) và mô hình **Peer-to-Peer - P2P** (cho luồng đàm thoại âm thanh và hình ảnh trực tiếp qua WebRTC/UDP). Hệ thống được xây dựng với **Spring Boot (Java 21)**, **Next.js 16 (React 19)**, **MySQL 8** và được tự động hóa triển khai 100% bằng **Docker Compose**.

> 📚 **Tài liệu đính kèm đồ án:**
> - 📄 [Báo cáo tiến độ hoàn chỉnh (Word .docx)](./Báo%20cáo%20tiến%20độ%2011-11-2026.docx) *(Bản in/nộp tiến độ nhóm 2 thành viên)*
> - 🎓 [Báo cáo chi tiết giao thức mạng (NETWORK_REPORT.md)](./NETWORK_REPORT.md) *(Tài liệu kỹ thuật chuyên sâu về giao thức & kiến trúc mạng)*
> - 📋 [Kế hoạch triển khai nội bộ (PLAN.md)](./PLAN.md) *(Theo dõi chi tiết các phase phát triển)*

---

## 🧑‍💻 THÔNG TIN NHÓM VÀ PHÂN CÔNG NHIỆM VỤ

- **Giảng viên phụ trách:** Nguyễn Quốc Huy
- **Học phần:** Lập trình mạng (INT1434 / IT4010)  
- **Tên nhóm:** Nhóm NekoTalk (Nhóm 2 thành viên)  
- **Chủ đề đăng ký:** Hệ thống giao tiếp thời gian thực & Đàm thoại P2P (WebSocket & WebRTC)

### Bảng phân công chi tiết (Nhóm 2 thành viên):

| STT | Họ và Tên | MSSV | Nhiệm vụ chính phụ trách | Tỷ lệ đóng góp |
|:---:|-----------|:----:|--------------------------|:--------------:|
| **1** | Đào Vũ Đạt | B23DCCN127 | **Fullstack Core Architecture, Socket Server & DevOps:**<br>• Thiết kế CSDL MySQL 8.0, Spring Data JPA, đánh chỉ mục (Index) tối ưu truy vấn lịch sử tin nhắn.<br>• Bảo mật mạng: Xác thực phân tán Stateless JWT (Access/Refresh Token), Interceptor xác thực WebSocket Handshake.<br>• Lập trình Socket Server: Xây dựng STOMP Message Broker (`/topic`, `/queue`), Chat realtime, Typing indicator, Read receipts, User Presence (Online/Offline/Last active).<br>• Game Socket: Thiết kế In-memory TicTacToe/Gomoku 15x15 Session Manager và tích hợp bàn cờ cờ ca-rô realtime.<br>• Frontend Core: Khởi tạo kiến trúc Next.js 16, layout workspace, Zustand state, Axios client, quản lý nhóm chat và upload avatar.<br>• DevOps & Mạng ảo: Viết Dockerfile đa tầng tối ưu (JRE 21, Node 20), Docker Compose bridge network, cấu hình truy cập mạng LAN. | **50%** |
| **2** | Bùi Hồng Phong | B23DCCN641 | **WebRTC P2P Media Stream, Signaling & Session Security:**<br>• Truyền thông P2P: Tích hợp WebRTC (`RTCPeerConnection`), Google STUN (NAT Traversal), xử lý luồng MediaStream âm thanh/hình ảnh.<br>• Signaling Server: Xây dựng bộ điều khiển và xử lý chuyển tiếp tín hiệu bắt tay SDP Offer/Answer, ICE Candidate qua STOMP (`CallSignalingController`, `CallService`).<br>• Đàm thoại nhóm đa điểm: Xây dựng phân hệ Group Call ở cả backend (`GroupCallService`) và frontend (`GroupCallProvider`).<br>• Giao diện cuộc gọi: Xây dựng UI đàm thoại Voice Call, Video Call, hộp thoại chuông reo cuộc gọi đến và thanh điều khiển thiết bị Mic/Cam.<br>• Bảo mật phiên & Tinh gọn Client: Hiện thực cơ chế thu hồi Refresh Token khi đăng xuất (Revoked Token lưu CSDL), trang hồ sơ cá nhân và dọn dẹp các thành phần UI thừa. | **50%** |

---

## 🧠 MÔ TẢ HỆ THỐNG VÀ KIẾN TRÚC MẠNG

### 1. Kiến trúc phân tầng mạng (Network Architecture)

Hệ thống kết hợp 2 mô hình mạng kinh điển nhằm tối ưu hóa triệt để hiệu năng và băng thông:

1. **Mô hình Client-Server (Quản lý nghiệp vụ & Nhắn tin thời gian thực):**
   - **Tầng Web Service / REST API (HTTP/1.1 qua TCP):** Xử lý đăng ký, đăng nhập cấp JWT, tìm kiếm người dùng, quản lý phòng chat, tải lịch sử tin nhắn phân trang và tải tệp đính kèm.
   - **Tầng Socket Server (WebSocket RFC 6455 + STOMP over TCP):** Duy trì kết nối 2 chiều liên tục (Full-Duplex), broadcast tin nhắn tức thì, cập nhật trạng thái đang gõ (Typing Indicator) và trạng thái trực tuyến (Presence Tracking).
2. **Mô hình Hybrid Peer-to-Peer (Đàm thoại Âm thanh & Hình ảnh qua WebRTC):**
   - **Signaling Server (Spring Boot):** Đóng vai trò môi giới bắt tay mạng, chuyển tiếp các gói tin SDP Offer/Answer và ICE Candidate qua kênh STOMP.
   - **Direct P2P Media Stream (UDP / RTP / RTCP):** Sau khi hoàn tất bắt tay (Handshake & NAT Traversal qua Google STUN), 2 trình duyệt truyền tải trực tiếp luồng Audio/Video với độ trễ tính bằng mili-giây, hoàn toàn không tốn tài nguyên băng thông của máy chủ trung tâm.

```
                    ┌────────────────────────────────────────────────────────┐
                    │                   HỆ THỐNG NEKOTALK                    │
                    └────────────────────────────────────────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
     [Phân hệ Text & Presence]                                     [Phân hệ Voice & Video Call]
     - Mô hình: Client - Server                                    - Mô hình: Hybrid P2P
     - Giao thức: HTTP REST + WebSocket/STOMP                      - Giao thức: WebRTC (RTP/RTCP trên UDP)
     - Kênh truyền: TCP Socket                                     - Kênh truyền: Direct UDP Stream
     - Trung gian: Spring Boot Message Broker                      - Trung gian: Spring Boot làm Signaling Server
```

### 2. Sơ đồ tương tác các thành phần

```
┌───────────────────────┐                                     ┌───────────────────────┐
│  Client A (Browser)   │                                     │  Client B (Browser)   │
└──────────┬────────────┘                                     └───────────┬───────────┘
           │                                                              │
           │◄═══════════ REST API (HTTP 1.1) / JWT Auth ═════════════════►│
           │                                                              │
           │◄═══════════ Persistent WebSocket (STOMP Broker) ════════════►│
           │               (Chat, Typing, Presence, Signaling)            │
           │                                                              │
           │                       ┌─────────────────┐                   │
           │                       │  Spring Boot    │                   │
           ├──────────────────────►│  Server (8080)  │◄──────────────────┤
           │                       └────────┬────────┘                   │
           │                                │                            │
           │                                ▼                            │
           │                       ┌─────────────────┐                   │
           │                       │  MySQL 8 (3306) │                   │
           │                       └─────────────────┘                   │
           │                                                              │
           │══════════════════════════════════════════════════════════════│
           │   LUỒNG TRUYỀN THÔNG TRỰC TIẾP P2P (WebRTC qua giao thức UDP)│
           │      (Audio / Video Streams - Sub-second Latency)            │
           └──────────────────────────────────────────────────────────────┘
```

---

## ⚙️ CÔNG NGHỆ VÀ KỸ THUẬT LẬP TRÌNH MẠNG ĐÃ ÁP DỤNG

| Thành phần | Kỹ thuật & Công nghệ áp dụng | Phiên bản | Vai trò trong hệ thống |
|---|---|---|---|
| **Ngôn ngữ Backend** | **Java** | 21 LTS | Xử lý nghiệp vụ, Virtual Threads tối ưu hóa đa luồng xử lý đồng thời |
| **Backend Framework** | **Spring Boot** | 4.1.0 | Spring MVC, Spring WebSocket, Spring Security, Spring Data JPA |
| **Giao thức Socket** | **WebSocket + STOMP** | RFC 6455 | Kênh kết nối 2 chiều liên tục trên TCP, quản lý theo Topic/Queue Broker |
| **Đàm thoại P2P** | **WebRTC + Google STUN** | HTML5 API | Truyền tải âm thanh/hình ảnh trực tiếp qua UDP, đục lỗ mạng NAT |
| **Xác thực mạng** | **Stateless JWT** | Nimbus JOSE | Bảo vệ REST API và chặn bắt xác thực kết nối WebSocket Handshake |
| **Frontend Framework** | **Next.js (React)** | 16.3 / 19 | Giao diện Web GUI hiện đại, Server & Client Components |
| **Ngôn ngữ Client** | **TypeScript** | 5.x | Đảm bảo tính toàn vẹn kiểu dữ liệu của các gói tin mạng gửi/nhận |
| **Quản lý State GUI** | **Zustand** | 5.x | Quản lý state tin nhắn, trạng thái phòng chat và luồng gọi P2P |
| **Cơ sở dữ liệu** | **MySQL Server** | 8.0 | Lưu trữ người dùng, hội thoại, lịch sử tin nhắn (hỗ trợ Indexing) |
| **Media Storage** | **Cloudinary API** | REST SDK | Lưu trữ hình ảnh và tệp tin đính kèm đa phương tiện |
| **Ảo hóa & Đóng gói** | **Docker & Docker Compose** | Multi-stage | Ảo hóa mạng nội bộ (bridge network), khởi chạy toàn bộ bằng 1 lệnh |

---

## 🐳 TRIỂN KHAI NHANH VỚI DOCKER COMPOSE (KHUYÊN DÙNG)

Dự án được containerize hóa hoàn chỉnh 100%. Giảng viên và người chấm **không cần cài đặt Java 21, Node.js hay MySQL** trên máy, chỉ cần duy nhất ứng dụng **Docker Desktop**.

### 1. Kiến trúc Container và Mạng ảo (Bridge Network)

```
                    [Host Machine / Trình duyệt người dùng]
                             │                 │
                       Port 3000 (UI)     Port 8080 (API & WS)
                             │                 │
    ┌────────────────────────▼─────────────────▼────────────────────────┐
    │  Docker Network: nekotalk-network (Driver: bridge)                │
    │                                                                   │
    │  ┌─────────────────────────┐         ┌─────────────────────────┐  │
    │  │     nekotalk-client     │         │     nekotalk-server     │  │
    │  │ (Next.js 16 - Node 20)  │         │  (Spring Boot - JRE 21) │  │
    │  └─────────────────────────┘         └────────────┬────────────┘  │
    │                                                   │               │
    │                                                   │ Port 3306     │
    │                                                   ▼               │
    │                                      ┌─────────────────────────┐  │
    │                                      │      nekotalk-mysql     │  │
    │                                      │     (MySQL Server 8)    │  │
    │                                      └────────────┬────────────┘  │
    └───────────────────────────────────────────────────┼───────────────┘
                                                        │
                                             ┌──────────▼──────────┐
                                             │ Volume: mysql_data  │
                                             └─────────────────────┘
```

- **`nekotalk-mysql`:** Tự động tạo schema `chat_online` với mã hóa UTF-8 (`utf8mb4`). Tích hợp `healthcheck` kiểm tra trạng thái sẵn sàng của DB.
- **`nekotalk-server`:** Đóng gói Multi-stage build (Stage 1: Maven build, Stage 2: Alpine JRE 21 siêu nhẹ). Tự động chờ DB `healthy` mới khởi động.
- **`nekotalk-client`:** Đóng gói Multi-stage build biên dịch Next.js production chạy trên Node 20 Alpine.

### 2. Các bước khởi chạy 1 lệnh duy nhất:

1. **Mở Docker Desktop** trên máy tính của bạn.
2. **Mở terminal tại thư mục gốc dự án và chạy:**
   ```bash
   docker compose up -d --build
   ```
   *(Docker sẽ tự động tải base images, build backend/frontend và khởi chạy 3 container).*

3. **Kiểm tra trạng thái các container:**
   ```bash
   docker compose ps
   ```
   *(Khi cả 3 containers đều hiển thị trạng thái `Up` và mysql ở trạng thái `healthy` là hệ thống đã sẵn sàng).*

4. **Truy cập hệ thống:**
   - 🌐 **Giao diện Client:** [http://localhost:3000](http://localhost:3000)
   - 🔌 **Backend REST API:** [http://localhost:8080](http://localhost:8080)
   - 🗄️ **MySQL Database (kết nối ngoài nếu cần):** `localhost:3306` (User: `root`, Password: `admin`, DB: `chat_online`)

5. **Dừng hệ thống:**
   ```bash
   docker compose down          # Dừng dịch vụ, giữ nguyên dữ liệu
   docker compose down -v       # Dừng và xoá sạch dữ liệu DB để chạy lại từ đầu
   ```

---

## 💻 HƯỚNG DẪN CHẠY MÔI TRƯỜNG PHÁT TRIỂN (LOCAL DEV)

Dành cho các thành viên trong nhóm muốn lập trình, sửa code và debug trực tiếp qua IDE:

### Yêu cầu môi trường:
- Java JDK 21+
- Node.js 20+ và npm
- MySQL Server 8.0

### Bước 1: Khởi động Database (MySQL)
```bash
docker compose up mysql -d
```
Hoặc tạo database trên MySQL local:
```sql
CREATE DATABASE chat_online CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Bước 2: Khởi động Backend (Spring Boot)
```bash
cd source/server
# Windows:
.\mvnw.cmd spring-boot:run
# Linux / macOS:
./mvnw spring-boot:run
```
Server sẽ chạy tại: `http://localhost:8080`

### Bước 3: Khởi động Frontend (Next.js)
```bash
cd source/client
npm install
npm run dev
```
Client sẽ chạy tại: [http://localhost:3000](http://localhost:3000)

---

## 🔗 DANH SÁCH GIAO THỨC & ENDPOINTS MẠNG

> 📖 Xem tài liệu kỹ thuật đầy đủ tại [NETWORK_REPORT.md](./NETWORK_REPORT.md)

### 1. HTTP / REST API Endpoints

| Nhóm chức năng | Phương thức | Endpoint | Mô tả | Xác thực JWT |
|:---:|:---:|---|---|:---:|
| **Xác thực** | `POST` | `/api/users` | Đăng ký tài khoản người dùng mới | ❌ |
| **Xác thực** | `POST` | `/api/auth/login` | Đăng nhập hệ thống, cấp Access & Refresh Token | ❌ |
| **Xác thực** | `POST` | `/api/auth/refresh` | Cấp mới Access Token khi token cũ hết hạn | ❌ |
| **Xác thực** | `POST` | `/api/auth/logout` | Đăng xuất, vô hiệu hóa Refresh Token hiện tại | ✅ |
| **Người dùng** | `GET` | `/api/users/my-info` | Lấy thông tin cá nhân của tài khoản đang đăng nhập | ✅ |
| **Người dùng** | `GET` | `/api/users/search?keyword={kw}` | Tìm kiếm tài khoản người dùng theo username | ✅ |
| **Người dùng** | `POST` | `/api/users/avatar` | Upload ảnh đại diện cá nhân lên Cloudinary | ✅ |
| **Hội thoại** | `POST` | `/api/conversations` | Tạo cuộc trò chuyện mới (1-1 hoặc nhóm) | ✅ |
| **Hội thoại** | `GET` | `/api/conversations/my-conversation` | Lấy danh sách các cuộc trò chuyện của tôi | ✅ |
| **Hội thoại** | `PATCH` | `/api/conversations/{id}/read` | Đánh dấu đã đọc tin nhắn trong hội thoại | ✅ |
| **Tin nhắn** | `POST` | `/api/chat-messages` | Gửi tin nhắn mới kèm danh sách file media | ✅ |
| **Tin nhắn** | `GET` | `/api/chat-messages/conversations/{id}/messages` | Lấy lịch sử tin nhắn theo hội thoại (phân trang) | ✅ |

### 2. WebSocket & STOMP Broker Topics / Queues

| Mục đích | Loại Endpoint / Kênh | Địa chỉ / Đích (Destination) | Mô tả chi tiết |
|---|---|---|---|
| **Handshake** | WebSocket URL | `ws://localhost:8080/ws` | Điểm bắt tay WebSocket, chặn bắt kiểm tra Token |
| **Gửi tin nhắn** | Application Prefix | `/app/chat.send` | Client gửi tin nhắn, Server lưu DB và broadcast |
| **Báo đang gõ** | Application Prefix | `/app/chat.typing` | Client gửi trạng thái đang gõ phím (typing event) |
| **Tín hiệu gọi** | Application Prefix | `/app/call.signal` | Toàn bộ tín hiệu cuộc gọi WebRTC (INVITE/SDP/ICE) |
| **Game cờ Caro** | Application Prefix | `/app/game.ttt` | Gửi lời mời và đồng bộ các nước đi cờ qua Socket |
| **Nhận tin realtime** | User Queue | `/user/queue/messages` | Hàng đợi nhận tin nhắn cá nhân thời gian thực |
| **Nhận tín hiệu gọi** | User Queue | `/user/queue/calls` | Hàng đợi nhận tín hiệu chuông reo, SDP, ICE |
| **Nhận game cờ** | User Queue | `/user/queue/game.ttt` | Hàng đợi nhận trạng thái ván cờ Caro |
| **Trạng thái Online** | Topic Broadcast | `/topic/presence` | Kênh lắng nghe trạng thái Online/Offline toàn mạng |

---

## 🎮 TÍNH NĂNG MỞ RỘNG ĐẶC SẮC

Bên cạnh các yêu cầu cơ bản của đề tài Lập trình mạng, nhóm đã nghiên cứu và phát triển thêm các tính năng nâng cao:
1. **Đàm thoại P2P Voice & Video Call:** Ứng dụng kỹ thuật đục lỗ NAT (NAT Traversal qua Google STUN Server), truyền tải âm thanh/hình ảnh trực tiếp qua UDP/RTP với độ trễ cực thấp.
2. **Minigame Cờ Caro (TicTacToe) Realtime:** Tích hợp trực tiếp trong phòng chat, hai người dùng có thể gửi lời mời thách đấu và chơi cờ đồng bộ theo lượt thông qua WebSocket.
3. **Chỉ báo Typing Indicator thông minh:** Sử dụng kỹ thuật Debounce phía Client và sự kiện Socket nhẹ giúp hiển thị đối phương đang nhập văn bản mượt mà.
4. **Theo dõi trạng thái kết nối (Presence Tracking):** Tự động phát hiện người dùng ngắt mạng thông qua bộ lắng nghe sự kiện `SessionDisconnectEvent` của Spring Boot.

---

## 🧩 CẤU TRÚC REPOSITORY (TUÂN THỦ INSTRUCTION.MD)

```
BTL_LTM_NekoTalk/
├── README.md                          # Tài liệu chính của đồ án (file này)
├── NETWORK_REPORT.md                  # Báo cáo chi tiết giao thức mạng
├── INSTRUCTION.md                     # File quy định của Giảng viên (KHÔNG sửa đổi)
├── PLAN.md                            # Kế hoạch phát triển nội bộ của nhóm
├── Báo cáo tiến độ 11-11-2026.docx    # File Word báo cáo tiến độ (Nhóm 2 SV)
├── docker-compose.yml                 # File điều phối khởi chạy 3 container Docker
├── statics/                           # Thư mục tài nguyên tĩnh
│   ├── logo.png                       # Logo nhận diện ứng dụng
│   ├── dataset_sample.csv             # Dữ liệu người dùng & tin nhắn mẫu
│   └── diagram.png                    # Sơ đồ kiến trúc mạng hệ thống
└── source/                            # Toàn bộ mã nguồn dự án
    ├── .gitignore
    ├── client/                        # Frontend Web Application (Next.js 16)
    │   ├── Dockerfile                 # Multi-stage Dockerfile cho Frontend
    │   ├── package.json               # Danh sách thư viện phụ thuộc
    │   ├── app/                       # Next.js App Router (Auth, Chat, Profile)
    │   ├── components/
    │   │   ├── auth/                  # Form đăng nhập, đăng ký
    │   │   ├── chat/                  # Danh sách chat, khung chat, call providers
    │   │   ├── game/                  # Giao diện bàn cờ Caro (TicTacToe)
    │   │   └── ui/                    # Thư viện giao diện chuẩn shadcn/ui
    │   ├── hooks/                     # Custom React Hooks (useWebSocket, useAuth)
    │   ├── services/                  # Các lớp gọi REST API (Axios)
    │   ├── store/                     # Quản lý State toàn cục bằng Zustand
    │   └── types/                     # Định nghĩa TypeScript interfaces
    └── server/                        # Backend REST & Socket Server (Spring Boot)
        ├── Dockerfile                 # Multi-stage Dockerfile cho Backend
        ├── pom.xml                    # Cấu hình Maven Dependencies (Java 21)
        └── src/main/java/com/nekotalk/
            ├── configuration/         # Cấu hình Security, JWT, WebSocket, CORS, Cloudinary
            ├── constant/              # Các hằng số ứng dụng
            ├── controller/            # REST Controllers & Socket MessageMapping
            ├── dto/                   # Request & Response Data Transfer Objects
            ├── entity/                # Các thực thể cơ sở dữ liệu JPA (MySQL)
            ├── event/                 # Các sự kiện ứng dụng Spring nội bộ
            ├── exception/             # Xử lý ngoại lệ toàn cục (Global Exception Handler)
            ├── game/                  # Xử lý logic và phiên đấu cờ Caro Socket
            ├── listener/              # Lắng nghe sự kiện kết nối/ngắt kết nối WebSocket
            ├── repository/            # Tầng truy xuất dữ liệu Spring Data JPA
            └── service/               # Tầng nghiệp vụ (Auth, Chat, Call, Presence, User)
```

---

## 📋 TIẾN ĐỘ THỰC HIỆN DỰ ÁN

- [x] **Setup & Cấu trúc:** Chuẩn hóa thư mục gốc theo `INSTRUCTION.md` (`source/client`, `source/server`, `statics/`).
- [x] **Docker Containerization:** Đóng gói Multi-stage build cho Client và Server, điều phối qua `docker-compose.yml` với healthcheck MySQL.
- [x] **Cơ sở dữ liệu:** Thiết kế ERD 7 bảng, đánh chỉ mục truy vấn, tích hợp JPA/Hibernate trên MySQL 8.
- [x] **Xác thực & Bảo mật:** Đăng ký, đăng nhập cấp JWT Access/Refresh Token, bảo vệ REST API và WebSocket Handshake.
- [x] **Nhắn tin văn bản Realtime:** Nhắn tin 1-1 và Chat nhóm qua STOMP Broker `/topic` và `/queue`.
- [x] **Typing Indicator:** Gửi sự kiện thời gian thực khi đối phương đang gõ phím.
- [x] **Presence Tracking:** Tự động phát hiện và broadcast trạng thái Online/Offline của người dùng.
- [x] **Minigame Socket:** Chơi cờ Caro (TicTacToe) đồng bộ thời gian thực giữa 2 người dùng trong phòng chat.
- [x] **Đàm thoại Voice & Video Call:** Xây dựng Signaling Server và tích hợp WebRTC P2P qua Google STUN.
- [x] **Dataset & Tài liệu:** Cung cấp dataset mẫu `dataset_sample.csv`, báo cáo giao thức mạng chi tiết và báo cáo tiến độ Word.
- [ ] **Kiểm thử mở rộng:** Thử nghiệm kết nối P2P trên các hạ tầng mạng đối xứng phức tạp (TURN Server) và hoàn thiện báo cáo bản in.

---

## 🧩 HƯỚNG PHÁT TRIỂN THÊM

- [ ] Hỗ trợ TURN Server cho NAT đối xứng phức tạp (Symmetric NAT)
- [ ] Gọi nhóm (Group Call) qua WebRTC Mesh / SFU
- [ ] Tìm kiếm toàn văn tin nhắn (Full-text Search)
- [ ] Triển khai trên cloud (AWS / GCP) với HTTPS/WSS

---

## 📝 GHI CHÚ

- Repo tuân thủ đúng cấu trúc đã hướng dẫn trong `INSTRUCTION.md`.
- Tài liệu giao thức mạng chi tiết xem tại [NETWORK_REPORT.md](./NETWORK_REPORT.md).
- Đảm bảo test kỹ trước khi submit.

---

## 📚 TÀI LIỆU THAM KHẢO

1. RFC 6455 – The WebSocket Protocol: https://tools.ietf.org/html/rfc6455
2. STOMP Protocol Specification 1.2: https://stomp.github.io/stomp-specification-1.2.html
3. WebRTC 1.0 – Real-Time Communication Between Browsers (W3C): https://www.w3.org/TR/webrtc/
4. Spring Framework WebSocket & STOMP Messaging: https://docs.spring.io/spring-framework/reference/web/websocket/stomp.html
5. Next.js App Router Documentation: https://nextjs.org/docs
6. Cloudinary Upload API: https://cloudinary.com/documentation/image_upload_api_reference
7. Project Loom & Virtual Threads in Java 21: https://openjdk.org/projects/loom/
