import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/auth/google";

export async function GET() {
  return NextResponse.redirect(getGoogleAuthUrl());
}
