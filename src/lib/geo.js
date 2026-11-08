import { BOLLE_COUNTRIES } from "./bolleCore.jsx";

export const COUNTRY_CODES = "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" ");

let countryListCache = null;

export function countryList() {
  if (countryListCache) return countryListCache;
  let names = null;
  try {
    names = new Intl.DisplayNames(["it"], { type: "region" });
  } catch {
    names = null;
  }
  const list = names
    ? COUNTRY_CODES.map(code => ({ code, name: names.of(code) }))
        .filter(c => c.name && c.name !== c.code)
        .sort((a, b) => a.name.localeCompare(b.name, "it"))
    : BOLLE_COUNTRIES;
  countryListCache = list;
  return list;
}

// Paese derivato dalla nazionalità dichiarata nel profilo, senza geolocalizzazione.
export function bolleCountryFromNationality(value) {
  const normalize = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const input = normalize(value);
  if (!input) return "";
  const aliases = {
    IT: ["italia", "italiana", "italiano", "italian", "italy"],
    FR: ["francia", "francese", "francese", "french", "france"],
    DE: ["germania", "tedesca", "tedesco", "german", "germany"],
    ES: ["spagna", "spagnola", "spagnolo", "spanish", "spain"],
    GB: ["regno unito", "britannica", "britannico", "inglese", "british", "english", "united kingdom"],
    US: ["stati uniti", "americana", "americano", "american", "united states", "usa"],
    CH: ["svizzera", "svizzero", "svizzera", "swiss", "switzerland"],
    PT: ["portogallo", "portoghese", "portuguese", "portugal"],
    RO: ["romania", "rumena", "rumeno", "romena", "romeno", "romanian"],
    AL: ["albania", "albanese", "albanian"],
    MA: ["marocco", "marocchina", "marocchino", "moroccan", "morocco"],
    TN: ["tunisia", "tunisina", "tunisino", "tunisian"],
    EG: ["egitto", "egiziana", "egiziano", "egyptian"],
    BR: ["brasile", "brasiliana", "brasiliano", "brazilian", "brazil"],
    AR: ["argentina", "argentino", "argentina", "argentinian"],
    IN: ["india", "indiana", "indiano", "indian"],
    CN: ["cina", "cinese", "chinese", "china"],
    JP: ["giappone", "giapponese", "japanese", "japan"],
    UA: ["ucraina", "ucraino", "ucraina", "ukrainian", "ukraine"],
    PL: ["polonia", "polacca", "polacco", "polish", "poland"],
    GR: ["grecia", "greca", "greco", "greek", "greece"],
    TR: ["turchia", "turca", "turco", "turkish", "turkey"],
    NL: ["paesi bassi", "olanda", "olandese", "dutch", "netherlands"],
    BE: ["belgio", "belga", "belgian", "belgium"],
    AT: ["austria", "austriaca", "austriaco", "austrian"],
    HR: ["croazia", "croata", "croato", "croatian"],
    RS: ["serbia", "serba", "serbo", "serbian"],
    RU: ["russia", "russa", "russo", "russian"],
  };
  const found = BOLLE_COUNTRIES.find((c) => normalize(c.name) === input || normalize(c.code) === input);
  if (found) return found.code;
  const fromFullList = countryList().find((c) => normalize(c.name) === input);
  if (fromFullList) return fromFullList.code;
  return Object.entries(aliases).find(([, values]) => values.includes(input))?.[0] || "";
}

export const MONTHS_IT = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

export function romeToday() {
  const s = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function isoDay(dt) {
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

export function ageFromBirthDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age;
}
