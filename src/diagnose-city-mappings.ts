import { cityFromText, getCity, matchesRequestedCity } from "../api/_cities.js";
import { dimria } from "../api/_dimria.js";
import { delay, fetchText, htmlText, statuses } from "../api/_http.js";
import { olx } from "../api/_olx.js";
import { rieltor } from "../api/_rieltor.js";
import type { SourceAdapter } from "../api/_types.js";

const adapters: SourceAdapter[] = [olx, dimria, rieltor];
const allCityIds = ["odesa", "kyiv", "zaporizhzhia", "cherkasy", "dnipro", "kharkiv", "lviv"];
const cityIds = process.argv.slice(2).length ? process.argv.slice(2) : allCityIds;

function firstMatch(html: string, pattern: RegExp): string | undefined {
  const match = pattern.exec(html)?.[1];
  return match ? htmlText(match) : undefined;
}

function sourceRawCards(source: SourceAdapter["source"], html: string): number {
  if (source === "olx") return [...html.matchAll(/<div[^>]+data-cy=["']l-card["'][^>]*>/gi)].length;
  if (source === "rieltor") return [...html.matchAll(/<div class=["']catalog-card\s[^"']*["'][^>]*>/gi)].length;
  return [...html.matchAll(/<a[^>]+href=["'][^"']*(?:arenda|prodazha)-[^"']*\d+[^"']*["']/gi)].length;
}

function compact(value: string | undefined, maximum = 180): string | undefined {
  if (!value) return undefined;
  return value.length > maximum ? `${value.slice(0, maximum - 1)}…` : value;
}

for (const cityId of cityIds) {
  const city = getCity(cityId);
  if (!city) throw new Error(`City registry is missing ${cityId}`);
  for (const adapter of adapters) {
    const mapping = city[adapter.source];
    if (!mapping || mapping.slug === undefined) {
      console.log(JSON.stringify({ requestedCity: city.labelRu, source: adapter.source, result: "unsupported" }));
      continue;
    }
    const params = { city, operation: "rent" as const, minArea: 30, maxArea: 100, maxPrice: 60_000, page: 1 };
    const requestedUrl = adapter.buildSearchUrl(params);
    const before = statuses.length;
    let html: string;
    try {
      html = await fetchText(requestedUrl, `city-diagnostic-${adapter.source}-${city.id}`, { timeoutMs: 15_000 });
    } catch (error) {
      console.log(JSON.stringify({ requestedCity: city.labelRu, source: adapter.source, requestedUrl, result: "parsing_error", error: String(error) }));
      continue;
    }
    const response = statuses.slice(before).at(-1);
    const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const heading = firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const breadcrumbs = firstMatch(html, /class=["'][^"']*bread[^"']*["'][^>]*>([\s\S]{0,3000}?)<\/(?:nav|ol|ul|div)>/i);
    const pageText = [title, heading, breadcrumbs].filter(Boolean).join(" ");
    const pageCity = cityFromText(pageText)?.labelRu;
    let listings;
    try {
      listings = await adapter.search(params);
    } catch (error) {
      console.log(JSON.stringify({ requestedCity: city.labelRu, source: adapter.source, requestedUrl, finalUrl: response?.url, status: response?.status, pageCity, title, heading, rawCards: sourceRawCards(adapter.source, html), result: "parsing_error", error: String(error) }));
      continue;
    }
    const cityStates = listings.map(listing => matchesRequestedCity(listing, city, adapter.source));
    const matched = cityStates.filter(value => value === true).length;
    const wrong = cityStates.filter(value => value === false).length;
    const result = response?.status !== 200 ? "parsing_error" : !listings.length ? "empty" : wrong >= Math.max(2, matched) ? "wrong_city" : pageCity === city.labelRu && matched >= Math.min(3, listings.length) ? "verified" : "parsing_error";
    console.log(JSON.stringify({
      requestedCity: city.labelRu, source: adapter.source, requestedUrl, finalUrl: response?.url,
      status: response?.status, redirected: response?.redirected, pageCity, title: compact(title), heading: compact(heading), breadcrumbs: compact(breadcrumbs),
      rawCards: sourceRawCards(adapter.source, html), parsedCards: listings.length, matchedCards: matched, wrongCards: wrong,
      firstCards: listings.slice(0, 5).map(listing => ({ title: compact(listing.title, 90), listingUrl: listing.listingUrl, location: compact(listing.location, 120), city: listing.city })), result,
    }));
    await delay(300);
  }
}
