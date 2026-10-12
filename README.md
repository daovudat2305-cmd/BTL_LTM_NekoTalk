# BÀI TẬP LỚN: LẬP TRÌNH MẠNG

## NekoTalk – Ứng dụng Chat Realtime

> 📘 Ứng dụng chat realtime sử dụng WebSocket/STOMP, xây dựng với Spring Boot (backend), Next.js (frontend) và MySQL (database), hỗ trợ đóng gói và triển khai toàn diện bằng Docker Compose.

---

## 🧑‍💻 THÔNG TIN NHÓM

| STT | Họ và Tên | MSSV | Email | Đóng góp |
|:---:|-----------|:----:|-------|----------|
| 1 | [Họ tên] | [MSSV] | [email] | Backend (Spring Boot, WebSocket) |
| 2 | [Họ tên] | [MSSV] | [email] | Frontend (Next.js, UI) |
| 3 | [Họ tên] | [MSSV] | [email] | Database, Authentication & DevOps |

**Tên nhóm:** [Tên nhóm]  
**Chủ đề đã đăng ký:** Ứng dụng Chat Realtime (WebSocket)

---

## 🧠 MÔ TẢ HỆ THỐNG

Hệ thống **NekoTalk** là ứng dụng chat đa người dùng trong thời gian thực (realtime) với các tính năng: đăng ký/đăng nhập xác thực bằng JWT, tìm kiếm người dùng, tạo cuộc trò chuyện 1-1 hoặc nhóm, và trò chuyện tức thì thông qua giao thức WebSocket (STOMP).

**Kiến trúc hệ thống:**
- **Backend (Spring Boot):** Xử lý nghiệp vụ REST API, xác thực và cấp phát JWT, lưu trữ dữ liệu, broadcast tin nhắn qua WebSocket/STOMP Broker.
- **Frontend (Next.js):** Giao diện web hiện đại (App Router, Tailwind CSS, shadcn/ui), quản lý trạng thái bằng Zustand, kết nối song song REST API (Axios) và WebSocket client (`@stomp/stompjs`).
- **Database (MySQL 8):** Lưu trữ người dùng, cuộc hội thoại và lịch sử tin nhắn.
- **Containerization (Docker Compose):** Đóng gói toàn bộ hệ thống (Database, Backend, Frontend) thành các containers chạy độc lập và giao tiếp qua mạng nội bộ.

**Cấu trúc giao tiếp:**
```
[Client (Next.js)]  <--- HTTP/REST --->  [Server (Spring Boot)]  <--->  [MySQL 8]
[Client (Next.js)]  <--- WebSocket --->  [Server (Spring Boot)]
```

**Sơ đồ hệ thống:**

![System Diagram](./statics/diagram.png)

---

## ⚙️ CÔNG NGHỆ SỬ DỤNG

| Thành phần | Công nghệ | Ghi chú |
|------------|-----------|---------|
| **Server** | Java 21 + Spring Boot 4.1.0 | REST API + WebSocket STOMP |
| **Database** | MySQL 8 | JPA / Hibernate (`ddl-auto: update`) |
| **Security / Auth** | JWT (Nimbus JOSE 9.30.1) | Spring Security (Bearer Token) |
| **Client** | TypeScript + Next.js 16.3 | React 19, App Router |
| **UI Styling** | Tailwind CSS v4 + shadcn/ui | Theme Dark / Light |
| **Client State** | Zustand | Quản lý state người dùng & tin nhắn |
| **Real-time** | WebSocket + STOMP | `@stomp/stompjs` |
| **HTTP Client** | Axios | Interceptor tự động refresh token |
| **Containerization** | Docker & Docker Compose | Multi-stage build (Alpine Linux) |

---

## 🐳 TRIỂN KHAI VỚI DOCKER & DOCKER COMPOSE

Dự án đã được containerize hóa hoàn chỉnh theo đúng yêu cầu kỹ thuật của bài tập lớn. Người dùng hoặc giảng viên khi clone dự án về **không cần cài đặt Java 21, Node.js hay MySQL** trên máy thật, chỉ cần duy nhất **Docker Desktop**.

### 1. Kiến trúc Container

```
                    [Host Machine / Browser]
                     │                    │
              Port 3000 (UI)        Port 8080 (API & WS)
                     │                    │
    ┌────────────────▼────────────────────▼─────────────────────┐
    │  Docker Network: nekotalk-network                         │
    │                                                           │
    │  ┌─────────────────┐             ┌─────────────────────┐  │
    │  │ nekotalk-client │             │   nekotalk-server   │  │
    │  │ (Next.js 16)    │             │ (Spring Boot / JRE) │  │
    │  └─────────────────┘             └──────────┬──────────┘  │
    │                                             │             │
    │                                             │ Port 3306   │
    │                                             ▼             │
    │                                  ┌─────────────────────┐  │
    │                                  │    nekotalk-mysql   │  │
    │                                  │       (MySQL 8)     │  │
    │                                  └──────────┬──────────┘  │
    └─────────────────────────────────────────────┼─────────────┘
                                                  │
                                       ┌──────────▼──────────┐
                                       │ Volume: mysql_data  │
                                       └─────────────────────┘
```

- **`nekotalk-mysql` (MySQL 8.0):**
  - Tự động khởi tạo database `chat_online` với mã hóa UTF-8 (`utf8mb4`).
  - Sử dụng cơ chế **Health Check** (`mysqladmin ping`) để đảm bảo DB đã sẵn sàng 100% trước khi backend kết nối.
  - Dữ liệu được lưu trữ bền vững qua volume `mysql_data`.
- **`nekotalk-server` (Spring Boot Java 21):**
  - Đóng gói bằng **Multi-stage build**: Stage 1 biên dịch Maven, Stage 2 chạy với `eclipse-temurin:21-jre-alpine` giúp tối ưu dung lượng image.
  - Phụ thuộc (`depends_on`) vào trạng thái `healthy` của MySQL.
- **`nekotalk-client` (Next.js 16.3):**
  - Đóng gói bằng **Multi-stage build**: cài đặt dependencies, build production bundle và chạy với Node 20 Alpine.

---

### 2. Hướng dẫn khởi chạy bằng 1 lệnh duy nhất (Quick Start)

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd BTL_LTM_NekoTalk
   ```

2. **Khởi chạy toàn bộ hệ thống bằng Docker Compose:**
   ```bash
   docker compose up -d --build
   ```
   *(Docker sẽ tự động tải images, biên dịch Backend & Frontend, cấu hình mạng và khởi chạy 3 container).*

3. **Kiểm tra trạng thái các container:**
   ```bash
   docker compose ps
   ```
   *Khi cả 3 containers đều hiển thị trạng thái `Up` (và `mysql` ở trạng thái `healthy`) là hệ thống đã sẵn sàng.*

4. **Truy cập ứng dụng:**
   - 🌐 **Giao diện Client (Chat):** [http://localhost:3000](http://localhost:3000)
   - 🔌 **Backend REST API:** [http://localhost:8080](http://localhost:8080)
   - 🗄️ **MySQL Database (kết nối ngoài):** `localhost:3306` (User: `root`, Password: `admin`, DB: `chat_online`)

---

### 3. Bảng lệnh quản lý Docker thường dùng

| Thao tác | Câu lệnh |
|---|---|
| **Xem log realtime tất cả container** | `docker compose logs -f` |
| **Xem log riêng của backend server** | `docker compose logs -f server` |
| **Xem log riêng của MySQL** | `docker compose logs -f mysql` |
| **Dừng hệ thống (giữ nguyên dữ liệu DB)** | `docker compose down` |
| **Dừng và xoá sạch dữ liệu DB (reset từ đầu)** | `docker compose down -v` |
| **Rebuild lại sau khi sửa code** | `docker compose up -d --build` |
| **Khởi động lại toàn bộ containers** | `docker compose restart` |

---

### 4. Xử lý sự cố thường gặp (Troubleshooting)

- **Lỗi trùng cổng (`port is already allocated`):**
  - *Nguyên nhân:* Cổng `3306`, `8080` hoặc `3000` đang bị dịch vụ khác trên máy thật chiếm dụng (ví dụ MySQL cài sẵn trên máy).
  - *Xử lý:* Tắt service MySQL local (qua `services.msc` trên Windows) hoặc đổi cổng ánh xạ bên ngoài trong [docker-compose.yml](file:///g:/Workplace/BTL_LTM_NekoTalk/docker-compose.yml) (ví dụ `"3307:3306"`).
- **Lỗi `Cannot connect to the Docker daemon`:**
  - *Xử lý:* Đảm bảo ứng dụng **Docker Desktop** đã được mở và đang chạy trước khi gõ lệnh.

---

## 💻 HƯỚNG DẪN CHẠY CỤC BỘ (LOCAL DEVELOPMENT)

Nếu thành viên muốn code và debug trực tiếp trên IDE mà không cần build lại image:

### Yêu cầu môi trường
- Java 21+
- Node.js 20+
- MySQL 8

### Bước 1: Chuẩn bị Database
Tạo database MySQL `chat_online`:
```sql
CREATE DATABASE chat_online CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
> 💡 **Mẹo:** Bạn có thể tận dụng Docker để chạy riêng MySQL mà không cần cài MySQL trên máy:
> ```bash
> docker compose up mysql -d
> ```

### Bước 2: Khởi động Server (Spring Boot)
```bash
cd source/server
# Linux / macOS:
./mvnw spring-boot:run
# Windows:
mvnw.cmd spring-boot:run
```
Server lắng nghe tại: `http://localhost:8080`

### Bước 3: Khởi động Client (Next.js)
```bash
cd source/client
npm install
npm run dev
```
Client lắng nghe tại: [http://localhost:3000](http://localhost:3000)

---

## 🔗 GIAO TIẾP VÀ DANH SÁCH API

### 1. HTTP / REST API (HTTP 1.1)

| Nhóm | Method | Endpoint | Mô tả | Auth |
|:---:|:---:|---|---|:---:|
| **Auth** | `POST` | `/api/users` | Đăng ký tài khoản mới | ❌ |
| **Auth** | `POST` | `/api/auth/login` | Đăng nhập, nhận Access Token & Refresh Token | ❌ |
| **Auth** | `POST` | `/api/auth/refresh` | Cấp mới Access Token từ Refresh Token | ❌ |
| **User** | `GET` | `/api/users/my-info` | Lấy thông tin tài khoản hiện tại | ✅ |
| **User** | `GET` | `/api/users/search?keyword={kw}` | Tìm kiếm người dùng theo username | ✅ |
| **Conversation** | `POST` | `/api/conversations` | Tạo cuộc trò chuyện mới | ✅ |
| **Conversation** | `GET` | `/api/conversations/my-conversation` | Lấy danh sách cuộc trò chuyện của tôi | ✅ |
| **Message** | `POST` | `/api/chat-messages` | Gửi tin nhắn mới | ✅ |
| **Message** | `GET` | `/api/chat-messages/conversations/{id}/messages` | Lấy lịch sử tin nhắn theo hội thoại (phân trang) | ✅ |

### 2. WebSocket / STOMP Real-time

| Thành phần | Đường dẫn | Mô tả |
|---|---|---|
| **STOMP Endpoint** | `ws://localhost:8080/ws` | Điểm kết nối WebSocket (kèm handshake interceptor xác thực JWT) |
| **Topic Subscription** | `/topic/conversations/{conversationId}` | Kênh nhận broadcast tin nhắn realtime cho từng cuộc trò chuyện |
| **User Queue** | `/user/queue/...` | Kênh nhận thông báo điểm-điểm (1-1) của từng người dùng |

---

## 📊 KẾT QUẢ THỰC NGHIỆM

> *(Ảnh chụp kết quả giao diện ứng dụng và hoạt động chat)*

![System Screenshot](./statics/diagram.png)

---

## 🧩 CẤU TRÚC DỰ ÁN

```
BTL_LTM_NekoTalk/
├── README.md                    # Tài liệu tổng quan dự án & hướng dẫn chạy
├── INSTRUCTION.md               # Yêu cầu bài tập lớn (giữ nguyên quy định)
├── docker-compose.yml           # Cấu hình Docker Compose (MySQL, Server, Client)
├── statics/                     # Tài nguyên tĩnh, sơ đồ kiến trúc
│   ├── logo.png
│   └── diagram.png
└── source/                      # Mã nguồn dự án
    ├── .gitignore
    ├── client/                  # Frontend Next.js
    │   ├── Dockerfile           # Multi-stage Docker build cho Next.js
    │   ├── .dockerignore
    │   ├── .env.example         # File mẫu biến môi trường
    │   ├── README.md
    │   ├── package.json
    │   ├── app/                 # Next.js App Router (trang đăng nhập, chat...)
    │   ├── components/          # Reusable UI components (shadcn/ui)
    │   ├── hooks/               # Custom hooks (useWebSocket, ...)
    │   ├── services/            # Axios API calls
    │   ├── store/               # Zustand state stores
    │   └── types/               # TypeScript interfaces
    └── server/                  # Backend Spring Boot
        ├── Dockerfile           # Multi-stage Docker build cho Spring Boot
        ├── .dockerignore
        ├── README.md
        ├── pom.xml
        ├── mvnw / mvnw.cmd
        └── src/
            └── main/
                ├── java/com/nekotalk/
                │   ├── configuration/   # Security, WebSocket, CORS
                │   ├── controller/      # REST API endpoints
                │   ├── dto/             # Request & Response DTOs
                │   ├── entity/          # JPA Entities (User, Conversation, Message)
                │   ├── repository/      # Spring Data Repositories
                │   └── service/         # Business logic
                └── resources/
                    └── application.yml  # Cấu hình DataSource, JPA, Port, JWT
```

---

## 🧩 HƯỚNG PHÁT TRIỂN THÊM

- [x] Containerize toàn bộ dự án bằng Docker Compose
- [ ] Hỗ trợ gửi file, hình ảnh trong chat
- [ ] Thêm tính năng quản lý nhóm chat (thêm/xóa thành viên, đổi tên nhóm)
- [ ] Push notification trên trình duyệt khi có tin nhắn mới
- [ ] Triển khai lên Cloud (AWS / DigitalOcean / Railway)

---

## 📝 GHI CHÚ

- Repository tuân thủ đầy đủ cấu trúc và quy định bắt buộc theo file `INSTRUCTION.md`.
- Dự án có thể chạy hoàn chỉnh cả ở chế độ **Docker container** hoặc **Local development**.

---

## 📚 TÀI LIỆU THAM KHẢO

- [Spring Boot Documentation](https://docs.spring.io/spring-boot/index.html)
- [Spring WebSocket & STOMP](https://docs.spring.io/spring-framework/reference/web/websocket/stomp.html)
- [Next.js Documentation](https://nextjs.org/docs)
- [STOMP Protocol Specification](https://stomp.github.io/)
- [Docker Documentation](https://docs.docker.com/)