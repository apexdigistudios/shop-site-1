import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({ title, message, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-soft-grey/50 bg-pure-white px-8 py-20 text-center transition-theme dark:border-dark-border dark:bg-dark-card">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-soft-grey/60 text-2xl text-muted-grey dark:border-dark-border dark:text-dark-muted">
        {icon ?? "◇"}
      </div>
      <h3 className="font-display text-2xl tracking-wide text-luxury-black dark:text-dark-text">{title}</h3>
      {message && <p className="max-w-md text-sm text-muted-grey dark:text-dark-muted">{message}</p>}
      {action}
    </div>
  );
}
