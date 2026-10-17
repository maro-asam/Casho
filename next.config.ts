import type { NextConfig } from "next";

// Baseline hardening for every response. Framing is limited to our own origin
// (the builder previews the storefront in a same-origin iframe), which stops
// clickjacking of the dashboard and checkout. A full script CSP is left out on
// purpose: themes, fonts and payment pages need an audit before it can't break them.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "microphone=(), browsing-topics=()" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    qualities: [25, 75],

    unoptimized: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
