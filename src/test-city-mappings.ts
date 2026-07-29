import { getCity, matchesRequestedCity } from "../api/_cities.js";
import { olx } from "../api/_olx.js";
import { dimria } from "../api/_dimria.js";
import { rieltor } from "../api/_rieltor.js";
import { searchSourceBatch } from "../api/_search.js";

const adapters = [olx, dimria, rieltor];
const cityIds = ["kyiv", "zaporizhzhia", "cherkasy"];
const results = new Map<string, string[]>();

for (const adapter of adapters) {
  for (const cityId of cityIds) {
    const city = getCity(cityId);
    if (!city) throw new Error(`City registry is missing ${cityId}`);
    const batch = await searchSourceBatch(adapter.source, { city, operation: "rent", minArea: 30, maxArea: 100, maxPrice: 60_000 }, 1, 1);
    const listings = batch.listings;
    const incorrect = listings.filter(listing => matchesRequestedCity(listing, city, adapter.source) === false);
    if (incorrect.length) throw new Error(`${adapter.source}/${cityId}: received ${incorrect.length} listings from another city`);
    results.set(`${adapter.source}:${cityId}`, listings.slice(0, 20).map(listing => listing.listingUrl));
  }
  const pairs = [["kyiv", "zaporizhzhia"], ["kyiv", "cherkasy"], ["zaporizhzhia", "cherkasy"]] as const;
  for (const [left, right] of pairs) {
    const leftUrls = results.get(`${adapter.source}:${left}`) || [];
    const rightUrls = new Set(results.get(`${adapter.source}:${right}`) || []);
    const overlap = leftUrls.filter(url => rightUrls.has(url)).length;
    if (leftUrls.length >= 5 && overlap / leftUrls.length >= 0.8) throw new Error(`${adapter.source}: City mapping is ignored or falls back to another city`);
  }
}

console.log("City mapping comparison passed", Object.fromEntries([...results].map(([key, urls]) => [key, urls.length])));
