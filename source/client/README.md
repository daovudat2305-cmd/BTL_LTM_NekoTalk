# MODULE CLIENT – NekoTalk Frontend

> 📘 Next.js frontend cung cấp giao diện web cho ứng dụng chat NekoTalk, kết nối với backend qua HTTP REST và WebSocket.

---

## 🎯 MỤC TIÊU

Client chịu trách nhiệm:
- Hiển thị giao diện chat realtime
- Xác thực người dùng (đăng nhập / đăng ký)
- Gửi và nhận tin nhắn qua WebSocket/STOMP
- Quản lý trạng thái ứng dụng

---

## ⚙️ CÔNG NGHỆ SỬ DỤNG

| Thành phần | Công nghệ | Ghi chú |
|------------|-----------|---------|
| Ngôn ngữ   | TypeScript | |
| Framework  | Next.js 16.3 | App Router |
| UI         | Tailwind CSS v4 + shadcn/ui | |
| State      | Zustand | |
| HTTP       | Axios | Giao tiếp với REST API |
| Real-time  | @stomp/stompjs | WebSocket chat |
| Form       | React Hook Form + Zod | Validation |

---

## 🚀 HƯỚNG DẪN CHẠY

### Yêu cầu
- Node.js 20+
- Backend server đang chạy tại `http://localhost:8080/api`

### 1. Cài đặt dependencies
```bash
cd source/client
npm install
```

### 2. Cấu hình môi trường
Tạo file `.env.local` (hoặc chỉnh `.env`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

### 3. Chạy development server
```bash
npm run dev
```

Client chạy tại: `http://localhost:3000`

---

## 📦 CẤU TRÚC

```
client/
├── package.json
├── next.config.ts
├── app/                    ← Next.js App Router pages
│   ├── (auth)/             ← Trang đăng nhập / đăng ký
│   ├── chat/               ← Trang chat chính
│   ├── layout.tsx
│   └── globals.css
├── components/             ← UI components tái sử dụng
│   ├── auth/
│   ├── chat/
│   └── ui/                 ← shadcn/ui components
├── hooks/                  ← Custom React hooks
├── services/               ← Axios API calls
├── store/                  ← Zustand state stores
├── types/                  ← TypeScript types/interfaces
├── lib/                    ← Utility functions
└── public/                 ← Static assets
```

---

## 📝 GHI CHÚ

- Đảm bảo **server backend đã chạy** trước khi khởi động client
- Mặc định kết nối đến `localhost:8080` (backend) và `localhost:3000` (frontend)
- File `.env.local` **không commit lên Git**
