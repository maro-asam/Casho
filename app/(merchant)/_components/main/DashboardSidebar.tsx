"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Shapes,
  ImageIcon,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/app/(auth)/_components/LogoutBtn";

interface Props {
  store: {
    name: string;
    slug: string;
  };
}

export default function DashboardSidebar({ store }: Props) {
  const pathname = usePathname();

  const links = [
    {
      name: "لوحة التحكم",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "الطلبات",
      href: "/dashboard/orders",
      icon: ShoppingCart,
    },
    {
      name: "المنتجات",
      href: "/dashboard/products",
      icon: Package,
    },
    {
      name: "التصنيفات",
      href: "/dashboard/categories",
      icon: Shapes,
    },
    {
      name: "البانر",
      href: "/dashboard/banners",
      icon: ImageIcon,
    },
  ];

  return (
    <aside className="w-64 h-full bg-secondary text-secondary-foreground p-4 border-l-2 flex flex-col">
      <h2 className="py-3 text-3xl text-primary font-bold text-center">
        <Link href="/dashboard">{store.name}</Link>
      </h2>

      <hr className="my-3" />

      <div className="flex flex-col gap-3">
        {links.map((link) => {
          const isActive =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(link.href);

          const Icon = link.icon;

          return (
            <Button
              key={link.href}
              asChild
              variant={isActive ? "default" : "outline"}
              className="w-full justify-start gap-2"
            >
              <Link href={link.href}>
                <Icon className="h-4 w-4" />
                {link.name}
              </Link>
            </Button>
          );
        })}
      </div>

      <div className="mt-auto pt-6 flex flex-col gap-2">
        <Button
          asChild
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Link href={`/dashboard/settings`}>
            <Settings className="h-4 w-4" />
            اعدادات المتجر
          </Link>
        </Button>

        <LogoutButton />
      </div>
    </aside>
  );
}
