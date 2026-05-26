import type { StoreNavbarVariant } from "@/constants/store-navbar";
import type { StoreFrontHeaderProps } from "../shared/store-header.types";
import StoreFrontHeaderDefault from "./StoreFrontHeaderDefault";
import StoreFrontHeaderCentered from "./StoreFrontHeaderCentered";
import StoreFrontHeaderCompact from "./StoreFrontHeaderCompact";
import StoreFrontHeaderAllaia from "./StoreFrontHeaderAllaia";

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

    case "allaia":
      return <StoreFrontHeaderAllaia {...props} />;

    case "default":
    default:
      return <StoreFrontHeaderDefault {...props} />;
  }
}
