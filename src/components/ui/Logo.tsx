import { cn } from "@/lib/utils";
import Image from "next/image";

const sizes = {
  sm: { className: "h-8 w-auto", width: 120, height: 32 },
  md: { className: "h-12 w-auto", width: 180, height: 48 },
  lg: { className: "h-16 w-auto sm:h-20", width: 260, height: 80 },
} as const;

export function Logo({
  size = "md",
  className,
  priority,
}: {
  size?: keyof typeof sizes;
  className?: string;
  priority?: boolean;
}) {
  const dims = sizes[size];

  return (
    <Image
      src="/img/logo.png"
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
