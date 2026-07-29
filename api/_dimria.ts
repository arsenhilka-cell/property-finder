import type { Listing, SearchParams, SourceAdapter } from "./_types.js";
import { absolute, fetchText, htmlText, jsonLd, numberFrom } from "./_http.js";
import { cityFromText } from "./_cities.js";

const BASE = "https://dom.ria.com";
export const dimria: SourceAdapter = {
  source: "dimria",
  buildSearchUrl(params) {
    const city = params.city.dimria?.slug;
    if (!city) throw new Error(`DIM.RIA does not support ${params.city.labelRu} yet`);
    const url = new URL(`/uk/${params.operation === "rent" ? "arenda" : "prodazha"}-kom-nedvizhimosti/${city}/`, BASE);
    if (params.page && params.page > 1) url.searchParams.set("page", String(params.page));
    // DIM.RIA's page currently ignores the unverified price/area query names used
    // by earlier probes. Do not invent URL parameters; range enforcement happens
    // centrally after parsing known card values.
    return url.href;
  },
  async searchPage(params) {
    const url = this.buildSearchUrl(params); const html = await fetchText(url, `dimria-search-p${params.page || 1}`, { signal: params.signal, timeoutMs: params.requestTimeoutMs });
    const output: Listing[] = []; const seen = new Set<string>();
    // Detail links are stable; card markup changes frequently, so take the nearby card text conservatively.
    const matches = [...html.matchAll(/<a[^>]+href=["']([^"']*(?:arenda|prodazha)-[^"']*\d+[^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)];
    for (const m of matches) {
      const listingUrl = absolute(BASE, m[1]); if (!listingUrl || seen.has(listingUrl) || !/\.html|\d+\/?$/.test(listingUrl)) continue;
      const title = htmlText(m[2]); if (title.length < 8) continue;
      seen.add(listingUrl); const around = html.slice(Math.max(0, m.index! - 1200), m.index! + 2500); const text = htmlText(around);
      const titleOffset = text.indexOf(title);
      const cardText = titleOffset >= 0 ? text.slice(titleOffset, titleOffset + 2_000) : text;
      const price = text.match(/([\d\s,.]+)\s*(\$|USD|грн)/i); const area = cardText.match(/([\d\s,.]+)\s*м²/i);
      const actualCity = cityFromText(text);
      output.push({ source: "dimria", sourceId: /(\d+)(?:\.html)?\/?$/.exec(listingUrl)?.[1], title,
        price: numberFrom(price?.[1]), currency: price?.[2], area: numberFrom(area?.[1]), city: actualCity?.labelRu,
        location: actualCity ? `${title} · ${actualCity.labelUk}` : undefined, listingUrl });
    }
    return { listings: output, diagnostics: { rawCards: matches.length, parsedCards: output.length } };
  },
  async search(params) {
    return (await this.searchPage!(params)).listings;
  },
  async getDetail(listing) {
    const html = await fetchText(listing.listingUrl, "dimria-detail");
    const data = jsonLd(html).flatMap(x => Array.isArray(x) ? x : [x]).find(x => x?.description || x?.image);
    return { ...listing, description: data?.description ? htmlText(data.description) : undefined,
      imageUrl: Array.isArray(data?.image) ? data.image[0] : data?.image,
      phone: undefined };
  },
};
