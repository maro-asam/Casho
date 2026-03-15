"use client";

import { LogoutAction } from "@/actions/auth/logout.actions";
import { Button } from "./ui/button";

export function LogoutButton() {
  return (
    <form action={LogoutAction}>
      <Button type="submit" variant="destructive" className="w-full">تسجيل الخروج</Button>
    </form>
  );
}
