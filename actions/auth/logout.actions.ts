"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function LogoutAction() {
  const cookieStore = await cookies();

  cookieStore.delete({
    name: "sessionToken",
    path: "/",
    // domain: ".example.com",    // ← add if you used a domain when setting (e.g. for subdomains)
    // secure: process.env.NODE_ENV === "production",
    // httpOnly: true,
    // sameSite: "lax",
  });

  redirect("/");
}
