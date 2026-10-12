# MODULE CLIENT – NekoTalk Frontend

> 📘 Next.js frontend cung cấp giao diện web cho ứng dụng chat NekoTalk, kết nối với backend qua HTTP REST và WebSocket.

---

## 🎯 MỤC TIÊU

Client chịu trách nhiệm:
- Hiển thị giao diện chat realtime (responsive, dark/light theme)
- Xác thực người dùng (đăng nhập / đăng ký / refresh token tự động)
- Gửi và nhận tin nhắn tức thì qua WebSocket/STOMP
- Quản lý trạng thái ứng dụng bằng Zustand

---

## ⚙️ CÔNG NGHỆ SỬ DỤNG

| Thành phần | Công nghệ | Ghi chú |
|------------|-----------|---------|
| Ngôn ngữ   | TypeScript | Type safety |
| Framework  | Next.js 16.3 | App Router |
| UI         | Tailwind CSS v4 + shadcn/ui | Modern UI |
| State      | Zustand | Quản lý state người dùng & chat |
| HTTP       | Axios | Interceptors quản lý JWT & refresh token |
| Real-time  | @stomp/stompjs | WebSocket kết nối backend |
| Form       | React Hook Form + Zod | Validate dữ liệu nhập |
| Container  | Docker (Multi-stage build) | Node 20 Alpine |

---

## 🚀 HƯỚNG DẪN CHẠY

### Cách 1: Chạy bằng Docker (Khuyên dùng)
Nếu chạy toàn bộ dự án từ root repo:
```bash
docker compose up -d --build
```
Hoặc chỉ build và chạy riêng module Client:
```bash
docker build -t nekotalk-client .
docker run -p 3000:3000 --name nekotalk-client nekotalk-client
```

---

### Cách 2: Chạy cục bộ (Local Development)

#### Yêu cầu
- Node.js 20+
- Backend server đang chạy tại `http://localhost:8080`

#### 1. Cài đặt dependencies
```bash
cd source/client
npm install
```

#### 2. Cấu hình môi trường
Tạo file `.env.local` (hoặc sao chép từ `.env.example`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

#### 3. Chạy development server
```bash
npm run dev
```

Mở trình duyệt tại: [http://localhost:3000](http://localhost:3000)

---

## 📦 CẤU TRÚC THƯ MỤC

```
client/
├── Dockerfile              ← Multi-stage build cho Docker
├── .dockerignore
├── .env.example            ← Mẫu biến môi trường
├── package.json
├── next.config.ts
├── app/                    ← Next.js App Router pages
│   ├── (auth)/             ← Trang đăng nhập (/login) & đăng ký (/register)
│   ├── chat/               ← Trang chat chính
│   ├── layout.tsx
│   └── globals.css
├── components/             ← UI components tái sử dụng
│   ├── auth/
│   ├── chat/
│   └── ui/                 ← shadcn/ui components
├── hooks/                  ← Custom React hooks (useWebSocket, ...)
├── services/               ← Axios API calls (auth, user, conversation, message)
├── store/                  ← Zustand stores (userStore, chatStore, ...)
├── types/                  ← TypeScript types & interfaces
├── lib/                    ← Utility functions
└── public/                 ← Static assets
```

---

## 📝 GHI CHÚ

- Đảm bảo **server backend đã chạy** trước khi gửi tin nhắn hoặc gọi API
- `NEXT_PUBLIC_API_URL` trỏ tới `http://localhost:8080` (không kèm `/api` vì các services đã tự tiền tố `/api/...`)
- File `.env.local` không commit lên Git
