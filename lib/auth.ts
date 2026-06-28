import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tahsilat_session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export function isAuthEnabled() {
  return Boolean(
    process.env.AUTH_SECRET &&
      process.env.AUTH_USERNAME &&
      process.env.AUTH_PASSWORD
  );
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET tanımlı değil.");
  }
  return new TextEncoder().encode(secret);
}

export function verifyCredentials(username: string, password: string) {
  if (!isAuthEnabled()) {
    return false;
  }

  return (
    username.trim() === process.env.AUTH_USERNAME &&
    password === process.env.AUTH_PASSWORD
  );
}

export async function createSessionToken(username: string) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getAuthSecret());
  return payload;
}

export async function getSessionUsername() {
  if (!isAuthEnabled()) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
    const payload = await verifySessionToken(token);
    return typeof payload.username === "string" ? payload.username : null;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge
  };
}
