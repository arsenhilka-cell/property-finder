import { searchListings, type SearchListingsParams } from "./_search.ts";
import type { Listing, SourceName } from "./_types.ts";

const sourceNames: SourceName[] = ["olx", "dimria", "rieltor"];

function json(value: unknown, status = 200): Response {
  return Response.json(value, { status });
}

function numberValue(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function parseParams(value: unknown): SearchListingsParams {
  if (!value || typeof value !== "object") throw new Error("Expected a JSON object");
  const body = value as Record<string, unknown>;
  if (typeof body.city !== "string" || !body.city.trim()) throw new Error("City is required");
  if (body.operation !== "rent" && body.operation !== "sale") throw new Error("Operation must be rent or sale");
  const sources = Array.isArray(body.sources) ? body.sources.filter((item): item is SourceName => typeof item === "string" && sourceNames.includes(item as SourceName)) : sourceNames;
  if (!sources.length) throw new Error("Choose at least one source");
  return { city: body.city.trim(), operation: body.operation, sources,
    minPrice: numberValue(body.minPrice), maxPrice: numberValue(body.maxPrice),
    minArea: numberValue(body.minArea), maxArea: numberValue(body.maxArea) };
}

function normalized(listing: Listing): Listing {
  return { ...listing, pricePerM2: listing.pricePerM2 ?? (listing.price && listing.area ? listing.price / listing.area : undefined) };
}

function inputListing(value: unknown): Listing {
  if (!value || typeof value !== "object") throw new Error("Listing is required");
  const listing = value as Partial<Listing>;
  if (typeof listing.title !== "string" || !listing.title.trim()) throw new Error("Listing title is required");
  if (typeof listing.listingUrl !== "string" || !/^https?:\/\//.test(listing.listingUrl)) throw new Error("Valid listing URL is required");
  if (!sourceNames.includes(listing.source as SourceName)) throw new Error("Valid listing source is required");
  return listing as Listing;
}

function telegramText(listing: Listing, comment: string): string {
  const price = listing.price === undefined ? "не указана" : `${listing.price} ${listing.currency || ""}`.trim();
  const area = listing.area === undefined ? "не указана" : `${listing.area} м²`;
  const location = [listing.city, listing.location].filter(Boolean).join(", ") || "не указана";
  const phone = listing.phone ? `\n📞 Телефон: ${listing.phone}` : "";
  return `🏢 ${listing.title}\n\n💰 Цена: ${price}\n📐 Площадь: ${area}\n📍 Локация: ${location}${phone}\n🌐 Источник: ${listing.source}\n\n💬 Комментарий:\n${comment || "—"}\n\n🔗 ${listing.listingUrl}`;
}

async function telegramRequest(method: "sendPhoto" | "sendMessage", payload: Record<string, string>): Promise<{ ok: boolean; description?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !process.env.TELEGRAM_CHAT_ID) throw new Error("Telegram is not configured on the server");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(payload) });
  const result = await response.json() as { ok?: boolean; description?: string };
  return { ok: Boolean(result.ok), description: result.description };
}

async function sendToTelegram(listing: Listing, comment: string): Promise<{ delivery: "photo" | "message" }> {
  const text = telegramText(listing, comment).slice(0, 4096);
  const chatId = process.env.TELEGRAM_CHAT_ID!;
  if (listing.imageUrl) {
    const photo = await telegramRequest("sendPhoto", { chat_id: chatId, photo: listing.imageUrl, caption: text.slice(0, 1024) });
    if (photo.ok) return { delivery: "photo" };
  }
  const message = await telegramRequest("sendMessage", { chat_id: chatId, text });
  if (!message.ok) throw new Error(message.description || "Telegram did not accept the message");
  return { delivery: "message" };
}

async function addToGoogleSheets(listing: Listing, comment: string): Promise<"added" | "already_exists"> {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL;
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET;
  if (!url || !secret) throw new Error("Google Sheets is not configured on the server");
  const item = normalized(listing);
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
    secret, source: item.source, sourceId: item.sourceId, title: item.title, price: item.price, currency: item.currency,
    area: item.area, pricePerM2: item.pricePerM2, city: item.city, location: item.location, phone: item.phone,
    listingUrl: item.listingUrl, comment,
  }) });
  let result: { status?: string; error?: string };
  try { result = await response.json() as { status?: string; error?: string }; }
  catch { throw new Error("Google Sheets returned an invalid response"); }
  if (!response.ok) throw new Error(result.error || `Google Sheets request failed (${response.status})`);
  if (result.status === "added" || result.status === "already_exists") return result.status;
  throw new Error(result.error || "Google Sheets returned an unexpected status");
}

export async function handleApiRequest(request: Request): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  try {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const body = await request.json() as Record<string, unknown>;
    if (pathname === "/api/search") {
      const result = await searchListings(parseParams(body));
      return json({ listings: result.listings.map(normalized), counts: Object.fromEntries(sourceNames.map(source => [source, result.bySource[source].length])), errors: result.errors });
    }
    const listing = inputListing(body.listing);
    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 2_000) : "";
    if (pathname === "/api/telegram") return json({ ok: true, ...(await sendToTelegram(listing, comment)) });
    if (pathname === "/api/sheets") return json({ ok: true, status: await addToGoogleSheets(listing, comment) });
    return json({ error: "Not found" }, 404);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected server error" }, 400);
  }
}
