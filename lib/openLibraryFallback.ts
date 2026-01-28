/**
 * OpenLibrary Fallback
 * 
 * Used as a primary source when Google Books API is rate-limited (429 errors)
 */

import { Book } from "@/lib/types"

/**
 * Fetch books by author from OpenLibrary Search API
 */
export async function fetchAuthorBooksFromOpenLibrary(authorName: string): Promise<Book[]> {
  try {
    console.log(`📚 Fetching books for ${authorName} from OpenLibrary (fallback)...`)
    
    const searchUrl = `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName)}&language=eng&limit=100`
    console.log(`🌐 OpenLibrary URL: ${searchUrl}`)
    
    let response: Response
    try {
      response = await fetch(searchUrl)
    } catch (fetchError) {
      console.error(`❌ Network error fetching from OpenLibrary:`, fetchError)
      if (fetchError instanceof Error) {
        console.error(`   Error message: ${fetchError.message}`)
        console.error(`   Error stack: ${fetchError.stack}`)
      }
      return []
    }
    
    if (!response.ok) {
      console.error(`❌ OpenLibrary API returned ${response.status} ${response.statusText}`)
      const errorText = await response.text().catch(() => 'Unable to read error response')
      console.error(`   Error details: ${errorText.substring(0, 200)}`)
      return []
    }
    
    let data: any
    try {
      data = await response.json()
    } catch (jsonError) {
      console.error(`❌ Error parsing OpenLibrary JSON response:`, jsonError)
      if (jsonError instanceof Error) {
        console.error(`   Error message: ${jsonError.message}`)
      }
      return []
    }
    
    if (!data || !data.docs || data.docs.length === 0) {
      console.log(`❌ No books found for ${authorName} from OpenLibrary`)
      console.log(`   Response data:`, data)
      return []
    }
    
    console.log(`📚 Found ${data.docs.length} books from OpenLibrary for ${authorName}`)
    
    // Process OpenLibrary results
    const books: Book[] = data.docs
      .map((doc: any) => {
        const title = doc.title || "Unknown Title"
        const author = doc.author_name?.[0] || doc.author_name || "Unknown Author"
        const isbn = doc.isbn?.[0] || doc.isbn_13?.[0] || doc.isbn_10?.[0] || ""
        
        // Get work key first (needed for fetching full description and covers)
        const workKey = doc.key ? doc.key.replace(/^\/works\//, "").replace(/^\/books\//, "") : null
        
        // Get cover from OpenLibrary (try multiple sources)
        let thumbnail = ""
        if (doc.cover_i) {
          // Use cover_i if available (most reliable)
          thumbnail = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        } else if (isbn) {
          // Try ISBN-based cover
          const cleanIsbn = isbn.replace(/-/g, "")
          thumbnail = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`
        } else if (doc.oclc?.[0]) {
          // Try OCLC-based cover
          thumbnail = `https://covers.openlibrary.org/b/oclc/${doc.oclc[0]}-L.jpg`
        } else if (workKey) {
          // Try work key-based cover as last resort
          thumbnail = `https://covers.openlibrary.org/b/olid/${workKey}-L.jpg`
        }
        
        // Get description from first_sentence if available (we'll fetch full description later if needed)
        let description = ""
        if (doc.first_sentence) {
          if (Array.isArray(doc.first_sentence)) {
            description = doc.first_sentence.join(" ")
          } else if (typeof doc.first_sentence === "string") {
            description = doc.first_sentence
          }
        }
        
        // Mark if we only have first_sentence (need to fetch full description)
        const hasOnlyFirstSentence = description.length > 0 && description.length < 200
        
        // Format publish date
        let publishedDate = "Unknown Date"
        if (doc.first_publish_year) {
          publishedDate = `${doc.first_publish_year}-01-01`
        } else if (doc.publish_year && Array.isArray(doc.publish_year) && doc.publish_year.length > 0) {
          publishedDate = `${doc.publish_year[0]}-01-01`
        }
        
        // Create ID from OpenLibrary key or generate one
        const id = doc.key ? `OL-${doc.key.replace(/^\/works\//, "").replace(/^\/books\//, "")}` : 
                   `OL-${title.replace(/\s+/g, '')}-${author.replace(/\s+/g, '')}`
        
        const book: any = {
          id,
          title,
          author,
          authors: doc.author_name || [author],
          publishedDate,
          description,
          thumbnail,
          isbn,
          pageCount: doc.number_of_pages_median || 0,
          categories: doc.subject || [],
          language: doc.language?.[0] || "en",
          publisher: doc.publisher?.[0] || "",
        }
        
        // Store work key and flag for fetching full description
        if (workKey) {
          (book as any).olWorkKey = workKey
        }
        if (hasOnlyFirstSentence) {
          (book as any).needsFullDescription = true
        }
        
        return book
      })
      .filter((book: Book) => {
        // Filter out non-English books
        if (book.language && book.language !== "en" && book.language !== "eng") {
          return false
        }
        
        // Filter out special editions (basic check)
        const title = (book.title || "").toLowerCase()
        const specialEditionIndicators = [
          "graded reader", "elt reader", "level 1", "level 2", "level 3",
          "abridged", "simplified", "adapted", "retold"
        ]
        
        if (specialEditionIndicators.some(indicator => title.includes(indicator))) {
          return false
        }
        
        return true
      })
    
    // Deduplicate by title + author
    const seen = new Map<string, Book>()
    const uniqueBooks: Book[] = []
    for (const book of books) {
      const key = `${book.title.toLowerCase()}|${book.author.toLowerCase()}`
      if (!seen.has(key)) {
        seen.set(key, book)
        uniqueBooks.push(book)
      }
    }
    
    // Sort by published date (newest first)
    uniqueBooks.sort((a, b) => {
      const dateA = a.publishedDate && a.publishedDate !== "Unknown Date" ? new Date(a.publishedDate).getTime() : 0
      const dateB = b.publishedDate && b.publishedDate !== "Unknown Date" ? new Date(b.publishedDate).getTime() : 0
      return dateB - dateA
    })
    
    console.log(`✅ Processed ${uniqueBooks.length} unique books from OpenLibrary for ${authorName}`)
    return uniqueBooks
    
  } catch (error) {
    console.error("❌ Unexpected error fetching books from OpenLibrary:", error)
    if (error instanceof Error) {
      console.error("   Error name:", error.name)
      console.error("   Error message:", error.message)
      console.error("   Error stack:", error.stack)
    } else {
      console.error("   Error (non-Error object):", JSON.stringify(error))
    }
    return []
  }
}
