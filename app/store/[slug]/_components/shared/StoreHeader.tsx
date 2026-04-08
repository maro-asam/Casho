import type { StoreNavbarVariant } from "@/constants/store-navbar";
import type { StoreFrontHeaderProps } from "./store-header.types";
import StoreFrontHeaderDefault from "./StoreFrontHeaderDefault";
import StoreFrontHeaderCentered from "./StoreFrontHeaderCentered";
import StoreFrontHeaderCompact from "./StoreFrontHeaderCompact";

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
