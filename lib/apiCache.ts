
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
        // Only log in development, not in production
        if (process.env.NODE_ENV === 'development') {
          console.log(`API returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`)
        }
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        // On final attempt, return the error response silently
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

export async function fetchAuthorBooksWithCache(authorName: string): Promise<any[]> {
  const cacheKey = getAuthorBooksCacheKey(authorName)
  
  // Check cache first
  const cached = apiCache.get(cacheKey)
  if (cached) {
    console.log(`Cache hit for author: ${authorName}`)
    return cached
  }

  console.log(`Cache miss for author: ${authorName}, fetching from Open Library API`)
  
  try {
    // Filter to English only at the API level
    const response = await fetchWithRetry(
      `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName)}&language=eng&limit=100&sort=new`,
      3,
      700
    )
    
    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Open Library API returned ${response.status} for author: ${authorName}`)
      }
      return []
    }
    
    const data = await response.json()
    if (data.docs && data.docs.length > 0) {
      const processedBooks = data.docs
        .map((doc: any) => {
          // Extract author name (first author from array)
          const author = doc.author_name?.[0] || "Unknown Author"
          
          // Format publish date
          let publishedDate = doc.first_publish_year ? `${doc.first_publish_year}-01-01` : "Unknown Date"
          
          // Get ISBN (prefer ISBN_13, fallback to ISBN_10)
          const isbn = doc.isbn?.[0] || doc.isbn_13?.[0] || doc.isbn_10?.[0] || ""
          
          // Use Open Library work key as ID
          const id = doc.key?.replace('/works/', 'OL') || `OL-${doc.title?.replace(/\s+/g, '')}-${author.replace(/\s+/g, '')}`
          
          // Get cover image - try multiple methods
          let thumbnail = ""
          if (doc.cover_i) {
            // Primary: use cover_i if available
            thumbnail = `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          } else if (isbn) {
            // Fallback 1: try ISBN
            thumbnail = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
          } else if (doc.key) {
            // Fallback 2: try work key (OLID)
            const olid = doc.key.replace('/works/', '')
            thumbnail = `https://covers.openlibrary.org/b/olid/${olid}-M.jpg`
          }
          
          // Get description from first sentence if available
          const description = doc.first_sentence?.[0] || ""
          
          // Get categories from subjects
          const categories = doc.subject?.slice(0, 5) || []
          
          // Get language (Open Library uses language codes like 'eng', 'spa', etc.)
          const langCode = doc.language?.[0] || "eng"
          // Map common language codes to our format
          const languageMap: { [key: string]: string } = {
            'eng': 'en',
            'spa': 'es',
            'fre': 'fr',
            'ger': 'de',
            'ita': 'it',
            'por': 'pt',
            'rus': 'ru',
            'chi': 'zh',
            'jpn': 'ja',
            'kor': 'ko',
          }
          let language = languageMap[langCode] || langCode.substring(0, 2) || "en"
          
          // If language is still not recognized, try to detect from title/description
          // Spanish titles often have accents and Spanish words
          if (!languageMap[langCode] && langCode.length > 2) {
            const title = (doc.title || "").toLowerCase()
            // Common Spanish words/patterns in titles
            const spanishIndicators = ['la ', 'el ', 'de los', 'de las', 'del ', 'una ', 'un ', 'y ', 'con ', 'sin ', 'por ', 'para ']
            if (spanishIndicators.some(indicator => title.startsWith(indicator) || title.includes(' ' + indicator))) {
              language = "es"
            }
          }
          
          return {
            id,
            title: doc.title || "Unknown Title",
            author,
            authors: doc.author_name || [author],
            publishedDate,
            description,
            categories,
            language,
            pageCount: doc.number_of_pages_median || doc.number_of_pages?.[0] || 0,
            imageUrl: thumbnail,
            thumbnail,
            previewLink: doc.key ? `https://openlibrary.org${doc.key}` : "",
            infoLink: doc.key ? `https://openlibrary.org${doc.key}` : "",
            canonicalVolumeLink: doc.key ? `https://openlibrary.org${doc.key}` : "",
            isbn,
          }
        })
        .filter((book: any) => {
          // Filter out special editions using title only
          if (isSpecialEdition(book)) return false
          
          // Language filtering is done in BookshelfClient based on user preferences
          // Don't filter here - let the user's preferred languages setting control it
          
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
      
      // Remove duplicates by title+author
      const seen = new Map<string, any>()
      const uniqueBooks: any[] = []
      for (const book of processedBooks) {
        const key = `${book.title.toLowerCase()}|${book.author.toLowerCase()}`
        if (!seen.has(key)) {
          seen.set(key, book)
          uniqueBooks.push(book)
        }
      }
      
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
    apiCache.set(cacheKey, [], 10 * 60 * 1000)
    return []
  } catch (error) {
    console.error('Error fetching author books from Open Library:', error)
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
