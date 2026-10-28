import { appleButton } from "@/components/saas-page";
import { tr } from "@/lib/i18n/dashboard";

/** Starts Meta's OAuth flow — a full navigation, not a client route. */
export function ConnectButton() {
  return (
    <a href="/api/instagram/oauth/initiate" className={appleButton.filled}>
      {tr("ربط حساب انستجرام")}
    </a>
  );
}
