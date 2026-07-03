import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark and light mode"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`group relative flex h-9 w-16 items-center rounded-full border border-soft-grey/60 bg-beige-cream/70 px-1 transition-all duration-250 dark:border-dark-border dark:bg-dark-card ${className}`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-luxury-black text-[11px] text-pure-white shadow-sm transition-transform duration-300 ease-out dark:bg-pure-white dark:text-luxury-black ${
          isDark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {isDark ? "☾" : "☀"}
      </span>
    </button>
  );
}
