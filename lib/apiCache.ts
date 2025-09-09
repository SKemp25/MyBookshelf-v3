
// Helper function to convert HTTP URLs to HTTPS
function ensureHttps(url: string): string {
  if (!url) return url
  return url.replace(/^http:\/\//, 'https://')
}

// Simple in-memory cache for API responses
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  clear(): void {
    this.cache.clear()
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Global cache instance
export const apiCache = new APICache()

// Cache key generators
export const getAuthorBooksCacheKey = (authorName: string): string => 
  `author-books:${authorName.toLowerCase().trim()}`

export const getRecommendationsCacheKey = (authors: string[], genres: string[], languages: string[]): string => 
  `recommendations:${authors.sort().join(',')}:${genres.sort().join(',')}:${languages.sort().join(',')}`

export const getBookSearchCacheKey = (query: string): string => 
  `book-search:${query.toLowerCase().trim()}`

// Cached API functions
export async function fetchAuthorBooksWithCache(authorName: string): Promise<any[]> {
  const cacheKey = getAuthorBooksCacheKey(authorName)
  
  // Check cache first
  const cached = apiCache.get(cacheKey)
  if (cached) {
    console.log(`Cache hit for author: ${authorName}`)
    return cached
  }

  console.log(`Cache miss for author: ${authorName}, fetching from API`)
  
  try {
    const queries = [
      `inauthor:"${encodeURIComponent(authorName)}"`,
      `"${encodeURIComponent(authorName)}" author`,
    ]

    let allBooks: any[] = []

    for (const query of queries) {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40&orderBy=newest&printType=books`,
      )
      
      if (!response.ok) continue
      
      const data = await response.json()
      if (data.items) {
        // Process the raw API data into proper Book objects
        const processedBooks = data.items.map((item: any) => {
          let publishedDate = item.volumeInfo.publishedDate
          if (publishedDate && publishedDate.length === 4) {
            publishedDate = `${publishedDate}-01-01`
          }

          return {
            id: item.id,
            title: item.volumeInfo.title || "Unknown Title",
            author: item.volumeInfo.authors?.[0] || "Unknown Author",
            authors: item.volumeInfo.authors || [],
            publishedDate: publishedDate || "Unknown Date",
            description: item.volumeInfo.description || "",
            categories: item.volumeInfo.categories || [],
            language: item.volumeInfo.language || "en",
            pageCount: item.volumeInfo.pageCount || 0,
            imageUrl: ensureHttps(item.volumeInfo.imageLinks?.thumbnail || ""),
            thumbnail: ensureHttps(item.volumeInfo.imageLinks?.thumbnail || ""),
            previewLink: ensureHttps(item.volumeInfo.previewLink || ""),
            infoLink: ensureHttps(item.volumeInfo.infoLink || ""),
            canonicalVolumeLink: ensureHttps(item.volumeInfo.canonicalVolumeLink || ""),
          }
        })
        allBooks = [...allBooks, ...processedBooks]
      }
    }

    // Cache the result for 10 minutes (longer for author books)
    apiCache.set(cacheKey, allBooks, 10 * 60 * 1000)
    
    return allBooks
  } catch (error) {
    console.error('Error fetching author books:', error)
    throw error
  }
}

export async function fetchRecommendationsWithCache(
  authors: string[], 
  genres: string[], 
  languages: string[]
): Promise<any[]> {
  const cacheKey = getRecommendationsCacheKey(authors, genres, languages)
  
  // Check cache first
  const cached = apiCache.get(cacheKey)
  if (cached) {
    console.log('Cache hit for recommendations')
    return cached
  }

  console.log('Cache miss for recommendations, fetching from API')
  
  try {
    const searchQueries: string[] = []
    
    // Generate search queries based on authors and genres
    for (const authorName of authors.slice(0, 3)) { // Limit to first 3 authors
      for (const genre of genres.slice(0, 2)) { // Limit to first 2 genres
        const genreQuery = genre.toLowerCase().replace(/\s+/g, '+')
        searchQueries.push(`author:"${authorName}" subject:"${genreQuery}"`)
      }
    }

    let allRecommendations: any[] = []

    for (const query of searchQueries.slice(0, 5)) { // Limit to 5 queries
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&orderBy=relevance&printType=books&langRestrict=${languages[0] || "en"}`,
      )

      if (!response.ok) continue

      const data = await response.json()
      if (data.items) {
        allRecommendations = [...allRecommendations, ...data.items]
      }
    }

    // Cache the result for 15 minutes (longer for recommendations)
    apiCache.set(cacheKey, allRecommendations, 15 * 60 * 1000)
    
    return allRecommendations
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    throw error
  }
}

export async function searchBooksWithCache(query: string): Promise<any[]> {
  const cacheKey = getBookSearchCacheKey(query)
  
  // Check cache first
  const cached = apiCache.get(cacheKey)
  if (cached) {
    console.log(`Cache hit for search: ${query}`)
    return cached
  }

  console.log(`Cache miss for search: ${query}, fetching from API`)
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`,
    )
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }
    
    const data = await response.json()
    const books = data.items || []

    // Cache the result for 5 minutes
    apiCache.set(cacheKey, books, 5 * 60 * 1000)
    
    return books
  } catch (error) {
    console.error('Error searching books:', error)
    throw error
  }
}

// Cleanup expired cache entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup()
  }, 10 * 60 * 1000)
}
