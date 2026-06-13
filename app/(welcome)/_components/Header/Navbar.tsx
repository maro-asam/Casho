import Link from "next/link";
import Image from "next/image";

import { getCurrentUser } from "@/actions/auth/auth-helpers.actions";
import MobileNavMenu from "./MobileNavMenu";
import AnimatedNavbarShell from "./AnimatedNavbarShell";
import NavbarDesktopLinks from "./NavbarDesktopLinks";
import NavbarDesktopActions from "./NavbarDesktopActions";

const Navbar = async () => {
  const user = await getCurrentUser();
  const store = user?.stores?.[0];

  return (
    <header className="sticky top-4 z-50 mx-auto px-4">
      <AnimatedNavbarShell>
        <div className="flex w-full items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex size-10 items-center justify-center">
              <Image src="/trans-logo.svg" width={100} height={100} alt="Casho" className="dark:invert" />
            </div>
            {/* <span className="bg-linear-to-l from-primary via-sky-500 to-primary bg-clip-text text-transparent font-black text-2xl">CASHO</span> */}
          </Link>

          {/* Desktop nav */}
          <NavbarDesktopLinks />

          {/* Desktop actions (client — language-aware) */}
          <NavbarDesktopActions
            user={
              user
                ? {
                    email: user.email,
                    storeName: store?.name ?? null,
                    storeSlug: store?.slug ?? null,
                  }
                : null
            }
          />

          {/* Mobile */}
          <div className="md:hidden">
            <MobileNavMenu
              user={
                user
                  ? {
                      email: user.email,
                      storeName: store?.name ?? null,
                      storeSlug: store?.slug ?? null,
                    }
                  : null
              }
            />
          </div>
        </div>
      </AnimatedNavbarShell>
    </header>
  );
};

export default Navbar;
