import { resolveCity } from "../api/_cities.js";

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
console.log("City aliases resolved:", Object.values(cases).flat().length);
