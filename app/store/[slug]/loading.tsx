import ThemeState from "./_themes/ThemeState";

// Renders inside the store layout, so the active theme's skeleton is used.
export default function StoreLoading() {
  return <ThemeState kind="home" />;
}
