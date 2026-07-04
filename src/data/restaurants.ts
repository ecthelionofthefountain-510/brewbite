import type { LunchDish, OpenRule, Restaurant, Weekday } from '../types'
import { MON_FRI, TUE_FRI, ALL_DAYS } from '../types'

/**
 * Ystad-restauranger.
 *
 * Namn, adresser och koordinater är riktiga (geokodade via OpenStreetMap).
 * Öppettider, lunchdagar och taggar bygger på publik info och bör dubbelkollas.
 * De flesta ställen saknar ännu meny i appen — där visas "serverar lunch" med
 * länk vidare. Ett fåtal har en GENERISK exempelmeny (menuIsExample: true) bara
 * för att visa hur menyvyn ser ut; de är inte verifierade rätter.
 *
 * Lägg till en ny restaurang genom att kopiera ett objekt nedan.
 */

// Ystads centrum ligger ungefär vid 55.4297, 13.8204.
export const YSTAD_CENTER = { lat: 55.4297, lng: 13.8204 }

/** Liten generisk exempelmeny för att demonstrera menyvyn. */
const exampleMenu = (): Partial<Record<Weekday, LunchDish[]>> => {
  const day: LunchDish[] = [
    { name: 'Dagens kött', tags: ['meat'] },
    { name: 'Veckans fisk', tags: ['fish'] },
    { name: 'Vegetariskt alternativ', tags: ['veg'] },
  ]
  return { mon: day, tue: day, wed: day, thu: day, fri: day }
}

export const restaurants: Restaurant[] = [
  {
    id: 'grandens-mat',
    name: 'Grändens Mat',
    area: 'Ystad centrum',
    address: 'Piparegränd 3, Ystad',
    lat: 55.4299499,
    lng: 13.8270322,
    hours: 'Mån–lör 11:00–15:30, sön 12:00–15:30',
    lunchDays: ALL_DAYS,
    tags: ['husmanskost'],
    website: 'https://www.grandensmat.se/lunchmeny/',
  },
  {
    id: 'tumult',
    name: 'Tumült',
    area: 'Östra Förstaden, Ystad',
    address: 'Björnstjernegatan 5, Ystad',
    lat: 55.4323972,
    lng: 13.8426424,
    hours: 'Tis–fre 11:30–14:00',
    lunchDays: TUE_FRI,
    tags: ['sydeuropeisk', 'fine-dining'],
    website: 'https://www.tumult.se',
    menu: exampleMenu(),
    menuIsExample: true,
  },
  {
    id: 'marinan',
    name: 'Marinan',
    area: 'Ystad hamn',
    address: 'Segelgatan, Ystad',
    lat: 55.4262049,
    lng: 13.8138056,
    hours: 'Alla dagar 11:30–sent',
    lunchDays: ALL_DAYS,
    tags: ['havsutsikt'],
    website: 'https://www.ystadmarinan.se/maten/',
  },
  {
    id: 'port-ysb',
    name: 'Port (Ystad Saltsjöbad)',
    area: 'Sandskogen',
    address: 'Saltsjöbadsvägen, Ystad',
    lat: 55.4250941,
    lng: 13.8487123,
    price: 135,
    hours: 'Mån–fre 11:30–13:30',
    lunchDays: MON_FRI,
    tags: ['fransk', 'havsutsikt', 'fine-dining'],
    website: 'https://www.ysb.se/restaurang/port/lunch/',
    note: '135 kr inkl. sallad, bröd & kaffe. Havsutsikt.',
    menu: exampleMenu(),
    menuIsExample: true,
  },
  {
    id: 'tryffelsvinet',
    name: 'Tryffelsvinet',
    area: 'Ystad centrum',
    address: 'Hamngatan 1B, Ystad',
    lat: 55.4271457,
    lng: 13.824579,
    hours: 'Ons–fre 11:30–15:00',
    lunchDays: ['wed', 'thu', 'fri'],
    tags: ['italiensk'],
    website: 'https://tryffelsvinetystad.se',
    note: 'Italiensk kvarterskrog i gamla stationshuset. Lunch inkl. bröd & bryggkaffe.',
  },
  {
    id: 'brasserie-du-sud',
    name: 'Brasserie du Sud',
    area: 'Ystad centrum',
    address: 'Hamngatan 13, Ystad (Hotell Continental)',
    lat: 55.4277877,
    lng: 13.8219654,
    hours: 'Mån–fre 11:30–14:00',
    lunchDays: MON_FRI,
    tags: ['fransk', 'fine-dining'],
    website: 'https://hotellcontinental.se/restaurang-och-bar',
    menu: exampleMenu(),
    menuIsExample: true,
  },
  {
    id: 'bakfickan',
    name: 'Bakfickan',
    area: 'Ystad hamn',
    address: 'Tullgatan, Ystad',
    lat: 55.4281419,
    lng: 13.8220085,
    hours: 'Lunch alla dagar 12:00–15:00 (även kvällsservering)',
    lunchDays: ALL_DAYS,
    tags: [],
    note: 'Sommaröppet. Kväll: mån–tor 17–23, fre–lör 17–24, sön till 22.',
    website: 'https://hotellcontinental.se/restaurang/',
  },
  {
    id: 'backahasten',
    name: 'Bäckahästen',
    area: 'Ystad centrum',
    address: 'Stortorget, Ystad',
    lat: 55.4303513,
    lng: 13.8211017,
    hours: 'Alla dagar 10:00–18:00 (maj–aug)',
    lunchDays: ALL_DAYS,
    tags: ['husmanskost'],
    note: 'Öppet maj–aug.',
  },
  {
    id: 'havsnara',
    name: 'Havsnära Fiskrökeri',
    area: 'Ystad hamn',
    address: 'Segelgatan 17, Ystad',
    lat: 55.4263448,
    lng: 13.8130818,
    hours: 'Lunch – se aktuella tider',
    lunchDays: MON_FRI,
    tags: ['fisk', 'havsutsikt'],
    website: 'https://havsnara.com',
    note: 'Hemrökt fisk och pajer vid marinan.',
    menu: {
      mon: [{ name: 'Dagens rökta fisk med tillbehör', tags: ['fish'] }],
      tue: [{ name: 'Dagens rökta fisk med tillbehör', tags: ['fish'] }],
      wed: [{ name: 'Dagens rökta fisk med tillbehör', tags: ['fish'] }],
      thu: [{ name: 'Dagens rökta fisk med tillbehör', tags: ['fish'] }],
      fri: [{ name: 'Dagens rökta fisk med tillbehör', tags: ['fish'] }],
    },
    menuIsExample: true,
  },
  {
    id: 'hos-morten',
    name: 'Hos Morten Bookcafé',
    area: 'Ystad centrum',
    address: 'Gåsegränd, Ystad',
    lat: 55.4306505,
    lng: 13.8242911,
    hours: 'Tis–lör fr. 11:30 (à la carte dagligen under högsommaren)',
    lunchDays: ['tue', 'wed', 'thu', 'fri', 'sat'],
    tags: ['kafe'],
    note: 'Dagens soppa, bakad potatis, varmrökt lax, bruschetta & sallader.',
    website: 'https://hosmortencafe.se',
  },
  {
    id: 'lisas-skafferi',
    name: 'Lisas Skafferi',
    area: 'Ystad centrum',
    address: 'Spanienfararegatan, Ystad',
    lat: 55.4267712,
    lng: 13.8216445,
    hours: 'Mån–fre 11:30–13:30 (avhämtning)',
    lunchDays: MON_FRI,
    tags: ['kafe'],
    note: 'Avhämtning: dagens varmrätt, soppa med bröd, paj & pastasallader.',
    website: 'https://www.lisasskafferi.se/dagens-lunch/',
  },
  {
    id: 'fritidsbaren',
    name: 'Fritidsbaren',
    area: 'Sandskogen',
    address: 'Fritidsvägen 16, Ystad',
    lat: 55.4297311,
    lng: 13.8610138,
    hours: 'Alla dagar 11:00–20:00',
    lunchDays: ALL_DAYS,
    tags: ['kafe', 'havsutsikt'],
    note: 'I Sandskogen, känd för sina wienerbröd.',
    website: 'https://www.facebook.com/fritidsbaren/',
  },
  {
    id: 'jaktpaviljongen',
    name: 'Jaktpaviljongen',
    area: 'Sandskogen',
    address: 'Jaktpaviljongsvägen 1, Ystad',
    lat: 55.4322281,
    lng: 13.8645975,
    hours: 'Vardagar fr. 11:30, helg fr. 12:00',
    lunchDays: ALL_DAYS,
    tags: ['husmanskost'],
    website: 'https://www.jaktpaviljongen.se',
    note: 'I Sandskogen. Öppet maj–aug.',
  },
]

/**
 * Strukturerade lunchtider per restaurang-id, för "Öppet nu"-status.
 * Ungefärliga och bör verifieras. Ställen som saknas här (t.ex. okänd tid)
 * får ingen öppet-nu-markering.
 */
export const openHours: Record<string, OpenRule[]> = {
  'grandens-mat': [
    { days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'], from: '11:00', to: '15:30' },
    { days: ['sun'], from: '12:00', to: '15:30' },
  ],
  tumult: [{ days: TUE_FRI, from: '11:30', to: '14:00' }],
  marinan: [{ days: ALL_DAYS, from: '11:30', to: '23:00' }],
  'port-ysb': [{ days: MON_FRI, from: '11:30', to: '13:30' }],
  tryffelsvinet: [{ days: ['wed', 'thu', 'fri'], from: '11:30', to: '15:00' }],
  'brasserie-du-sud': [{ days: MON_FRI, from: '11:30', to: '14:00' }],
  bakfickan: [{ days: ALL_DAYS, from: '12:00', to: '15:00' }],
  backahasten: [{ days: ALL_DAYS, from: '10:00', to: '18:00' }],
  'hos-morten': [{ days: ['tue', 'wed', 'thu', 'fri', 'sat'], from: '11:30', to: '15:00' }],
  'lisas-skafferi': [{ days: MON_FRI, from: '11:30', to: '13:30' }],
  fritidsbaren: [{ days: ALL_DAYS, from: '11:00', to: '20:00' }],
  jaktpaviljongen: [
    { days: MON_FRI, from: '11:30', to: '20:00' },
    { days: ['sat', 'sun'], from: '12:00', to: '20:00' },
  ],
}
