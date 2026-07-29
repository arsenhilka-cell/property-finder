import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { HttpStatus } from "./_types.ts";

const DEBUG_DIR = new URL("../debug/", import.meta.url);
const HTTP_TIMEOUT_MS = 20_000;
export const statuses: HttpStatus[] = [];

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchText(url: string, label: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS);
  let hardTimeout: ReturnType<typeof setTimeout> | undefined;
  const request = fetch(url, {
    redirect: "follow",
    signal: controller.signal,
    headers: {
      "accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
      "accept-language": "uk-UA,uk;q=0.9,en;q=0.7",
      "user-agent": "Mozilla/5.0 (compatible; CommercialRealtyMVPResearch/0.1; contact: local-research)",
    },
  });
  const hardTimeoutPromise = new Promise<never>((_, reject) => {
    hardTimeout = setTimeout(() => reject(new Error(`HTTP timeout after ${HTTP_TIMEOUT_MS}ms: ${url}`)), HTTP_TIMEOUT_MS + 100);
  });
  const response = await Promise.race([request, hardTimeoutPromise]).finally(() => {
    clearTimeout(timeout);
    if (hardTimeout) clearTimeout(hardTimeout);
  });
  const body = await response.text();
  statuses.push({ url: response.url, status: response.status, redirected: response.redirected,
    contentType: response.headers.get("content-type"), bytes: Buffer.byteLength(body), at: new Date().toISOString() });
  // Vercel's deployment filesystem is read-only. Debug captures are useful
  // locally, but must never make a serverless invocation fail.
  if (!process.env.VERCEL) {
    await mkdir(DEBUG_DIR, { recursive: true });
    const ext = response.headers.get("content-type")?.includes("json") ? "json" : "html";
    await writeFile(join(DEBUG_DIR.pathname, `${label}.${ext}`), body);
  }
  return body;
}

export function absolute(base: string, href?: string): string | undefined {
  if (!href) return undefined;
  try { return new URL(href, base).href; } catch { return undefined; }
}

export function htmlText(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, "\"").replace(/\s+/g, " ").trim();
}

export function numberFrom(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value.replace(/\s/g, "").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function jsonLd(html: string): any[] {
  const values: any[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { values.push(JSON.parse(match[1])); } catch { /* invalid JSON-LD is not fatal */ }
  }
  return values;
}
