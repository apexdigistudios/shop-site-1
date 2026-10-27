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
      className={`group relative flex h-9 w-16 items-center rounded-full border border-black/10 bg-white/80 px-1 transition-all duration-250 ${className}`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[11px] text-slate-900 shadow-sm transition-transform duration-300 ease-out ${
          isDark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {isDark ? "☾" : "☀"}
      </span>
    </button>
  );
}
