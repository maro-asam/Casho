import AnimatedNavbarShell from "./AnimatedNavbarShell";
import NavbarBrand from "./NavbarBrand";
import NavbarDesktopLinks from "./NavbarDesktopLinks";
import NavbarAccount from "./NavbarAccount";

// No session read here: it would make every marketing page render per
// request. NavbarAccount loads the signed-in user from the browser.
const Navbar = () => {
  return (
    <header className="al fixed inset-x-0 top-0 z-50 px-3 pt-2.5 sm:pt-3">
      <div aria-hidden className="al-scroll-edge -z-10" />
      <AnimatedNavbarShell>
        <div className="flex w-full items-center justify-between gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-4">
          <NavbarBrand className="justify-self-start" />

          {/* Desktop nav — centered */}
          <NavbarDesktopLinks />

          <NavbarAccount />
        </div>
      </AnimatedNavbarShell>
    </header>
  );
};

export default Navbar;
