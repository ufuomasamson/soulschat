import { cn } from "@/lib/utils";
import Image from "next/image";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  online?: boolean;
  className?: string;
  alt?: string;
}

const sizeMap: Record<AvatarSize, { box: string; px: number; online: string; text: string }> = {
  xs: { box: "size-8", px: 32, online: "size-2 ring-1", text: "text-[11px]" },
  sm: { box: "size-10", px: 40, online: "size-2.5 ring-2", text: "text-[12px]" },
  md: { box: "size-12", px: 48, online: "size-3 ring-2", text: "text-[14px]" },
  lg: { box: "size-16", px: 64, online: "size-3.5 ring-2", text: "text-[18px]" },
  xl: { box: "size-24", px: 96, online: "size-4 ring-[3px]", text: "text-[28px]" },
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function Avatar({
  src,
  name,
  size = "md",
  online,
  className,
  alt,
}: AvatarProps) {
  const dims = sizeMap[size];

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "relative overflow-hidden rounded-full bg-primary-light text-primary",
          "inline-flex items-center justify-center font-semibold",
          dims.box,
          dims.text,
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt ?? name}
            width={dims.px}
            height={dims.px}
            className="size-full object-cover"
          />
        ) : (
          <span aria-hidden>{getInitials(name)}</span>
        )}
      </span>
      {online ? (
        <span
          className={cn(
            "absolute right-0 bottom-0 rounded-full bg-success ring-background",
            dims.online,
          )}
          aria-label="Online"
        />
      ) : null}
    </span>
  );
}
