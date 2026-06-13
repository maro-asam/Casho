"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { StoreNavbarVariant } from "@/constants/store-navbar";
import type { StoreFrontHeaderProps } from "../shared/store-header.types";
import StoreFrontHeaderDefault from "./StoreFrontHeaderDefault";
import StoreFrontHeaderCentered from "./StoreFrontHeaderCentered";
import StoreFrontHeaderCompact from "./StoreFrontHeaderCompact";
import StoreFrontHeaderAllaia from "./StoreFrontHeaderAllaia";
import { GetCartItemsAction } from "@/actions/store/cart.actions";

type Props = StoreFrontHeaderProps & {
  variant?: StoreNavbarVariant | null;
};

export default function StoreFrontHeader({
  variant = "default",
  storeSlug,
  ...props
}: Props) {
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    GetCartItemsAction(storeSlug)
      .then(({ items }) => {
        setCartCount(items.reduce((total, item) => total + item.quantity, 0));
      })
      .catch(() => {});
  }, [pathname, storeSlug]);

  const headerProps = { ...props, storeSlug, cartCount };

  switch (variant) {
    case "centered":
      return <StoreFrontHeaderCentered {...headerProps} />;

    case "compact":
      return <StoreFrontHeaderCompact {...headerProps} />;

    case "allaia":
      return <StoreFrontHeaderAllaia {...headerProps} />;

    case "default":
    default:
      return <StoreFrontHeaderDefault {...headerProps} />;
  }
}
