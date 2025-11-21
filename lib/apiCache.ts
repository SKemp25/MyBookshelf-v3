
// Helper function to convert HTTP URLs to HTTPS
function ensureHttps(url: string): string {
  if (!url) return url
  return url.replace(/^http:\/\//, "https://")
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

  // Clear cache for a specific author
  clearAuthor(authorName: string): void {
    const key = getAuthorBooksCacheKey(authorName)
    this.cache.delete(key)
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

// Export clearAuthor function for use in components
export function clearAuthorCache(authorName: string): void {
  apiCache.clearAuthor(authorName)
}

// Cache key generators
export const getAuthorBooksCacheKey = (authorName: string): string => 
  `author-books:${authorName.toLowerCase().trim()}`

export const getRecommendationsCacheKey = (authors: string[], genres: string[], languages: string[]): string => 
  `recommendations:${authors.sort().join(',')}:${genres.sort().join(',')}:${languages.sort().join(',')}`

export const getBookSearchCacheKey = (query: string): string => 
  `book-search:${query.toLowerCase().trim()}`

// Cached API functions
// Retry function with exponential backoff
async function fetchWithRetry(
  url: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url)
      
      // If successful or non-retryable error, return immediately
      if (response.ok || (response.status !== 503 && response.status !== 429)) {
        return response
      }
      
      // For 503/429, retry with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`API returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        return response // Return the error response on final attempt
      }
    } catch (error) {
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }
  
  throw new Error('Max retries exceeded')
}

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
      try {
        const response = await fetchWithRetry(
          `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40&orderBy=newest&printType=books`,
          3, // max retries
          1000 // base delay 1 second
        )
        
        if (!response.ok) {
          if (response.status === 503 || response.status === 429) {
            console.warn(`Google Books API rate limited or unavailable (${response.status}) for query: ${query}`)
            // Continue to next query instead of failing completely
            continue
          }
          console.warn(`API returned ${response.status} for query: ${query}`)
          continue
        }
        
        const data = await response.json()
        if (data.items) {
          console.log(`API returned ${data.items.length} books for query: ${query}`)
          // Process the raw API data into proper Book objects
          const processedBooks = data.items.map((item: any) => {
            let publishedDate = item.volumeInfo.publishedDate
            if (publishedDate && publishedDate.length === 4) {
              publishedDate = `${publishedDate}-01-01`
            }

            const bookData = {
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
            
            return bookData
          })
          allBooks = [...allBooks, ...processedBooks]
        }
      } catch (queryError) {
        console.error(`Error fetching books for query "${query}":`, queryError)
        // Continue to next query
        continue
      }
    }

    // Cache the result for 10 minutes (longer for author books)
    // Even if we got no books, cache the empty result to avoid repeated failed requests
    apiCache.set(cacheKey, allBooks, 10 * 60 * 1000)
    
    return allBooks
  } catch (error) {
    console.error('Error fetching author books:', error)
    // Return empty array instead of throwing, so the author can still be added
    return []
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
