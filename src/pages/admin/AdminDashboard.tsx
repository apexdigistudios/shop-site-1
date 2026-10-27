import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { formatCompactNumber, formatCompactPrice } from "../../lib/helpers";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

interface Stats {
  products: number;
  categories: number;
  orders: number;
  users: number;
  pendingReviews: number;
  revenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { appUser } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const [products, categories, orders, users, reviews, ordersData, recentOrdersRes] = await Promise.all([
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("categories").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("id", { count: "exact", head: true }),
          supabase.from("users").select("id", { count: "exact", head: true }),
          supabase.from("reviews").select("id", { count: "exact", head: true }).eq("approved", false),
          supabase.from("orders").select("total_amount, total"),
          supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
        ]);
        const queryError = [
          products.error,
          categories.error,
          orders.error,
          users.error,
          reviews.error,
          ordersData.error,
          recentOrdersRes.error,
        ].find((error) => error !== null);
        if (queryError) throw queryError;

        const revenue = (ordersData.data || []).reduce(
          (sum: number, o: any) => sum + (o.total_amount ?? o.total ?? 0),
          0
        );

        setStats({
          products: products.count || 0,
          categories: categories.count || 0,
          orders: orders.count || 0,
          users: users.count || 0,
          pendingReviews: reviews.count || 0,
          revenue,
        });
        setRecentOrders(recentOrdersRes.data || []);
      } catch (error) {
        showToast(`Unable to load dashboard: ${error instanceof Error ? error.message : String(error)}`, "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [showToast]);

  if (loading) {
    return (
      <div aria-label="Loading dashboard" aria-busy="true" className="space-y-8 pb-24">
        <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200" />
        <div className="h-48 animate-pulse rounded-3xl bg-slate-200 sm:h-56" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-slate-50/70" />
          ))}
        </div>
        <div className="space-y-3">
          <div className="h-5 w-36 animate-pulse rounded-full bg-slate-200" />
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Top Bar Header */}
      <div className="border-b border-slate-200 pb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
          DASHBOARD
        </p>
      </div>

      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-slate-900 to-amber-950/80 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-200 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Gallery Control
            </span>
            <p className="pt-2 text-xs uppercase tracking-[0.2em] text-amber-400">
              WELCOME, {appUser?.display_name || "ADMIN"}
            </p>
            <h1 className="font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">
              Christy Black Portal
            </h1>
            <p className="text-xs text-slate-300">
              Overviewing revenue, store inventory, and user inquiries.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-900 transition-transform hover:scale-105"
            >
              <span>🖼️</span> Artworks
            </Link>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/20"
            >
              <span>🛒</span> Orders
            </Link>
          </div>
        </div>
      </div>

      {/* CORE MODULES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
            CORE MODULES
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Revenue */}
          <Link
            to="/admin/orders"
            className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                💰
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                Live
              </span>
            </div>
            <div className="mt-6">
              <h3 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                {stats ? formatCompactPrice(stats.revenue) : "—"}
              </h3>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Total Revenue
              </p>
            </div>
          </Link>

          {/* Orders */}
          <Link
            to="/admin/orders"
            className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                🛒
              </div>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">
                Sales
              </span>
            </div>
            <div className="mt-6">
              <h3 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                {stats ? formatCompactNumber(stats.orders) : "—"}
              </h3>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Total Orders
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* GALLERY METRICS SECTION */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
            GALLERY METRICS
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            {formatCompactNumber(4)} Modules
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {/* Artworks */}
          <Link
            to="/admin/products"
            className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:bg-white hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-800">
              🖼️
            </div>
            <div className="mt-4">
              <p className="font-display text-xl font-bold text-slate-900">
                {stats ? formatCompactNumber(stats.products) : "—"}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Artworks</p>
            </div>
          </Link>

          {/* Collections */}
          <Link
            to="/admin/categories"
            className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:bg-white hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-800">
              🗂️
            </div>
            <div className="mt-4">
              <p className="font-display text-xl font-bold text-slate-900">
                {stats ? formatCompactNumber(stats.categories) : "—"}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Collections</p>
            </div>
          </Link>

          {/* Users */}
          <Link
            to="/admin/users"
            className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:bg-white hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-800">
              👥
            </div>
            <div className="mt-4">
              <p className="font-display text-xl font-bold text-slate-900">
                {stats ? formatCompactNumber(stats.users) : "—"}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Users</p>
            </div>
          </Link>

          {/* Pending Reviews */}
          <Link
            to="/admin/reviews"
            className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:bg-white hover:shadow-md"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
              ⭐
            </div>
            <div className="mt-4">
              <p className="font-display text-xl font-bold text-slate-900">
                {stats ? formatCompactNumber(stats.pendingReviews) : "—"}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Reviews</p>
            </div>
          </Link>
        </div>
      </div>

      {/* RECENT ORDERS LIST */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">
            RECENT ORDERS
          </h2>
          <Link to="/admin/orders" className="text-xs font-semibold uppercase tracking-wider text-slate-900 hover:underline">
            View All →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No recent orders found.
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all hover:bg-white hover:shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-semibold capitalize text-slate-700">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {order.customer_name || "Guest Customer"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-display text-sm font-bold text-slate-900">
                    {formatCompactPrice(order.total_amount ?? order.total ?? 0)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}