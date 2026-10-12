import { Cat, MessageCircle, MessageSquare, MessagesSquare, PawPrint, Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      {/* Decorative Floating Background Icons */}
      <div className="auth-bg-decorations" aria-hidden="true">
        {/* Góc trên bên trái */}
        <div className="decor-item decor-1">
          <PawPrint size={60} strokeWidth={1.5} />
        </div>
        <div className="decor-item decor-2">
          <MessageCircle size={44} strokeWidth={1.5} />
        </div>

        {/* Góc trên bên phải */}
        <div className="decor-item decor-3">
          <MessagesSquare size={68} strokeWidth={1.5} />
        </div>
        <div className="decor-item decor-4">
          <Sparkles size={34} strokeWidth={1.5} />
        </div>

        {/* Góc dưới bên trái */}
        <div className="decor-item decor-5">
          <Cat size={50} strokeWidth={1.5} />
        </div>
        <div className="decor-item decor-6">
          <MessageSquare size={38} strokeWidth={1.5} />
        </div>

        {/* Góc dưới bên phải */}
        <div className="decor-item decor-7">
          <PawPrint size={64} strokeWidth={1.5} />
        </div>
        <div className="decor-item decor-8">
          <MessageCircle size={46} strokeWidth={1.5} />
        </div>
      </div>

      <div className="auth-container">
        {children}
      </div>
    </main>
  );
}


