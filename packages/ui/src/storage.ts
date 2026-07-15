/**
 * Build public Firebase Storage download URLs.
 *
 * Legacy convention (verified in Phase 0): a place's `cover` is a FOLDER path
 * like "/images/places/{id}/cover", and the actual files live at
 * "{cover}/{large|medium|thumbnail|tiny}.jpg". Public read is enabled, so the
 * tokenless firebasestorage download URL works directly (CDN-friendly).
 */
export function storageUrl(bucket: string, path: string): string {
  const clean = path.replace(/^\/+/, '')
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(clean)}?alt=media`
}

export interface CoverVariants {
  /** ~6KB blur-up placeholder. */
  tiny: string
  thumbnail: string
  medium: string
  large: string
}

export function coverVariants(bucket: string, cover: string): CoverVariants {
  const base = cover.replace(/\/+$/, '')
  return {
    tiny: storageUrl(bucket, `${base}/tiny.jpg`),
    thumbnail: storageUrl(bucket, `${base}/thumbnail.jpg`),
    medium: storageUrl(bucket, `${base}/medium.jpg`),
    large: storageUrl(bucket, `${base}/large.jpg`),
  }
}
