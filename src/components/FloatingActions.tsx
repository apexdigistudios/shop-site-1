import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeftIcon, ArrowUpIcon, RefreshIcon, WhatsAppIcon } from "./icons";
import { WHATSAPP_NUMBER } from "../lib/helpers";

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function FloatingActions() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShowBackToTop(window.scrollY > 400);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Minimum 44px touch target, round, clean shadow, premium.
  const btnBase =
    "flex h-12 w-12 items-center justify-center rounded-full shadow-lg backdrop-blur-md transition-all duration-250 ease-out hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

  const utilBtn =
    "border border-soft-grey/50 bg-warm-cream text-luxury-black hover:bg-luxury-black hover:text-pure-white focus-visible:ring-luxury-black dark:border-dark-border dark:bg-dark-card dark:text-dark-text dark:hover:bg-dark-accent dark:hover:text-luxury-black";

  // Authentic WhatsApp brand styling: #25D366 bg, white icon, darker green hover.
  const whatsappBtn =
    "bg-[#25D366] text-white shadow-[0_6px_20px_rgba(37,211,102,0.35)] hover:bg-[#1EBE5A] focus-visible:ring-[#25D366]";

  return (
    <>
      {/* LEFT UTILITY STACK — refresh + back */}
      <div className="fixed bottom-4 left-4 z-[60] flex flex-col gap-3 sm:bottom-5 sm:left-5">
        <button
          type="button"
          aria-label="Refresh page"
          title="Refresh"
          onClick={() => window.location.reload()}
          className={`${btnBase} ${utilBtn}`}
        >
          <RefreshIcon size={19} />
        </button>

        {!isHome && (
          <button
            type="button"
            aria-label="Go back"
            title="Go back"
            onClick={() => navigate(-1)}
            className={`${btnBase} ${utilBtn}`}
          >
            <ArrowLeftIcon size={20} />
          </button>
        )}
      </div>

      {/* RIGHT STACK — WhatsApp (top) above Back-to-top (bottom) */}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 sm:bottom-5 sm:right-5">
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          title="Chat on WhatsApp"
          className={`${btnBase} ${whatsappBtn}`}
        >
          <WhatsAppIcon size={26} className="text-white" />
        </a>

        {showBackToTop && (
          <button
            type="button"
            aria-label="Back to top"
            title="Back to top"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className={`${btnBase} ${utilBtn}`}
          >
            <ArrowUpIcon size={20} />
          </button>
        )}
      </div>
    </>
  );
}
