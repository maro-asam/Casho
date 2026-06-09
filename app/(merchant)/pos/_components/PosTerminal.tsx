"use client";

import { useReducer, useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Barcode,
  ChevronLeft,
  ClipboardList,
  History,
  LayoutDashboard,
  Pause,
  RotateCcw,
  Search,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SearchPosProductsAction, FindProductByBarcodeAction } from "@/actions/pos/pos.actions";
import type { HeldCartData } from "@/actions/pos/pos.actions";
import ProductGrid from "./ProductGrid";
import CartPanel from "./CartPanel";
import ShiftModal from "./ShiftModal";
import HeldOrdersDialog from "./HeldOrdersDialog";

// ─── Types ────────────────────────────────────────────────────

export type CartItem = {
  productId: string;
  name: string;
  image: string;
  price: number;       // piasters
  costPrice: number;   // piasters
  quantity: number;
  discountAmount: number; // piasters
  stock: number;
  sku?: string;
};

export type InvoiceDiscount = { type: "percentage" | "fixed"; value: number } | null;

export type CartState = {
  items: CartItem[];
  invoiceDiscount: InvoiceDiscount;
  customer: { id?: string; name: string; phone: string } | null;
  note: string;
};

type CartAction =
  | { type: "ADD_ITEM"; item: CartItem }
  | { type: "INCREMENT"; productId: string }
  | { type: "DECREMENT"; productId: string }
  | { type: "REMOVE"; productId: string }
  | { type: "SET_QUANTITY"; productId: string; qty: number }
  | { type: "SET_ITEM_DISCOUNT"; productId: string; amount: number }
  | { type: "SET_INVOICE_DISCOUNT"; discount: InvoiceDiscount }
  | { type: "SET_CUSTOMER"; customer: CartState["customer"] }
  | { type: "SET_NOTE"; note: string }
  | { type: "CLEAR" }
  | { type: "LOAD"; state: CartState };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.productId === action.item.productId);
      if (existing) {
        const newQty = Math.min(existing.quantity + 1, existing.stock);
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.item.productId ? { ...i, quantity: newQty } : i,
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case "INCREMENT": {
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId
            ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) }
            : i,
        ),
      };
    }
    case "DECREMENT": {
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.productId === action.productId ? { ...i, quantity: i.quantity - 1 } : i,
          )
          .filter((i) => i.quantity > 0),
      };
    }
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };
    case "SET_QUANTITY":
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId
            ? { ...i, quantity: Math.max(1, Math.min(action.qty, i.stock)) }
            : i,
        ),
      };
    case "SET_ITEM_DISCOUNT":
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.productId
            ? { ...i, discountAmount: Math.max(0, action.amount) }
            : i,
        ),
      };
    case "SET_INVOICE_DISCOUNT":
      return { ...state, invoiceDiscount: action.discount };
    case "SET_CUSTOMER":
      return { ...state, customer: action.customer };
    case "SET_NOTE":
      return { ...state, note: action.note };
    case "CLEAR":
      return { items: [], invoiceDiscount: null, customer: null, note: "" };
    case "LOAD":
      return action.state;
    default:
      return state;
  }
}

const initialCart: CartState = {
  items: [],
  invoiceDiscount: null,
  customer: null,
  note: "",
};

// ─── Props ────────────────────────────────────────────────────

type Props = {
  store: { id: string; name: string; slug: string; settings: { logo: string | null; primaryColor: string | null; whatsappNumber: string | null } | null };
  cashier: { id: string; name: string | null; email: string };
  activeShift: { id: string; openingBalance: number; totalSales: number; transactionCount: number; openedAt: string } | null;
  categories: { id: string; name: string; _count: { products: number } }[];
};

// ─── Component ────────────────────────────────────────────────

export default function PosTerminal({ store, cashier, activeShift: initialShift, categories }: Props) {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);
  const [activeShift, setActiveShift] = useState(initialShift);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<CartItem[]>([]);
  const [loading, startSearch] = useTransition();
  const [showShiftModal, setShowShiftModal] = useState(!initialShift);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [heldCount, setHeldCount] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const barcodeBuffer = useRef("");
  const barcodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load products
  const loadProducts = useCallback(
    (q: string, catId?: string | null) => {
      startSearch(async () => {
        const results = await SearchPosProductsAction(q, catId ?? undefined);
        setProducts(
          results.map((p) => ({
            productId: p.id,
            name: p.name,
            image: p.image,
            price: Math.round(p.price * 100),
            costPrice: Math.round((p.costPrice ?? 0) * 100),
            quantity: 1,
            discountAmount: 0,
            stock: p.stock,
            sku: p.sku ?? undefined,
          })),
        );
      });
    },
    [],
  );

  useEffect(() => {
    loadProducts("", null);
  }, [loadProducts]);

  useEffect(() => {
    const timeout = setTimeout(() => loadProducts(search, activeCategoryId), 200);
    return () => clearTimeout(timeout);
  }, [search, activeCategoryId, loadProducts]);

  // Barcode scanner: USB scanners emit chars fast then Enter
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // F1 → focus search
      if (e.key === "F1") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      // F2 → held orders
      if (e.key === "F2") {
        e.preventDefault();
        setShowHeldOrders(true);
        return;
      }

      // Barcode scanner: accumulate chars
      if (document.activeElement === searchRef.current) return; // not for search input
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
        barcodeTimer.current = setTimeout(() => {
          barcodeBuffer.current = "";
        }, 100);
      }
      if (e.key === "Enter" && barcodeBuffer.current.length >= 3) {
        e.preventDefault();
        const code = barcodeBuffer.current;
        barcodeBuffer.current = "";
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current);

        startSearch(async () => {
          const product = await FindProductByBarcodeAction(code);
          if (product) {
            dispatch({
              type: "ADD_ITEM",
              item: {
                productId: product.id,
                name: product.name,
                image: product.image,
                price: Math.round(product.price * 100),
                costPrice: Math.round((product.costPrice ?? 0) * 100),
                quantity: 1,
                discountAmount: 0,
                stock: product.stock,
                sku: product.sku ?? undefined,
              },
            });
          }
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleLoadHeld = (data: HeldCartData) => {
    dispatch({
      type: "LOAD",
      state: {
        items: data.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          image: i.image,
          price: i.price,
          costPrice: i.costPrice,
          quantity: i.quantity,
          discountAmount: i.discountAmount,
          stock: i.stock,
          sku: i.sku,
        })),
        invoiceDiscount: data.invoiceDiscount,
        customer: data.customer,
        note: data.note,
      },
    });
    setShowHeldOrders(false);
  };

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ── Top Bar ── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link href="/dashboard">
              <LayoutDashboard className="size-4" />
            </Link>
          </Button>
          <span className="text-sm font-semibold">{store.name}</span>
          <Badge variant="outline" className="gap-1 text-xs">
            <Zap className="size-3 text-amber-500" />
            نقطة البيع
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {activeShift ? (
            <Badge className="gap-1.5 bg-emerald-500/10 text-emerald-600 border-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
              وردية مفتوحة · {activeShift.transactionCount} فاتورة
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1.5">
              لا توجد وردية مفتوحة
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setShowHeldOrders(true)}
          >
            <Pause className="size-3" />
            معلق
            {heldCount > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground font-bold">
                {heldCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setShowShiftModal(true)}
          >
            <History className="size-3" />
            الوردية
          </Button>

          <Button asChild variant="ghost" size="sm" className="gap-1.5 h-7 text-xs">
            <Link href="/pos/returns">
              <RotateCcw className="size-3" />
              المرتجعات
            </Link>
          </Button>

          <Button asChild variant="ghost" size="sm" className="gap-1.5 h-7 text-xs">
            <Link href="/pos/shifts">
              <ClipboardList className="size-3" />
              التقارير
            </Link>
          </Button>
        </div>
      </header>

      {/* ── Main Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Products */}
        <div className="flex w-[62%] flex-col overflow-hidden border-l border-border">
          {/* Search bar */}
          <div className="border-b border-border bg-muted/30 px-3 py-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الـ SKU أو الباركود... (F1)"
                className="h-9 w-full rounded-md border border-input bg-background pr-9 pl-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-9 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Category filters */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-border bg-muted/20 px-3 py-1.5 scrollbar-hide">
            <button
              onClick={() => { setActiveCategoryId(null); }}
              className={cn(
                "shrink-0 rounded-full px-3 py-0.5 text-xs font-medium transition-colors",
                !activeCategoryId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              الكل
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id === activeCategoryId ? null : cat.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-0.5 text-xs font-medium transition-colors",
                  activeCategoryId === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <ProductGrid
            products={products}
            loading={loading}
            onAdd={(item) => dispatch({ type: "ADD_ITEM", item })}
            cartItems={cart.items}
          />
        </div>

        {/* Right: Cart */}
        <div className="flex w-[38%] flex-col overflow-hidden">
          <CartPanel
            cart={cart}
            dispatch={dispatch}
            store={store}
            cashier={cashier}
            activeShift={activeShift}
            onShiftComplete={(shift) => setActiveShift(shift)}
            onHoldComplete={() => {
              setHeldCount((c) => c + 1);
              dispatch({ type: "CLEAR" });
            }}
          />
        </div>
      </div>

      {/* Modals */}
      <ShiftModal
        open={showShiftModal}
        onOpenChange={setShowShiftModal}
        activeShift={activeShift}
        cashierName={cashier.name ?? cashier.email}
        onShiftOpened={(shift) => {
          setActiveShift(shift);
          setShowShiftModal(false);
        }}
        onShiftClosed={() => {
          setActiveShift(null);
          setShowShiftModal(false);
        }}
      />

      <HeldOrdersDialog
        open={showHeldOrders}
        onOpenChange={setShowHeldOrders}
        onResume={handleLoadHeld}
        onCountChange={setHeldCount}
      />
    </div>
  );
}
