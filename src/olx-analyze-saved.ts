import { readdir, readFile } from "node:fs/promises";
import { parseOlxSearchHtml } from "./sources/olx.js";
import { htmlText } from "./utils/http.js";
import { getCity } from "../api/_cities.js";

const city = getCity("odesa");
if (!city) throw new Error("City registry is missing Odesa");
const params = { city, operation: "rent" as const, minArea: 30, maxArea: 100, maxPrice: 60_000 };
const fileNames = (await readdir("debug"))
  .map(name => ({ name, page: Number(/^olx-full-p(\d+)\.html$/.exec(name)?.[1]) }))
  .filter(item => Number.isInteger(item.page) && item.page > 0)
  .sort((a, b) => a.page - b.page);
const unique = new Map<string, string>();
let rawCards = 0;
const pages: Array<{ page: number; rawCards: number; parsed: number }> = [];
let reportedTotal: number | undefined;

for (const { name, page } of fileNames) {
  const html = await readFile(`debug/${name}`, "utf8");
  if (page === 1) {
    const match = /Ми знайшли\s+([\d\s]+)\s+оголошен/i.exec(htmlText(html));
    reportedTotal = match ? Number(match[1].replace(/\s/g, "")) : undefined;
  }
  const { listings, diagnostics } = parseOlxSearchHtml(html, { ...params, page });
  if (diagnostics.rawCards === 0) continue;
  rawCards += diagnostics.rawCards;
  pages.push({ page, rawCards: diagnostics.rawCards, parsed: listings.length });
  for (const listing of listings) unique.set(listing.sourceId || listing.listingUrl, listing.listingUrl);
}

console.log(JSON.stringify({ reportedTotal, pagesDiscovered: pages.length, rawCardsDiscovered: rawCards,
  uniqueListingsParsed: unique.size, pages }, null, 2));
