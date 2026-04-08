import type { StoreFrontHeaderProps } from "./store-header.types";
import StoreFrontHeaderDefault from "./StoreFrontHeaderDefault";
import StoreFrontHeaderCentered from "./StoreFrontHeaderCentered";
import StoreFrontHeaderCompact from "./StoreFrontHeaderCompact";
import { StoreNavbarVariant } from "@/constants/store-navbar";

type Props = StoreFrontHeaderProps & {
  variant?: StoreNavbarVariant | null;
};

export default function StoreFrontHeader({
  variant = "default",
  ...props
}: Props) {
  switch (variant) {
    case "centered":
      return <StoreFrontHeaderCentered {...props} />;

    case "compact":
      return <StoreFrontHeaderCompact {...props} />;

    case "default":
    default:
      return <StoreFrontHeaderDefault {...props} />;
  }
}
