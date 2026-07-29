import type { Listing, SourceName } from "./_types.js";

export interface CityConfig {
  id: string;
  labelRu: string;
  labelUk: string;
  aliases: string[];
  olx?: { slug?: string; locationId?: string };
  dimria?: { slug?: string; cityId?: string };
  rieltor?: { slug?: string; cityId?: string };
}

function city(config: CityConfig): CityConfig { return config; }

/**
 * Source slugs below are explicit, per-provider configuration — never derived
 * from the user-entered label. Add a city by changing this one registry entry.
 */
export const cities: CityConfig[] = [
  city({ id: "kyiv", labelRu: "Киев", labelUk: "Київ", aliases: ["Київ", "Києві", "Kyiv", "Kiev", "Киев"], olx: { slug: "kiev" }, dimria: { slug: "kiev" }, rieltor: { slug: "" } }),
  city({ id: "odesa", labelRu: "Одесса", labelUk: "Одеса", aliases: ["Одеса", "Одесі", "Odessa", "Odesa"], olx: { slug: "odessa" }, dimria: { slug: "odessa" }, rieltor: { slug: "odessa" } }),
  city({ id: "kharkiv", labelRu: "Харьков", labelUk: "Харків", aliases: ["Харків", "Харкові", "Kharkiv", "Kharkov"], olx: { slug: "kharkov" }, dimria: { slug: "kharkov" }, rieltor: { slug: "harkov" } }),
  city({ id: "dnipro", labelRu: "Днепр", labelUk: "Дніпро", aliases: ["Дніпро", "Дніпрі", "Dnipro", "Днепропетровск", "Dnepropetrovsk"], olx: { slug: "dnepr" }, dimria: { slug: "dnepr" }, rieltor: { slug: "dnepr" } }),
  city({ id: "zaporizhzhia", labelRu: "Запорожье", labelUk: "Запоріжжя", aliases: ["Запоріжжя", "Запоріжжі", "Zaporizhzhia", "Zaporozhye", "Zaporizhia"], olx: { slug: "zaporozhe" }, dimria: { slug: "zaporozhye" }, rieltor: { slug: "zaporozhje" } }),
  city({ id: "lviv", labelRu: "Львов", labelUk: "Львів", aliases: ["Львів", "Львові", "Lviv", "Lvov"], olx: { slug: "lvov" }, dimria: { slug: "lvov" }, rieltor: { slug: "lvov" } }),
  city({ id: "vinnytsia", labelRu: "Винница", labelUk: "Вінниця", aliases: ["Вінниця", "Vinnytsia", "Vinnitsa"], olx: { slug: "vinnitsa" }, dimria: { slug: "vinnitsa" }, rieltor: { slug: "vinnytsia" } }),
  city({ id: "poltava", labelRu: "Полтава", labelUk: "Полтава", aliases: ["Poltava"], olx: { slug: "poltava" }, dimria: { slug: "poltava" }, rieltor: { slug: "poltava" } }),
  city({ id: "cherkasy", labelRu: "Черкассы", labelUk: "Черкаси", aliases: ["Черкаси", "Черкасах", "Cherkasy", "Cherkassy"], olx: { slug: "cherkassy" }, dimria: { slug: "cherkassy" }, rieltor: { slug: "cherkassy" } }),
  city({ id: "zhytomyr", labelRu: "Житомир", labelUk: "Житомир", aliases: ["Zhytomyr", "Zhitomir"], olx: { slug: "zhitomir" }, dimria: { slug: "zhitomir" }, rieltor: { slug: "zhytomyr" } }),
  city({ id: "kryvyi-rih", labelRu: "Кривой Рог", labelUk: "Кривий Ріг", aliases: ["Кривий Ріг", "Kryvyi Rih", "Krivoy Rog"], olx: { slug: "krivoy-rog" }, dimria: { slug: "krivoy-rog" }, rieltor: { slug: "kryvyi-rih" } }),
  city({ id: "mykolaiv", labelRu: "Николаев", labelUk: "Миколаїв", aliases: ["Миколаїв", "Mykolaiv", "Nikolaev"], olx: { slug: "nikolaev" }, dimria: { slug: "nikolaev" }, rieltor: { slug: "mykolaiv" } }),
  city({ id: "kherson", labelRu: "Херсон", labelUk: "Херсон", aliases: ["Kherson"], olx: { slug: "kherson" }, dimria: { slug: "kherson" }, rieltor: { slug: "kherson" } }),
  city({ id: "chernihiv", labelRu: "Чернигов", labelUk: "Чернігів", aliases: ["Чернігів", "Chernihiv", "Chernigov"], olx: { slug: "chernigov" }, dimria: { slug: "chernigov" }, rieltor: { slug: "chernihiv" } }),
  city({ id: "sumy", labelRu: "Сумы", labelUk: "Суми", aliases: ["Суми", "Sumy"], olx: { slug: "sumy" }, dimria: { slug: "sumy" }, rieltor: { slug: "sumy" } }),
  city({ id: "chernivtsi", labelRu: "Черновцы", labelUk: "Чернівці", aliases: ["Чернівці", "Chernivtsi", "Chernovtsy"], olx: { slug: "chernovtsy" }, dimria: { slug: "chernovtsy" }, rieltor: { slug: "chernivtsi" } }),
  city({ id: "uzhhorod", labelRu: "Ужгород", labelUk: "Ужгород", aliases: ["Uzhhorod", "Uzhgorod"], olx: { slug: "uzhgorod" }, dimria: { slug: "uzhgorod" }, rieltor: { slug: "uzhhorod" } }),
  city({ id: "rivne", labelRu: "Ровно", labelUk: "Рівне", aliases: ["Рівне", "Rivne", "Rovno"], olx: { slug: "rovno" }, dimria: { slug: "rovno" }, rieltor: { slug: "rivne" } }),
  city({ id: "lutsk", labelRu: "Луцк", labelUk: "Луцьк", aliases: ["Луцьк", "Lutsk"], olx: { slug: "lutsk" }, dimria: { slug: "lutsk" }, rieltor: { slug: "lutsk" } }),
  city({ id: "ivano-frankivsk", labelRu: "Ивано-Франковск", labelUk: "Івано-Франківськ", aliases: ["Івано-Франківськ", "Ivano-Frankivsk", "Ivano Frankivsk"], olx: { slug: "ivano-frankovsk" }, dimria: { slug: "ivano-frankovsk" }, rieltor: { slug: "ivano-frankivsk" } }),
  city({ id: "ternopil", labelRu: "Тернополь", labelUk: "Тернопіль", aliases: ["Тернопіль", "Ternopil", "Ternopol"], olx: { slug: "ternopol" }, dimria: { slug: "ternopol" }, rieltor: { slug: "ternopil" } }),
  city({ id: "kropyvnytskyi", labelRu: "Кропивницкий", labelUk: "Кропивницький", aliases: ["Кропивницький", "Кировоград", "Kropyvnytskyi", "Kirovograd"], olx: { slug: "kirovograd" }, dimria: { slug: "kirovograd" }, rieltor: { slug: "kropyvnytskyi" } }),
  city({ id: "donetsk", labelRu: "Донецк", labelUk: "Донецьк", aliases: ["Донецьк", "Donetsk"] }),
  city({ id: "luhansk", labelRu: "Луганск", labelUk: "Луганськ", aliases: ["Луганськ", "Luhansk", "Lugansk"] }),
  city({ id: "simferopol", labelRu: "Симферополь", labelUk: "Сімферополь", aliases: ["Сімферополь", "Simferopol"] }),
];

function normalized(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase().replace(/ё/g, "е").replace(/[ʼ’`´]/g, "'");
}

export function resolveCity(value: string): CityConfig | undefined {
  const query = normalized(value);
  return cities.find(city => [city.id, city.labelRu, city.labelUk, ...city.aliases].some(alias => normalized(alias) === query));
}

export function getCity(id: string): CityConfig | undefined {
  return cities.find(city => city.id === id);
}

function includesAlias(text: string, alias: string): boolean {
  const haystack = normalized(text);
  const needle = normalized(alias);
  return new RegExp(`(^|[^\\p{L}])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}])`, "iu").test(haystack);
}

/** Finds a city only when it is actually present in source text. */
export function cityFromText(text: string): CityConfig | undefined {
  return cities.find(city => [city.labelRu, city.labelUk, ...city.aliases].some(alias => includesAlias(text, alias)));
}

/**
 * `true` means the card explicitly names the requested city; `false` means it
 * explicitly names another configured city. `unknown` is never a substituted
 * city name and may only be retained after page-level verification.
 */
export function matchesRequestedCity(listing: Listing, city: CityConfig, _source: SourceName): boolean | "unknown" {
  // Location is the most specific source field (and can contradict a stale
  // generic city label), therefore it always wins over `listing.city`.
  for (const value of [listing.location, listing.city]) {
    if (!value) continue;
    const factualCity = cityFromText(value);
    if (factualCity) return factualCity.id === city.id;
    if ([city.labelRu, city.labelUk, ...city.aliases].some(alias => includesAlias(value, alias))) return true;
  }
  return "unknown";
}

export function publicCities(): Pick<CityConfig, "id" | "labelRu" | "labelUk" | "aliases">[] {
  return cities.map(({ id, labelRu, labelUk, aliases }) => ({ id, labelRu, labelUk, aliases }));
}
