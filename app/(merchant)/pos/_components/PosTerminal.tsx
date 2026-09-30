"use client";

import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Keyboard,
  Maximize,
  Minimize,
  Pause,
  RotateCcw,
  ScanBarcode,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { FindProductByBarcodeAction, SearchPosProductsAction } from "@/actions/pos/pos.actions";
import type { HeldCartData } from "@/actions/pos/pos.actions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import CartPanel, { calcTotals } from "./CartPanel";
import HeldOrdersDialog from "./HeldOrdersDialog";
import ProductGrid from "./ProductGrid";
import ShiftModal from "./ShiftModal";
import { egp } from "./pos-format";

// ─── Cart state ───────────────────────────────────────────────

export type CartItem = {
  productId: string;
  name: string;
  image: string;
  price: number; // piasters
  costPrice: number; // piasters
  quantity: number;
  discountAmount: number; // piasters
  stock: number;
  lowStockThreshold?: number | null;
  sku?: string;
};

export type InvoiceDiscount = { type: "percentage" | "fixed"; value: number } | null;

export type CartState = {
  items: CartItem[];
  invoiceDiscount: InvoiceDiscount;
  customer: { id?: string; name: string; phone: string } | null;
  note: string;
};

export type CartAction =
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

const clampQty = (qty: number, stock: number) => Math.max(1, Math.min(qty, stock));

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      if (action.item.stock <= 0) return state;
      const existing = state.items.find((i) => i.productId === action.item.productId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.item.productId ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) } : i,
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: 1 }] };
    }
    case "INCREMENT":
      return {
        ...state,
        items: state.items.map((i) => (i.productId === action.productId ? { ...i, quantity: Math.min(i.quantity + 1, i.stock) } : i)),
      };
    case "DECREMENT":
      return {
        ...state,
        items: state.items
          .map((i) => (i.productId === action.productId ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0),
      };
    case "REMOVE":
      return { ...state, items: state.items.filter((i) => i.productId !== action.productId) };
    case "SET_QUANTITY":
      return {
        ...state,
        items: state.items.map((i) => (i.productId === action.productId ? { ...i, quantity: clampQty(action.qty, i.stock) } : i)),
      };
    case "SET_ITEM_DISCOUNT":
      return {
        ...state,
        items: state.items.map((i) => (i.productId === action.productId ? { ...i, discountAmount: Math.max(0, action.amount) } : i)),
      };
    case "SET_INVOICE_DISCOUNT":
      return { ...state, invoiceDiscount: action.discount };
    case "SET_CUSTOMER":
      return { ...state, customer: action.customer };
    case "SET_NOTE":
      return { ...state, note: action.note };
    case "CLEAR":
      return initialCart;
    case "LOAD":
      return action.state;
    default:
      return state;
  }
}

const initialCart: CartState = { items: [], invoiceDiscount: null, customer: null, note: "" };

type SearchResult = Awaited<ReturnType<typeof SearchPosProductsAction>>[number];
type BarcodeResult = NonNullable<Awaited<ReturnType<typeof FindProductByBarcodeAction>>>;

/** Product prices are stored in pounds; the POS works in piasters. */
function toCartItem(p: SearchResult | BarcodeResult): CartItem {
  return {
    productId: p.id,
    name: p.name,
    image: p.image,
    price: Math.round(p.price * 100),
    costPrice: Math.round((p.costPrice ?? 0) * 100),
    quantity: 1,
    discountAmount: 0,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    sku: p.sku ?? undefined,
  };
}

// The cart sits beside the products from lg up; below that it slides in.
const desktopQuery = "(min-width: 1024px)";
function useIsDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(desktopQuery);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(desktopQuery).matches,
    () => true,
  );
}

function useFullscreen() {
  const isFullscreen = useSyncExternalStore(
    (cb) => {
      document.addEventListener("fullscreenchange", cb);
      return () => document.removeEventListener("fullscreenchange", cb);
    },
    () => Boolean(document.fullscreenElement),
    () => false,
  );
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => undefined);
  };
  return { isFullscreen, toggle };
}

// ─── Component ────────────────────────────────────────────────

type Shift = { id: string; openingBalance: number; totalSales: number; transactionCount: number; openedAt: string };

type Props = {
  store: { id: string; name: string; slug: string; settings: { logo: string | null; primaryColor: string | null; whatsappNumber: string | null } | null };
  cashier: { id: string; name: string | null; email: string };
  activeShift: Shift | null;
  categories: { id: string; name: string; _count: { products: number } }[];
  initialHeldCount: number;
};

export default function PosTerminal({ store, cashier, activeShift: initialShift, categories, initialHeldCount }: Props) {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);
  const [activeShift, setActiveShift] = useState(initialShift);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<CartItem[]>([]);
  const [loading, startSearch] = useTransition();
  const [showShiftModal, setShowShiftModal] = useState(!initialShift);
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [heldCount, setHeldCount] = useState(initialHeldCount);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const searchRef = useRef<HTMLInputElement>(null);
  const barcodeBuffer = useRef("");
  const barcodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { total, itemCount } = calcTotals(cart);

  /** Adds one piece, telling the cashier why when it can't. */
  const addToCart = useCallback(
    (item: CartItem) => {
      if (item.stock <= 0) {
        toast.error(`"${item.name}" نفد من المخزون`);
        return;
      }
      const current = cart.items.find((i) => i.productId === item.productId)?.quantity ?? 0;
      if (current >= item.stock) {
        toast.warning(`كل الكمية المتاحة من "${item.name}" في الفاتورة (${item.stock})`);
        return;
      }
      dispatch({ type: "ADD_ITEM", item });
    },
    [cart.items],
  );

  const addByCode = useCallback(
    (code: string) => {
      startSearch(async () => {
        const product = await FindProductByBarcodeAction(code);
        if (product) addToCart(toCartItem(product));
        else toast.error(`مفيش منتج بالكود ${code}`);
      });
    },
    [addToCart],
  );

  const loadProducts = useCallback((q: string, catId: string | null) => {
    startSearch(async () => {
      const results = await SearchPosProductsAction(q, catId ?? undefined);
      setProducts(results.map(toCartItem));
    });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => loadProducts(search, activeCategoryId), search ? 200 : 0);
    return () => clearTimeout(timeout);
  }, [search, activeCategoryId, loadProducts]);

  // Keyboard: F1 search · F2 held · F9 pay · USB barcode scanners (fast keys + Enter).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        setShowHeldOrders(true);
        return;
      }
      if (e.key === "F9") {
        e.preventDefault();
        if (activeShift && cart.items.length > 0) setPaymentOpen(true);
        return;
      }

      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (document.querySelector("[role=dialog]")) return;

      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
        barcodeTimer.current = setTimeout(() => (barcodeBuffer.current = ""), 100);
      }
      if (e.key === "Enter" && barcodeBuffer.current.length >= 3) {
        e.preventDefault();
        const code = barcodeBuffer.current;
        barcodeBuffer.current = "";
        addByCode(code);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeShift, cart.items.length, addByCode]);

  // Enter in the search box: a scanned code or the only match goes straight into the cart.
  function onSearchEnter() {
    const q = search.trim();
    if (!q) return;
    if (products.length === 1) {
      addToCart(products[0]);
      setSearch("");
      return;
    }
    const exact = products.find((p) => p.sku === q);
    if (exact) {
      addToCart(exact);
      setSearch("");
      return;
    }
    addByCode(q);
    setSearch("");
  }

  const handleLoadHeld = (data: HeldCartData) => {
    dispatch({
      type: "LOAD",
      state: { items: data.items, invoiceDiscount: data.invoiceDiscount, customer: data.customer, note: data.note },
    });
    setShowHeldOrders(false);
  };

  const cartPanel = (
    <CartPanel
      cart={cart}
      dispatch={dispatch}
      store={store}
      cashier={cashier}
      activeShift={activeShift}
      onShiftComplete={setActiveShift}
      onHoldComplete={() => {
        setHeldCount((c) => c + 1);
        dispatch({ type: "CLEAR" });
      }}
      onOpenShift={() => setShowShiftModal(true)}
      paymentOpen={paymentOpen}
      onPaymentOpenChange={setPaymentOpen}
    />
  );

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        {/* ── Top bar ── */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-3 sm:px-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="size-9">
                <Link href="/" aria-label="رجوع للوحة التحكم">
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>لوحة التحكم</TooltipContent>
          </Tooltip>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{store.name}</p>
            <p className="text-xs text-muted-foreground">نقطة البيع · {cashier.name ?? cashier.email}</p>
          </div>

          <button
            type="button"
            onClick={() => setShowShiftModal(true)}
            className={cn(
              "ms-2 hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors hover:bg-muted md:flex",
              activeShift ? "border-border" : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
            )}
          >
            <span className={cn("size-2 rounded-full", activeShift ? "bg-emerald-500" : "bg-amber-500")} />
            {activeShift ? (
              <>
                <span className="font-medium">الوردية مفتوحة</span>
                <span className="text-muted-foreground tabular-nums">
                  {activeShift.transactionCount} فاتورة · {egp(activeShift.totalSales)}
                </span>
              </>
            ) : (
              <span className="font-medium">مفيش وردية مفتوحة — افتح وردية</span>
            )}
          </button>

          <div className="ms-auto flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-9 gap-1.5" onClick={() => setShowHeldOrders(true)}>
              <Pause className="size-4" />
              <span className="hidden sm:inline">معلّق</span>
              {heldCount > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {heldCount}
                </span>
              )}
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden h-9 gap-1.5 sm:inline-flex">
              <Link href="/pos/returns">
                <RotateCcw className="size-4" />
                مرتجعات
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden h-9 gap-1.5 sm:inline-flex">
              <Link href="/pos/shifts">
                <ClipboardList className="size-4" />
                الورديات
              </Link>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden size-9 lg:inline-flex" aria-label="اختصارات الكيبورد">
                  <Keyboard className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-start leading-6">
                F1 بحث · F2 المعلّق · F9 الدفع
                <br />
                امسح الباركود في أي وقت
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9" onClick={toggleFullscreen} aria-label="ملء الشاشة">
                  {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? "خروج من ملء الشاشة" : "ملء الشاشة"}</TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex min-h-0 flex-1">
          {/* Products */}
          <section aria-label="المنتجات" className="flex min-w-0 flex-1 flex-col">
            <div className="space-y-3 border-b border-border p-4 pb-3">
              <div className="relative">
                <Search className="pointer-events-none absolute inset-s-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onSearchEnter();
                    }
                    if (e.key === "Escape") setSearch("");
                  }}
                  placeholder="ابحث باسم المنتج أو امسح الباركود"
                  aria-label="بحث عن منتج"
                  className="h-11 w-full rounded-xl border border-input bg-background ps-11 pe-20 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
                />
                <div className="absolute inset-e-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="مسح البحث"
                      className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  ) : (
                    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[11px] text-muted-foreground">F1</kbd>
                  )}
                  <ScanBarcode className="size-5 text-muted-foreground" aria-hidden />
                </div>
              </div>

              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-hide" role="tablist" aria-label="التصنيفات">
                {[{ id: null as string | null, name: "الكل" }, ...categories].map((cat) => {
                  const active = activeCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id ?? "all"}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={cn(
                        "h-8 shrink-0 rounded-lg px-3 text-sm transition-colors",
                        active ? "bg-foreground font-medium text-background" : "bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <ProductGrid products={products} loading={loading} onAdd={addToCart} cartItems={cart.items} query={search.trim()} />

            {/* Compact screens: the invoice lives in a sheet */}
            {!isDesktop && (
              <div className="shrink-0 border-t border-border bg-card p-3">
                <Button size="lg" className="h-12 w-full justify-between px-4" onClick={() => setCartSheetOpen(true)}>
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="size-5" />
                    الفاتورة
                    {itemCount > 0 && (
                      <span className="rounded-full bg-primary-foreground/20 px-2 text-xs tabular-nums">{itemCount}</span>
                    )}
                  </span>
                  <span className="tabular-nums">{egp(total)}</span>
                </Button>
              </div>
            )}
          </section>

          {isDesktop && (
            <aside aria-label="الفاتورة" className="flex w-100 shrink-0 flex-col border-s border-border xl:w-110">
              {cartPanel}
            </aside>
          )}
        </div>

        {!isDesktop && (
          <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
            <SheetContent side="left" className="w-full p-0 sm:max-w-md [&>button]:hidden">
              <SheetTitle className="sr-only">الفاتورة</SheetTitle>
              {cartPanel}
            </SheetContent>
          </Sheet>
        )}

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

        <HeldOrdersDialog open={showHeldOrders} onOpenChange={setShowHeldOrders} onResume={handleLoadHeld} onCountChange={setHeldCount} />
      </div>
    </TooltipProvider>
  );
}
