import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[200] flex w-[92vw] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-up rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur-xl transition-all duration-250
              ${t.type === "success" ? "border-soft-grey/40 bg-pure-white/95 text-luxury-black dark:border-dark-border dark:bg-dark-card/95 dark:text-dark-text" : ""}
              ${t.type === "error" ? "border-alert-red/40 bg-alert-red/10 text-alert-red" : ""}
              ${t.type === "info" ? "border-soft-grey/40 bg-warm-cream/95 text-luxury-black dark:border-dark-border dark:bg-dark-card/95 dark:text-dark-text" : ""}
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
