import { Link } from "react-router-dom";
import { buildWhatsappOrderLink } from "../lib/helpers";
import { WhatsAppIcon } from "./icons";

export default function Footer() {
  return (
    <footer className="border-t border-soft-grey/50 bg-beige-cream transition-theme dark:border-dark-border dark:bg-dark-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <h2 className="font-display text-2xl tracking-[0.15em] text-luxury-black dark:text-dark-text">
            THE CHRISTY BLACK ART GALLERY
          </h2>
          <p className="max-w-sm text-sm text-muted-grey dark:text-dark-muted">
            Original paintings and masterworks by Christy Black, curated for collectors and art lovers.
          </p>
          <a
            href={buildWhatsappOrderLink()}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp"
            className="mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-whatsapp-green px-5 text-xs uppercase tracking-widest text-white shadow-[0_6px_20px_rgba(37,211,102,0.35)] transition-all duration-250 hover:scale-[1.02] hover:bg-[#1EBE5A]"
          >
            <WhatsAppIcon size={18} className="text-white" />
            Chat on WhatsApp
          </a>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-grey dark:text-dark-muted">Shop</h3>
          <ul className="space-y-2 text-sm text-luxury-black dark:text-dark-secondary">
            <li><Link to="/shop" className="transition-colors duration-200 hover:text-muted-grey dark:hover:text-dark-muted">All Artworks</Link></li>
            <li><Link to="/categories" className="transition-colors duration-200 hover:text-muted-grey dark:hover:text-dark-muted">Collections</Link></li>
            <li><Link to="/wishlist" className="transition-colors duration-200 hover:text-muted-grey dark:hover:text-dark-muted">Wishlist</Link></li>
            <li><Link to="/cart" className="transition-colors duration-200 hover:text-muted-grey dark:hover:text-dark-muted">Cart</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-[0.2em] text-muted-grey dark:text-dark-muted">Account</h3>
          <ul className="space-y-2 text-sm text-luxury-black dark:text-dark-secondary">
            <li><Link to="/account" className="transition-colors duration-200 hover:text-muted-grey dark:hover:text-dark-muted">Login / Signup</Link></li>
            <li><Link to="/account?tab=orders" className="transition-colors duration-200 hover:text-muted-grey dark:hover:text-dark-muted">My Orders</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-soft-grey/40 py-6 text-center transition-theme dark:border-dark-border">
        <p className="text-xs text-muted-grey dark:text-dark-muted">
          © {new Date().getFullYear()} The Christy Black Art Gallery. All rights reserved.
        </p>
        <p className="mt-2.5 text-[11px] tracking-wider text-muted-grey/60 dark:text-dark-muted/60">
          Powered by{" "}
          <a
            href="https://wa.me/233548648357"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-luxury-black/70 transition-colors duration-200 hover:text-luxury-black dark:text-dark-text/60 dark:hover:text-dark-text"
          >
            ADJACENT
          </a>
        </p>
      </div>
    </footer>
  );
}
