import { HomeSkeleton } from "./_themes/classic/states";

// Loading/not-found boundaries render before the store is known, so they use
// the default (Classic) theme's states.
export default function StoreLoading() {
  return <HomeSkeleton />;
}
