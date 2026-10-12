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

**Kiến trúc:**
- **Backend (Spring Boot):** Xử lý nghiệp vụ REST API, xác thực và cấp phát JWT, lưu trữ dữ liệu, broadcast tin nhắn qua WebSocket/STOMP Broker.
- **Frontend (Next.js):** Giao diện web hiện đại (App Router, Tailwind CSS, shadcn/ui), quản lý trạng thái bằng Zustand, kết nối song song REST API (Axios) và WebSocket client (`@stomp/stompjs`).
- **Database (MySQL 8):** Lưu trữ người dùng, cuộc hội thoại và lịch sử tin nhắn.
- **Containerization (Docker Compose):** Đóng gói toàn bộ hệ sinh thái (Database, Backend, Frontend) thành các containers chạy độc lập và giao tiếp nội bộ.

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
| **DevOps / Deploy** | Docker & Docker Compose | Multi-stage build (Alpine Linux) |

---

## 🚀 HƯỚNG DẪN CHẠY DỰ ÁN

### Cách 1: Chạy toàn bộ với Docker Compose (Khuyên Dùng 🌟)
> Chỉ cần cài đặt **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**, bất kỳ ai clone repo về cũng có thể chạy ngay toàn bộ hệ thống (MySQL + Backend + Frontend) chỉ với **1 câu lệnh duy nhất**.

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd BTL_LTM_NekoTalk
   ```

2. **Khởi chạy hệ thống bằng Docker Compose:**
   ```bash
   docker compose up -d --build
   ```
   *Docker sẽ tự động tải MySQL 8, build image cho Server & Client, tạo database `chat_online`, thiết lập mạng nội bộ và khởi chạy các container.*

3. **Kiểm tra trạng thái các container:**
   ```bash
   docker compose ps
   ```

4. **Truy cập ứng dụng:**
   - **Giao diện Client (Chat):** [http://localhost:3000](http://localhost:3000)
   - **Backend REST API:** [http://localhost:8080](http://localhost:8080)
   - **MySQL Database:** `localhost:3306` (User: `root`, Password: `admin`, Database: `chat_online`)

5. **Các lệnh quản lý hữu ích:**
   ```bash
   # Xem log realtime của toàn bộ hệ thống
   docker compose logs -f

   # Chỉ xem log của Spring Boot server
   docker compose logs -f server

   # Dừng hệ thống
   docker compose down

   # Dừng và xoá sạch dữ liệu database (nếu muốn reset từ đầu)
   docker compose down -v
   ```

---

### Cách 2: Chạy cục bộ (Local Development)

#### Yêu cầu môi trường
- Java 21+
- Node.js 20+
- MySQL 8

#### 1. Chuẩn bị Cơ sở dữ liệu
Khởi tạo database `chat_online`:
```sql
CREATE DATABASE chat_online CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
> 💡 **Mẹo:** Bạn có thể dùng Docker để chạy riêng MySQL mà không cần cài MySQL trên máy:
> ```bash
> docker compose up mysql -d
> ```

#### 2. Chạy Backend (Spring Boot)
```bash
cd source/server
# Cấu hình DB nằm tại src/main/resources/application.yml
./mvnw spring-boot:run
# Trên Windows: mvnw.cmd spring-boot:run
```
Server lắng nghe tại: `http://localhost:8080`

#### 3. Chạy Frontend (Next.js)
```bash
cd source/client
npm install
npm run dev
```
Client lắng nghe tại: [http://localhost:3000](http://localhost:3000)

#### 4. Kiểm tra kết nối
- Đăng ký tài khoản tại [http://localhost:3000/register](http://localhost:3000/register) hoặc đăng nhập tại [http://localhost:3000/login](http://localhost:3000/login).

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
| **STOMP Endpoint** | `ws://localhost:8080/ws` | Điểm kết nối WebSocket (kèm interceptor xác thực JWT) |
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