import { getStoreTheme } from "@/constants/store-themes";

import type { StoreThemeData } from "./types";
import ClassicHome from "./classic/ClassicHome";
import ModernHome from "./modern/ModernHome";
import ExclusiveHome from "./exclusive/ExclusiveHome";
import AllaiaHome from "./allaia/AllaiaHome";

type StoreThemeRendererProps = {
  themeId?: string | null;
  store: StoreThemeData;
};

export default function StoreThemeRenderer({
  themeId,
  store,
}: StoreThemeRendererProps) {
  const theme = getStoreTheme(themeId);

  switch (theme.id) {
    case "modern":
      return <ModernHome store={store} />;

    case "exclusive":
      return <ExclusiveHome store={store} />;

    case "allaia":
      return <AllaiaHome store={store} />;

    case "classic":
    default:
      return <ClassicHome store={store} />;
  }
}
