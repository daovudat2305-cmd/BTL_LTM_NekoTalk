# MODULE SERVER – NekoTalk Backend

> 📘 Spring Boot backend cung cấp REST API và kết nối WebSocket real-time cho ứng dụng chat NekoTalk.

---

## 🎯 MỤC TIÊU

Server chịu trách nhiệm:
- Xác thực người dùng (JWT)
- Quản lý tin nhắn và phòng chat
- Cung cấp kết nối real-time qua WebSocket/STOMP
- Tương tác với cơ sở dữ liệu MySQL

---

## ⚙️ CÔNG NGHỆ SỬ DỤNG

| Thành phần | Công nghệ | Ghi chú |
|------------|-----------|---------|
| Ngôn ngữ   | Java 21   | |
| Framework  | Spring Boot 4.1.0 | MVC, WebSocket, Security |
| Auth       | JWT (Nimbus JOSE 9.30.1) | OAuth2 Resource Server |
| Database   | MySQL 8   | JPA / Hibernate |
| Build tool | Maven (Wrapper) | `./mvnw` |
| Real-time  | WebSocket + STOMP | `@stomp/stompjs` ở client |

---

## 🚀 HƯỚNG DẪN CHẠY

### Yêu cầu
- Java 21+
- MySQL 8 đang chạy

### 1. Chuẩn bị Database
```sql
CREATE DATABASE chat_online CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Cấu hình kết nối
Chỉnh sửa file `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/chat_online
    username: root       # ← đổi thành username của bạn
    password: admin      # ← đổi thành password của bạn
```

### 3. Khởi động server
```bash
cd source/server
./mvnw spring-boot:run
```
> Trên Windows: `mvnw.cmd spring-boot:run`

Server chạy tại: `http://localhost:8080/api`

---

## 🔗 API CHÍNH

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/api/auth/register` | POST | Đăng ký tài khoản |
| `/api/auth/login` | POST | Đăng nhập, trả JWT |
| `/api/users` | GET | Lấy danh sách người dùng |
| `/api/messages` | GET / POST | Tin nhắn |
| `/ws` | WebSocket | Kết nối real-time (STOMP) |

---

## 📦 CẤU TRÚC

```
server/
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
        │   ├── controller/         ← REST endpoints
        │   ├── dto/
        │   ├── entity/             ← JPA entities
        │   ├── event/
        │   ├── exception/
        │   ├── listener/
        │   ├── mapper/
        │   ├── repository/         ← JPA repositories
        │   └── service/            ← Business logic
        └── resources/
            └── application.yml
```

---

## 🧪 TEST

```bash
# Kiểm tra server đang chạy
curl http://localhost:8080/api/health
```

---

## 📝 GHI CHÚ

- Port mặc định: **8080**, context path: `/api`
- Hibernate `ddl-auto: update` → tự tạo bảng khi chạy lần đầu
- File `.env` chứa thông tin nhạy cảm, **không commit lên Git**