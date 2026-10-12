# MODULE SERVER – NekoTalk Backend

> 📘 Spring Boot backend cung cấp REST API và kết nối WebSocket real-time cho ứng dụng chat NekoTalk.

---

## 🎯 MỤC TIÊU

Server chịu trách nhiệm:
- Xác thực người dùng (JWT, Spring Security)
- Quản lý người dùng, cuộc trò chuyện và tin nhắn
- Broadcast tin nhắn real-time qua WebSocket / STOMP
- Lưu trữ và truy vấn dữ liệu từ MySQL (JPA/Hibernate)

---

## ⚙️ CÔNG NGHỆ SỬ DỤNG

| Thành phần | Công nghệ | Ghi chú |
|------------|-----------|---------|
| Ngôn ngữ   | Java 21   | |
| Framework  | Spring Boot 4.1.0 | MVC, WebSocket, Security |
| Auth       | JWT (Nimbus JOSE 9.30.1) | OAuth2 Resource Server |
| Database   | MySQL 8   | JPA / Hibernate |
| Build tool | Maven (Wrapper) | `./mvnw` |
| Container  | Docker (Multi-stage build) | Alpine JRE 21 |
| Real-time  | WebSocket + STOMP | Broker: `/topic`, `/queue` |

---

## 🚀 HƯỚNG DẪN CHẠY

### Cách 1: Chạy bằng Docker (Khuyên dùng)
Nếu chạy toàn bộ dự án từ root repo:
```bash
docker compose up -d --build
```
Hoặc chỉ build và chạy riêng module Server:
```bash
docker build -t nekotalk-server .
docker run -p 8080:8080 --name nekotalk-server \
  -e SPRING_DATASOURCE_URL="jdbc:mysql://<mysql-host>:3306/chat_online?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" \
  -e SPRING_DATASOURCE_USERNAME="root" \
  -e SPRING_DATASOURCE_PASSWORD="admin" \
  nekotalk-server
```

---

### Cách 2: Chạy cục bộ (Local Development)

#### Yêu cầu
- Java 21+
- MySQL 8 đang chạy tại `localhost:3306`

#### 1. Chuẩn bị Database
Tạo database MySQL:
```sql
CREATE DATABASE chat_online CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
*(Hoặc dùng Docker: `docker compose up mysql -d` ở thư mục gốc)*

#### 2. Cấu hình kết nối
File `src/main/resources/application.yml` hỗ trợ biến môi trường hoặc cấu hình trực tiếp:
```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:mysql://localhost:3306/chat_online}
    username: ${SPRING_DATASOURCE_USERNAME:root}
    password: ${SPRING_DATASOURCE_PASSWORD:admin}
```

#### 3. Khởi động Server
- **Linux/macOS:**
  ```bash
  ./mvnw spring-boot:run
  ```
- **Windows:**
  ```cmd
  mvnw.cmd spring-boot:run
  ```

Server lắng nghe tại: `http://localhost:8080`

---

## 🔗 DANH SÁCH API CHÍNH

### 1. Xác thực & Người dùng (Authentication & Users)
| Method | Endpoint | Mô tả | Yêu cầu Auth |
|---|---|---|:---:|
| `POST` | `/api/users` | Đăng ký tài khoản mới | ❌ |
| `POST` | `/api/auth/login` | Đăng nhập, nhận Access Token & Refresh Token | ❌ |
| `POST` | `/api/auth/refresh` | Cấp lại Access Token mới | ❌ |
| `GET` | `/api/users/my-info` | Lấy thông tin tài khoản hiện tại | ✅ |
| `GET` | `/api/users/search?keyword={kw}` | Tìm kiếm người dùng theo tên/username | ✅ |

### 2. Cuộc trò chuyện (Conversations)
| Method | Endpoint | Mô tả | Yêu cầu Auth |
|---|---|---|:---:|
| `POST` | `/api/conversations` | Tạo cuộc trò chuyện (1-1 hoặc nhóm) | ✅ |
| `GET` | `/api/conversations/my-conversation` | Lấy danh sách hội thoại của người dùng | ✅ |

### 3. Tin nhắn (Chat Messages)
| Method | Endpoint | Mô tả | Yêu cầu Auth |
|---|---|---|:---:|
| `POST` | `/api/chat-messages` | Gửi tin nhắn qua REST API | ✅ |
| `GET` | `/api/chat-messages/conversations/{id}/messages` | Lấy lịch sử tin nhắn của cuộc trò chuyện (phân trang) | ✅ |

### 4. WebSocket (STOMP)
- **Endpoint kết nối:** `ws://localhost:8080/ws`
- **Topic nhận tin nhắn:** `/topic/conversations/{conversationId}`

---

## 📦 CẤU TRÚC THƯ MỤC

```
server/
├── Dockerfile              ← Multi-stage build cho Docker
├── .dockerignore
├── pom.xml
├── mvnw / mvnw.cmd
├── .mvn/
└── src/
    └── main/
        ├── java/com/nekotalk/
        │   ├── NekotalkApplication.java
        │   ├── common/
        │   ├── configuration/      ← Security, WebSocket, CORS
        │   ├── constant/
        │   ├── controller/         ← REST Controllers
        │   ├── dto/                ← Request & Response DTOs
        │   ├── entity/             ← JPA Entities (User, Conversation, ChatMessage...)
        │   ├── event/              ← WebSocket events
        │   ├── exception/          ← Global Exception Handler
        │   ├── listener/
        │   ├── mapper/             ← Object Mappers
        │   ├── repository/         ← Spring Data JPA Repositories
        │   └── service/            ← Business logic
        └── resources/
            └── application.yml     ← Cấu hình ứng dụng
```

---

## 📝 GHI CHÚ

- Cổng mặc định: **8080**
- Hibernate `ddl-auto: update` → tự động tạo và cập nhật các bảng khi chạy lần đầu.
- Khi gửi request cần xác thực, đính kèm Header: `Authorization: Bearer <accessToken>`.