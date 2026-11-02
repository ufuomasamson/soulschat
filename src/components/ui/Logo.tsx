import { cn } from "@/lib/utils";
import Image from "next/image";

const wordmarkSizes = {
  sm: { className: "h-8 w-auto", width: 120, height: 32 },
  md: { className: "h-12 w-auto", width: 180, height: 48 },
  lg: { className: "h-16 w-auto sm:h-20", width: 260, height: 80 },
} as const;

const iconSizes = {
  sm: { className: "size-8", width: 32, height: 32 },
  md: { className: "size-10", width: 40, height: 40 },
  lg: { className: "size-14", width: 56, height: 56 },
} as const;

export function Logo({
  size = "md",
  variant = "wordmark",
  className,
  priority,
}: {
  size?: keyof typeof wordmarkSizes;
  variant?: "wordmark" | "icon";
  className?: string;
  priority?: boolean;
}) {
  const dims = variant === "icon" ? iconSizes[size] : wordmarkSizes[size];

  return (
    <Image
      src={variant === "icon" ? "/img/souls-icon.png" : "/img/logo.png"}
      alt="SoulsChat"
      width={dims.width}
      height={dims.height}
      priority={priority}
      className={cn(
        "object-contain object-center",
        dims.className,
        className,
      )}
    />
  );
}
