/**
 * Book Data Middleware
 * 
 * Fetches book data from multiple sources and stitches together the best data:
 * - Primary: Google Books API
 * - Description fallback: OpenLibrary Works API
 * - Cover fallback: OpenLibrary Covers API or ISBNLab
 */

import { Book } from "@/lib/types"

interface BookDataSource {
  title: string
  author: string
  description?: string
  thumbnail?: string
  isbn?: string
  publishedDate?: string
  pageCount?: number
  categories?: string[]
  language?: string
  publisher?: string
  authors?: string[]
}

/**
 * Fetch description from OpenLibrary Works API using ISBN or title+author
 */
async function fetchDescriptionFromOpenLibrary(isbn?: string, title?: string, author?: string): Promise<string | null> {
  try {
    let url = ""
    
    // Try ISBN first (most reliable)
    if (isbn) {
      // Remove hyphens from ISBN
      const cleanIsbn = isbn.replace(/-/g, "")
      url = `https://openlibrary.org/isbn/${cleanIsbn}.json`
    } else if (title && author) {
      // Fallback to search by title and author
      const searchQuery = encodeURIComponent(`${title} ${author}`)
      const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}&limit=1`
      
      const searchResponse = await fetch(searchUrl)
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        if (searchData.docs && searchData.docs.length > 0) {
          const workKey = searchData.docs[0].key // e.g., "/works/OL123456W"
          if (workKey) {
            url = `https://openlibrary.org${workKey}.json`
          }
        }
      }
    }
    
    if (!url) return null
    
    const response = await fetch(url)
    if (!response.ok) return null
    
    const data = await response.json()
    
    // OpenLibrary description can be in different fields
    if (data.description) {
      if (typeof data.description === "string") {
        return data.description
      } else if (data.description.value) {
        return data.description.value
      }
    }
    
    // Try first_sentence as fallback
    if (data.first_sentence) {
      if (typeof data.first_sentence === "string") {
        return data.first_sentence
      } else if (Array.isArray(data.first_sentence) && data.first_sentence.length > 0) {
        return data.first_sentence.join(" ")
      }
    }
    
    return null
  } catch (error) {
    console.error("Error fetching description from OpenLibrary:", error)
    return null
  }
}

/**
 * Fetch cover image from OpenLibrary Covers API
 */
async function fetchCoverFromOpenLibrary(isbn?: string, olid?: string): Promise<string | null> {
  try {
    let coverUrl = ""
    
    // Try ISBN first (most reliable)
    if (isbn) {
      const cleanIsbn = isbn.replace(/-/g, "")
      // OpenLibrary covers API: https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg
      coverUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`
    } else if (olid) {
      // Try OLID (OpenLibrary ID)
      coverUrl = `https://covers.openlibrary.org/b/olid/${olid}-L.jpg`
    }
    
    if (!coverUrl) return null
    
    // Test if the cover actually exists
    const response = await fetch(coverUrl, { method: "HEAD" })
    if (response.ok && response.headers.get("content-type")?.startsWith("image/")) {
      return coverUrl
    }
    
    return null
  } catch (error) {
    console.error("Error fetching cover from OpenLibrary:", error)
    return null
  }
}

/**
 * Fetch cover from ISBNLab (alternative cover source)
 */
async function fetchCoverFromISBNLab(isbn?: string): Promise<string | null> {
  try {
    if (!isbn) return null
    
    const cleanIsbn = isbn.replace(/-/g, "")
    // ISBNLab API endpoint (if available)
    const url = `https://api.isbnlab.org/api/v1/book/${cleanIsbn}`
    
    const response = await fetch(url)
    if (!response.ok) return null
    
    const data = await response.json()
    if (data.cover_url || data.thumbnail) {
      return data.cover_url || data.thumbnail
    }
    
    return null
  } catch (error) {
    // ISBNLab might not be available, fail silently
    return null
  }
}

/**
 * Enhance a book with missing data from fallback sources
 */
export async function enhanceBookData(book: Book): Promise<Book> {
  const enhanced = { ...book }
  let needsDescription = !book.description || book.description.trim().length === 0
  let needsCover = !book.thumbnail || book.thumbnail.trim().length === 0
  
  // If we have everything, return early
  if (!needsDescription && !needsCover) {
    return enhanced
  }
  
  console.log(`🔍 Enhancing book data for "${book.title}" by ${book.author}...`)
  console.log(`   Missing: ${needsDescription ? "description " : ""}${needsCover ? "cover" : ""}`)
  
  // Try to fetch missing description
  if (needsDescription) {
    console.log(`   📝 Fetching description from OpenLibrary...`)
    const description = await fetchDescriptionFromOpenLibrary(book.isbn, book.title, book.author)
    if (description && description.trim().length > 0) {
      enhanced.description = description
      needsDescription = false
      console.log(`   ✅ Found description (${description.length} chars)`)
    } else {
      console.log(`   ⚠️ No description found`)
    }
  }
  
  // Try to fetch missing cover
  if (needsCover) {
    // Try OpenLibrary first (free, no API key needed)
    console.log(`   🖼️ Fetching cover from OpenLibrary...`)
    let coverUrl = await fetchCoverFromOpenLibrary(book.isbn)
    
    if (!coverUrl) {
      // Fallback to ISBNLab
      console.log(`   🖼️ Trying ISBNLab...`)
      coverUrl = await fetchCoverFromISBNLab(book.isbn) || null
    }
    
    if (coverUrl) {
      enhanced.thumbnail = coverUrl
      needsCover = false
      console.log(`   ✅ Found cover: ${coverUrl}`)
    } else {
      console.log(`   ⚠️ No cover found`)
    }
  }
  
  return enhanced
}

/**
 * Enhance multiple books with missing data (with rate limiting)
 */
export async function enhanceBooksData(books: Book[], delayBetweenBooks: number = 300): Promise<Book[]> {
  const enhanced: Book[] = []
  
  for (let i = 0; i < books.length; i++) {
    const book = books[i]
    
    // Add delay between requests to avoid rate limiting
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBooks))
    }
    
    const enhancedBook = await enhanceBookData(book)
    enhanced.push(enhancedBook)
  }
  
  return enhanced
}

/**
 * Process Google Books response and enhance with fallback sources
 */
export async function processGoogleBooksResponse(
  items: any[],
  authorName: string
): Promise<Book[]> {
  const processedBooks: Book[] = []
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const volumeInfo = item.volumeInfo || {}
    
    // Extract basic info
    const author = volumeInfo.authors?.[0] || "Unknown Author"
    let publishedDate = volumeInfo.publishedDate || "Unknown Date"
    if (publishedDate && publishedDate.length === 4) {
      publishedDate = `${publishedDate}-01-01`
    }
    
    const isbn = volumeInfo.industryIdentifiers?.find((id: any) => id.type === "ISBN_13")?.identifier ||
                volumeInfo.industryIdentifiers?.find((id: any) => id.type === "ISBN_10")?.identifier ||
                ""
    
    const id = item.id || `GB-${volumeInfo.title?.replace(/\s+/g, '')}-${author.replace(/\s+/g, '')}`
    
    // Get data from Google Books
    const thumbnail = volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:") || 
                     volumeInfo.imageLinks?.smallThumbnail?.replace("http:", "https:") || ""
    const description = volumeInfo.description || ""
    
    // Create base book object
    const book: Book = {
      id,
      title: volumeInfo.title || "Unknown Title",
      author,
      authors: volumeInfo.authors || [author],
      publishedDate: publishedDate || "Unknown Date",
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
    } as any // Type assertion to include extra fields
    
    // Enhance with fallback sources if needed
    // Only enhance if description or cover is missing
    if ((!description || description.trim().length === 0) || (!thumbnail || thumbnail.trim().length === 0)) {
      // Add delay to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      const enhanced = await enhanceBookData(book)
      processedBooks.push(enhanced)
    } else {
      processedBooks.push(book)
    }
  }
  
  return processedBooks
}
