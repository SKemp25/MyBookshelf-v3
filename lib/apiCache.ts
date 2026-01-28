
// Helper function to convert HTTP URLs to HTTPS
function ensureHttps(url: string): string {
  if (!url) return url
  return url.replace(/^http:\/\//, "https://")
}

// Check if a book is a special edition, graded reader, or abridged version
function isSpecialEdition(book: any): boolean {
  const title = (book.title || "").toLowerCase()
  const description = (book.description || "").toLowerCase()
  const categories = (book.categories || []).map((cat: string) => cat.toLowerCase()).join(" ")
  const pageCount = book.pageCount || 0
  
  // Combined text for checking
  const combinedText = `${title} ${description} ${categories}`.toLowerCase()
  
  // Special edition indicators - graded readers, ELT, abridged versions
  const specialEditionIndicators = [
    "penguin readers",
    "elt graded reader",
    "graded reader",
    "elt reader",
    "english language teaching",
    "level 1", "level 2", "level 3", "level 4", "level 5", "level 6", "level 7",
    "level one", "level two", "level three", "level four", "level five", "level six", "level seven",
    "abridged", "abridged edition", "abridged version",
    "simplified", "simplified edition", "simplified version",
    "easy reader", "beginner reader", "intermediate reader",
    "adapted", "adapted edition", "adapted version",
    "retold", "retold edition",
    "oxford bookworms", "macmillan readers", "cambridge readers",
    "black cat", "green apple", "dominoes",
    "young adult reader", "ya reader"
  ]
  
  // Check for special edition indicators in title/description
  if (specialEditionIndicators.some(indicator => combinedText.includes(indicator))) {
    return true
  }
  
  // Check for "Level" followed by a number (e.g., "Level 6", "Level Six")
  if (/\blevel\s+\d+\b/i.test(title) || /\blevel\s+(one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(title)) {
    return true
  }
  
  // Check for suspiciously short page counts that might indicate graded readers
  // Only flag if it's very short AND has other indicators
  if (pageCount > 0 && pageCount < 100 && (
    combinedText.includes("reader") || 
    combinedText.includes("graded") ||
    combinedText.includes("elt") ||
    combinedText.includes("level")
  )) {
    return true
  }
  
  // Check for "ELT" or "English Language Teaching" in any form
  if (combinedText.includes("elt") || combinedText.includes("english language teaching")) {
    return true
  }
  
  return false
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

  delete(key: string): void {
    this.cache.delete(key)
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
      
      // IMPORTANT: Do not retry 429 (rate limit). Retrying only wastes time and makes it worse.
      // Let the caller handle fallback immediately.
      if (response.status === 429) {
        return response
      }
      
      // If successful or non-retryable error, return immediately
      if (response.ok || response.status !== 503) {
        return response
      }
      
      // For 503, retry with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`API returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        // On final attempt, return the error response
        return response
      }
    } catch (error) {
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
        }
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        // On final attempt, throw silently or return error response
        throw error
      }
    }
  }
  
  throw new Error('Max retries exceeded')
}

// Fetch work details from Open Library to get full description
export async function fetchWorkDescription(workKey: string): Promise<string> {
  if (!workKey) return ""
  
  try {
    // Extract OLID from work key (e.g., "/works/OL123456W" -> "OL123456W")
    const olid = workKey.replace('/works/', '')
    if (!olid) return ""
    
    const response = await fetchWithRetry(
      `https://openlibrary.org${workKey}.json`,
      2,
      500
    )
    
    if (!response.ok) return ""
    
    const workData = await response.json()
    
    // Open Library description can be a string or an object with a "value" property
    if (typeof workData.description === 'string') {
      return workData.description
    } else if (workData.description?.value) {
      return workData.description.value
    }
    
    return ""
  } catch (error) {
    // Silently fail - description is optional
    return ""
  }
}

export async function fetchAuthorBooksWithCache(authorName: string, clearCache: boolean = false): Promise<any[]> {
  const cacheKey = getAuthorBooksCacheKey(authorName)
  
  // Check cache first (unless explicitly clearing)
  if (!clearCache) {
    const cached = apiCache.get(cacheKey)
    if (cached) {
      console.log(`Cache hit for author: ${authorName}`)
      return cached
    }
  } else {
    console.log(`Cache cleared for author: ${authorName}`)
    apiCache.delete(cacheKey)
  }

  console.log(`Cache miss for author: ${authorName}, fetching from Google Books API`)
  
  try {
    // Use Google Books API with inauthor query for better results
    // Try primary query first (inauthor for exact match)
    // Add a small delay before making the request to help avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
    let response = await fetchWithRetry(
      `https://www.googleapis.com/books/v1/volumes?q=inauthor:"${encodeURIComponent(authorName)}"&maxResults=40&langRestrict=en&printType=books`,
      2, // Reduce retries to avoid making it worse
      2000 // Longer base delay for rate limiting
    )
    
    let allBooks: any[] = []
    
    // Check if Google Books is rate-limited
    if (response.status === 429) {
      console.warn(`⚠️ Google Books API rate-limited (429). Falling back to OpenLibrary...`)
      const { fetchAuthorBooksFromOpenLibrary } = await import("./openLibraryFallback")
      const openLibraryBooks = await fetchAuthorBooksFromOpenLibrary(authorName)
      if (openLibraryBooks.length > 0) {
        // Skip enhancement when we're already rate-limited - return books as-is
        // Enhancement can happen later in the background or when user explicitly requests it
        console.log(`✅ Got ${openLibraryBooks.length} books from OpenLibrary (skipping enhancement to avoid more API calls)`)
        apiCache.set(cacheKey, openLibraryBooks, 10 * 60 * 1000)
        return openLibraryBooks
      }
      // If OpenLibrary also fails, return empty array
      console.error(`❌ Both Google Books and OpenLibrary failed for ${authorName}`)
      apiCache.set(cacheKey, [], 10 * 60 * 1000)
      return []
    }
    
    if (response.ok) {
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        allBooks = data.items
        console.log(`📚 Found ${allBooks.length} books from primary query for ${authorName}`)
      }
    }
    
    // If we got fewer than 5 books, try a fallback query with just author name (less strict)
    // Add a delay before fallback to avoid rate limiting
    if (allBooks.length < 5) {
      console.log(`📚 Only ${allBooks.length} books found, trying fallback query...`)
      // Wait a bit before making the fallback call to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
      const fallbackResponse = await fetchWithRetry(
        `https://www.googleapis.com/books/v1/volumes?q=author:"${encodeURIComponent(authorName)}"&maxResults=40&langRestrict=en&printType=books`,
        2, // Reduce retries
        2000 // Longer delay
      )
      
      // Check for rate limiting on fallback too
      if (fallbackResponse.status === 429) {
        console.warn(`⚠️ Google Books fallback also rate-limited. Using OpenLibrary...`)
        const { fetchAuthorBooksFromOpenLibrary } = await import("./openLibraryFallback")
        const openLibraryBooks = await fetchAuthorBooksFromOpenLibrary(authorName)
        if (openLibraryBooks.length > 0) {
          // Skip enhancement when rate-limited - return books as-is
          console.log(`✅ Got ${openLibraryBooks.length} books from OpenLibrary (skipping enhancement to avoid more API calls)`)
          apiCache.set(cacheKey, openLibraryBooks, 10 * 60 * 1000)
          return openLibraryBooks
        }
      }
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        if (fallbackData.items && fallbackData.items.length > 0) {
          // Merge results, avoiding duplicates by ID
          const existingIds = new Set(allBooks.map((item: any) => item.id))
          const newItems = fallbackData.items.filter((item: any) => !existingIds.has(item.id))
          allBooks = [...allBooks, ...newItems]
          console.log(`📚 Added ${newItems.length} more books from fallback query (total: ${allBooks.length})`)
        }
      }
    }
    
    if (allBooks.length > 0) {
      // Process Google Books response (but skip enhancement to avoid extra API calls)
      // Enhancement can happen later if needed
      const processedBooks = allBooks
        .map((item: any) => {
          const volumeInfo = item.volumeInfo || {}
          const author = volumeInfo.authors?.[0] || "Unknown Author"
          let publishedDate = volumeInfo.publishedDate || "Unknown Date"
          if (publishedDate && publishedDate.length === 4) {
            publishedDate = `${publishedDate}-01-01`
          }
          const isbn = volumeInfo.industryIdentifiers?.find((id: any) => id.type === "ISBN_13")?.identifier ||
                      volumeInfo.industryIdentifiers?.find((id: any) => id.type === "ISBN_10")?.identifier ||
                      ""
          const id = item.id || `GB-${volumeInfo.title?.replace(/\s+/g, '')}-${author.replace(/\s+/g, '')}`
          const thumbnail = volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:") || 
                           volumeInfo.imageLinks?.smallThumbnail?.replace("http:", "https:") || ""
          const description = volumeInfo.description || ""
          return {
            id,
            title: volumeInfo.title || "Unknown Title",
            author,
            authors: volumeInfo.authors || [author],
            publishedDate,
            description,
            thumbnail,
            isbn,
            pageCount: volumeInfo.pageCount || 0,
            categories: volumeInfo.categories || [],
            language: volumeInfo.language || "en",
            publisher: volumeInfo.publisher || "",
            previewLink: volumeInfo.previewLink || "",
            infoLink: volumeInfo.infoLink || "",
            canonicalVolumeLink: volumeInfo.canonicalVolumeLink || "",
            imageUrl: thumbnail,
          } as any
        })

      // Normalize the target author name for strict matching
      const targetAuthorNormalized = authorName.trim().toLowerCase()

      const filteredBooks = processedBooks
        .filter((book: any) => {
          // STRICT AUTHOR MATCHING:
          // Only include books where the primary author matches the requested author exactly
          const bookAuthor = (book.author || "").trim().toLowerCase()
          if (!bookAuthor || bookAuthor !== targetAuthorNormalized) {
            return false
          }

          // Filter out special editions using title only
          if (isSpecialEdition(book)) return false
          
          // Filter out non-English books (API should filter, but double-check client-side)
          // Default to English if language is missing or unknown
          if (book.language && book.language !== "en") {
            if (process.env.NODE_ENV === 'development') {
              console.log(`🚫 Filtering out non-English book: ${book.title} (language: ${book.language})`)
            }
            return false
          }
          
          // Language filtering is also done in BookshelfClient based on user preferences
          
          // Filter out unwanted keywords in title
          const title = (book.title || "").toLowerCase()
          const unwantedKeywords = [
            "free preview",
            "sample",
            "showcard",
            "promotional",
            "marketing",
            "advertisement",
            "ad copy",
            "book trailer",
            "excerpt",
            "preview edition",
            "advance reader",
            "arc",
            "galley",
            "proof",
            "uncorrected",
            "not for sale",
            "review copy",
            "promotional copy",
            "media kit",
            "press kit",
            "catalog",
            "catalogue",
            "brochure",
            "flyer",
            "leaflet",
            "pamphlet",
          ]
          
          if (unwantedKeywords.some(keyword => title.includes(keyword))) {
            return false
          }
          
          return true
        })
      
      // Remove duplicates by title+author (use the filtered list)
      const seen = new Map<string, any>()
      const uniqueBooks: any[] = []
      for (const book of filteredBooks) {
        const key = `${book.title.toLowerCase()}|${book.author.toLowerCase()}`
        if (!seen.has(key)) {
          seen.set(key, book)
          uniqueBooks.push(book)
        }
      }
      
      // Enhanced with fallback sources (OpenLibrary for descriptions/covers)
      const booksWithDescriptions = uniqueBooks.filter(book => book.description && book.description.length > 0).length
      const booksWithCovers = uniqueBooks.filter(book => book.thumbnail && book.thumbnail.length > 0).length
      console.log(`📚 ${booksWithDescriptions} out of ${uniqueBooks.length} books have descriptions (enhanced with fallback sources)`)
      console.log(`📷 ${booksWithCovers} out of ${uniqueBooks.length} books have covers (enhanced with fallback sources)`)
      
      // Sort: books with descriptions first, then by publication date (newest first)
      uniqueBooks.sort((a, b) => {
        const aHasDesc = a.description && a.description.length > 0
        const bHasDesc = b.description && b.description.length > 0
        if (aHasDesc && !bHasDesc) return -1
        if (!aHasDesc && bHasDesc) return 1
        
        const aDate = a.publishedDate && a.publishedDate !== "Unknown Date" ? new Date(a.publishedDate).getTime() : 0
        const bDate = b.publishedDate && b.publishedDate !== "Unknown Date" ? new Date(b.publishedDate).getTime() : 0
        return bDate - aDate
      })
      
      // Cache the result for 10 minutes
      apiCache.set(cacheKey, uniqueBooks, 10 * 60 * 1000)
      
      return uniqueBooks
    }
    
    // No results
    console.log(`❌ No books found for ${authorName} from Google Books API`)
    apiCache.set(cacheKey, [], 10 * 60 * 1000)
    return []
  } catch (error) {
    console.error('Error fetching author books from Google Books:', error)
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack)
    }
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
