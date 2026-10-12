import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Các route yêu cầu phải đăng nhập mới được vào
const protectedRoutes = ["/chat"];
// Các route chỉ dành cho người chưa đăng nhập (đã đăng nhập thì không cần vào lại)
const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("accessToken")?.value;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/chat", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

// Cấu hình matcher để middleware chỉ chạy trên các route cần thiết (tối ưu hiệu năng, bỏ qua file tĩnh)
export const config = {
  matcher: ["/", "/login", "/register", "/chat/:path*"],
};
