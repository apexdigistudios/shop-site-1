import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { MeetupStatus, Order, OrderStatus } from "../../lib/types";
import { formatPrice, WHATSAPP_NUMBER } from "../../lib/helpers";
import { useToast } from "../../contexts/ToastContext";
import { WhatsAppIcon, BagIcon, ChevronDownIcon } from "../../components/icons";
import AdminSectionHeader from "../../components/AdminSectionHeader";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "pending_payment", "processing", "shipped", "delivered", "cancelled"];
const MEETUP_OPTIONS: MeetupStatus[] = ["awaiting_meetup", "arranged", "completed", "cancelled"];

export default function AdminOrders() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data as Order[]) || []);
        setLoading(false);
      });
  }, []);

  async function updateStatus(id: string, status: OrderStatus) {
    const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select().maybeSingle();
    if (error) {
      showToast(error.message, "error");
      return;
    }
    if (data) {
      setOrders((prev) => prev.map((o) => (o.id === id ? (data as Order) : o)));
      showToast("Order status updated.", "success");
    }
  }

  async function updatePaymentStatus(id: string, paymentStatus: "deposit_paid" | "pending_meetup_payment") {
    const { data, error } = await supabase
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) {
      showToast(error.message, "error");
      return;
    }
    if (data) {
      setOrders((prev) => prev.map((o) => (o.id === id ? (data as Order) : o)));
      showToast("Payment status updated.", "success");
    }
  }

  async function updateMeetupStatus(id: string, meetupStatus: MeetupStatus) {
    const { data, error } = await supabase
      .from("orders")
      .update({ meetup_status: meetupStatus })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) {
      showToast(error.message, "error");
      return;
    }
    if (data) {
      setOrders((prev) => prev.map((o) => (o.id === id ? (data as Order) : o)));
      showToast("Meetup status updated.", "success");
    }
  }

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  function statusBadgeClasses(status: OrderStatus) {
    if (status === "delivered") return "bg-whatsapp-green/15 text-whatsapp-green";
    if (status === "cancelled") return "bg-alert-red/15 text-alert-red";
    if (status === "shipped") return "bg-blue-500/15 text-blue-500";
    if (status === "processing") return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
    return "bg-beige-cream text-luxury-black dark:bg-dark-elevated dark:text-dark-text";
  }

  const selectClass =
    "h-9 rounded-lg border border-soft-grey/60 bg-transparent px-2.5 text-xs uppercase tracking-widest outline-none dark:border-dark-border dark:bg-dark-card dark:text-dark-text";

  return (
    <div>
      <AdminSectionHeader
        emoji="🛒"
        title="Orders"
        subtitle={`${orders.length} total order${orders.length !== 1 ? "s" : ""}`}
      />

      {/* FILTER TABS */}
      <div className="mt-6 flex flex-wrap gap-2">
        {([
          ["all", "All", counts.all],
          ["pending", "Pending", counts.pending],
          ["processing", "Processing", counts.processing],
          ["shipped", "Shipped", counts.shipped],
          ["delivered", "Delivered", counts.delivered],
          ["cancelled", "Cancelled", counts.cancelled],
        ] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key as OrderStatus | "all")}
            className={`flex h-9 items-center gap-2 rounded-full px-3.5 text-xs uppercase tracking-widest transition-all duration-200 ${
              filter === key
                ? "bg-luxury-black text-pure-white dark:bg-dark-accent dark:text-luxury-black"
                : "border border-soft-grey/50 text-muted-grey hover:border-luxury-black hover:text-luxury-black dark:border-dark-border dark:text-dark-muted dark:hover:border-dark-accent dark:hover:text-dark-text"
            }`}
          >
            {label}
            <span className={`rounded-full px-1.5 text-[10px] ${filter === key ? "bg-white/20" : "bg-soft-grey/30 dark:bg-dark-elevated"}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 w-full animate-pulse rounded-2xl bg-soft-grey/30 dark:bg-dark-card" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <p className="text-sm text-muted-grey dark:text-dark-muted">No orders match this filter.</p>
        ) : (
          filteredOrders.map((order) => {
            const safeItems = Array.isArray(order.items) ? order.items : [];
            const isExpanded = expanded === order.id;
            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-soft-grey/40 bg-pure-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-250 dark:border-dark-border dark:bg-dark-card dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
              >
                {/* ── TOP: Order Info + Status ── */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-soft-grey/30 p-5 dark:border-dark-border">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-beige-cream text-luxury-black dark:bg-dark-elevated dark:text-dark-text">
                      <BagIcon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-luxury-black dark:text-dark-text">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-grey dark:text-dark-muted">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-widest ${statusBadgeClasses(order.status)}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-base font-semibold text-luxury-black dark:text-dark-text">
                      {formatPrice(order.total_amount ?? order.total ?? 0)}
                    </span>
                  </div>
                </div>

                {/* ── MIDDLE: Customer + Payment (grid) ── */}
                <div className="grid grid-cols-1 divide-y divide-soft-grey/30 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-dark-border">
                  {/* Customer */}
                  <div className="p-5">
                    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-grey dark:text-dark-muted">
                      Customer
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-luxury-black dark:text-dark-text">{order.customer_name || "—"}</p>
                      <p className="text-muted-grey dark:text-dark-muted">{order.customer_phone || "—"}</p>
                      {order.customer_address && (
                        <p className="text-muted-grey dark:text-dark-muted">{order.customer_address}</p>
                      )}
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="p-5">
                    <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-grey dark:text-dark-muted">
                      Payment
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest ${
                            order.payment_status === "deposit_paid"
                              ? "bg-whatsapp-green/15 text-whatsapp-green"
                              : "bg-alert-red/15 text-alert-red"
                          }`}
                        >
                          {order.payment_status === "deposit_paid" ? "Deposit Paid" : "Pending Meetup Pay"}
                        </span>
                        <span className="rounded-full bg-beige-cream px-2.5 py-1 text-[10px] uppercase tracking-widest text-luxury-black dark:bg-dark-elevated dark:text-dark-text">
                          {order.payment_method === "paystack_deposit" ? "Paystack" : "Meetup"}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-grey dark:text-dark-muted">
                        <span>Total</span>
                        <span className="text-luxury-black dark:text-dark-text">{formatPrice(order.total_amount ?? order.total ?? 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-grey dark:text-dark-muted">
                        <span>Deposit</span>
                        <span className="text-whatsapp-green">{formatPrice(order.deposit_amount ?? 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-grey dark:text-dark-muted">
                        <span>Balance</span>
                        <span className="text-alert-red">{formatPrice(order.remaining_balance ?? 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── ITEMS (expandable) ── */}
                {isExpanded && safeItems.length > 0 && (
                  <div className="border-t border-soft-grey/30 p-5 dark:border-dark-border">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-grey dark:text-dark-muted">
                      Items ({safeItems.length})
                    </p>
                    <div className="space-y-2.5">
                      {safeItems.map((it, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-soft-grey/40 bg-beige-cream dark:border-dark-border dark:bg-dark-elevated">
                            {it.image ? (
                              <img src={it.image} alt={it.name} className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[9px] text-muted-grey">N/A</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-luxury-black dark:text-dark-text">{it.name}</p>
                            <p className="text-xs text-muted-grey dark:text-dark-muted">
                              Qty {it.quantity}
                              {it.size ? ` · ${it.size}` : ""}
                              {it.color ? ` · ${it.color}` : ""}
                            </p>
                          </div>
                          <span className="flex-shrink-0 text-sm font-medium text-luxury-black dark:text-dark-text">
                            {formatPrice(it.price * it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── BOTTOM: Meetup + Actions ── */}
                <div className="flex flex-col gap-3 border-t border-soft-grey/30 bg-beige-cream/40 p-4 dark:border-dark-border dark:bg-dark-elevated/40 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-grey dark:text-dark-muted">
                      Meetup
                    </span>
                    <select
                      value={order.meetup_status ?? "awaiting_meetup"}
                      onChange={(e) => updateMeetupStatus(order.id, e.target.value as MeetupStatus)}
                      className={selectClass}
                    >
                      {MEETUP_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {order.payment_method === "meetup" && (
                      <button
                        onClick={() =>
                          updatePaymentStatus(
                            order.id,
                            order.payment_status === "deposit_paid" ? "pending_meetup_payment" : "deposit_paid"
                          )
                        }
                        className="flex h-9 items-center rounded-lg border border-soft-grey/60 px-3 text-xs uppercase tracking-widest text-luxury-black transition-colors duration-200 hover:bg-luxury-black hover:text-pure-white dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-accent dark:hover:text-luxury-black"
                      >
                        {order.payment_status === "deposit_paid" ? "Mark Pending" : "Mark Paid"}
                      </button>
                    )}
                    {order.customer_phone && (
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                          `Hello, I'm following up on Order #${order.id.slice(0, 8).toUpperCase()} for ${order.customer_name || "Customer"}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Chat on WhatsApp"
                        title="Contact on WhatsApp"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-sm transition-all duration-200 hover:scale-105 hover:bg-[#1EBE5A]"
                      >
                        <WhatsAppIcon size={17} className="text-white" />
                      </a>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : order.id)}
                      className="flex h-9 items-center gap-1.5 rounded-lg border border-soft-grey/60 px-3 text-xs uppercase tracking-widest text-luxury-black transition-colors duration-200 hover:bg-luxury-black hover:text-pure-white dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-accent dark:hover:text-luxury-black"
                    >
                      {isExpanded ? "Hide" : "View"}
                      <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* ── STATUS DROPDOWN (separate row for clarity) ── */}
                <div className="flex items-center justify-between gap-3 border-t border-soft-grey/30 px-5 py-3 dark:border-dark-border">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-grey dark:text-dark-muted">
                    Order Status
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                    className={selectClass}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
