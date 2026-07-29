import { cities, publicCities, resolveCity } from "../api/_cities.js";

const cases: Record<string, string[]> = {
  kyiv: ["Киев", "Київ", "Kyiv", "Kiev"],
  zaporizhzhia: ["Запорожье", "Запоріжжя", "Zaporizhzhia", "Zaporozhye"],
  dnipro: ["Днепр", "Дніпро", "Днепропетровск", "Dnipro"],
  kropyvnytskyi: ["Кропивницкий", "Кировоград", "Кропивницький"],
  lviv: ["Львов", "Львів", "Lviv", "Lvov"],
};

for (const [id, aliases] of Object.entries(cases)) {
  for (const alias of aliases) {
    const city = resolveCity(alias);
    if (city?.id !== id) throw new Error(`${alias}: expected ${id}, got ${city?.id || "undefined"}`);
  }
}

const ids = new Set<string>();
const aliases = new Map<string, string>();
for (const city of cities) {
  if (ids.has(city.id)) throw new Error(`Duplicate city id: ${city.id}`);
  ids.add(city.id);
  for (const value of [city.id, city.labelRu, city.labelUk, ...city.aliases]) {
    const key = value.trim().toLowerCase().replace(/ё/g, "е");
    const previous = aliases.get(key);
    if (previous && previous !== city.id) throw new Error(`Conflicting alias ${value}: ${previous} / ${city.id}`);
    aliases.set(key, city.id);
  }
  for (const source of ["olx", "dimria", "rieltor"] as const) {
    const mapping = city[source];
    if (mapping && mapping.slug === "undefined") throw new Error(`${city.id}/${source}: invalid slug`);
  }
}
if (resolveCity("unknown-city") !== undefined) throw new Error("Unknown city was accepted");
const published = publicCities();
if (published.length !== cities.length || published.some(city => !city.regionRu || !city.regionUk)) throw new Error("Searchable select did not receive every city with a region");
console.log("City aliases resolved:", Object.values(cases).flat().length, "registry:", cities.length);
