import { olx, parseOlxSearchHtml } from "./sources/olx.js";
import { delay, fetchText, statuses } from "./utils/http.js";

const params = { city: "Одесса", operation: "rent" as const, minArea: 30, maxArea: 100, maxPrice: 60_000 };
const pageRows: unknown[] = [];
const rawIds = new Set<string>();
const parsedIds = new Set<string>();

for (const page of [1, 2, 3, 4, 5]) {
  const html = await fetchText(olx.buildSearchUrl({ ...params, page }), `olx-diagnostic-p${page}`);
  const { listings, diagnostics } = parseOlxSearchHtml(html, { ...params, page });
  const status = statuses.at(-1)!;
  for (const listing of listings) { rawIds.add(listing.listingUrl); parsedIds.add(listing.sourceId || listing.listingUrl); }
  pageRows.push({ page, url: status.url, httpStatus: status.status, htmlBytes: status.bytes,
    rawCards: diagnostics.rawCards, parserCandidates: diagnostics.parserCandidates, listings: diagnostics.listings,
    dropped: diagnostics.dropped, missingPrice: diagnostics.missingPrice, missingArea: diagnostics.missingArea,
    localPriceFilterDropped: 0, localAreaFilterDropped: 0, jsonLdBlocks: diagnostics.jsonLdBlocks,
    scriptsContainingListingIds: diagnostics.scriptsContainingListingIds });
  await delay(1_200);
}

console.log("OLX adapter URL:", olx.buildSearchUrl(params));
console.log(JSON.stringify(pageRows, null, 2));
console.log("First-five totals:", { rawCards: rawIds.size, uniqueListingsParsed: parsedIds.size });
