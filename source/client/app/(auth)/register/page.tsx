import AuthBanner from "@/components/auth/AuthBanner";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] items-center gap-8 md:gap-14 p-4 sm:p-6">
      <AuthBanner
        titleId="register-title"
        title="Tạo tài khoản mới"
        description="Tham gia vào NekoTalk và bắt đầu trò chuyện cùng mọi người."
      />

      <div className="w-full max-w-[480px] mx-auto">
        <RegisterForm />
      </div>
    </div>
  );
}
