import Image from "next/image";

interface AuthBannerProps {
  title: string;
  description: string;
  titleId?: string;
}

export default function AuthBanner({
  title,
  description,
  titleId,
}: AuthBannerProps) {
  return (
    <div className="flex flex-col items-start text-left gap-7 max-md:items-center max-md:text-center">
      <div className="inline-flex items-center gap-4">
        <Image src="/logo.svg" alt="NekoTalk" width={60} height={60} priority />
        <span className="text-4xl sm:text-5xl font-extrabold text-[#3b203c] dark:text-zinc-100 tracking-tight">
          NekoTalk
        </span>
      </div>

      <header>
        <h1
          id={titleId}
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#4a1d6d] dark:text-pink-300 tracking-tight leading-tight"
        >
          {title}
        </h1>
        <p className="mt-3.5 text-[#7f6a7d] dark:text-zinc-300 text-base sm:text-lg leading-relaxed max-w-[440px]">
          {description}
        </p>
      </header>
    </div>
  );
}
