import { getStoreTheme } from "@/constants/store-themes";

import type { StoreThemeData } from "./types";
import BoutiqueHome from "./boutique/BoutiqueHome";
import BoldHome from "./bold/BoldHome";
import ClassicHome from "./classic/ClassicHome";
import MagazineHome from "./magazine/MagazineHome";

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
    case "boutique":
      return <BoutiqueHome store={store} />;

    case "bold":
      return <BoldHome store={store} />;

    case "magazine":
      return <MagazineHome store={store} />;

    case "classic":
    default:
      return <ClassicHome store={store} />;
  }
}
