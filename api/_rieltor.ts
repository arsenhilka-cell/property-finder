import type { Listing, SearchParams, SourceAdapter } from "./_types.js";
import { absolute, fetchText, htmlText, jsonLd, numberFrom } from "./_http.js";
import { cityFromText } from "./_cities.js";

const BASE = "https://rieltor.ua";
export const rieltor: SourceAdapter = {
  source: "rieltor",
  buildSearchUrl(params) {
    const city = params.city.rieltor?.slug;
    if (city === undefined) throw new Error(`RIELTOR does not support ${params.city.labelRu} yet`);
    const prefix = city ? `/${city}` : "";
    const url = new URL(`${prefix}/commercials-${params.operation === "rent" ? "rent" : "sale"}/`, BASE);
    if (params.page && params.page > 1) url.searchParams.set("page", String(params.page));
    if (params.minPrice !== undefined) url.searchParams.set("price_min", String(params.minPrice));
    if (params.maxPrice !== undefined) url.searchParams.set("price_max", String(params.maxPrice));
    if (params.minArea !== undefined) url.searchParams.set("common_area_min", String(params.minArea));
    if (params.maxArea !== undefined) url.searchParams.set("common_area_max", String(params.maxArea));
    return url.href;
  },
  async searchPage(params) {
    const url = this.buildSearchUrl(params); const html = await fetchText(url, `rieltor-search-p${params.page || 1}`, { signal: params.signal, timeoutMs: params.requestTimeoutMs });
    const output: Listing[] = [];
    const starts = [...html.matchAll(/<div class=["']catalog-card\s[^"']*["'][^>]*>/gi)].map(x => x.index!);
    for (const [i, start] of starts.entries()) {
      const card = html.slice(start, starts[i + 1] ?? html.length);
      const listingUrl = /href=["']([^"']+\/commercials-(?:rent|sale)\/view\/\d+\/)["']/i.exec(card)?.[1];
      const title = htmlText(/class=["']catalog-card-address["'][^>]*>([\s\S]*?)<\/div>/i.exec(card)?.[1] || "");
      const region = htmlText(/class=["']catalog-card-region["'][\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i.exec(card)?.[1] || "");
      if (!listingUrl || !title) continue;
      const price = /class=["']catalog-card-price-title["'][^>]*>([\s\S]*?)<\/strong>/i.exec(card)?.[1]?.match(/([\d\s,.]+)\s*(\$|USD|грн)/i);
      const area = htmlText(card).match(/([\d\s,.]+)\s*м²/i); const ppm = htmlText(card).match(/([\d\s,.]+)\s*(?:\$|грн)\s*\/\s*м²/i);
      const actualCity = cityFromText(region);
      output.push({ source: "rieltor", sourceId: /view\/(\d+)/.exec(listingUrl)?.[1], title,
        price: numberFrom(price?.[1]), currency: price?.[2], area: numberFrom(area?.[1]), pricePerM2: numberFrom(ppm?.[1]),
        city: actualCity?.labelRu, location: [region, title].filter(Boolean).join(", ") || undefined, imageUrl: /<img[^>]+src=["']([^"']+)/i.exec(card)?.[1],
        publishedAt: htmlText(/class=["']catalog-card-update["'][\s\S]*?<span>([\s\S]*?)<\/span>/i.exec(card)?.[1] || "") || undefined,
        description: htmlText(/class=["']catalog-card-description["'][\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i.exec(card)?.[1] || "") || undefined, listingUrl });
    }
    return { listings: output, diagnostics: { rawCards: starts.length, parsedCards: output.length } };
  },
  async search(params) {
    return (await this.searchPage!(params)).listings;
  },
  async getDetail(listing) {
    const html = await fetchText(listing.listingUrl, "rieltor-detail");
    const data = jsonLd(html).flatMap(x => Array.isArray(x) ? x : [x]).find(x => x?.description || x?.image);
    return { ...listing, description: data?.description ? htmlText(data.description) : undefined,
      imageUrl: Array.isArray(data?.image) ? data.image[0] : data?.image,
      phone: /href=["']tel:([^"']+)/i.exec(html)?.[1] };
  },
};
