"use client";

const THEME_COOKIE = "nu_theme";
const DEVICE_COOKIE = "nu_device_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const matches = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return matches ? decodeURIComponent(matches[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `max-age=${COOKIE_MAX_AGE}`,
    "path=/",
    "sameSite=lax",
  ];
  document.cookie = parts.join("; ");
}

export function ensureDeviceId() {
  if (typeof document === "undefined") return null;
  let id = readCookie(DEVICE_COOKIE);
  if (!id) {
    const randomId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `device-${Math.random().toString(36).slice(2, 10)}`;
    id = randomId;
    writeCookie(DEVICE_COOKIE, id);
  }
  return id;
}

export function readThemeCookie() {
  return readCookie(THEME_COOKIE);
}

export function persistThemeCookie(theme: string) {
  if (typeof document === "undefined") return;
  ensureDeviceId();
  writeCookie(THEME_COOKIE, theme);
}
