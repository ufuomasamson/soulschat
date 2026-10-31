"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { ReactNode } from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center px-8 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary-light text-primary">
          {icon}
        </div>
      ) : null}
      <h2 className="text-[18px] font-semibold tracking-tight text-text-primary">
        {title}
      </h2>
      <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-text-secondary">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <div className="mt-6">
          <Link
            href={actionHref}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-[var(--radius-xl)] px-4",
              "bg-primary text-[15px] font-medium text-text-inverse",
              "transition-colors duration-150 hover:bg-primary-dark",
            )}
          >
            {actionLabel}
          </Link>
        </div>
      ) : actionLabel && onAction ? (
        <div className="mt-6">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
      {children}
    </div>
  );
}
