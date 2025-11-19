export interface AnalyticsEvent {
  event_type: string
  event_data?: Record<string, any>
  book_id?: string
  book_title?: string
  book_author?: string
}

export interface ReadingStats {
  totalBooks: number
  booksRead: number
  booksWanted: number
  booksPassed: number
  favoriteGenres: string[]
  readingStreak: number
  averageBooksPerMonth: number
  totalAuthors: number
  recentActivity: AnalyticsEvent[]
}

function saveAnalyticsToLocalStorage(userId: string, event: AnalyticsEvent) {
  if (typeof window === "undefined") return

  const key = `analytics_${userId}`
  const existing = localStorage.getItem(key)
  const events = existing ? JSON.parse(existing) : []

  events.push({
    ...event,
    created_at: new Date().toISOString(),
    user_id: userId,
  })

  // Keep only last 1000 events to prevent localStorage bloat
  if (events.length > 1000) {
    events.splice(0, events.length - 1000)
  }

  localStorage.setItem(key, JSON.stringify(events))
}

function loadAnalyticsFromLocalStorage(userId: string): any[] {
  if (typeof window === "undefined") return []

  const key = `analytics_${userId}`
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

// Track user events
export async function trackEvent(userId: string, event: AnalyticsEvent) {
  try {
    saveAnalyticsToLocalStorage(userId, event)
  } catch (error) {
    console.error("Error tracking analytics event:", error)
  }
}

// Get user reading statistics
export async function getUserReadingStats(userId: string): Promise<ReadingStats> {
  try {
    const events = loadAnalyticsFromLocalStorage(userId)

    if (events.length === 0) {
      return getDefaultStats()
    }

    // Calculate statistics
    const bookEvents = events.filter((e) => e.book_id)
    const readEvents = events.filter((e) => e.event_type === "book_marked_read")
    const wantEvents = events.filter((e) => e.event_type === "book_marked_want")
    const passEvents = events.filter((e) => e.event_type === "book_marked_pass")
    const authorEvents = events.filter((e) => e.event_type === "author_added")

    // Get unique books and authors
    const uniqueBooks = new Set(bookEvents.map((e) => e.book_id).filter(Boolean))
    const uniqueAuthors = new Set(authorEvents.map((e) => e.event_data?.author_name).filter(Boolean))

    // Calculate favorite genres from book events
    const genreCounts: Record<string, number> = {}
    bookEvents.forEach((event) => {
      const genres = event.event_data?.genres || []
      genres.forEach((genre: string) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1
      })
    })

    const favoriteGenres = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre)

    // Calculate reading streak (consecutive days with reading activity)
    const readingStreak = calculateReadingStreak(events)

    // Calculate average books per month
    const firstEvent = events[events.length - 1]
    const monthsSinceStart = firstEvent
      ? Math.max(1, Math.ceil((Date.now() - new Date(firstEvent.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)))
      : 1
    const averageBooksPerMonth = Math.round((readEvents.length / monthsSinceStart) * 10) / 10

    return {
      totalBooks: uniqueBooks.size,
      booksRead: readEvents.length,
      booksWanted: wantEvents.length,
      booksPassed: passEvents.length,
      favoriteGenres,
      readingStreak,
      averageBooksPerMonth,
      totalAuthors: uniqueAuthors.size,
      recentActivity: events.slice(0, 10),
    }
  } catch (error) {
    console.error("Error calculating reading stats:", error)
    return getDefaultStats()
  }
}

function calculateReadingStreak(events: any[]): number {
  const readEvents = events
    .filter((e) => e.event_type === "book_marked_read")
    .map((e) => new Date(e.created_at).toDateString())

  const uniqueDates = [...new Set(readEvents)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  if (uniqueDates.length === 0) return 0

  let streak = 1
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()

  // Check if the most recent reading was today or yesterday
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0
  }

  // Count consecutive days
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i - 1])
    const nextDate = new Date(uniqueDates[i])
    const dayDifference = Math.floor((currentDate.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24))

    if (dayDifference === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

function getDefaultStats(): ReadingStats {
  return {
    totalBooks: 0,
    booksRead: 0,
    booksWanted: 0,
    booksPassed: 0,
    favoriteGenres: [],
    readingStreak: 0,
    averageBooksPerMonth: 0,
    totalAuthors: 0,
    recentActivity: [],
  }
}

// Predefined event types for consistency
export const ANALYTICS_EVENTS = {
  BOOK_MARKED_READ: "book_marked_read",
  BOOK_MARKED_UNREAD: "book_marked_unread",
  BOOK_MARKED_WANT: "book_marked_want",
  BOOK_MARKED_PASS: "book_marked_pass",
  BOOK_STATUS_CHANGED: "book_status_changed",
  AUTHOR_ADDED: "author_added",
  AUTHOR_REMOVED: "author_removed",
  BOOK_SEARCH: "book_search",
  FILTER_APPLIED: "filter_applied",
  BOOK_SHARED: "book_shared",
  BOOK_RECOMMENDED: "book_recommended",
  PROFILE_UPDATED: "profile_updated",
  LOGIN: "login",
  SIGNUP: "signup",
} as const
