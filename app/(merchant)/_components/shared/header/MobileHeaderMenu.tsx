"use client";

import Link from "next/link";
import { useState } from "react";
import { LogIn, Menu, Store, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoutAction } from "@/actions/auth/logout.actions";

type HeaderUser = {
  id: string;
  email: string;
  stores: {
    id: string;
    name: string;
    slug: string;
  }[];
} | null;

type Props = {
  user: HeaderUser;
  links: { name: string; href: string }[];
};

const MobileHeaderMenu = ({ user, links }: Props) => {
  const [open, setOpen] = useState(false);

  const storeName = user?.stores?.[0]?.name;
  const storeSlug = user?.stores?.[0]?.slug;

  return (
    <div className="md:hidden">
      <button onClick={() => setOpen(!open)} aria-label="Open Menu">
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {open && (
        <div className="absolute left-0 top-full w-full border-t bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            {!user ? (
              <>
                <Button className="mt-4 w-full" asChild>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    ابدأ متجرك دلوقتي
                  </Link>
                </Button>

                <Button className="w-full" variant="outline" asChild>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    تسجيل الدخول
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <div className="mt-4 rounded-md border p-3">
                  <p className="font-semibold">{storeName || "الحساب"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>

                <Button className="w-full" asChild>
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    لوحة التحكم
                  </Link>
                </Button>

                {storeSlug && (
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={`/store/${storeSlug}`} onClick={() => setOpen(false)}>
                      عرض المتجر
                    </Link>
                  </Button>
                )}

                <form
                  action={async () => {
                    setOpen(false);
                    await LogoutAction();
                  }}
                >
                  <Button type="submit" variant="destructive" className="w-full">
                    تسجيل الخروج
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileHeaderMenu;