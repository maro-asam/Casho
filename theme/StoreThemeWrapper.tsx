type StoreThemeWrapperProps = {
  children: React.ReactNode;
  primaryColor?: string | null;
  secondaryColor?: string | null;
};

export default function StoreThemeWrapper({
  children,
  primaryColor,
  secondaryColor,
}: StoreThemeWrapperProps) {
  const style = {
    "--primary": primaryColor || "#2563eb",
    "--secondary": secondaryColor || "oklch(0.9276 0.0058 264.5313)",
  } as React.CSSProperties;

  return <div style={style}>{children}</div>;
}
