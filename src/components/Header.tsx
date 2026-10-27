import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { SearchIcon, UserIcon, CartIcon, MenuIcon, CloseIcon, ChevronDownIcon } from "./icons";
import { useBranding } from "../contexts/BrandingContext";

const STORE_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Collections" },
  { to: "/wishlist", label: "Wishlist" },
];

const ADMIN_PRIMARY_LINKS = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/products", label: "Artworks" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/categories", label: "Collections" },
];

const ADMIN_SECONDARY_LINKS = [
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/coupons", label: "Coupons" },
  { to: "/admin/testimonials", label: "Testimonials" },
  { to: "/admin/home-text", label: "Homepage Text" },
  { to: "/admin/branding", label: "Site Branding" },
  { to: "/admin/payment-settings", label: "Payment Settings" },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const { user, appUser, signOut } = useAuth();
  const { count } = useCart();
  const { logoUrl } = useBranding();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setAdminDropdownOpen(false);
  }, [location.pathname]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length === 0) return;
    navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setQuery("");
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-[76px] transition-all duration-300 ease-out ${
        isScrolled
          ? "border-b border-black/10 bg-white/85 text-slate-900 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-transparent text-slate-900"
      }`}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* BRAND LOGO AREA */}
        <Link to="/" className="group flex items-center gap-3 transition-opacity duration-200 hover:opacity-80" aria-label="Home">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Site logo"
              className="h-10 w-auto max-w-[180px] object-contain transition-all duration-250 group-hover:scale-[1.03] sm:h-11 sm:max-w-[220px]"
              loading="eager"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-250 group-hover:scale-105 ${isHome && !isScrolled ? "border-white/20 bg-white/10 text-white backdrop-blur-sm" : "border-black/10 bg-white text-slate-900"}`}>
                <span className="font-display text-base font-semibold tracking-tighter">CB</span>
              </div>
              <div className="flex flex-col">
                <span className={`font-display text-lg font-medium leading-none tracking-[0.18em] ${isHome && !isScrolled ? "text-white drop-shadow" : "text-slate-900"}`}>
                  CHRISTY BLACK
                </span>
                <span className={`text-[9px] font-medium uppercase leading-tight tracking-[0.3em] ${isHome && !isScrolled ? "text-slate-200 drop-shadow" : "text-slate-600"}`}>
                  ART GALLERY
                </span>
              </div>
            </>
          )}
        </Link>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-7 lg:flex">
          {!isAdminRoute ? (
            <>
              {STORE_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `text-xs uppercase tracking-[0.2em] transition-all duration-200 ${
                      isActive
                        ? isHome && !isScrolled
                          ? "font-medium text-white drop-shadow"
                          : "font-medium text-slate-900"
                        : isHome && !isScrolled
                          ? "text-slate-200 hover:text-white drop-shadow"
                          : "text-slate-600 hover:text-slate-900"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </>
          ) : (
            <>
              {ADMIN_PRIMARY_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `text-xs uppercase tracking-[0.2em] transition-all duration-200 hover:text-slate-900 ${
                      isActive ? "font-medium text-slate-900" : "text-slate-600"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="relative" onMouseLeave={() => setAdminDropdownOpen(false)}>
                <button
                  type="button"
                  onClick={() => setAdminDropdownOpen((v) => !v)}
                  onMouseEnter={() => setAdminDropdownOpen(true)}
                  className="flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-slate-600 transition-all duration-200 hover:text-slate-900"
                >
                  <span>More</span>
                  <ChevronDownIcon className={`h-3 w-3 transition-transform duration-200 ${adminDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {adminDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-black/10 bg-white/95 p-2 shadow-xl backdrop-blur-md">
                    {ADMIN_SECONDARY_LINKS.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setAdminDropdownOpen(false)}
                        className={({ isActive }) =>
                          `block rounded-lg px-3 py-2 text-[11px] uppercase tracking-[0.15em] transition-all duration-200 ${
                            isActive
                              ? "bg-slate-100 font-medium text-slate-900"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`
                        }
                      >
                        {link.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              <span className="h-4 w-px bg-black/10" />

              <Link
                to="/"
                className="text-xs uppercase tracking-[0.2em] text-slate-600 transition-all duration-200 hover:text-slate-900"
              >
                ← Store
              </Link>
            </>
          )}
        </nav>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search"
            className={`flex h-10 w-10 items-center justify-center transition-all duration-200 ${
              isHome && !isScrolled ? "text-white hover:opacity-80 drop-shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <SearchIcon />
          </button>

          <Link
            to="/account"
            aria-label="Account"
            className={`hidden h-10 w-10 items-center justify-center transition-all duration-200 sm:flex ${
              isHome && !isScrolled ? "text-white hover:opacity-80 drop-shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserIcon />
          </Link>

          {!isAdminRoute && (
            <Link
              to="/cart"
              aria-label="Cart"
              className={`relative flex h-10 w-10 items-center justify-center transition-all duration-200 ${
                isHome && !isScrolled ? "text-white hover:opacity-80 drop-shadow" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CartIcon />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[9px] font-medium text-white shadow">
                  {count}
                </span>
              )}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className={`flex h-10 w-10 items-center justify-center transition-all duration-200 lg:hidden ${
              isHome && !isScrolled ? "text-white hover:opacity-80 drop-shadow" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* SEARCH PANEL */}
      {searchOpen && (
        <div className="border-b border-black/10 bg-white/95 px-5 py-3.5 shadow-md backdrop-blur-md sm:px-8">
          <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-7xl items-center gap-3">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search artworks, paintings, and masterworks..."
              className="w-full border-b border-black/10 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500"
            />
            <button type="submit" className="text-xs font-medium uppercase tracking-widest text-slate-900">
              Search
            </button>
          </form>
        </div>
      )}

      {/* MOBILE MENU DROPDOWN */}
      {menuOpen && (
        <div className="max-h-[80vh] overflow-y-auto border-b border-black/10 bg-white/95 px-5 py-6 text-slate-900 shadow-xl backdrop-blur-md lg:hidden">
          <div className="flex flex-col gap-4">
            {!isAdminRoute ? (
              <>
                {STORE_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `text-sm uppercase tracking-[0.2em] transition-colors duration-200 ${
                        isActive ? "font-medium text-slate-900" : "text-slate-600"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </>
            ) : (
              <>
                <div className="mb-2 border-b border-black/10 pb-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-slate-600">Admin Dashboard</span>
                </div>
                {ADMIN_PRIMARY_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `text-sm uppercase tracking-[0.2em] transition-colors duration-200 ${
                        isActive ? "font-medium text-slate-900" : "text-slate-600"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                {ADMIN_SECONDARY_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `text-sm uppercase tracking-[0.2em] transition-colors duration-200 ${
                        isActive ? "font-medium text-slate-900" : "text-slate-600"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 border-t border-black/10 pt-2 text-sm uppercase tracking-[0.2em] text-slate-600 transition-colors duration-200 hover:text-slate-900"
                >
                  ← Back to Store
                </Link>
              </>
            )}

            <div className="mt-4 flex flex-col gap-3 border-t border-black/10 pt-4">
              <Link
                to="/account"
                onClick={() => setMenuOpen(false)}
                className="text-xs uppercase tracking-[0.2em] text-slate-900"
              >
                {user ? appUser?.display_name || "My Account" : "Login / Signup"}
              </Link>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    setMenuOpen(false);
                  }}
                  className="text-left text-xs uppercase tracking-[0.2em] text-red-600"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}