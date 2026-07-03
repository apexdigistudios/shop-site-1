import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { formatPrice } from "../../lib/helpers";
import AdminSectionHeader from "../../components/AdminSectionHeader";

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

  useEffect(() => {
    async function load() {
      const [products, categories, orders, users, reviews, ordersData, recentOrdersRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("approved", false),
        supabase.from("orders").select("total_amount, total"),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

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
    }
    load();
  }, []);

  const cards = [
    { emoji: "📦", label: "Total Products", value: stats?.products ?? "—", to: "/admin/products" },
    { emoji: "🗂️", label: "Total Categories", value: stats?.categories ?? "—", to: "/admin/categories" },
    { emoji: "🛒", label: "Total Orders", value: stats?.orders ?? "—", to: "/admin/orders" },
    { emoji: "👥", label: "Total Users", value: stats?.users ?? "—", to: "/admin/users" },
    { emoji: "⭐", label: "Pending Reviews", value: stats?.pendingReviews ?? "—", to: "/admin/reviews" },
    { emoji: "💰", label: "Revenue", value: stats ? formatPrice(stats.revenue) : "—", to: "/admin/orders" },
  ];

  return (
    <div>
      <AdminSectionHeader
        emoji="📊"
        title="Dashboard Overview"
        subtitle="Welcome back. Here's what's happening at ADOB'S IMPORTS HUB."
      />

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-2xl border border-soft-grey/40 bg-pure-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-250 hover:-translate-y-[2px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-dark-border dark:bg-dark-elevated dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
          >
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-grey dark:text-dark-muted">
              <span className="text-sm leading-none" aria-hidden="true">{card.emoji}</span>
              <span>{card.label}</span>
            </p>
            <p className="mt-3 font-display text-3xl">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-muted-grey dark:text-dark-muted">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-soft-grey/40 dark:border-dark-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-beige-cream text-xs uppercase tracking-widest text-muted-grey dark:bg-dark-card dark:text-dark-muted">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-soft-grey/30 dark:border-dark-border">
                    <td className="px-4 py-3">#{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3">{order.customer_name || "—"}</td>
                    <td className="px-4 py-3">{formatPrice(order.total_amount ?? order.total ?? 0)}</td>
                    <td className="px-4 py-3 capitalize">{order.status}</td>
                    <td className="px-4 py-3">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
