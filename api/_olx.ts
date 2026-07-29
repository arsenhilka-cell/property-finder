import type { Listing, SearchParams, SourceAdapter } from "./_types.js";
import { absolute, fetchText, htmlText, jsonLd, numberFrom } from "./_http.js";

const BASE = "https://www.olx.ua";

export interface OlxParseDiagnostics {
  rawCards: number;
  parserCandidates: number;
  listings: number;
  dropped: { missingTitle: number; missingUrl: number; duplicate: number; other: number };
  missingPrice: number;
  missingArea: number;
  jsonLdBlocks: number;
  scriptsContainingListingIds: number;
}

export function parseOlxSearchHtml(html: string, params: SearchParams): { listings: Listing[]; diagnostics: OlxParseDiagnostics } {
  const seen = new Set<string>(); const listings: Listing[] = [];
  const starts = [...html.matchAll(/<div[^>]+data-cy=["']l-card["'][^>]*>/gi)].map(x => x.index!);
  const diagnostics: OlxParseDiagnostics = {
    rawCards: starts.length, parserCandidates: 0, listings: 0,
    dropped: { missingTitle: 0, missingUrl: 0, duplicate: 0, other: 0 },
    missingPrice: 0, missingArea: 0, jsonLdBlocks: jsonLd(html).length,
    scriptsContainingListingIds: [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)]
      .filter(script => /ID[A-Za-z0-9]{5,}/.test(script[0])).length,
  };

  for (const [i, start] of starts.entries()) {
    diagnostics.parserCandidates++;
    const fragment = html.slice(start, starts[i + 1] ?? html.length);
    const href = /<a[^>]+href=["']([^"']*\/d\/[^"']+)["']/i.exec(fragment)?.[1];
    const listingUrl = absolute(BASE, href);
    const title = /aria-label=["']([^"']+)["']/i.exec(fragment)?.[1] || htmlText(/<h[^>]*>([\s\S]*?)<\/h\d>/i.exec(fragment)?.[1] || "");
    if (!listingUrl) { diagnostics.dropped.missingUrl++; continue; }
    if (!title) { diagnostics.dropped.missingTitle++; continue; }
    if (seen.has(listingUrl)) { diagnostics.dropped.duplicate++; continue; }
    seen.add(listingUrl);

    const allText = htmlText(fragment.replace(/<style[\s\S]*?<\/style>/gi, ""));
    const priceMatch = allText.match(/(\d[\d\s]*(?:[,.]\d+)?)\s*(грн\.?|USD|\$|€)/i);
    const areaMatch = allText.match(/(\d[\d\s]*(?:[,.]\d+)?)\s*м²/i);
    const price = numberFrom(priceMatch?.[1]); const area = numberFrom(areaMatch?.[1]);
    if (price === undefined) diagnostics.missingPrice++;
    if (area === undefined) diagnostics.missingArea++;
    listings.push({ source: "olx", sourceId: /-(ID[\w-]+)\.html/i.exec(listingUrl)?.[1], title,
      price, currency: priceMatch?.[2], area, city: params.city || "Одеса",
      location: allText.match(/Одеса,\s*[^-<]{0,80}/i)?.[0]?.trim(),
      imageUrl: absolute(BASE, /<img[^>]+src=["']([^"']+)/i.exec(fragment)?.[1]), listingUrl });
  }
  diagnostics.listings = listings.length;
  return { listings, diagnostics };
}

export const olx: SourceAdapter = {
  source: "olx",
  buildSearchUrl(params) {
    const city = /^(одеса|одесса|odessa)$/i.test(params.city || "odessa") ? "odessa" : (params.city || "odessa").toLowerCase();
    const operation = params.operation === "rent" ? "arenda-kommercheskoy-nedvizhimosti" : "prodazha-kommercheskoy-nedvizhimosti";
    const url = new URL(`/uk/nedvizhimost/kommercheskaya-nedvizhimost/${operation}/${city}/`, BASE);
    // The OLX filter UI adds this explicit currency for a UAH price range.
    if (params.minPrice !== undefined || params.maxPrice !== undefined) url.searchParams.set("currency", "UAH");
    if (params.page && params.page > 1) url.searchParams.set("page", String(params.page));
    if (params.minPrice !== undefined) url.searchParams.set("search[filter_float_price:from]", String(params.minPrice));
    if (params.maxPrice !== undefined) url.searchParams.set("search[filter_float_price:to]", String(params.maxPrice));
    if (params.minArea !== undefined) url.searchParams.set("search[filter_float_total_area:from]", String(params.minArea));
    if (params.maxArea !== undefined) url.searchParams.set("search[filter_float_total_area:to]", String(params.maxArea));
    return url.href;
  },
  async search(params) {
    const url = this.buildSearchUrl(params);
    const html = await fetchText(url, `olx-search-p${params.page || 1}`);
    return parseOlxSearchHtml(html, params).listings;
  },
  async getDetail(listing) {
    const html = await fetchText(listing.listingUrl, "olx-detail");
    const data = jsonLd(html).flatMap(x => Array.isArray(x) ? x : [x]).find(x => x?.description || x?.image);
    return { ...listing, description: data?.description ? htmlText(data.description) : undefined,
      imageUrl: Array.isArray(data?.image) ? data.image[0] : data?.image,
      phone: undefined };
  },
};
