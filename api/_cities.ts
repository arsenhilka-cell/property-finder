import type { Listing, SourceName } from "./_types.js";

export interface CityConfig {
  id: string;
  labelRu: string;
  labelUk: string;
  aliases: string[];
  regionRu: string;
  regionUk: string;
  priority?: number;
  olx?: { slug?: string; locationId?: string };
  dimria?: { slug?: string; cityId?: string };
  rieltor?: { slug?: string; cityId?: string };
}

export type CoverageStatus = "verified" | "partial" | "unsupported" | "needs_review" | "wrong_city" | "redirected";

type CityInput = Omit<CityConfig, "regionRu" | "regionUk"> & Partial<Pick<CityConfig, "regionRu" | "regionUk">>;
const legacyRegions: Record<string, Pick<CityConfig, "regionRu" | "regionUk">> = {
  kyiv: { regionRu: "г. Киев", regionUk: "м. Київ" }, odesa: { regionRu: "Одесская область", regionUk: "Одеська область" }, kharkiv: { regionRu: "Харьковская область", regionUk: "Харківська область" }, dnipro: { regionRu: "Днепропетровская область", regionUk: "Дніпропетровська область" }, zaporizhzhia: { regionRu: "Запорожская область", regionUk: "Запорізька область" }, lviv: { regionRu: "Львовская область", regionUk: "Львівська область" }, vinnytsia: { regionRu: "Винницкая область", regionUk: "Вінницька область" }, poltava: { regionRu: "Полтавская область", regionUk: "Полтавська область" }, cherkasy: { regionRu: "Черкасская область", regionUk: "Черкаська область" }, zhytomyr: { regionRu: "Житомирская область", regionUk: "Житомирська область" }, "kryvyi-rih": { regionRu: "Днепропетровская область", regionUk: "Дніпропетровська область" }, mykolaiv: { regionRu: "Николаевская область", regionUk: "Миколаївська область" }, kherson: { regionRu: "Херсонская область", regionUk: "Херсонська область" }, chernihiv: { regionRu: "Черниговская область", regionUk: "Чернігівська область" }, sumy: { regionRu: "Сумская область", regionUk: "Сумська область" }, chernivtsi: { regionRu: "Черновицкая область", regionUk: "Чернівецька область" }, uzhhorod: { regionRu: "Закарпатская область", regionUk: "Закарпатська область" }, rivne: { regionRu: "Ровенская область", regionUk: "Рівненська область" }, lutsk: { regionRu: "Волынская область", regionUk: "Волинська область" }, "ivano-frankivsk": { regionRu: "Ивано-Франковская область", regionUk: "Івано-Франківська область" }, ternopil: { regionRu: "Тернопольская область", regionUk: "Тернопільська область" }, kropyvnytskyi: { regionRu: "Кировоградская область", regionUk: "Кіровоградська область" }, donetsk: { regionRu: "Донецкая область", regionUk: "Донецька область" }, luhansk: { regionRu: "Луганская область", regionUk: "Луганська область" }, simferopol: { regionRu: "АР Крым", regionUk: "АР Крим" },
};
function city(config: CityInput): CityConfig {
  const region = config.regionRu && config.regionUk ? { regionRu: config.regionRu, regionUk: config.regionUk } : legacyRegions[config.id];
  if (!region) throw new Error(`Region is required for ${config.id}`);
  return { ...config, ...region };
}

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
  city({ id: "vinnytsia", labelRu: "Винница", labelUk: "Вінниця", aliases: ["Вінниця", "Vinnytsia", "Vinnitsa"], olx: { slug: "vinnitsa" }, dimria: { slug: "vinnitsa" } }),
  city({ id: "poltava", labelRu: "Полтава", labelUk: "Полтава", aliases: ["Poltava"], olx: { slug: "poltava" }, dimria: { slug: "poltava" }, rieltor: { slug: "poltava" } }),
  city({ id: "cherkasy", labelRu: "Черкассы", labelUk: "Черкаси", aliases: ["Черкаси", "Черкасах", "Cherkasy", "Cherkassy"], olx: { slug: "cherkassy" }, dimria: { slug: "cherkassy" }, rieltor: { slug: "cherkassy" } }),
  city({ id: "zhytomyr", labelRu: "Житомир", labelUk: "Житомир", aliases: ["Zhytomyr", "Zhitomir"], olx: { slug: "zhitomir" }, dimria: { slug: "zhitomir" } }),
  city({ id: "kryvyi-rih", labelRu: "Кривой Рог", labelUk: "Кривий Ріг", aliases: ["Кривий Ріг", "Kryvyi Rih", "Krivoy Rog"] }),
  city({ id: "mykolaiv", labelRu: "Николаев", labelUk: "Миколаїв", aliases: ["Миколаїв", "Mykolaiv", "Nikolaev"], olx: { slug: "nikolaev" }, dimria: { slug: "nikolaev" } }),
  city({ id: "kherson", labelRu: "Херсон", labelUk: "Херсон", aliases: ["Kherson"], olx: { slug: "kherson" }, dimria: { slug: "kherson" } }),
  city({ id: "chernihiv", labelRu: "Чернигов", labelUk: "Чернігів", aliases: ["Чернігів", "Chernihiv", "Chernigov"], olx: { slug: "chernigov" }, dimria: { slug: "chernigov" } }),
  city({ id: "sumy", labelRu: "Сумы", labelUk: "Суми", aliases: ["Суми", "Sumy"], olx: { slug: "sumy" }, dimria: { slug: "sumy" }, rieltor: { slug: "sumy" } }),
  city({ id: "chernivtsi", labelRu: "Черновцы", labelUk: "Чернівці", aliases: ["Чернівці", "Chernivtsi", "Chernovtsy"], olx: { slug: "chernovtsy" }, dimria: { slug: "chernovtsy" } }),
  city({ id: "uzhhorod", labelRu: "Ужгород", labelUk: "Ужгород", aliases: ["Uzhhorod", "Uzhgorod"], olx: { slug: "uzhgorod" }, dimria: { slug: "uzhgorod" } }),
  city({ id: "rivne", labelRu: "Ровно", labelUk: "Рівне", aliases: ["Рівне", "Rivne", "Rovno"], olx: { slug: "rovno" }, dimria: { slug: "rovno" } }),
  city({ id: "lutsk", labelRu: "Луцк", labelUk: "Луцьк", aliases: ["Луцьк", "Lutsk"], olx: { slug: "lutsk" }, dimria: { slug: "lutsk" } }),
  city({ id: "ivano-frankivsk", labelRu: "Ивано-Франковск", labelUk: "Івано-Франківськ", aliases: ["Івано-Франківськ", "Ivano-Frankivsk", "Ivano Frankivsk"], olx: { slug: "ivano-frankovsk" }, dimria: { slug: "ivano-frankovsk" } }),
  city({ id: "ternopil", labelRu: "Тернополь", labelUk: "Тернопіль", aliases: ["Тернопіль", "Ternopil", "Ternopol"], olx: { slug: "ternopol" }, dimria: { slug: "ternopol" } }),
  city({ id: "kropyvnytskyi", labelRu: "Кропивницкий", labelUk: "Кропивницький", aliases: ["Кропивницький", "Кировоград", "Kropyvnytskyi", "Kirovograd"], olx: { slug: "kropivnitskiy" }, rieltor: { slug: "kropyvnytskyi" } }),
  city({ id: "bila-tserkva", labelRu: "Белая Церковь", labelUk: "Біла Церква", aliases: ["Біла Церква", "Білій Церкві", "Белая Церковь", "Bila Tserkva", "Bila-Tserkva", "Belaya Tserkov"], regionRu: "Киевская область", regionUk: "Київська область", priority: 20, olx: { slug: "belayatserkov" } }),
  city({ id: "brovary", labelRu: "Бровары", labelUk: "Бровари", aliases: ["Бровари", "Броварах", "Brovary"], regionRu: "Киевская область", regionUk: "Київська область", priority: 20, olx: { slug: "brovary" }, rieltor: { slug: "brovary" } }),
  // Города вне областных центров с населением порядка 100 000+.
  city({ id: "kamianske", labelRu: "Каменское", labelUk: "Кам'янське", aliases: ["Кам’янське", "Камянское", "Днепродзержинск", "Дніпродзержинськ", "Kamianske", "Kamenskoe", "Dneprodzerzhinsk"], regionRu: "Днепропетровская область", regionUk: "Дніпропетровська область", priority: 20 }),
  city({ id: "pavlohrad", labelRu: "Павлоград", labelUk: "Павлоград", aliases: ["Pavlohrad", "Pavlograd"], regionRu: "Днепропетровская область", regionUk: "Дніпропетровська область", priority: 30 }),
  city({ id: "khmelnytskyi", labelRu: "Хмельницкий", labelUk: "Хмельницький", aliases: ["Хмельницький", "Khmelnytskyi", "Khmelnytsky"], regionRu: "Хмельницкая область", regionUk: "Хмельницька область", priority: 10, olx: { slug: "khmelnitskiy" } }),
  city({ id: "kremenchuk", labelRu: "Кременчуг", labelUk: "Кременчук", aliases: ["Кременчук", "Kremenchuk"], regionRu: "Полтавская область", regionUk: "Полтавська область", priority: 20 }),
  city({ id: "mariupol", labelRu: "Мариуполь", labelUk: "Маріуполь", aliases: ["Маріуполь", "Mariupol"], regionRu: "Донецкая область", regionUk: "Донецька область", priority: 20 }),
  city({ id: "makiivka", labelRu: "Макеевка", labelUk: "Макіївка", aliases: ["Макіївка", "Makiivka", "Makeevka"], regionRu: "Донецкая область", regionUk: "Донецька область", priority: 20 }),
  city({ id: "horlivka", labelRu: "Горловка", labelUk: "Горлівка", aliases: ["Горлівка", "Horlivka", "Gorlovka"], regionRu: "Донецкая область", regionUk: "Донецька область", priority: 20 }),
  city({ id: "kramatorsk", labelRu: "Краматорск", labelUk: "Краматорськ", aliases: ["Краматорськ", "Kramatorsk"], regionRu: "Донецкая область", regionUk: "Донецька область", priority: 30 }),
  city({ id: "sloviansk", labelRu: "Славянск", labelUk: "Слов'янськ", aliases: ["Слов’янськ", "Sloviansk", "Slavyansk"], regionRu: "Донецкая область", regionUk: "Донецька область", priority: 30 }),
  city({ id: "melitopol", labelRu: "Мелитополь", labelUk: "Мелітополь", aliases: ["Мелітополь", "Melitopol"], regionRu: "Запорожская область", regionUk: "Запорізька область", priority: 30 }),
  city({ id: "berdiansk", labelRu: "Бердянск", labelUk: "Бердянськ", aliases: ["Бердянськ", "Berdiansk", "Berdyansk"], regionRu: "Запорожская область", regionUk: "Запорізька область", priority: 30 }),
  city({ id: "alchevsk", labelRu: "Алчевск", labelUk: "Алчевськ", aliases: ["Алчевськ", "Alchevsk"], regionRu: "Луганская область", regionUk: "Луганська область", priority: 30 }),
  city({ id: "sievierodonetsk", labelRu: "Северодонецк", labelUk: "Сєвєродонецьк", aliases: ["Сєвєродонецьк", "Sievierodonetsk", "Severodonetsk"], regionRu: "Луганская область", regionUk: "Луганська область", priority: 30 }),
  city({ id: "sevastopol", labelRu: "Севастополь", labelUk: "Севастополь", aliases: ["Sevastopol"], regionRu: "г. Севастополь", regionUk: "м. Севастополь", priority: 20 }),
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

export function publicCities(): Pick<CityConfig, "id" | "labelRu" | "labelUk" | "aliases" | "regionRu" | "regionUk" | "priority">[] {
  return cities
    .map(({ id, labelRu, labelUk, aliases, regionRu, regionUk, priority }) => ({ id, labelRu, labelUk, aliases, regionRu, regionUk, priority }))
    .sort((left, right) => (left.priority ?? 50) - (right.priority ?? 50) || left.labelRu.localeCompare(right.labelRu, "ru"));
}
