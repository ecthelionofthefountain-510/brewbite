export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: 'Måndag',
  tue: 'Tisdag',
  wed: 'Onsdag',
  thu: 'Torsdag',
  fri: 'Fredag',
  sat: 'Lördag',
  sun: 'Söndag',
}

/** Genväg för vanliga lunchdags-uppsättningar. */
export const MON_FRI: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri']
export const TUE_FRI: Weekday[] = ['tue', 'wed', 'thu', 'fri']
export const ALL_DAYS: Weekday[] = [...WEEKDAYS]

/** Kost-märkning på en enskild rätt. */
export type DishTag = 'veg' | 'vegan' | 'fish' | 'meat' | 'gluten-free'

export const DISH_TAG_LABEL: Record<DishTag, string> = {
  veg: 'Vegetariskt',
  vegan: 'Veganskt',
  fish: 'Fisk',
  meat: 'Kött',
  'gluten-free': 'Glutenfritt',
}

export interface LunchDish {
  name: string
  description?: string
  tags?: DishTag[]
}

/**
 * Tagg på restaurangnivå — kök, typ av ställe eller kost-inriktning.
 * Används av filtren och beskriver stället, inte en specifik rätt.
 */
export type Tag =
  | 'husmanskost'
  | 'fransk'
  | 'italiensk'
  | 'sydeuropeisk'
  | 'fisk'
  | 'vegetariskt'
  | 'ekologiskt'
  | 'kafe'
  | 'pub'
  | 'bar'
  | 'fine-dining'
  | 'havsutsikt'

export const TAG_LABEL: Record<Tag, string> = {
  husmanskost: 'Husmanskost',
  fransk: 'Franskt',
  italiensk: 'Italienskt',
  sydeuropeisk: 'Sydeuropeiskt',
  fisk: 'Fisk & skaldjur',
  vegetariskt: 'Vegetariskt',
  ekologiskt: 'Ekologiskt',
  kafe: 'Kafé',
  pub: 'Pub',
  bar: 'Bar',
  'fine-dining': 'Fine dining',
  havsutsikt: 'Havsutsikt',
}

/** Taggar som visas som filterchips (i denna ordning). */
export const FILTER_TAGS: Tag[] = [
  'fisk',
  'vegetariskt',
  'husmanskost',
  'fransk',
  'italiensk',
  'kafe',
  'pub',
  'havsutsikt',
]

export interface Restaurant {
  id: string
  name: string
  /** Stadsdel/ort, t.ex. "Ystad centrum". */
  area: string
  address: string
  lat: number
  lng: number
  /** Ungefärligt lunchpris i kronor. Saknas → okänt. */
  price?: number
  /** Serveringstider, fri text. */
  hours: string
  /** Dagar då lunch serveras. */
  lunchDays: Weekday[]
  /** Kök/typ/kost — driver filtren. */
  tags: Tag[]
  website?: string
  /** Extra info, t.ex. "Öppet maj–aug" eller pris-detaljer. */
  note?: string
  /** Meny per veckodag. Oftast tom — fylls på med riktiga menyer. */
  menu?: Partial<Record<Weekday, LunchDish[]>>
  /** True om menyn ovan är exempeldata, inte en verifierad meny. */
  menuIsExample?: boolean
}
