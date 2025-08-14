"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2, Search, Upload } from "lucide-react"
import type { Book } from "@/lib/types"
import AuthorImport from "./AuthorImport"
import { saveUserAuthors } from "@/lib/database"
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics"
import { deduplicateBooks } from "@/lib/utils"

interface AuthorManagerProps {
  authors: string[]
  setAuthors: (authors: string[]) => void
  onBooksFound: (books: Book[]) => void
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

const normalizeAuthorName = (name: string): string => {
  const normalized = name
    .trim()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
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
  }

  return corrections[normalized] || normalized
}

export default function AuthorManager({ authors, setAuthors, onBooksFound, userId }: AuthorManagerProps) {
  const [newAuthor, setNewAuthor] = useState("")
  const [searchTitle, setSearchTitle] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [isAddingAuthor, setIsAddingAuthor] = useState(false)

  const addAuthor = async () => {
    if (newAuthor.trim() && !authors.some((author) => author.toLowerCase() === newAuthor.toLowerCase())) {
      setIsAddingAuthor(true)

      const normalizedName = normalizeAuthorName(newAuthor)

      const updatedAuthors = [...authors, normalizedName].sort((a, b) => getLastName(a).localeCompare(getLastName(b)))
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

      try {
        let allBooks: Book[] = []

        console.log(`=== FETCHING BOOKS FOR ${normalizedName.toUpperCase()} ===`)

        const queries = [
          `inauthor:"${encodeURIComponent(normalizedName)}"`,
          `"${encodeURIComponent(normalizedName)}" author`,
        ]

        for (const query of queries) {
          const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=40&orderBy=newest&printType=books`,
          )
          const data = await response.json()

          if (data.items) {
            const books = data.items
              .filter((item: any) => {
                const apiAuthor = item.volumeInfo.authors?.[0] || ""
                const searchedAuthor = normalizedName.toLowerCase()
                const bookAuthor = apiAuthor.toLowerCase()

                // Check for exact match first
                if (bookAuthor === searchedAuthor) return true

                const searchedWords = searchedAuthor
                  .split(/[\s,]+/)
                  .filter((word) => word.length > 1)
                  .sort()
                const bookWords = bookAuthor
                  .split(/[\s,]+/)
                  .filter((word) => word.length > 1)
                  .sort()

                if (searchedWords.length !== bookWords.length) return false

                return searchedWords.every((word, index) => word === bookWords[index])
              })
              .map((item: any) => {
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
                    console.log(
                      `Unreasonably far future date detected for ${item.volumeInfo.title}: ${publishedDate}, setting to null`,
                    )
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
                  author: item.volumeInfo.authors?.[0] || normalizedName,
                  authorId: normalizedName,
                  publishedDate: publishedDate,
                  description: item.volumeInfo.description,
                  pageCount: item.volumeInfo.pageCount,
                  categories: item.volumeInfo.categories,
                  thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace("http://", "https://"),
                  language: item.volumeInfo.language || "en",
                }
              })

            allBooks = [...allBooks, ...books]
          }
        }

        console.log(`Raw API results: ${allBooks.length} books from Google Books API`)

        const filteredBooks = allBooks.filter((book) => {
          const title = book.title.toLowerCase()
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
            console.log(`Filtering out promotional material: ${book.title}`)
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
            console.log(`Filtering out special release: ${book.title}`)
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
            console.log(`Filtering out rerelease: ${book.title}`)
            return false
          }

          return true
        })

        const deduplicatedBooks = deduplicateBooks(filteredBooks)

        console.log(
          `Found ${allBooks.length} total books, ${filteredBooks.length} after filtering, ${deduplicatedBooks.length} unique books for ${normalizedName}`,
        )

        const upcomingBooks = deduplicatedBooks.filter((book) => {
          if (!book.publishedDate) return false
          const bookDate = new Date(book.publishedDate)
          const now = new Date()
          return bookDate > now
        })
        console.log(`Upcoming releases found: ${upcomingBooks.length}`)
        upcomingBooks.forEach((book) => {
          console.log(`- ${book.title} by ${book.author} (${book.publishedDate})`)
        })

        onBooksFound(deduplicatedBooks)
      } catch (error) {
        console.error("Error fetching books for author:", error)
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

  const searchBooks = async () => {
    if (!searchTitle.trim()) return

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
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchTitle.trim())}&maxResults=10`,
      )
      const data = await response.json()

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
              console.log(
                `Unreasonably far future date detected for ${item.volumeInfo.title}: ${publishedDate}, setting to null`,
              )
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

        onBooksFound(books)
        setSearchTitle("")
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
            className="border-orange-200 focus:border-orange-400"
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
        <div className="flex gap-3">
          <Input
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            placeholder="Search for a book title..."
            onKeyPress={(e) => e.key === "Enter" && searchBooks()}
            className="border-orange-200 focus:border-orange-400"
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

      {/* Authors List */}
      {authors.length > 0 && (
        <div className="border-t border-orange-200 pt-6">
          <h4 className="font-semibold text-orange-800 mb-4">Your Authors ({authors.length})</h4>
          <div className="space-y-2">
            {authors
              .sort((a, b) => getLastName(a).localeCompare(getLastName(b)))
              .map((author) => (
                <div
                  key={author}
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

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="sm:max-w-md bg-white border-orange-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-orange-800 font-display text-xl">Import Authors</DialogTitle>
          </DialogHeader>
          <AuthorImport authors={authors} setAuthors={setAuthors} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
