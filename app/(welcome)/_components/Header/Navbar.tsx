import { getCurrentUser } from "@/actions/auth/auth-helpers.actions";
import MobileNavMenu from "./MobileNavMenu";
import AnimatedNavbarShell from "./AnimatedNavbarShell";
import NavbarBrand from "./NavbarBrand";
import NavbarDesktopLinks from "./NavbarDesktopLinks";
import NavbarDesktopActions from "./NavbarDesktopActions";

const Navbar = async () => {
  const user = await getCurrentUser();
  const store = user?.stores?.[0];

  const navUser = user
    ? {
        email: user.email,
        storeName: store?.name ?? null,
        storeSlug: store?.slug ?? null,
      }
    : null;

  return (
    <header className="sticky top-2 z-50 mx-auto sm:top-3 md:top-4">
      <AnimatedNavbarShell>
        <div className="flex w-full items-center justify-between gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
          <NavbarBrand className="justify-self-start" />

          {/* Desktop nav — centered */}
          <NavbarDesktopLinks />

          {/* Desktop actions */}
          <div className="hidden justify-self-end lg:block">
            <NavbarDesktopActions user={navUser} />
          </div>

          {/* Mobile */}
          <div className="justify-self-end lg:hidden">
            <MobileNavMenu user={navUser} />
          </div>
        </div>
      </AnimatedNavbarShell>
    </header>
  );
};

export default Navbar;
