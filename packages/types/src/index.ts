/**
 * @deetravel/types — Firestore data model for Dee Travel.
 *
 * Grounded in the REAL data verified in the Phase 0 audit (2026-07-15), then
 * extended with the additive fields the rebuild needs (status / SEO / marketing).
 *
 * Conventions
 * -----------
 * - Fields marked `// legacy` exist in the current production documents as-is
 *   (note the snake_case — that is how Flamelink stored them; we keep the names
 *   to make migration additive rather than a rename).
 * - Fields marked `// additive` do NOT exist yet. They are optional here so
 *   existing docs type-check, and get backfilled during migration.
 *
 * The package is dependency-free: Firestore primitives are modelled with the
 * minimal shapes below so this can be imported by any app or a Cloud Function
 * without pulling in the Firebase SDK.
 */

/** Firestore Timestamp (minimal shape). */
export interface Timestamp {
  seconds: number
  nanoseconds: number
  toDate(): Date
}

/** Firestore GeoPoint. */
export interface GeoPoint {
  latitude: number
  longitude: number
}

/**
 * A reference to another document, stored as its full path
 * e.g. "provinces/2sXk...". `T` is a phantom type for readability.
 */
export type Ref<T> = string & { readonly __ref?: T }

/** ISO date string, e.g. "2026-07-15T06:33:51.124Z". */
export type IsoDate = string

// ---------------------------------------------------------------------------
// Shared / additive
// ---------------------------------------------------------------------------

/** Publishing workflow state. Additive — legacy content is treated as published. */
export type ContentStatus = 'draft' | 'ready' | 'scheduled' | 'published' | 'archived'

/** A stored image. Legacy `cover` is a folder path; files live at `{cover}/{size}.jpg`. */
export interface ImageVariants {
  /** Base folder path, e.g. "/images/places/{id}/cover". */
  path: string
  large?: string
  medium?: string
  thumbnail?: string
  /** ~6KB blur placeholder (LQIP). */
  tiny?: string
  alt?: string
  width?: number
  height?: number
}

/** SEO + social metadata. Additive. */
export interface SeoMeta {
  metaTitle?: string
  metaDescription?: string
  ogImagePath?: string
  canonicalUrl?: string
}

/** Denormalised marketing rollup kept on the content doc. Additive. */
export interface MarketingSummary {
  assetCount: number
  usageCount: number
  lastPostedAt?: Timestamp
}

/** Fields mixed into every content type (places / articles / events). */
export interface ContentBase {
  id: string
  slug: string
  name: string
  excerpt: string
  /** Rich HTML body. */
  content: string
  cover: string // legacy: folder path -> `${cover}/{size}.jpg`
  category: Ref<Category>[] // legacy
  createdAt: Timestamp // legacy
  updatedAt?: Timestamp // legacy (present on places)

  // --- additive ---
  status?: ContentStatus // additive
  featured?: boolean // additive
  publishedAt?: Timestamp // additive
  tags?: string[] // additive
  gallery?: ImageVariants[] // additive
  seo?: SeoMeta // additive
  marketingSummary?: MarketingSummary // additive
}

// ---------------------------------------------------------------------------
// Geography tree: geographies > provinces > districts > subdistricts
// ---------------------------------------------------------------------------

export interface Geography {
  id: string
  name: string
  slug?: string
}

export interface Province {
  id: string
  name: string
  slug?: string
  geography?: Ref<Geography>
}

export interface District {
  id: string
  name: string
  province?: Ref<Province>
}

export interface Subdistrict {
  id: string
  name: string
  district?: Ref<District>
}

export interface Category {
  id: string
  name: string
  slug?: string
  parent?: Ref<Category> // additive
}

// ---------------------------------------------------------------------------
// Core content
// ---------------------------------------------------------------------------

/** Kind of place. Currently encoded via `category` refs; promoted to a field. Additive. */
export type PlaceType = 'attraction' | 'restaurant' | 'cafe' | 'hotel' | 'activity'

export interface OpenHour {
  day?: number // 0-6
  open?: string // "09:00"
  close?: string // "17:00"
}

export interface Place extends ContentBase {
  format_address: string // legacy
  getting: string // legacy — how to get there ("-" when unknown)
  phone: string // legacy ("-" when unknown)
  website: string // legacy ("-" when unknown)
  position: GeoPoint // legacy — lat/lng
  open_hours: OpenHour[] // legacy (often empty)
  geography: Ref<Geography> // legacy
  province: Ref<Province> // legacy
  district: Ref<District> // legacy
  subdistrict: Ref<Subdistrict> // legacy

  type?: PlaceType // additive
  priceRange?: string // additive
  amenities?: string[] // additive
  rating?: number // additive
  reviewCount?: number // additive
}

export type ArticleType = 'guide' | 'listicle' | 'story' | 'tips' | 'news'

export interface Article extends ContentBase {
  type?: ArticleType // additive
  relatedPlaces?: Ref<Place>[] // additive
  readingTime?: number // additive (minutes)
}

/** A date span for an event. Legacy `period` is an array of these. */
export interface EventPeriod {
  date: Timestamp
}

export interface EventItem extends ContentBase {
  period: EventPeriod[] // legacy — one or more date ranges
  place: Ref<Place>[] // legacy — related places (often empty)
  geography?: Ref<Geography> // legacy on some docs

  startDate?: Timestamp // additive (normalised from period)
  endDate?: Timestamp // additive
  recurring?: boolean // additive
}

// ---------------------------------------------------------------------------
// Marketing (new in the rebuild) — powers the Facebook toolkit
// ---------------------------------------------------------------------------

export type PostType =
  | 'educational'
  | 'recommendation'
  | 'promotion'
  | 'engagement'
  | 'question'
  | 'listicle'
  | 'seasonal'
  | 'storytelling'

export type Tone = 'friendly' | 'informative' | 'salesy' | 'engagement'

export type CreativeFormat = 'single' | 'carousel' | 'reel' | 'story' | 'album'

export type MarketingStatus = 'draft' | 'ready' | 'scheduled' | 'published'

export type ContentCollection = 'places' | 'articles' | 'events'

export interface MarketingCaptions {
  short: string
  long: string
  friendly: string
  salesy: string
  engagement: string
}

export interface MarketingPerformance {
  reach?: number
  engagement?: number
  clicks?: number
  shares?: number
  fetchedAt?: Timestamp
}

/** marketingAssets/{assetId} */
export interface MarketingAsset {
  id: string
  content: { collection: ContentCollection; id: string; type: 'place' | 'article' | 'event' }
  postType: PostType
  tone: Tone
  captions: MarketingCaptions
  headline: string
  shortDescription: string
  imageOverlayText?: string
  highlights: string[]
  hashtags: { th: string[]; en: string[] }
  cta: string
  creativeFormat: CreativeFormat
  recommendedImages: string[] // Storage paths
  imageSpec: { ratio: '1:1' | '4:5' | '9:16'; size: string }
  suggestedAudience?: string
  suggestedPostDate?: Timestamp
  status: MarketingStatus
  generatedBy: 'template' | 'ai'
  fbPostUrl?: string
  performance?: MarketingPerformance
  usageCount: number
  lastUsedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

/** contentCalendar/{entryId} */
export interface ContentCalendarEntry {
  id: string
  marketingAssetId: string
  scheduledDate: Timestamp
  channel: 'facebook'
  status: 'planned' | 'ready' | 'scheduled' | 'published'
}

// ---------------------------------------------------------------------------
// Users / auth
// ---------------------------------------------------------------------------

export type UserRole = 'admin' | 'editor' | 'viewer'

/** users/{uid} — role is ALSO enforced via a custom claim, not just this doc. */
export interface UserProfile {
  id: string
  email: string
  displayName?: string
  role: UserRole
  createdAt?: Timestamp
}

/** Collection id -> document type. */
export interface Collections {
  places: Place
  articles: Article
  events: EventItem
  categories: Category
  geographies: Geography
  provinces: Province
  districts: District
  subdistricts: Subdistrict
  users: UserProfile
  marketingAssets: MarketingAsset
  contentCalendar: ContentCalendarEntry
}

export type CollectionId = keyof Collections
