"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Plus, Trash2, Search, Upload } from "lucide-react"
import type { Book } from "@/lib/types"
import AuthorImport from "./AuthorImport"
import { saveUserAuthors } from "@/lib/database"
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics"
import { deduplicateBooks } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { fetchAuthorBooksWithCache } from "@/lib/apiCache"

// Helper function to convert HTTP URLs to HTTPS
function ensureHttps(url: string): string {
  if (!url) return url
  return url.replace(/^http:\/\//, "https://")
}
import { Card, CardContent } from "@/components/ui/card"

interface AuthorManagerProps {
  authors: string[]
  setAuthors: (authors: string[]) => void
  onBooksFound: (books: Book[]) => void
  onAuthorsChange?: (authors: string[]) => void
  userId?: string
}

// Helper function to extract last name for sorting
const getLastName = (fullName: string): string => {
  // Handle cases where fullName might not be a string
  if (!fullName || typeof fullName !== "string") {
    return ""
  }

  const nameParts = fullName.trim().split(" ")
  return nameParts[nameParts.length - 1].toLowerCase()
}

export const normalizeAuthorName = (name: string): string => {
  const normalized = name
    .trim()
    .split(" ")
    .map((word) => {
      // Handle words with apostrophes (like O'Farrell, D'Angelo, etc.)
      if (word.includes("'")) {
        return word
          .split("'")
          .map((part, index) => {
            if (index === 0) {
              return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            } else {
              return "'" + part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            }
          })
          .join("")
      }
      // Regular word capitalization
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(" ")

  // Handle common author name corrections
  const corrections: { [key: string]: string } = {
    "Phillip Pullman": "Philip Pullman",
    "Phillip Pulman": "Philip Pullman",
    "Philip Pulman": "Philip Pullman",
    "Kristin Hanna": "Kristin Hannah",
    "Kristen Hannah": "Kristin Hannah",
    "Steven King": "Stephen King",
    "J K Rowling": "J.K. Rowling",
    "Jk Rowling": "J.K. Rowling",
    "Maggie O'Farrell": "Maggie O'Farrell", // Ensure proper capitalization
  }

  return corrections[normalized] || normalized
}

export default function AuthorManager({ authors, setAuthors, onBooksFound, onAuthorsChange, userId }: AuthorManagerProps) {
  const [newAuthor, setNewAuthor] = useState("")
  const [searchTitle, setSearchTitle] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [isAddingAuthor, setIsAddingAuthor] = useState(false)
  const [foundBooks, setFoundBooks] = useState<Book[]>([])
  const [showAuthorVerification, setShowAuthorVerification] = useState(false)
  const [authorCandidates, setAuthorCandidates] = useState<Array<{name: string, sampleBooks: Book[], allBooks: Book[], bookCount: number}>>([])
  const [pendingAuthorName, setPendingAuthorName] = useState<string>("")
  const { toast } = useToast()

  // Clear found books when user manually clears the search field
  useEffect(() => {
    if (searchTitle.trim() === "") {
      setFoundBooks([])
    }
  }, [searchTitle])

  const addAuthor = async () => {
    if (newAuthor.trim() && !authors.some((author) => author.toLowerCase() === newAuthor.toLowerCase())) {
      setIsAddingAuthor(true)

      const normalizedName = normalizeAuthorName(newAuthor)
      const searchedNameLower = normalizedName.toLowerCase()

      try {
        // Use cached API call to check for multiple authors BEFORE adding
        const apiResults = await fetchAuthorBooksWithCache(normalizedName)
        
        // Filter out books where author name appears in title but author is different
        // Only include books where the author field actually matches EXACTLY
        const validBooks = apiResults.filter((item: any) => {
          const apiAuthor = item.volumeInfo?.authors?.[0] || item.author || ""
          if (!apiAuthor) return false
          
          const bookTitle = (item.volumeInfo?.title || item.title || "").toLowerCase()
          const bookAuthor = normalizeAuthorName(apiAuthor).toLowerCase()
          
          // Exclude books where the searched name appears in title but author is different
          if (bookTitle.includes(searchedNameLower) && bookAuthor !== searchedNameLower) {
            return false
          }
          
          // STRICT MATCHING: Only include books where author matches exactly (after normalization)
          // This prevents mixing authors with the same name
          if (bookAuthor === searchedNameLower) return true
          
          // Allow for suffixes like "Jr.", "Sr.", "III" - check if base name matches
          const searchedBaseName = searchedNameLower.replace(/\s+(jr|sr|ii|iii|iv|v)\.?$/i, "").trim()
          const bookBaseName = bookAuthor.replace(/\s+(jr|sr|ii|iii|iv|v)\.?$/i, "").trim()
          
          if (searchedBaseName === bookBaseName && searchedBaseName.length > 0) {
            return true
          }
          
          // If no exact match, exclude the book to avoid mixing authors with same name
          return false
        })
        
        // Group books by author name to detect multiple authors with same name
        // Only include books where the author field matches, not where name appears in title
        const authorGroups = new Map<string, Book[]>()
        
        validBooks.forEach((item: any) => {
          const apiAuthor = item.volumeInfo?.authors?.[0] || item.author || ""
          if (!apiAuthor) return
          
          const normalizedApiAuthor = normalizeAuthorName(apiAuthor)
          const normalizedApiAuthorLower = normalizedApiAuthor.toLowerCase()
          
          // Only group books where the author field actually matches (already filtered by validBooks)
          // Group by the exact author name from the author field
          if (!authorGroups.has(normalizedApiAuthor)) {
            authorGroups.set(normalizedApiAuthor, [])
          }
          authorGroups.get(normalizedApiAuthor)!.push(item)
        })
        
        // If multiple distinct authors found, show verification dialog WITHOUT adding author yet
        if (authorGroups.size > 1) {
          const candidates = Array.from(authorGroups.entries()).map(([name, books]) => ({
            name,
            sampleBooks: books.slice(0, 3),
            allBooks: books, // Store all books for this candidate
            bookCount: books.length
          }))
          setAuthorCandidates(candidates)
          setShowAuthorVerification(true)
          setIsAddingAuthor(false)
          // Store the pending author name for later use
          setPendingAuthorName(normalizedName)
          return
        }
        
        // Only one author found - proceed with adding (deduplicate first)
        const uniqueAuthors = Array.from(new Set([...authors, normalizedName]))
        const updatedAuthors = uniqueAuthors.sort((a, b) => getLastName(a).localeCompare(getLastName(b)))
        setAuthors(updatedAuthors)
        setNewAuthor("")

        try {
          if (userId) {
            await saveUserAuthors(userId, updatedAuthors)

            await trackEvent(userId, {
              event_type: ANALYTICS_EVENTS.AUTHOR_ADDED,
              event_data: {
                author_name: normalizedName,
                total_authors: updatedAuthors.length,
                timestamp: new Date().toISOString(),
              },
            })
          }
        } catch (error) {
          console.error("Error saving authors to database:", error)
        }
        
        // Use the already-filtered validBooks instead of re-filtering apiResults
        // This ensures we get all books that matched the author, not just exact matches
        // First, process raw API data into Book format if needed
        const processedBooks = validBooks.map((item: any) => {
          // If already processed (has title directly), return as-is
          if (item.title && !item.volumeInfo) {
            return item
          }
          
          // Process raw API data
          const volumeInfo = item.volumeInfo || {}
          let publishedDate = volumeInfo.publishedDate
          if (publishedDate && publishedDate.length === 4) {
            publishedDate = `${publishedDate}-01-01`
          }
          
          return {
            id: item.id,
            title: volumeInfo.title || "Unknown Title",
            author: volumeInfo.authors?.[0] || "Unknown Author",
            authors: volumeInfo.authors || [],
            publishedDate: publishedDate || "Unknown Date",
            description: volumeInfo.description || "",
            categories: volumeInfo.categories || [],
            language: volumeInfo.language || "en",
            pageCount: volumeInfo.pageCount || 0,
            imageUrl: ensureHttps(volumeInfo.imageLinks?.thumbnail || ""),
            thumbnail: ensureHttps(volumeInfo.imageLinks?.thumbnail || ""),
            previewLink: ensureHttps(volumeInfo.previewLink || ""),
            infoLink: ensureHttps(volumeInfo.infoLink || ""),
            canonicalVolumeLink: ensureHttps(volumeInfo.canonicalVolumeLink || ""),
          }
        })

        const filteredBooks = processedBooks.filter((book) => {
          const title = (book.title || "").toLowerCase()
          const description = (book.description || "").toLowerCase()

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

          const hasUnwantedContent = unwantedKeywords.some(
            (keyword) => title.includes(keyword) || description.includes(keyword),
          )

          if (hasUnwantedContent) {
            return false
          }

          const specialReleaseIndicators = [
            "tesco exclusive",
            "walmart exclusive",
            "target exclusive",
            "amazon exclusive",
            "barnes & noble exclusive",
            "waterstones exclusive",
            "whsmith exclusive",
            "costco exclusive",
            "sam's club exclusive",
            "bj's exclusive",
            "kroger exclusive",
            "safeway exclusive",
            "publix exclusive",
            "retailer exclusive",
            "store exclusive",
            "exclusive edition",
            "exclusive release",
            "special release",
            "limited release",
            "promotional edition",
            "bonus edition",
            "gift edition",
            "holiday edition",
            "christmas edition",
            "valentine's edition",
            "mother's day edition",
            "father's day edition",
            "graduation edition",
            "back to school edition",
            "summer reading edition",
            "beach read edition",
            "book club edition",
            "large print edition",
            "mass market edition",
            "pocket edition",
            "compact edition",
            "mini edition",
            "jumbo edition",
            "oversized edition",
          ]

          const isSpecialRelease = specialReleaseIndicators.some(
            (indicator) => title.includes(indicator) || description.includes(indicator),
          )

          if (isSpecialRelease) {
            return false
          }

          const rereleaseIndicators = [
            "tie-in",
            "movie tie-in",
            "tv tie-in",
            "film tie-in",
            "netflix tie-in",
            "hulu tie-in",
            "amazon tie-in",
            "disney tie-in",
            "movie edition",
            "tv edition",
            "film edition",
            "netflix edition",
            "streaming edition",
            "television edition",
            "anniversary edition",
            "special edition",
            "collector's edition",
            "deluxe edition",
            "premium edition",
            "limited edition",
            "commemorative edition",
            "reissue",
            "reprint",
            "new edition",
            "revised edition",
            "updated edition",
            "expanded edition",
            "enhanced edition",
            "movie cover",
            "tv cover",
            "film cover",
            "netflix cover",
            "now a major motion picture",
            "now a netflix series",
            "now a tv series",
            "now streaming",
            "coming soon to",
            "media tie-in",
            "adaptation",
            "based on the",
            "inspiration for",
            "soon to be a",
            "major motion picture",
            "blockbuster film",
            "hit series",
            "popular series",
            "bestselling series",
            "award-winning series",
          ]

          const isRerelease = rereleaseIndicators.some(
            (indicator) => title.includes(indicator) || description.includes(indicator),
          )

          if (isRerelease) {
            return false
          }

          return true
        })

        // Get user country from localStorage if available, default to US
        let userCountry = "US"
        try {
          const userPrefsKey = `bookshelf_user_${userId}`
          const userPrefsData = localStorage.getItem(userPrefsKey)
          if (userPrefsData) {
            const userPrefs = JSON.parse(userPrefsData)
            userCountry = userPrefs.country || "US"
          }
        } catch (error) {
          // Default to US if unable to get user country
        }
        
        const deduplicatedBooks = deduplicateBooks(filteredBooks, userCountry)

        onBooksFound(deduplicatedBooks)
        
        toast({
          title: "Author Added Successfully!",
          description: `Found ${deduplicatedBooks.length} books for ${normalizedName}`,
          duration: 4000, // Auto-dismiss after 4 seconds
        })
      } catch (error) {
        console.error("Error fetching books for author:", error)
        toast({
          title: "Error Adding Author",
          description: "Failed to fetch books. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsAddingAuthor(false)
      }
    }
  }

  const removeAuthor = async (authorName: string) => {
    const updatedAuthors = authors.filter((author) => author !== authorName)
    setAuthors(updatedAuthors)

    try {
      if (userId) {
        await saveUserAuthors(userId, updatedAuthors)

        await trackEvent(userId, {
          event_type: ANALYTICS_EVENTS.AUTHOR_REMOVED,
          event_data: {
            author_name: authorName,
            total_authors: updatedAuthors.length,
            timestamp: new Date().toISOString(),
          },
        })
      }
    } catch (error) {
      console.error("Error removing author from database:", error)
    }
  }

  const addAuthorFromBook = async (book: Book) => {
    const authorName = book.author || book.authors?.[0] || "Unknown"
    
    if (!authors.some((author) => author.toLowerCase() === authorName.toLowerCase())) {
      setIsAddingAuthor(true)
      try {
        const normalizedName = normalizeAuthorName(authorName)
        const newAuthorsList = [...authors, normalizedName].sort((a, b) => getLastName(a).localeCompare(getLastName(b)))
        setAuthors(newAuthorsList)
        
        // Also update the parent component's authors list
        onAuthorsChange?.(newAuthorsList)

        // Fetch all books by this author first
        const authorBooks = await fetchAuthorBooksWithCache(normalizedName)
        if (authorBooks && authorBooks.length > 0) {
          // Add all books by this author at once
          onBooksFound(authorBooks)
        } else {
          // If no books found, just add the specific book
          onBooksFound([book])
        }

        if (userId) {
          await saveUserAuthors(userId, newAuthorsList)
          await trackEvent(userId, {
            event_type: ANALYTICS_EVENTS.AUTHOR_ADDED,
            event_data: {
              author_name: normalizedName,
              source: "book_search",
              timestamp: new Date().toISOString(),
            },
          })
        }

        toast({
          title: "Author Added",
          description: `${normalizedName} has been added to your authors list.`,
          duration: 4000, // Auto-dismiss after 4 seconds
        })

        // Clear the found books since we've added the author
        setFoundBooks([])
      } catch (error) {
        console.error("Error adding author:", error)
        toast({
          title: "Error",
          description: "Failed to add author. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsAddingAuthor(false)
      }
    } else {
      toast({
        title: "Author Already Exists",
        description: `${authorName} is already in your authors list.`,
      })
    }
  }

  const searchBooks = async () => {
    if (!searchTitle.trim()) return

    console.log("🔍 Starting search for:", searchTitle.trim())
    setIsSearching(true)

    if (userId) {
      await trackEvent(userId, {
        event_type: ANALYTICS_EVENTS.BOOK_SEARCH,
        event_data: {
          search_query: searchTitle.trim(),
          timestamp: new Date().toISOString(),
        },
      })
    }

    try {
      // Try title search (more flexible than exact quotes)
      const searchQuery = `intitle:${searchTitle.trim()}`
      const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=10`
      console.log("🌐 API URL:", apiUrl)
      
      const response = await fetch(apiUrl)
      console.log("📡 Response status:", response.status)
      
      const data = await response.json()
      console.log("📚 API Response:", data)

      if (data.items) {
        const books: Book[] = data.items.map((item: any) => {
          let publishedDate = item.volumeInfo.publishedDate

          if (publishedDate) {
            // Parse the date
            let dateObj: Date

            if (publishedDate.length === 4) {
              dateObj = new Date(`${publishedDate}-01-01`)
              publishedDate = `${publishedDate}-01-01`
            } else if (publishedDate.length === 7) {
              dateObj = new Date(`${publishedDate}-01`)
              publishedDate = `${publishedDate}-01`
            } else {
              dateObj = new Date(publishedDate)
            }

            // Only validate that the date isn't unreasonably far in the future (more than 2 years)
            const now = new Date()
            const twoYearsFromNow = new Date()
            twoYearsFromNow.setFullYear(now.getFullYear() + 2)

            if (dateObj > twoYearsFromNow) {
              publishedDate = null
            }

            // If the date is invalid, set to null
            if (isNaN(dateObj.getTime())) {
              publishedDate = null
            }
          }

          return {
            id: item.id,
            title: item.volumeInfo.title || "Unknown Title",
            author: item.volumeInfo.authors?.[0] || "Unknown Author",
            publishedDate: publishedDate,
            description: item.volumeInfo.description,
            pageCount: item.volumeInfo.pageCount,
            categories: item.volumeInfo.categories,
            thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://"),
            language: item.volumeInfo.language || "en",
          }
        })

        // Sort books by relevance (exact title matches first, then by publication date)
        const sortedBooks = books.sort((a, b) => {
          const searchTerm = searchTitle.trim().toLowerCase()
          const aTitle = a.title.toLowerCase()
          const bTitle = b.title.toLowerCase()
          
          // Exact title match gets highest priority
          if (aTitle === searchTerm && bTitle !== searchTerm) return -1
          if (bTitle === searchTerm && aTitle !== searchTerm) return 1
          
          // If both or neither are exact matches, sort by publication date (newest first)
          const aDate = a.publishedDate ? new Date(a.publishedDate).getTime() : 0
          const bDate = b.publishedDate ? new Date(b.publishedDate).getTime() : 0
          return bDate - aDate
        })

        // Limit to top 5 most relevant results
        const topBooks = sortedBooks.slice(0, 5)
        console.log("📖 Found books:", topBooks.length, topBooks)

        setFoundBooks(topBooks)
        // Don't auto-add books to bookshelf - just show as suggestions
        // Don't clear search title - let user see what they searched for
      } else {
        console.log("⚠️ No results from title search, trying fallback...")
        // If title search returns no results, try a broader search
        const fallbackUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTitle.trim())}&maxResults=10`
        console.log("🔄 Fallback URL:", fallbackUrl)
        
        const fallbackResponse = await fetch(fallbackUrl)
        console.log("📡 Fallback response status:", fallbackResponse.status)
        
        const fallbackData = await fallbackResponse.json()
        console.log("📚 Fallback response:", fallbackData)

        if (fallbackData.items) {
          const fallbackBooks: Book[] = fallbackData.items.map((item: any) => {
            let publishedDate = item.volumeInfo.publishedDate

            if (publishedDate) {
              let dateObj: Date
              if (publishedDate.length === 4) {
                dateObj = new Date(`${publishedDate}-01-01`)
                publishedDate = `${publishedDate}-01-01`
              } else if (publishedDate.length === 7) {
                dateObj = new Date(`${publishedDate}-01`)
                publishedDate = `${publishedDate}-01`
              } else {
                dateObj = new Date(publishedDate)
              }

              const now = new Date()
              const twoYearsFromNow = new Date()
              twoYearsFromNow.setFullYear(now.getFullYear() + 2)

              if (dateObj > twoYearsFromNow) {
                publishedDate = null
              }

              if (isNaN(dateObj.getTime())) {
                publishedDate = null
              }
            }

            return {
              id: item.id,
              title: item.volumeInfo.title || "Unknown Title",
              author: item.volumeInfo.authors?.[0] || "Unknown Author",
              publishedDate: publishedDate,
              description: item.volumeInfo.description,
              pageCount: item.volumeInfo.pageCount,
              categories: item.volumeInfo.categories,
              thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://"),
              language: item.volumeInfo.language || "en",
            }
          })

          // Sort fallback results by relevance
          const sortedFallbackBooks = fallbackBooks.sort((a, b) => {
            const searchTerm = searchTitle.trim().toLowerCase()
            const aTitle = a.title.toLowerCase()
            const bTitle = b.title.toLowerCase()
            
            if (aTitle === searchTerm && bTitle !== searchTerm) return -1
            if (bTitle === searchTerm && aTitle !== searchTerm) return 1
            
            const aDate = a.publishedDate ? new Date(a.publishedDate).getTime() : 0
            const bDate = b.publishedDate ? new Date(b.publishedDate).getTime() : 0
            return bDate - aDate
          })

          const topFallbackBooks = sortedFallbackBooks.slice(0, 5)
          console.log("📖 Fallback books found:", topFallbackBooks.length, topFallbackBooks)
          
          setFoundBooks(topFallbackBooks)
          // Don't auto-add books to bookshelf - just show as suggestions
          // Don't clear search title - let user see what they searched for
        } else {
          console.log("❌ No results from fallback search either")
        }
      }
    } catch (error) {
      console.error("Error searching books:", error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Add Author */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <Input
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            placeholder="Enter author name..."
            onKeyPress={(e) => e.key === "Enter" && addAuthor()}
            className="flex-1 border-orange-200 focus:border-orange-400"
            disabled={isAddingAuthor}
          />
          <Button
            onClick={addAuthor}
            disabled={!newAuthor.trim() || isAddingAuthor}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isAddingAuthor ? "Adding..." : "Add"}
          </Button>
        </div>

        <Button
          onClick={() => setShowImport(true)}
          variant="outline"
          className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import Authors
        </Button>
      </div>

      {/* Search Books */}
      <div className="border-t border-orange-200 pt-6">
        <div className="mb-3">
          <h4 className="font-semibold text-orange-800 mb-2">Add Books by Title</h4>
          <p className="text-sm text-orange-600">
            Enter a book title to find and add it to your bookshelf. You can then choose to add the author to your authors list.
          </p>
        </div>
        <div className="flex gap-3">
          <Input
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            placeholder="Type a book title here (e.g., 'The Great Gatsby')"
            onKeyPress={(e) => e.key === "Enter" && searchBooks()}
            className="flex-1 border-orange-200 focus:border-orange-400"
          />
          <Button
            onClick={searchBooks}
            disabled={!searchTitle.trim() || isSearching}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Search className="w-4 h-4 mr-2" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {/* Found Books */}
      {foundBooks.length > 0 && (
        <div className="border-t border-orange-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-orange-800">Found Books ({foundBooks.length})</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFoundBooks([])}
              className="text-xs border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              Clear Results
            </Button>
          </div>
          <div className="space-y-3">
            {foundBooks.map((book) => (
              <div
                key={book.id}
                className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
              >
                <div className="flex-1">
                  <div className="font-medium text-orange-900">{book.title}</div>
                  <div className="text-sm text-orange-700">by {book.author}</div>
                  {book.publishedDate && (
                    <div className="text-xs text-orange-500">
                      Published: {new Date(book.publishedDate).getFullYear()}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!authors.some((author) => author.toLowerCase() === book.author.toLowerCase()) ? (
                    <Button
                      size="sm"
                      onClick={() => addAuthorFromBook(book)}
                      disabled={isAddingAuthor}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Author
                    </Button>
                  ) : (
                    <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-50 rounded">
                      Author Added
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-orange-600">
            💡 Books have been added to your bookshelf. Click "Add Author" to get more books by that author.
          </div>
        </div>
      )}

      {/* Authors List */}
      {authors.length > 0 && (
        <div className="border-t border-orange-200 pt-6">
          <h4 className="font-semibold text-orange-800 mb-4">Your Authors ({authors.length})</h4>
          <div className="space-y-2">
            {Array.from(new Set(authors))
              .sort((a, b) => getLastName(a).localeCompare(getLastName(b)))
              .map((author, index) => (
                <div
                  key={`${author}-${index}`}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <span className="font-medium text-orange-900">{author}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAuthor(author)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Author Verification Dialog */}
      <Dialog open={showAuthorVerification} onOpenChange={(open) => {
        setShowAuthorVerification(open)
        if (!open) {
          // Clear pending author name when dialog is closed without selection
          setPendingAuthorName("")
        }
      }}>
        <DialogContent className="sm:max-w-2xl bg-white border-orange-200 rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-orange-800 font-display text-xl">Multiple Authors Found</DialogTitle>
            <DialogDescription>
              We found multiple authors with similar names. Please select the correct author:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {authorCandidates.map((candidate, index) => (
              <Card key={index} className="border-orange-200 hover:border-orange-400 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-orange-900 mb-2">{candidate.name}</h4>
                      <p className="text-sm text-orange-600 mb-3">{candidate.bookCount} books found</p>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-orange-700">Sample books:</p>
                        {candidate.sampleBooks.map((book: any, bookIndex: number) => (
                          <div key={bookIndex} className="text-xs text-orange-600 pl-2 border-l-2 border-orange-200">
                            • {book.title || book.volumeInfo?.title || 'Unknown Title'} ({book.publishedDate ? new Date(book.publishedDate).getFullYear() : 'Unknown year'})
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={async () => {
                        const selectedAuthor = candidate.name
                        setShowAuthorVerification(false)
                        setIsAddingAuthor(true)
                        
                        try {
                          // Check if author already exists (in case user clicked add before verification)
                          if (authors.some((author) => author.toLowerCase() === selectedAuthor.toLowerCase())) {
                            toast({
                              title: "Author Already Exists",
                              description: `${selectedAuthor} is already in your authors list.`,
                            })
                            setIsAddingAuthor(false)
                            setPendingAuthorName("")
                            return
                          }
                          
                          // Deduplicate authors before adding
                          const uniqueAuthors = Array.from(new Set([...authors, selectedAuthor]))
                          const updatedAuthors = uniqueAuthors.sort((a, b) => getLastName(a).localeCompare(getLastName(b)))
                          setAuthors(updatedAuthors)
                          setNewAuthor("") // Clear the input field
                          setPendingAuthorName("") // Clear pending name
                          
                          if (userId) {
                            await saveUserAuthors(userId, updatedAuthors)
                            await trackEvent(userId, {
                              event_type: ANALYTICS_EVENTS.AUTHOR_ADDED,
                              event_data: {
                                author_name: selectedAuthor,
                                total_authors: updatedAuthors.length,
                                timestamp: new Date().toISOString(),
                              },
                            })
                          }
                          
                          // Use the books that were already grouped for this specific candidate author
                          // This ensures we only get books by the selected author, not from cache of broader search
                          const candidateBooks = candidate.allBooks || []
                          
                          // Process the books to ensure they're in the correct format
                          const processedBooks = candidateBooks.map((item: any) => {
                            // Handle both raw API data and processed Book objects
                            if (item.volumeInfo) {
                              // Raw API data - convert to Book format
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
                                imageUrl: item.volumeInfo.imageLinks?.thumbnail || "",
                                thumbnail: item.volumeInfo.imageLinks?.thumbnail || "",
                                previewLink: item.volumeInfo.previewLink || "",
                                infoLink: item.volumeInfo.infoLink || "",
                                canonicalVolumeLink: item.volumeInfo.canonicalVolumeLink || "",
                              }
                            } else {
                              // Already processed Book object
                              return item
                            }
                          })
                          
                          if (processedBooks && processedBooks.length > 0) {
                            onBooksFound(processedBooks)
                          }
                          
                          toast({
                            title: "Author Added",
                            description: `${selectedAuthor} has been added to your authors list.`,
                          })
                        } catch (error) {
                          console.error("Error adding author:", error)
                          toast({
                            title: "Error",
                            description: "Failed to add author. Please try again.",
                            variant: "destructive",
                          })
                        } finally {
                          setIsAddingAuthor(false)
                        }
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white ml-4"
                    >
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="sm:max-w-md bg-white border-orange-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-orange-800 font-display text-xl">Import Authors</DialogTitle>
          </DialogHeader>
          <AuthorImport 
            onBulkImport={async (books, importedAuthors) => {
              try {
                // Add imported authors to the authors list
                const newAuthorNames = importedAuthors.map(author => author.name)
                const updatedAuthors = [...new Set([...authors, ...newAuthorNames])]
                setAuthors(updatedAuthors)
                
                // Save to database
                if (userId) {
                  await saveUserAuthors(userId, updatedAuthors)
                }
                
                // Add books to the bookshelf
                if (books.length > 0) {
                  onBooksFound(books)
                }
                
                // Track analytics
                if (userId) {
                  await trackEvent(userId, {
                    event_type: ANALYTICS_EVENTS.AUTHOR_ADDED,
                    event_data: {
                      method: 'bulk_import',
                      count: importedAuthors.length,
                      books_count: books.length,
                      timestamp: new Date().toISOString(),
                    },
                  })
                }
                
                toast({
                  title: "Import Successful!",
                  description: `Added ${importedAuthors.length} authors and ${books.length} books`,
                })
              } catch (error) {
                console.error("Error during bulk import:", error)
                toast({
                  title: "Import Error",
                  description: "Failed to save imported data. Please try again.",
                  variant: "destructive",
                })
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
