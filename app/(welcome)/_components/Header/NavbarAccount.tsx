"use client";

import { useEffect, useState } from "react";
import { GetNavbarUserAction } from "@/actions/auth/auth-helpers.actions";
import MobileNavMenu from "./MobileNavMenu";
import NavbarDesktopActions from "./NavbarDesktopActions";

type NavUser = Awaited<ReturnType<typeof GetNavbarUserAction>>;

/**
 * Desktop + mobile account actions. The signed-in user is loaded after the
 * page renders (signed-out buttons show until then), so the marketing pages
 * themselves never touch the session and stay cacheable.
 */
export default function NavbarAccount() {
  const [user, setUser] = useState<NavUser>(null);

  useEffect(() => {
    let alive = true;
    GetNavbarUserAction()
      .then((next) => alive && setUser(next))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      {/* Desktop actions */}
      <div className="hidden justify-self-end lg:block">
        <NavbarDesktopActions user={user} />
      </div>

      {/* Mobile */}
      <div className="justify-self-end lg:hidden">
        <MobileNavMenu user={user} />
      </div>
    </>
  );
}
