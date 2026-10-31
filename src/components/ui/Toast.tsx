"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { IconButton } from "./IconButton";

type ToastTone = "default" | "success" | "error";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
}

interface ToastContextValue {
  toast: (input: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneIcon = {
  default: Info,
  success: CheckCircle2,
  error: XCircle,
};

const toneStyles: Record<ToastTone, string> = {
  default: "border-border",
  success: "border-success/30",
  error: "border-error/30",
};

const iconStyles: Record<ToastTone, string> = {
  default: "text-text-secondary",
  success: "text-success",
  error: "text-error",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setItems((prev) => [...prev, { ...input, id }]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--nav-height)+1rem+env(safe-area-inset-bottom,0px))] z-50 flex flex-col items-center gap-2 px-4"
        aria-live="polite"
      >
        {items.map((item) => {
          const tone = item.tone ?? "default";
          const Icon = toneIcon[tone];
          return (
            <div
              key={item.id}
              className={cn(
                "pointer-events-auto animate-toast-in flex w-full max-w-[min(420px,100%)] items-start gap-3",
                "rounded-[var(--radius-xl)] border bg-background px-3.5 py-3 shadow-[var(--shadow-subtle)]",
                toneStyles[tone],
              )}
              role="status"
            >
              <Icon
                className={cn("mt-0.5 size-[18px] shrink-0", iconStyles[tone])}
                strokeWidth={1.75}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-text-primary">
                  {item.title}
                </p>
                {item.description ? (
                  <p className="mt-0.5 text-[13px] text-text-secondary">
                    {item.description}
                  </p>
                ) : null}
              </div>
              <IconButton
                label="Dismiss"
                size="sm"
                tone="muted"
                onClick={() => dismiss(item.id)}
                className="-mr-1 -mt-1"
              >
                <X className="size-4" strokeWidth={1.75} />
              </IconButton>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
