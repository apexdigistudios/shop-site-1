import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-warm-cream text-luxury-black transition-theme dark:bg-dark-bg dark:text-dark-text">
      <Header />
      <main className={`flex-1 ${!isHome ? "pt-[76px]" : ""}`}>{children}</main>
      <Footer />
    </div>
  );
}
