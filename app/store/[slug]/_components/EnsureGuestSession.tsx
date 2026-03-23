"use client";

import { useEffect } from "react";

export default function EnsureGuestSession() {
  useEffect(() => {
    fetch("/api/guest-session", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }).catch(() => {});
  }, []);

  return null;
}