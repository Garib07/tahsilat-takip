import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieOptions,
  isAuthEnabled,
  SESSION_COOKIE,
  verifyCredentials
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Kimlik doğrulama kapalı." }, { status: 503 });
  }

  const body = (await request.json()) as { username?: string; password?: string };
  const username = String(body.username ?? "");
  const password = String(body.password ?? "");

  if (!verifyCredentials(username, password)) {
    return NextResponse.json({ error: "Kullanıcı adı veya şifre hatalı." }, { status: 401 });
  }

  const token = await createSessionToken(username);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
  return response;
}
