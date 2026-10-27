import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { MeetupStatus, Order, OrderStatus } from "../../lib/types";
import { formatCompactNumber, formatPrice, WHATSAPP_NUMBER } from "../../lib/helpers";
import { useToast } from "../../contexts/ToastContext";
import { WhatsAppIcon, BagIcon, ChevronDownIcon } from "../../components/icons";
import AdminSectionHeader from "../../components/AdminSectionHeader";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "pending_payment", "processing", "shipped", "delivered", "cancelled"];
const MEETUP_OPTIONS: MeetupStatus[] = ["awaiting_meetup", "arranged", "completed", "cancelled"];

function formatCompactAmount(value: number | null | undefined): string {
  const n = typeof value === "number" && !Number.isNaN(value) ? value : 0;
  if (n >= 1_000_000_000) {
    return "GH₵" + (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
  }
  if (n >= 1_000_000) {
    return "GH₵" + (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (n >= 1_000) {
    return "GH₵" + (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return formatPrice(n);
}

export default function AdminOrders() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  // Confirmation Wizard State for Dropdown Changes
  const [pendingChange, setPendingChange] = useState<{
    orderId: string;
    type: "status" | "meetup" | "payment";
    newValue: any;
    currentValue: any;
  } | null>(null);

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

  async function executeConfirmedChange() {
    if (!pendingChange) return;
    const { orderId, type, newValue } = pendingChange;

    let updatePayload: any = {};
    if (type === "status") updatePayload = { status: newValue };
    if (type === "meetup") updatePayload = { meetup_status: newValue };
    if (type === "payment") updatePayload = { payment_status: newValue };

    const { data, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .select()
      .maybeSingle();

    if (error) {
      showToast(error.message, "error");
      setPendingChange(null);
      return;
    }

    if (data) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? (data as Order) : o)));
      showToast("Order updated successfully.", "success");
    }
    setPendingChange(null);
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

  function getStatusColor(status: OrderStatus) {
    if (status === "delivered") return "bg-emerald-100 text-emerald-800 border-emerald-300";
    if (status === "cancelled") return "bg-red-100 text-red-800 border-red-300";
    if (status === "shipped") return "bg-blue-100 text-blue-800 border-blue-300";
    if (status === "processing") return "bg-amber-100 text-amber-800 border-amber-300";
    return "bg-slate-100 text-slate-800 border-slate-300";
  }

  return (
    <div className="space-y-6 pb-20">
      <AdminSectionHeader
        emoji="🛒"
        title="Order Management"
        subtitle={`${formatCompactNumber(orders.length)} total orders recorded`}
      />

      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2">
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
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
              filter === key
                ? "bg-slate-900 text-white shadow-md"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <span>{label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                filter === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {formatCompactNumber(count)}
            </span>
          </button>
        ))}
      </div>

      {/* ORDERS LIST / GRID */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 w-full animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-12 text-center text-sm text-slate-500">
          No orders match this filter.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const safeItems = Array.isArray(order.items) ? order.items : [];
            const isExpanded = expandedOrder === order.id;

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
              >
                {/* CARD HEADER */}
                <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow">
                      <BagIcon size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-slate-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Placed on {new Date(order.created_at).toLocaleDateString()} at{" "}
                        {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Amount</p>
                      <p className="font-display text-xl font-bold text-slate-900">
                        {formatCompactAmount(order.total_amount ?? order.total ?? 0)}
                      </p>
                    </div>
                    {order.customer_phone && (
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                          `Hello, I'm following up on Order #${order.id.slice(0, 8).toUpperCase()} for ${order.customer_name || "Customer"}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-whatsapp-green text-white shadow transition-transform hover:scale-105"
                        title="Contact customer on WhatsApp"
                      >
                        <WhatsAppIcon size={20} className="text-white" />
                      </a>
                    )}
                  </div>
                </div>

                {/* 3-STEP WIZARD GRID */}
                <div className="grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-3">
                  {/* STEP 1: ORDER OVERVIEW & ITEMS */}
                  <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                          1
                        </span>
                        <span>Artwork Items</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        Contains <strong className="text-slate-900">{safeItems.length} artwork(s)</strong>
                      </p>

                      {/* Items Preview */}
                      <div className="space-y-2 pt-1">
                        {safeItems.slice(0, isExpanded ? safeItems.length : 2).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white p-2">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[9px] text-slate-400">N/A</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-slate-900">{item.name}</p>
                              <p className="text-[10px] text-slate-500">
                                Qty {item.quantity} · {formatCompactAmount(item.price)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {safeItems.length > 2 && (
                      <button
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="mt-3 flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
                      >
                        <span>{isExpanded ? "Show Less" : `+${safeItems.length - 2} More Items`}</span>
                        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </div>

                  {/* STEP 2: CUSTOMER & DELIVERY INFO */}
                  <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                          2
                        </span>
                        <span>Customer & Delivery</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-slate-900">{order.customer_name || "Guest Customer"}</p>
                        <p className="text-slate-600">{order.customer_phone || "No phone provided"}</p>
                        {order.customer_address && (
                          <p className="mt-2 rounded-xl bg-white p-2 text-slate-600 border border-slate-200/60">
                            {order.customer_address}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-200/60 pt-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Meetup Status</p>
                      <select
                        value={order.meetup_status ?? "awaiting_meetup"}
                        onChange={(e) =>
                          setPendingChange({
                            orderId: order.id,
                            type: "meetup",
                            newValue: e.target.value as MeetupStatus,
                            currentValue: order.meetup_status ?? "awaiting_meetup",
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 outline-none"
                      >
                        {MEETUP_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* STEP 3: PAYMENT & STATUS MANAGEMENT */}
                  <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                          3
                        </span>
                        <span>Payment & Status</span>
                      </div>

                      {/* Payment Badges & Details */}
                      <div className="space-y-2 rounded-xl border border-slate-200/60 bg-white p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Method</span>
                          <span className="font-semibold text-slate-900">
                            {order.payment_method === "paystack_deposit" ? "Paystack" : "Meetup"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Deposit</span>
                          <span className="font-semibold text-emerald-600">
                            {formatCompactAmount(order.deposit_amount ?? 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Balance</span>
                          <span className="font-semibold text-red-600">
                            {formatCompactAmount(order.remaining_balance ?? 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 border-t border-slate-200/60 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Update Order Status</p>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          setPendingChange({
                            orderId: order.id,
                            type: "status",
                            newValue: e.target.value as OrderStatus,
                            currentValue: order.status,
                          })
                        }
                        className="w-full rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-bold text-white outline-none"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>

                      {order.payment_method === "meetup" && (
                        <button
                          onClick={() =>
                            setPendingChange({
                              orderId: order.id,
                              type: "payment",
                              newValue: order.payment_status === "deposit_paid" ? "pending_meetup_payment" : "deposit_paid",
                              currentValue: order.payment_status,
                            })
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-100"
                        >
                          {order.payment_status === "deposit_paid" ? "Mark Payment Pending" : "Mark Payment Paid"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CHANGE CONFIRMATION WIZARD MODAL */}
      {pendingChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900">Confirm Status Change</h3>
            <p className="text-xs text-slate-600">
              You are about to change the <span className="font-semibold capitalize">{pendingChange.type}</span> from{" "}
              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                {String(pendingChange.currentValue).replace(/_/g, " ")}
              </span>{" "}
              to{" "}
              <span className="font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                {String(pendingChange.newValue).replace(/_/g, " ")}
              </span>
              .
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingChange(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedChange}
                className="rounded-2xl bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-slate-800"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}