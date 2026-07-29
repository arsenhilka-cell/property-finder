# OLX diagnostic — 25 July 2026

Control query: Odesa, commercial property, rent, 30–100 m², price up to 60,000 UAH.

Browser URL and adapter URL now use the same endpoint and filters:

```text
https://www.olx.ua/uk/nedvizhimost/kommercheskaya-nedvizhimost/arenda-kommercheskoy-nedvizhimosti/odessa/?currency=UAH&search%5Bfilter_float_price%3Ato%5D=60000&search%5Bfilter_float_total_area%3Afrom%5D=30&search%5Bfilter_float_total_area%3Ato%5D=100
```

OLX reported **883** results at the time of the HTTP crawl. (The browser UI showed 884 a few minutes earlier; this is a live marketplace.)

| Page | HTTP | HTML bytes | Cards in HTML | Parser candidates | Listings | Dropped |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 200 | 3,836,962 | 51 | 51 | 51 | 0 |
| 2 | 200 | 3,809,561 | 52 | 52 | 52 | 0 |
| 3 | 200 | 3,742,814 | 52 | 52 | 52 | 0 |
| 4 | 200 | 3,780,738 | 52 | 52 | 52 | 0 |
| 5 | 200 | 3,606,047 | 41 | 41 | 41 | 0 |

For each of pages 1–5, rejection counters were: missing title 0; missing URL 0; unparseable price 0; unparseable area 0; price filter 0; area filter 0; duplicate 0; other 0. Missing price or area is now retained as `undefined`, not discarded.

## Full crawl result

| Metric | Result |
|---|---:|
| OLX reported total | 883 |
| Pages discovered | 23 |
| Raw card placements discovered | 931 |
| Unique listings parsed by `sourceId` / URL | 883 |

The 48-card difference between raw placements and unique listings is expected: OLX repeats promoted/organic cards across pages. The old path had three correctness problems: it omitted the browser's `currency=UAH` parameter, applied a second local area/price predicate (which treated missing values as non-matches), and used an overly loose numeric pattern. The adapter now matches the browser URL, retains missing price/area as `undefined`, and does not apply a second OLX area/price predicate.

## Structured data investigation

The response contains `window.__PRERENDERED_STATE__` and JSON-LD blocks. On page 1, JSON-LD includes one `Product` and 20 `Offer` objects, plus site/breadcrumb/organization metadata; it is not a complete one-record-per-card feed. The pre-rendered state is present, but the stable complete source for all 51 cards is server-rendered HTML marked with `data-cy="l-card"`. The parser uses those semantic card markers rather than volatile CSS classes. No public JSON search endpoint was established by this diagnostic.

## Pagination

The first page has links through page 23. Pages 1–22 contain 40–52 card placements; page 23 has 3; page 24 returns no cards. The crawler stops after the discovered last page (with an empty-page fallback when pagination cannot be read).
