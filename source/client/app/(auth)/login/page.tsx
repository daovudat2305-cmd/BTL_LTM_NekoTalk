import AuthBanner from "@/components/auth/AuthBanner";
import LoginForm from "@/components/auth/LoginForm";
import StaleTokenCleaner from "@/components/auth/StaleTokenCleaner";

export default function LoginPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] items-center gap-8 md:gap-14 p-4 sm:p-6">
      {/* Xóa token hết hạn khỏi localStorage khi vào trang login */}
      <StaleTokenCleaner />

      <AuthBanner
        titleId="login-title"
        title="Chào mừng bạn trở lại"
        description="Đăng nhập để tiếp tục với NekoTalk và kết nối cùng mọi người."
      />

      <div className="w-full max-w-[480px] mx-auto">
        <LoginForm />
      </div>
    </div>
  );
}
