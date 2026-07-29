# Source research report — commercial rent, Odesa

Test date: 2026-07-25. The CLI made five sequential public GET requests per source (search pages 1–3, one detail page, and a repeat of page 1), with roughly 0.9 seconds between requests. It did not submit logins, solve CAPTCHAs, or invoke browser automation.

| Source | Search | Filters | Pagination | Detail page | Phone | Plain HTTP | Browser needed | Cloudflare compatible |
|---|---|---|---|---|---|---|---|---|
| OLX.ua | 200; 51 / 51 / 52 parsed cards on pages 1–3 | City and operation are path segments; price/area names not yet verified | `?page=N`; pages 1–3 have different URLs/results; page reports only “over 1,000” | 200; description and image available | Not exposed in tested static HTML (a show-phone control exists) | Yes, with a normal User-Agent | No for listings/details tested; possibly for contact reveal | Conditionally: Worker `fetch` can retrieve HTML, but large 3.8 MB pages and volatile markup make it a weak production source |
| DIM.RIA / dom.ria.com | 200; 20 / 20 / 20 parsed cards | City/operation/type are path segments; price/area names not yet verified | `?page=N`; pages 1–3 differ. Hydration exposed `resultsCount: 753` at test time | 200; JSON-LD has description and image | No verified public number extracted | Yes, with a normal User-Agent | No for listings/details tested | Yes for this HTML approach; avoid relying on the exposed client `apiKey` until an official/validated API is identified |
| RIELTOR.ua | 200; 20 / 20 / 20 parsed cards | City/operation/type are path segments; price/area names not yet verified | `?page=N`; pages 1–3 differ. No total/last-page field was confirmed in this test | 200; listing HTML has description and images | Yes: public `tel:` links appeared in the tested detail HTML | Yes, with a normal User-Agent | No | Yes for the observed server-rendered HTML; use rate limits and cache |

## OLX.ua

Used search endpoint:

`https://www.olx.ua/uk/nedvizhimost/kommercheskaya-nedvizhimost/arenda-kommercheskoy-nedvizhimosti/odessa/`

The operation is part of the path (`arenda-kommercheskoy-nedvizhimosti` or `prodazha-kommercheskoy-nedvizhimosti`); the city is the final path segment. Pagination is `?page=2`, `?page=3`. The public response is server-rendered HTML, 3.79–3.88 MB in this run. It contained 51, 51, and 52 parsable cards on pages 1–3, respectively; their listing URLs differed.

The page displayed “over 1,000 listings,” not an exact total, so an exact page count and final page were not established. Price and area filter parameter names were not validated, so the adapter intentionally does not add them. No internal JSON endpoint was validated; the adapter deliberately uses HTML.

The tested detail page returned 200 and contained a description and image. It did not expose a verified telephone number in static HTML. All five requests returned 200: no redirect, CAPTCHA, 403, or 429 appeared. This is usable for a limited, cached backend collector, but the huge HTML and CSS-class-heavy markup are brittle; a Worker can technically fetch it, yet size, CPU parsing, and bot-policy changes are operational risks.

## DIM.RIA / dom.ria.com

Used search endpoint:

`https://dom.ria.com/uk/arenda-kom-nedvizhimosti/odessa/`

Operation and commercial category are path segments (`arenda-kom-nedvizhimosti`; sale becomes `prodazha-kom-nedvizhimosti`), with city as the final segment. Pagination uses `?page=N`. Each tested page returned 20 normalized cards, and the first ten URLs differed across pages 1–3. The server HTML hydration state reported `resultsCount: 753` in this run, which can provide an exact total; final page still needs a defined page-size calculation/validation.

The HTML contains application state including an `apiKey`, but this test did not identify or call a corresponding JSON endpoint. It must not be treated as a public API. The detail page returned 200 and its JSON-LD exposed a description and image. The apparent numeric pattern formerly seen in text was not a verified phone number, so the adapter returns no phone. All five requests were 200 with no protection status. This is currently the strongest plain-HTTP candidate, but production must use conservative caching and validate filter parameter names from the actual form/application behavior.

## RIELTOR.ua

Used search endpoint:

`https://rieltor.ua/odessa/commercials-rent/`

For sale the route is `commercials-sale`; `odessa` is the city path segment. Pagination works as `?page=2` and `?page=3`. The pages are server-rendered and each yielded 20 cards. Their data includes price, currency, area, price per m², address, image, short description, and relative publication label. The test did not establish an exact total, page count, or last page.

The tested detail page returned 200. Unlike the other two, it contains public `tel:` links in its static HTML, along with the description/images. No internal JSON endpoint was validated. Five spaced requests all returned 200, without redirect/CAPTCHA/403/429. A Cloudflare Worker can use ordinary `fetch` for this observed flow; cache and rate-limit it, and expect DOM changes.

## Recommendation for the next backend step

Start with server-side HTML adapters for all three, with a low request rate, retry/backoff only for transient errors, response caching, and no contact-reveal automation. Use DIM.RIA and RIELTOR first for an MVP ingestion slice because their tested cards are smaller and structurally clearer. Keep OLX behind a feature flag until its parsing is hardened and payload/cost behavior is measured in the target runtime.
