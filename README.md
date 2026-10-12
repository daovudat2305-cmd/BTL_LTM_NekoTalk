# BÀI TẬP LỚN: LẬP TRÌNH MẠNG

## NekoTalk – Ứng dụng Chat Realtime

> 📘 Ứng dụng chat realtime sử dụng WebSocket/STOMP, xây dựng với Spring Boot (backend) và Next.js (frontend).

---

## 🧑‍💻 THÔNG TIN NHÓM

| STT | Họ và Tên | MSSV | Email | Đóng góp |
|-----|-----------|------|-------|----------|
| 1 | [Họ tên] | [MSSV] | [email] | Backend (Spring Boot, WebSocket) |
| 2 | [Họ tên] | [MSSV] | [email] | Frontend (Next.js, UI) |
| 3 | [Họ tên] | [MSSV] | [email] | Database, Authentication |

**Tên nhóm:** [Tên nhóm]
**Chủ đề đã đăng ký:** Ứng dụng Chat Realtime (WebSocket)

---

## 🧠 MÔ TẢ HỆ THỐNG

Hệ thống NekoTalk là ứng dụng chat realtime cho phép nhiều người dùng trò chuyện trong các phòng chat.

**Kiến trúc:**
- **Backend** (Spring Boot): Xử lý xác thực JWT, quản lý tin nhắn, broadcast qua WebSocket/STOMP
- **Frontend** (Next.js): Giao diện web realtime, kết nối WebSocket để nhận/gửi tin nhắn tức thì
- **Database** (MySQL): Lưu trữ người dùng, tin nhắn, phòng chat

**Cấu trúc logic:**
```
client (Next.js)  <--HTTP/REST-->  server (Spring Boot)  <-->  MySQL
client (Next.js)  <--WebSocket-->  server (Spring Boot)
```

**Sơ đồ hệ thống:**

![System Diagram](./statics/diagram.png)

---

## ⚙️ CÔNG NGHỆ SỬ DỤNG

| Thành phần | Công nghệ | Ghi chú |
|------------|-----------|---------|
| Server     | Java 21 + Spring Boot 4.1.0 | REST API + WebSocket |
| Database   | MySQL 8 | JPA / Hibernate |
| Auth       | JWT (Nimbus JOSE) | Spring Security |
| Client     | TypeScript + Next.js 16.3 | App Router |
| UI         | Tailwind CSS v4 + shadcn/ui | |
| State      | Zustand | |
| Real-time  | WebSocket + STOMP | `@stomp/stompjs` |
| HTTP       | Axios | |

---

## 🚀 HƯỚNG DẪN CHẠY DỰ ÁN

### Yêu cầu
- Java 21+
- Node.js 20+
- MySQL 8

### 1. Clone repository
```bash
git clone <repository-url>
cd BTL_LTM_NekoTalk
```

### 2. Chuẩn bị Database
```sql
CREATE DATABASE chat_online CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Chạy Server
```bash
cd source/server
# Cấu hình DB trong src/main/resources/application.yml
./mvnw spring-boot:run
# Windows: mvnw.cmd spring-boot:run
```
Server chạy tại: `http://localhost:8080/api`

### 4. Chạy Client
```bash
cd source/client
npm install
npm run dev
```
Client chạy tại: `http://localhost:3000`

### 5. Kiểm thử nhanh
```bash
# Kiểm tra server
curl http://localhost:8080/api/health

# Mở trình duyệt
# http://localhost:3000
```

---

## 🔗 GIAO TIẾP (GIAO THỨC SỬ DỤNG)

| Endpoint | Protocol | Method | Mô tả |
|----------|----------|--------|-------|
| `/api/auth/register` | HTTP/1.1 | POST | Đăng ký tài khoản |
| `/api/auth/login` | HTTP/1.1 | POST | Đăng nhập, nhận JWT |
| `/api/messages` | HTTP/1.1 | GET | Lấy lịch sử tin nhắn |
| `/api/messages` | HTTP/1.1 | POST | Gửi tin nhắn |
| `/ws` | WebSocket/STOMP | — | Kết nối realtime |

---

## 📊 KẾT QUẢ THỰC NGHIỆM

> *(Thêm ảnh chụp màn hình kết quả vào `statics/` và cập nhật đường dẫn bên dưới)*

![Logo](./statics/logo.png)

---

## 🧩 CẤU TRÚC DỰ ÁN

```
BTL_LTM_NekoTalk/
├── README.md
├── INSTRUCTION.md
├── statics/
│   ├── logo.png
│   └── diagram.png
└── source/
    ├── .gitignore
    ├── client/                  ← Next.js frontend
    │   ├── README.md
    │   ├── package.json
    │   ├── app/
    │   ├── components/
    │   ├── hooks/
    │   ├── services/
    │   ├── store/
    │   └── types/
    └── server/                  ← Spring Boot backend
        ├── README.md
        ├── pom.xml
        ├── mvnw / mvnw.cmd
        └── src/
            └── main/
                ├── java/com/nekotalk/
                └── resources/
```

---

## 🧩 HƯỚNG PHÁT TRIỂN THÊM

- [ ] Hỗ trợ gửi file, hình ảnh trong chat
- [ ] Thêm tính năng tạo nhóm chat
- [ ] Push notification (email/browser)
- [ ] Triển khai trên cloud (AWS / Railway)
- [ ] Containerize bằng Docker Compose

---

## 📝 GHI CHÚ

- Repo tuân thủ đúng cấu trúc đã hướng dẫn trong `INSTRUCTION.md`.
- Đảm bảo test kỹ trước khi submit.

---

## 📚 TÀI LIỆU THAM KHẢO

- [Spring Boot Documentation](https://docs.spring.io/spring-boot/index.html)
- [Next.js Documentation](https://nextjs.org/docs)
- [STOMP Protocol](https://stomp.github.io/)
- [shadcn/ui](https://ui.shadcn.com/)