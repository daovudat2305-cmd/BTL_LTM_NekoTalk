import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Các route yêu cầu phải đăng nhập mới được vào
const protectedRoutes = ["/chat"];
// Các route chỉ dành cho người chưa đăng nhập (đã đăng nhập thì không cần vào lại)
const authRoutes = ["/login", "/register"];

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    const decodedPayload =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf-8");

    const payload = JSON.parse(decodedPayload);
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rawToken = request.cookies.get("accessToken")?.value;
  const isAuthenticated = Boolean(rawToken && !isTokenExpired(rawToken));

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    if (rawToken) {
      response.cookies.delete("accessToken");
    }
    return response;
  }

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/chat", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

// Cấu hình matcher để proxy chỉ chạy trên các route cần thiết (tối ưu hiệu năng, bỏ qua file tĩnh)
export const config = {
  matcher: ["/", "/login", "/register", "/chat/:path*"],
};
