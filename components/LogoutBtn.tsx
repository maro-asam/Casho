"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoutAction } from "@/actions/auth/logout.actions";
import { cn } from "@/lib/utils";

export function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <form action={LogoutAction} className={cn("w-full", collapsed && "w-auto")}>
      <Button
        type="submit"
        variant="destructive"
        className={cn(
          "h-11 w-full text-destructive hover:text-destructive",
          collapsed ? "justify-center px-0" : "justify-start gap-3 px-3",
        )}
        title={collapsed ? "تسجيل الخروج" : undefined}
      >
        <LogOut className="h-5 w-5 shrink-0" />
        {!collapsed && <span>تسجيل الخروج</span>}
      </Button>
    </form>
  );
}
