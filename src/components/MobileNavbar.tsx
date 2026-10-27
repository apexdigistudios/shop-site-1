import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { formatCompactNumber } from "../lib/helpers";
import {
  BagIcon,
  CartIcon,
  CloseIcon,
  GridIcon,
  HomeEditIcon,
  ImageIcon,
  MenuIcon,
  QuoteIcon,
  StarIcon,
  TicketIcon,
  UserIcon,
  UsersIcon,
} from "./icons";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const publicLinks: NavItem[] = [
  { to: "/", label: "Home", icon: <GridIcon size={19} />, end: true },
  { to: "/shop", label: "Shop artworks", icon: <ImageIcon size={19} /> },
  { to: "/categories", label: "Collections", icon: <GridIcon size={19} /> },
  { to: "/cart", label: "Shopping cart", icon: <CartIcon size={19} /> },
  { to: "/wishlist", label: "Wishlist", icon: <StarIcon size={19} /> },
  { to: "/account", label: "My account", icon: <UserIcon size={19} /> },
];

const adminLinks: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <GridIcon size={19} />, end: true },
  { to: "/admin/products", label: "Artworks", icon: <ImageIcon size={19} /> },
  { to: "/admin/categories", label: "Collections", icon: <GridIcon size={19} /> },
  { to: "/admin/orders", label: "Orders", icon: <BagIcon size={19} /> },
  { to: "/admin/users", label: "Users", icon: <UsersIcon size={19} /> },
  { to: "/admin/reviews", label: "Reviews", icon: <StarIcon size={19} /> },
  { to: "/admin/coupons", label: "Coupons", icon: <TicketIcon size={19} /> },
  { to: "/admin/testimonials", label: "Testimonials", icon: <QuoteIcon size={19} /> },
  { to: "/admin/home-text", label: "Homepage text", icon: <HomeEditIcon size={19} /> },
  { to: "/admin/branding", label: "Site branding", icon: <ImageIcon size={19} /> },
  {
    to: "/admin/payment-settings",
    label: "Payment settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[19px] w-[19px]" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h3" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function MobileNavbar() {
  const location = useLocation();
  const { count } = useCart();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const [menuOpen, setMenuOpen] = useState(false);
  const links = isAdminRoute ? adminLinks : publicLinks;
  const quickLinks = isAdminRoute
    ? adminLinks.filter((link) =>
        ["/admin", "/admin/products", "/admin/categories", "/admin/orders"].includes(link.to)
      )
    : publicLinks.filter((link) => ["/", "/shop", "/categories", "/cart"].includes(link.to));

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 lg:hidden">
        <nav aria-label="Quick navigation" className="flex items-center justify-around gap-1 rounded-full border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-xl backdrop-blur-md">
          {quickLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              aria-label={link.label}
              className={({ isActive }) =>
                `flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {link.to === "/cart" && !isAdminRoute ? (
                <span className="relative">
                  {link.icon}
                  {count > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-slate-900">
                      {formatCompactNumber(count)}
                    </span>
                  )}
                </span>
              ) : (
                link.icon
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation-drawer"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-700"
          >
            {menuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </nav>
      </div>

      <div
        className={`fixed inset-0 z-[70] transition-opacity duration-300 lg:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          tabIndex={menuOpen ? 0 : -1}
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 h-full w-full bg-slate-950/45 backdrop-blur-sm"
        />
        <section
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-navigation-title"
          inert={!menuOpen}
          className={`absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border border-slate-200 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-5 shadow-2xl transition-transform duration-300 ease-out ${
            menuOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-300" />
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {isAdminRoute ? "Gallery management" : "Explore"}
              </p>
              <h2 id="mobile-navigation-title" className="mt-1 font-display text-lg font-semibold text-slate-900">
                {isAdminRoute ? "Admin navigation" : "The Christy Black Art Gallery"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
            >
              <CloseIcon size={19} />
            </button>
          </div>

          <nav aria-label={isAdminRoute ? "Admin navigation" : "Main navigation"} className="grid gap-1.5">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition-colors ${
                    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                <span className="flex h-8 w-8 items-center justify-center" aria-hidden="true">
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </section>
      </div>
    </>
  );
}
