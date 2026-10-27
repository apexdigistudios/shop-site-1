import type { ReactNode } from "react";

interface AdminSectionHeaderProps {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function AdminSectionHeader({ emoji, title, subtitle, action }: AdminSectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3.5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 text-2xl leading-none transition-theme dark:border-dark-border dark:bg-dark-elevated"
          aria-hidden="true"
        >
          {emoji}
        </span>
        <div>
          <h1 className="font-display text-2xl leading-none tracking-wide text-luxury-black sm:text-3xl dark:text-dark-text">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted-grey dark:text-dark-muted">{subtitle}</p>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}
