import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import type { CartItem, Product } from "../lib/types";

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  count: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number, size?: string | null, color?: string | null) => Promise<void>;
  updateQuantity: (cartId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function makeGuestId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]); // Supabase-backed items when logged in
  const [guestItems, setGuestItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("cart")
      .select("*, product:products(*)")
      .eq("user_id", user.id);
    if (!error && data) {
      setItems(data as unknown as CartItem[]);
    }
    setLoading(false);
  }, [user]);

  // Load user cart on login; merge any guest bag items into Supabase.
  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    const sync = async () => {
      setLoading(true);
      await refresh();
      if (guestItems.length > 0) {
        for (const g of guestItems) {
          await supabase
            .from("cart")
            .insert({ user_id: user.id, product_id: g.product_id, quantity: g.quantity, size: g.size, color: g.color });
        }
        setGuestItems([]);
        await refresh();
      }
      setLoading(false);
    };
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addToCart = useCallback(
    async (product: Product, quantity = 1, size: string | null = null, color: string | null = null) => {
      if (user) {
        const existing = items.find((it) => it.product_id === product.id && it.size === size && it.color === color);

        if (existing) {
          const { data, error } = await supabase
            .from("cart")
            .update({ quantity: existing.quantity + quantity })
            .eq("id", existing.id)
            .select("*, product:products(*)")
            .maybeSingle();
          if (error) throw new Error(error.message);
          if (data) {
            setItems((prev) => prev.map((it) => (it.id === existing.id ? (data as unknown as CartItem) : it)));
          }
        } else {
          const { data, error } = await supabase
            .from("cart")
            .insert({ user_id: user.id, product_id: product.id, quantity, size, color })
            .select("*, product:products(*)")
            .maybeSingle();
          if (error) throw new Error(error.message);
          if (data) setItems((prev) => [...prev, data as unknown as CartItem]);
        }
      } else {
        // Guest cart is kept in React state only (no localStorage per project rules).
        const existing = guestItems.find((it) => it.product_id === product.id && it.size === size && it.color === color);
        if (existing) {
          setGuestItems((prev) =>
            prev.map((it) => (it.id === existing.id ? { ...it, quantity: it.quantity + quantity } : it))
          );
        } else {
          const newItem: CartItem = {
            id: makeGuestId(),
            product_id: product.id,
            quantity,
            size,
            color,
            product,
          };
          setGuestItems((prev) => [...prev, newItem]);
        }
      }
    },
    [user, items, guestItems]
  );

  const updateQuantity = useCallback(
    async (cartId: string, quantity: number) => {
      if (quantity < 1) return;
      if (user) {
        const { data, error } = await supabase
          .from("cart")
          .update({ quantity })
          .eq("id", cartId)
          .select("*, product:products(*)")
          .maybeSingle();
        if (error) throw new Error(error.message);
        if (data) setItems((prev) => prev.map((it) => (it.id === cartId ? (data as unknown as CartItem) : it)));
      } else {
        setGuestItems((prev) => prev.map((it) => (it.id === cartId ? { ...it, quantity } : it)));
      }
    },
    [user]
  );

  const removeFromCart = useCallback(
    async (cartId: string) => {
      if (user) {
        const { error } = await supabase.from("cart").delete().eq("id", cartId);
        if (error) throw new Error(error.message);
        setItems((prev) => prev.filter((it) => it.id !== cartId));
      } else {
        setGuestItems((prev) => prev.filter((it) => it.id !== cartId));
      }
    },
    [user]
  );

  const clearCart = useCallback(async () => {
    if (user) {
      const { error } = await supabase.from("cart").delete().eq("user_id", user.id);
      if (error) throw new Error(error.message);
      setItems([]);
    } else {
      setGuestItems([]);
    }
  }, [user]);

  const displayedItems = user ? items : guestItems;
  const count = displayedItems.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = displayedItems.reduce((sum, it) => sum + (it.product?.price ?? 0) * it.quantity, 0);

  const value = useMemo<CartContextValue>(
    () => ({
      items: displayedItems,
      loading,
      count,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refresh,
    }),
    [displayedItems, loading, count, subtotal, addToCart, updateQuantity, removeFromCart, clearCart, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
