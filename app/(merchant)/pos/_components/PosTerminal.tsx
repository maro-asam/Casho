"use client";

import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import {
  ChevronRight,
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
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import CartPanel, { calcTotals } from "./CartPanel";
import HeldOrdersDialog from "./HeldOrdersDialog";
import ProductGrid from "./ProductGrid";
import ShiftModal from "./ShiftModal";
import { BranchSwitcher } from "@/components/branch/BranchSwitcher";
import { StoreSwitcher } from "@/components/branch/StoreSwitcher";
import { egp } from "./pos-format";
import { isRtl, tr } from "@/lib/i18n/dashboard";

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
  /** The branch this POS sells from (stock, held orders and the shift belong to it). */
  branch: { id: string; name: string };
  branches: { id: string; name: string }[];
  /** A shift is open: the branch can't change until it is closed. */
  branchLocked: boolean;
  /** Stores this user can work in (own + memberships). */
  stores: { id: string; name: string; isOwner: boolean }[];
};

export default function PosTerminal({
  store,
  cashier,
  activeShift: initialShift,
  categories,
  initialHeldCount,
  branch,
  branches,
  branchLocked,
  stores,
}: Props) {
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
        toast.error(tr("\"{0}\" نفد من المخزون", item.name));
        return;
      }
      const current = cart.items.find((i) => i.productId === item.productId)?.quantity ?? 0;
      if (current >= item.stock) {
        toast.warning(tr("كل الكمية المتاحة من \"{0}\" في الفاتورة ({1})", item.name, item.stock));
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
        else toast.error(tr("مفيش منتج بالكود {0}", code));
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

  const iconButton =
    "apple-press grid size-9 shrink-0 place-items-center rounded-full text-foreground/80 hover:bg-(--fill-3) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        {/* ── Floating glass toolbar ── */}
        <header className="shrink-0 px-3 pt-3">
          <div className="apple-glass flex h-14 items-center gap-2 rounded-full ps-2 pe-2 sm:gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/" aria-label={tr("رجوع للوحة التحكم")} className={iconButton}>
                  <ChevronRight className="size-5 ltr:-scale-x-100" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>{tr("لوحة التحكم")}</TooltipContent>
            </Tooltip>

            <div className="min-w-0">
              <p className="truncate text-[15px] leading-tight font-semibold">{store.name}</p>
              <p className="truncate text-[12px] text-muted-foreground">
                {tr("نقطة البيع · {0}{1}", branches.length > 1 ? `${branch.name} · ` : "", cashier.name ?? cashier.email)}
              </p>
            </div>

            <StoreSwitcher stores={stores} value={store.id} className="hidden rounded-full border-0 bg-(--fill-3) md:flex" />
            <BranchSwitcher
              surface="pos"
              branches={branches}
              value={branch.id}
              lockedReason={branchLocked || activeShift ? tr("الفرع مربوط بالوردية المفتوحة — اقفلها عشان تغيّر الفرع") : undefined}
              className="hidden rounded-full border-0 bg-(--fill-3) sm:flex"
            />

            {/* Shift capsule: the cashier's state at a glance. */}
            <button
              type="button"
              onClick={() => setShowShiftModal(true)}
              className={cn(
                "apple-press ms-1 hidden h-9 items-center gap-2 rounded-full px-3.5 text-[13px] md:flex",
                activeShift ? "bg-(--sys-green)/12" : "bg-(--sys-orange)/14",
              )}
            >
              <span className={cn("size-2 rounded-full", activeShift ? "bg-(--sys-green)" : "bg-(--sys-orange)")} />
              {activeShift ? (
                <>
                  <span className="font-semibold">{tr("الوردية مفتوحة")}</span>
                  <span className="text-foreground/60 tabular-nums">
                    {tr("{0} فاتورة · {1}", activeShift.transactionCount, egp(activeShift.totalSales))}
                  </span>
                </>
              ) : (
                <span className="font-semibold">{tr("مفيش وردية مفتوحة — افتح وردية")}</span>
              )}
            </button>

            <div className="ms-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowHeldOrders(true)}
                className="apple-press inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[15px] hover:bg-(--fill-3)"
              >
                <Pause className="size-4" />
                <span className="hidden sm:inline">{tr("معلّق")}</span>
                {heldCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-(--sys-orange) px-1.5 text-[11px] font-bold text-white tabular-nums">
                    {heldCount}
                  </span>
                )}
              </button>
              <Link href="/pos/returns" className="apple-press hidden h-9 items-center gap-1.5 rounded-full px-3 text-[15px] hover:bg-(--fill-3) sm:inline-flex">
                <RotateCcw className="size-4" />
                {tr("مرتجعات")}
              </Link>
              <Link href="/pos/shifts" className="apple-press hidden h-9 items-center gap-1.5 rounded-full px-3 text-[15px] hover:bg-(--fill-3) sm:inline-flex">
                <ClipboardList className="size-4" />
                {tr("الورديات")}
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className={cn(iconButton, "hidden lg:grid")} aria-label={tr("اختصارات الكيبورد")}>
                    <Keyboard className="size-[18px]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-start leading-6">
                  {tr("F1 بحث · F2 المعلّق · F9 الدفع")}
                  <br />
                  {tr("امسح الباركود في أي وقت")}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className={iconButton} onClick={toggleFullscreen} aria-label={tr("ملء الشاشة")}>
                    {isFullscreen ? <Minimize className="size-[18px]" /> : <Maximize className="size-[18px]" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{isFullscreen ? tr("خروج من ملء الشاشة") : tr("ملء الشاشة")}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex min-h-0 flex-1 gap-3 p-3">
          {/* Products */}
          <section aria-label={tr("المنتجات")} className="flex min-w-0 flex-1 flex-col">
            <div className="space-y-3 px-1 pt-1 pb-3">
              <div className="relative">
                <Search className="pointer-events-none absolute inset-s-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
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
                  placeholder={tr("ابحث باسم المنتج أو امسح الباركود")}
                  aria-label={tr("بحث عن منتج")}
                  className="h-12 w-full rounded-[14px] bg-card ps-12 pe-24 text-[17px] shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
                />
                <div className="absolute inset-e-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                  {search ? (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label={tr("مسح البحث")}
                      className="grid size-5 place-items-center rounded-full bg-(--sys-gray)/60 text-white hover:bg-(--sys-gray)"
                    >
                      <X className="size-3" strokeWidth={3} />
                    </button>
                  ) : (
                    <kbd className="rounded-md bg-(--fill-3) px-1.5 py-0.5 font-sans text-[11px] text-muted-foreground">F1</kbd>
                  )}
                  <ScanBarcode className="size-5 text-muted-foreground" aria-hidden />
                </div>
              </div>

              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-hide" role="tablist" aria-label={tr("التصنيفات")}>
                {[{ id: null as string | null, name: tr("الكل") }, ...categories].map((cat) => {
                  const active = activeCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id ?? "all"}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={cn(
                        "apple-press h-9 shrink-0 rounded-full px-4 text-[15px] transition-colors",
                        active ? "bg-foreground font-semibold text-background" : "bg-card text-foreground/80 hover:text-foreground",
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
              <div className="shrink-0 pt-3">
                <button
                  type="button"
                  onClick={() => setCartSheetOpen(true)}
                  className="apple-press flex h-14 w-full items-center justify-between rounded-[16px] bg-primary px-5 text-[17px] font-semibold text-primary-foreground"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="size-5" />
                    {tr("الفاتورة")}
                    {itemCount > 0 && <span className="rounded-full bg-primary-foreground/20 px-2 text-[13px] tabular-nums">{itemCount}</span>}
                  </span>
                  <span className="tabular-nums">{egp(total)}</span>
                </button>
              </div>
            )}
          </section>

          {isDesktop && (
            <aside aria-label={tr("الفاتورة")} className="apple-card flex w-100 shrink-0 flex-col overflow-hidden xl:w-110">
              {cartPanel}
            </aside>
          )}
        </div>

        {!isDesktop && (
          <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
            <SheetContent side={isRtl() ? "left" : "right"} className="apple-ui apple-form w-full bg-card p-0 text-foreground sm:max-w-md [&>button]:hidden">
              <SheetTitle className="sr-only">{tr("الفاتورة")}</SheetTitle>
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
