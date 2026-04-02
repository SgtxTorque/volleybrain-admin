// ============================================
// YOUTUBE HELPERS — URL parsing and thumbnail extraction
// ============================================

/**
 * Extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractYouTubeId(url) {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Get thumbnail URL for a YouTube video
 */
export function getYouTubeThumbnail(videoId, quality = 'hqdefault') {
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

/**
 * Get embed URL for a YouTube video
 */
export function getYouTubeEmbedUrl(videoId) {
  if (!videoId) return null
  return `https://www.youtube.com/embed/${videoId}`
}

/**
 * Check if a URL is a YouTube URL
 */
export function isYouTubeUrl(url) {
  return extractYouTubeId(url) !== null
}

/**
 * Process a pasted URL: extract ID, build thumbnail and embed URLs
 */
export function processVideoUrl(url) {
  const videoId = extractYouTubeId(url)
  if (!videoId) return { isValid: false, videoId: null, thumbnailUrl: null, embedUrl: null }

  return {
    isValid: true,
    videoId,
    thumbnailUrl: getYouTubeThumbnail(videoId),
    embedUrl: getYouTubeEmbedUrl(videoId),
    source: 'youtube',
  }
}

/**
 * Fetch video metadata from YouTube oEmbed API (no API key needed).
 * Returns { title, author, thumbnailUrl } or null on failure.
 */
export async function fetchYouTubeMetadata(videoUrl) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
    )
    if (!response.ok) return null
    const data = await response.json()
    return {
      title: data.title || '',
      author: data.author_name || '',
      thumbnailUrl: data.thumbnail_url || null,
    }
  } catch {
    return null
  }
}
