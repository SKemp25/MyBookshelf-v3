"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookCheck,
  BookmarkPlus,
  BookX,
  RotateCcw,
  Globe,
  FileText,
  Calendar,
  Headphones,
  ShoppingCart,
  Send,
  BookOpen,
  User,
  Heart,
  ThumbsUp,
  ThumbsDown,
  List,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react"
import type { Book, Platform } from "@/lib/types"
import { updateBookStatus } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"

interface BookGridProps {
  books: Book[]
  sortBy: string
  readBooks: Set<string>
  wantToReadBooks: Set<string>
  dontWantBooks: Set<string>
  sharedBooks: Set<string>
  friends: string[]
  platforms: Platform[]
  onMarkAsRead: (bookId: string, title: string, author: string) => void
  onUnmarkAsRead?: (bookId: string, title: string, author: string) => void
  onMarkAsWant: (bookId: string, title: string, author: string) => void
  onToggleDontWant: (bookId: string, title: string, author: string) => void
  onSetBookRating?: (bookId: string, rating: "loved" | "liked" | "didnt-like" | null) => void
  bookRatings?: Map<string, "loved" | "liked" | "didnt-like">
  userId?: string // Added userId for database operations
  onBookClick?: (bookId: string) => void // Track recently viewed
  highContrast?: boolean // High contrast mode
  recommendedAuthors?: Set<string> // Authors that came from recommendations
  onAddAuthor?: (authorName: string) => void // Add all books by an author
  memoryAids?: string[] // Memory aid preferences
  viewMode?: "grid" | "list" // View mode for displaying books
  onSortChange?: (sortBy: string) => void // Callback to change sorting
  emptyStateIconClass?: string // Theme-aware icon class for empty state
  emptyStateTitleClass?: string // Theme-aware title class for empty state
  emptyStateDescClass?: string // Theme-aware description class for empty state
  showRecommendButton?: boolean // Show Recommend button; opens Google Books for similar titles
  onRecommendClick?: (book: Book) => void
}

export default function BookGrid({
  books,
  sortBy,
  readBooks,
  wantToReadBooks,
  dontWantBooks,
  sharedBooks,
  friends,
  platforms,
  onMarkAsRead,
  onUnmarkAsRead,
  onMarkAsWant,
  onToggleDontWant,
  onSetBookRating,
  bookRatings = new Map(),
  userId,
  onBookClick,
  highContrast = false,
  recommendedAuthors = new Set(),
  onAddAuthor,
  memoryAids = [],
  viewMode = "grid",
  onSortChange,
  emptyStateIconClass = "text-orange-400",
  emptyStateTitleClass = "text-orange-800",
  emptyStateDescClass = "text-orange-600",
  showRecommendButton = false,
  onRecommendClick,
}: BookGridProps) {
  const showCovers = memoryAids.includes("Show book covers")
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  const [expandedMobileDescriptions, setExpandedMobileDescriptions] = useState<Set<string>>(new Set())
  const [isUpdating, setIsUpdating] = useState<Set<string>>(new Set())
  const [showSeriesForBookId, setShowSeriesForBookId] = useState<string | null>(null)
  const { toast } = useToast()
  const isMobile = useIsMobile()
  
  const toggleMobileDescription = (bookId: string) => {
    setExpandedMobileDescriptions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(bookId)) {
        newSet.delete(bookId)
      } else {
        newSet.add(bookId)
      }
      return newSet
    })
  }

  const handleMarkAsRead = async (bookId: string, title: string, author: string) => {
    if (isUpdating.has(bookId)) return

    setIsUpdating((prev) => new Set([...prev, bookId]))

    try {
      if (userId) {
        await updateBookStatus(userId, bookId, "read")
      }
      onMarkAsRead(bookId, title, author)
      toast({
        title: "Book Marked as Read!",
        description: `"${title}" by ${author}`,
      })
    } catch (error) {
      console.error("Error updating book status to read:", error)
      toast({
        title: "Error",
        description: "Failed to update book status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating((prev) => {
        const newSet = new Set(prev)
        newSet.delete(bookId)
        return newSet
      })
    }
  }

  const handleUnmarkAsRead = async (bookId: string, title: string, author: string) => {
    if (isUpdating.has(bookId)) return

    setIsUpdating((prev) => new Set([...prev, bookId]))

    try {
      if (userId) {
        await updateBookStatus(userId, bookId, "unread")
      }
      onUnmarkAsRead?.(bookId, title, author)
      toast({
        title: "Book Unmarked",
        description: `"${title}" by ${author} is now unread`,
      })
    } catch (error) {
      console.error("Error updating book status to unread:", error)
      toast({
        title: "Error",
        description: "Failed to update book status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating((prev) => {
        const newSet = new Set(prev)
        newSet.delete(bookId)
        return newSet
      })
    }
  }

  const handleMarkAsWant = async (bookId: string, title: string, author: string) => {
    if (isUpdating.has(bookId)) return

    setIsUpdating((prev) => new Set([...prev, bookId]))

    try {
      if (userId) {
        await updateBookStatus(userId, bookId, "want")
      }
      onMarkAsWant(bookId, title, author)
      toast({
        title: "Added to Want to Read!",
        description: `"${title}" by ${author}`,
      })
    } catch (error) {
      console.error("Error updating book status to want:", error)
      toast({
        title: "Error",
        description: "Failed to update book status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating((prev) => {
        const newSet = new Set(prev)
        newSet.delete(bookId)
        return newSet
      })
    }
  }

  const handleToggleDontWant = async (bookId: string, title: string, author: string) => {
    if (isUpdating.has(bookId)) return

    setIsUpdating((prev) => new Set([...prev, bookId]))

    try {
      if (userId) {
        const newStatus = dontWantBooks.has(bookId) ? "unread" : "dont-want"
        await updateBookStatus(userId, bookId, newStatus)
      }
      onToggleDontWant(bookId, title, author)
      
      // Show toast notification
      const isCurrentlyPassed = dontWantBooks.has(bookId)
      toast({
        title: isCurrentlyPassed ? "Book Removed from Pass List!" : "Book Marked as Pass!",
        description: `"${title}" by ${author}`,
      })
    } catch (error) {
      console.error("Error updating book status:", error)
      toast({
        title: "Error",
        description: "Failed to update book status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating((prev) => {
        const newSet = new Set(prev)
        newSet.delete(bookId)
        return newSet
      })
    }
  }

  const getReadingStatus = (bookId: string) => {
    if (readBooks.has(bookId)) return "read"
    if (wantToReadBooks.has(bookId)) return "want"
    if (dontWantBooks.has(bookId)) return "pass"
    return "unread"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "read":
        return "bg-green-100 text-green-800 border-green-200"
      case "want":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "pass":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "read":
        return "Read"
      case "want":
        return "Want"
      case "pass":
        return "Pass"
      default:
        return "Unread"
    }
  }

  const openPlatformLink = (book: Book, platform: Platform) => {
    let url = platform.url

    // Construct platform-specific URLs for direct book access
    switch (platform.name.toLowerCase()) {
      case "kindle":
        // Amazon Kindle - search by title and author for best match
        const amazonQuery = `${book.title} ${getAuthorName(book)}`.replace(/[^\w\s]/g, " ").trim()
        url = `https://www.amazon.com/s?k=${encodeURIComponent(amazonQuery)}&i=digital-text&ref=nb_sb_noss`
        break

      case "audible":
        // Audible - search by title and author
        const audibleQuery = `${book.title} ${getAuthorName(book)}`.replace(/[^\w\s]/g, " ").trim()
        url = `https://www.audible.com/search?keywords=${encodeURIComponent(audibleQuery)}&ref=a_search_c1_lProduct_1_1&pf_rd_p=073d8370-97e5-4b7b-be04-aa6cf4b9e3a4&pf_rd_r=&pageLoadId=&creativeId=`
        break

      case "books":
      case "print":
        // Google Books or general book search
        const bookQuery = `${book.title} ${getAuthorName(book)}`.replace(/[^\w\s]/g, " ").trim()
        url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(bookQuery + " book")}`
        break

      case "apple books":
      case "ibooks":
        // Apple Books
        const appleQuery = `${book.title} ${getAuthorName(book)}`.replace(/[^\w\s]/g, " ").trim()
        url = `https://books.apple.com/search?term=${encodeURIComponent(appleQuery)}`
        break

      case "kobo":
        // Kobo
        const koboQuery = `${book.title} ${getAuthorName(book)}`.replace(/[^\w\s]/g, " ").trim()
        url = `https://www.kobo.com/search?query=${encodeURIComponent(koboQuery)}`
        break

      case "barnes & noble":
      case "nook":
        // Barnes & Noble
        const bnQuery = `${book.title} ${getAuthorName(book)}`.replace(/[^\w\s]/g, " ").trim()
        url = `https://www.barnesandnoble.com/s/${encodeURIComponent(bnQuery)}`
        break

      case "library":
      case "local library":
      case "overdrive":
      case "libby":
        // Smart library URL handling - detect common platforms and construct proper search URLs
        if (platform.url && platform.url !== "") {
          const title = book.title.replace(/[^\w\s]/g, " ").trim()
          const author = getAuthorName(book).replace(/[^\w\s]/g, " ").trim()
          
          // Create multiple search strategies for better results
          const searchStrategies = [
            `"${title}" "${author}"`,  // Exact phrase search
            `${title} ${author}`,      // Combined search
            title,                     // Title only
            author,                    // Author only
            `${author} ${title}`       // Author first
          ]
          
          const encodedTitle = encodeURIComponent(title)
          const encodedAuthor = encodeURIComponent(author)
          const encodedQuery = encodeURIComponent(searchStrategies[0]) // Use best strategy first
          
          // Check if URL contains template variables (user knows how to use them)
          if (platform.url.includes("{") && platform.url.includes("}")) {
            url = platform.url
              .replace("{title}", encodedTitle)
              .replace("{author}", encodedAuthor)
              .replace("{query}", encodedQuery)
          } else {
            // Smart detection for common library platforms
            const urlLower = platform.url.toLowerCase()
            
            if (urlLower.includes("libbyapp.com") || urlLower.includes("libby") || urlLower.includes("overdrive.com")) {
              // Libby/OverDrive - convert Libby URL to OverDrive base URL if needed
              let overdriveBase = platform.url
              
              // If it's a Libby URL, extract library code and convert to OverDrive format
              // Example: https://libbyapp.com/library/mcplmd -> https://mcplmd.overdrive.com
              if (urlLower.includes("libbyapp.com/library/")) {
                const libraryMatch = platform.url.match(/library\/([^\/\?]+)/i)
                if (libraryMatch && libraryMatch[1]) {
                  const libraryCode = libraryMatch[1]
                  overdriveBase = `https://${libraryCode}.overdrive.com`
                } else {
                  // Fallback if library code not found
                  overdriveBase = "https://www.overdrive.com"
                }
              } else if (urlLower.includes("overdrive.com") && !urlLower.includes("www.overdrive.com")) {
                // Already an OverDrive base URL (e.g., https://mclpmd.overdrive.com)
                // Clean up the URL to ensure it's just the base
                overdriveBase = platform.url.replace(/\/$/, "").split("?")[0].split("#")[0]
              } else if (urlLower.includes("www.overdrive.com")) {
                // Generic OverDrive, try to extract library code from Libby URL if available
                // For now, use generic OverDrive
                overdriveBase = "https://www.overdrive.com"
              }
              
              // Construct OverDrive search URL: {overdriveBase}/search/title?query={bookTitle}
              // OverDrive uses /search/title?query= format for title searches
              url = `${overdriveBase}/search/title?query=${encodedTitle}`
            } else if (urlLower.includes("hoopladigital.com") || urlLower.includes("hoopla")) {
              // Hoopla - use title search first
              url = `https://www.hoopladigital.com/search?q=${encodedTitle}`
            } else if (urlLower.includes("worldcat.org")) {
              // WorldCat - use advanced search format
              url = `https://www.worldcat.org/search?q=ti%3A${encodedTitle}+au%3A${encodedAuthor}&qt=results_page`
            } else if (urlLower.includes("catalog") || urlLower.includes("library")) {
              // Generic library catalog - try multiple search parameters
              const separator = platform.url.includes("?") ? "&" : "?"
              url = `${platform.url}${separator}search=${encodedTitle}&author=${encodedAuthor}`
            } else {
              // Generic library - try to append search parameters
              const separator = platform.url.includes("?") ? "&" : "?"
              url = `${platform.url}${separator}q=${encodedQuery}`
            }
          }
        } else {
          // Default to WorldCat with advanced search if no custom URL provided
          // This ensures library platforms always search for the selected book
          const title = book.title.replace(/[^\w\s]/g, " ").trim()
          const author = getAuthorName(book).replace(/[^\w\s]/g, " ").trim()
          const encodedTitle = encodeURIComponent(title)
          const encodedAuthor = encodeURIComponent(author)
          url = `https://www.worldcat.org/search?q=ti%3A${encodedTitle}+au%3A${encodedAuthor}&qt=results_page`
        }
        break

      default:
        // For custom platforms, use the existing template replacement
        const query = `${book.title} ${getAuthorName(book)}`.replace(/[^\w\s]/g, " ").trim()
        url = platform.url
          .replace("{title}", encodeURIComponent(book.title))
          .replace("{author}", encodeURIComponent(getAuthorName(book)))
          .replace("{query}", encodeURIComponent(query))
          .replace("{isbn}", encodeURIComponent(book.isbn || ""))
    }

    window.open(url, "_blank")
  }


  const getAuthorName = (book: Book): string => {
    if (typeof (book as any).author === "string" && (book as any).author) {
      return (book as any).author as any
    }
    if ((book as any).author && typeof (book as any).author === "object" && "name" in ((book as any).author as any)) {
      return (((book as any).author as any).name as string) || "Unknown Author"
    }
    if (Array.isArray((book as any).authors) && (book as any).authors.length > 0) {
      return ((book as any).authors[0] as string) || "Unknown Author"
    }
    return "Unknown Author"
  }

  const getLastName = (authorName: string): string => {
    if (!authorName || typeof authorName !== "string") return ""
    const nameParts = authorName.trim().split(/\s+/)
    return nameParts[nameParts.length - 1].toLowerCase()
  }

  const toggleDescription = (bookId: string) => {
    const newExpanded = new Set(expandedDescriptions)
    if (newExpanded.has(bookId)) {
      newExpanded.delete(bookId)
    } else {
      newExpanded.add(bookId)
    }
    setExpandedDescriptions(newExpanded)
  }

  const isUpcomingRelease = (publishedDate: string) => {
    if (!publishedDate) return false
    
    try {
    const now = new Date()
    const twelveMonthsFromNow = new Date()
    twelveMonthsFromNow.setMonth(twelveMonthsFromNow.getMonth() + 12)
      
      // Handle different date formats
      let bookDate: Date
      const dateStr = publishedDate.trim()
      
      if (dateStr.match(/^\d{4}$/)) {
        // Year only (e.g., "2026")
        bookDate = new Date(`${dateStr}-01-01`)
      } else if (dateStr.match(/^\d{4}-\d{2}$/)) {
        // Year-month (e.g., "2026-07")
        bookDate = new Date(`${dateStr}-01`)
      } else {
        // Full date (e.g., "2026-07-13")
        bookDate = new Date(dateStr)
      }
      
      // Check if date is valid
      if (isNaN(bookDate.getTime())) {
        return false
      }
      
      // Check if it's in the future and within 12 months
    return bookDate >= now && bookDate <= twelveMonthsFromNow
    } catch (error) {
      console.error("Error parsing date:", publishedDate, error)
      return false
    }
  }

  const formatUpcomingDate = (publishedDate: string) => {
    if (!publishedDate) return ""
    const date = new Date(publishedDate)
    const now = new Date()

    if (date > now) {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    }
    return publishedDate
  }

  const sortedBooks = [...books].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.publishedDate || "1900").getTime() - new Date(a.publishedDate || "1900").getTime()
      case "oldest":
        return new Date(a.publishedDate || "2100").getTime() - new Date(b.publishedDate || "2100").getTime()
      case "title":
        return a.title.localeCompare(b.title)
      case "author":
        const lastNameA = getLastName(getAuthorName(a))
        const lastNameB = getLastName(getAuthorName(b))
        const nameComparison = lastNameA.localeCompare(lastNameB)

        // If authors have the same last name, sort by publication date (newest first)
        if (nameComparison === 0) {
          return new Date(b.publishedDate || "1900").getTime() - new Date(a.publishedDate || "1900").getTime()
        }

        return nameComparison
      case "pages":
        return (b.pageCount || 0) - (a.pageCount || 0)
      default:
        return 0
    }
  })

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-28 h-28 mx-auto mb-6 opacity-30">
          <BookOpen className={`w-full h-full ${emptyStateIconClass}`} />
        </div>
        <h3 className={`text-2xl md:text-3xl font-semibold mb-3 ${emptyStateTitleClass}`}>Start Your Personal Library</h3>
        <p className={`text-lg md:text-xl max-w-md mx-auto ${emptyStateDescClass}`}>Add your favorite authors to discover and organize your books.</p>
      </div>
    )
  }

  // Helper function to render sortable header
  const renderSortableHeader = (label: string, sortKey: string) => {
    const isActive = sortBy === sortKey
    const handleClick = () => {
      if (onSortChange) {
        // Toggle between ascending and descending if already sorted by this column
        if (isActive && sortBy === sortKey) {
          // For now, just set the sort key (can enhance later to toggle direction)
          onSortChange(sortKey)
        } else {
          onSortChange(sortKey)
        }
      }
    }

    return (
      <th 
        className={`text-left p-2 text-xs font-bold uppercase text-gray-700 ${
          onSortChange ? "cursor-pointer hover:bg-gray-200 select-none" : ""
        } transition-colors`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          {onSortChange && (
            <span className="text-gray-400">
              {isActive ? (
                sortKey === "newest" || sortKey === "pages" ? (
                  <ArrowDown className="w-3 h-3" />
                ) : (
                  <ArrowUp className="w-3 h-3" />
                )
              ) : (
                <ArrowUpDown className="w-3 h-3" />
              )}
            </span>
          )}
        </div>
      </th>
    )
  }

  // For list view, render as a table
  if (viewMode === "list") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="text-left p-2 text-xs font-bold uppercase text-gray-700 w-16">Cover</th>
              {renderSortableHeader("Title", "title")}
              {renderSortableHeader("Author", "author")}
              {renderSortableHeader("Published", "newest")}
              {renderSortableHeader("Pages", "pages")}
              <th className="text-left p-2 text-xs font-bold uppercase text-gray-700 w-24">Status</th>
              {showRecommendButton && onRecommendClick && (
                <th className="text-left p-2 text-xs font-bold uppercase text-gray-700 w-16">Rec</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedBooks.map((book, index) => {
              const bookId = `${book.title}-${book.author}`
              const status = getReadingStatus(bookId)
              const isUpcoming = isUpcomingRelease(book.publishedDate || "")
              const bookAuthor = getAuthorName(book)
              const isRecommendedAuthor = recommendedAuthors.has(bookAuthor)

              return (
                <tr
                  key={`${book.id}-${index}`}
                  data-book-id={book.id}
                  onClick={() => onBookClick?.(book.id)}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer ${
                    isUpcoming ? "bg-yellow-50" : isRecommendedAuthor ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="p-2">
                    {book.thumbnail && showCovers ? (
                      <img
                        src={book.thumbnail || "/placeholder.svg"}
                        alt={book.title}
                        className="w-10 h-15 object-cover rounded shadow-sm"
                      />
                    ) : (
                      <div className="w-10 h-15 bg-gray-200 rounded flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="p-2 max-w-[200px]">
                    <div className="font-bold text-sm text-black truncate" title={book.title}>
                      {book.title}
                    </div>
                  </td>
                  <td className="p-2 max-w-[150px]">
                    <div className="text-red-600 font-semibold text-sm truncate" title={bookAuthor}>
                      {bookAuthor}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="text-xs text-gray-600 whitespace-nowrap">{book.publishedDate || "-"}</div>
                  </td>
                  <td className="p-2">
                    <div className="text-xs text-gray-600 whitespace-nowrap">{book.pageCount && book.pageCount > 0 ? `${book.pageCount}` : "-"}</div>
                  </td>
                  <td className="p-2">
                    <Badge className={`${getStatusColor(status)} border-2 border-black font-bold uppercase text-xs`}>
                      {getStatusText(status)}
                    </Badge>
                  </td>
                  {showRecommendButton && onRecommendClick && (
                    <td className="p-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRecommendClick(book)
                        }}
                        className="p-1.5 rounded border-2 border-amber-400 text-amber-800 hover:bg-amber-50 bg-white"
                        title="Recommend — open Google Books for similar titles"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {sortedBooks.map((book, index) => {
          const bookId = `${book.title}-${book.author}`
          const status = getReadingStatus(bookId)
          const isExpanded = expandedDescriptions.has(book.id)
          const isUpcoming = isUpcomingRelease(book.publishedDate || "")
          const isBookUpdating = isUpdating.has(bookId)
          const bookAuthor = getAuthorName(book)
          const isRecommendedAuthor = recommendedAuthors.has(bookAuthor)

          return (
            /* Grid View - Use Card */
            <Card
              key={`${book.id}-${index}`}
              data-book-id={book.id}
              className={`shadow-lg hover:shadow-xl transition-all duration-300 ${
                isUpcoming
                  ? "shadow-yellow-300 ring-2 ring-yellow-300 bg-gradient-to-br from-white to-yellow-50 text-black"
                  : isRecommendedAuthor
                  ? "shadow-blue-200 ring-2 ring-blue-200 bg-gradient-to-br from-white to-blue-50 text-black"
                  : highContrast ? "bg-white text-black" : "bg-white text-black"
              }`}
              onClick={() => onBookClick?.(book.id)}
              style={{ cursor: onBookClick ? 'pointer' : 'default' }}
            >
              <CardContent className={isMobile ? "p-4" : "p-6"}>
                {isMobile ? (
                  /* Clean Mobile View - iPhone */
                  <div className="space-y-3">
                    {/* Book Cover - if available */}
                    {book.thumbnail && showCovers && (
                      <div className="flex justify-center mt-4">
                        <img
                          src={book.thumbnail || "/placeholder.svg"}
                          alt={book.title}
                          className="w-24 h-36 object-cover rounded-lg shadow-sm border-2 border-black"
                        />
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="font-black text-black text-base leading-tight uppercase">
                      {book.title}
                    </h3>
                    
                    {/* Author */}
                    <p className="text-red-600 font-bold text-sm uppercase">{getAuthorName(book)}</p>

                    {/* Book Info - Compact */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
                      {book.publishedDate && (
                        <span className="font-medium">
                          {isUpcoming ? formatUpcomingDate(book.publishedDate) : book.publishedDate}
                        </span>
                      )}
                      {book.pageCount && book.pageCount > 0 && (
                        <span className="font-medium">• {book.pageCount} pages</span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-center">
                      <Badge className={`${getStatusColor(status)} border-2 border-black font-bold uppercase text-xs`}>
                        {getStatusText(status)}
                      </Badge>
                    </div>

                    {/* Reading Status Buttons - Compact */}
                    <div className="flex gap-1 justify-center">
                      {status === "read" ? (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const currentRating = bookRatings.get(bookId)
                              const newRating = currentRating === "loved" ? null : "loved"
                              onSetBookRating?.(bookId, newRating as "loved" | "liked" | "didnt-like" | null)
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              bookRatings.get(bookId) === "loved"
                                ? "bg-pink-100 text-pink-600"
                                : "text-gray-400 hover:text-pink-600 hover:bg-pink-50"
                            }`}
                            title="Loved"
                          >
                            <Heart className={`w-4 h-4 ${bookRatings.get(bookId) === "loved" ? "fill-current" : ""}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const currentRating = bookRatings.get(bookId)
                              const newRating = currentRating === "liked" ? null : "liked"
                              onSetBookRating?.(bookId, newRating as "loved" | "liked" | "didnt-like" | null)
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              bookRatings.get(bookId) === "liked"
                                ? "bg-blue-100 text-blue-600"
                                : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            }`}
                            title="Liked"
                          >
                            <ThumbsUp className={`w-4 h-4 ${bookRatings.get(bookId) === "liked" ? "fill-current" : ""}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const currentRating = bookRatings.get(bookId)
                              const newRating = currentRating === "didnt-like" ? null : "didnt-like"
                              onSetBookRating?.(bookId, newRating as "loved" | "liked" | "didnt-like" | null)
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              bookRatings.get(bookId) === "didnt-like"
                                ? "bg-red-100 text-red-600"
                                : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                            }`}
                            title="Didn't like"
                          >
                            <ThumbsDown className={`w-4 h-4 ${bookRatings.get(bookId) === "didnt-like" ? "fill-current" : ""}`} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(bookId, book.title, getAuthorName(book))
                            }}
                            disabled={isBookUpdating}
                            className="flex-1 h-8 text-xs font-bold border-2 border-gray-400 text-gray-800 hover:bg-orange-50 bg-white"
                          >
                            <BookCheck className="w-3 h-3 mr-1" />
                            Read
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onMarkAsWant(bookId, book.title, getAuthorName(book))
                            }}
                            disabled={isBookUpdating}
                            className="flex-1 h-8 text-xs font-bold border-2 border-blue-400 text-blue-800 hover:bg-blue-50 bg-white"
                          >
                            <BookmarkPlus className="w-3 h-3 mr-1" />
                            Want
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleDontWant(bookId, book.title, getAuthorName(book))
                            }}
                            disabled={isBookUpdating}
                            className={`flex-1 h-8 text-xs font-bold border-2 bg-white ${
                              status === "pass"
                                ? "border-red-500 text-red-800 hover:bg-red-50"
                                : "border-gray-400 text-gray-800 hover:bg-gray-50"
                            }`}
                          >
                            <BookX className="w-3 h-3 mr-1" />
                            Pass
                          </Button>
                        </div>
                      )}
                    </div>

                    {showRecommendButton && onRecommendClick && (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRecommendClick(book)
                          }}
                          className="h-8 text-xs font-bold border-2 border-amber-400 text-amber-800 hover:bg-amber-50 bg-white"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Recommend
                        </Button>
                      </div>
                    )}

                    {/* Description - Expandable */}
                    {book.description && (
                      <div className="space-y-1">
                        <p className={`text-xs text-gray-700 leading-relaxed ${expandedMobileDescriptions.has(book.id) ? "" : "line-clamp-2"}`}>
                          {book.description}
                        </p>
                        {book.description.length > 100 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleMobileDescription(book.id)
                            }}
                            className="text-xs text-orange-600 hover:text-orange-700 font-bold"
                          >
                            {expandedMobileDescriptions.has(book.id) ? "Show less" : "Read more"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Platform Links - Compact */}
                    {platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center pt-2 border-t border-gray-200">
                        {platforms.slice(0, 4).map((platform, index) => (
                          <Button
                            key={`${platform.name}-${platform.category || 'default'}-${index}`}
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openPlatformLink(book, platform)
                            }}
                            className="border border-gray-300 text-gray-700 hover:bg-orange-50 bg-white text-xs h-6 px-2"
                          >
                            {platform.name === "Kindle" && <BookCheck className="w-3 h-3" />}
                            {platform.name === "Audible" && <Headphones className="w-3 h-3" />}
                            {platform.name === "Books" && <ShoppingCart className="w-3 h-3" />}
                            {!["Kindle", "Audible", "Books"].includes(platform.name) && <Globe className="w-3 h-3" />}
                            <span className="ml-1 hidden sm:inline">
                              {platform.name === "Books" ? "Print" : 
                               platform.name === "OverDrive/Libby" ? "Library" : 
                               platform.name}
                            </span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Full Desktop View */
                  <div className="space-y-4">
                    {/* Book Cover - only show if memory aid preference is enabled */}
                    {book.thumbnail && showCovers && (
                    <div className="flex justify-center mt-4">
                      <img
                        src={book.thumbnail || "/placeholder.svg"}
                        alt={book.title}
                        className="w-28 h-42 object-cover rounded-lg shadow-sm border-2 border-black"
                      />
                    </div>
                  )}

                  {/* Book Info */}
                  <div className="space-y-3">
                    <h3 className="font-black text-black text-lg leading-tight min-h-[3rem] flex items-center uppercase">
                      {book.title}
                    </h3>
                    <p className="text-red-600 font-bold text-base uppercase">{getAuthorName(book)}</p>

                    <div className="flex flex-wrap gap-2 text-sm">
                      {book.publishedDate && (
                        <div
                          className={`flex items-center gap-1 ${
                            isUpcoming
                              ? "text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full border border-emerald-300"
                              : "text-black"
                          }`}
                        >
                          <Calendar
                            className={`w-3 h-3 ${
                              isUpcoming ? "text-emerald-600" : "drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]"
                            }`}
                          />
                          <span className="font-bold">
                            {isUpcoming ? formatUpcomingDate(book.publishedDate) : book.publishedDate}
                          </span>
                          {isUpcoming && (
                            <span className="text-xs text-emerald-600 ml-1 font-black">• COMING SOON</span>
                          )}
                        </div>
                      )}
                      {book.pageCount && book.pageCount > 0 && (
                        <div className="flex items-center gap-1 text-black">
                          <FileText className="w-3 h-3 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                          <span className="font-bold">{book.pageCount} pages</span>
                        </div>
                      )}
                      {book.language && book.language !== "en" && (
                        <div className="flex items-center gap-1 text-black">
                          <Globe className="w-3 h-3 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                          <span className="font-bold">{book.language.toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex justify-center">
                    <Badge className={`${getStatusColor(status)} border-2 border-black font-bold uppercase`}>
                      {getStatusText(status)}
                    </Badge>
                  </div>

                  {/* Description */}
                  {book.description && (
                    <div className="space-y-2">
                      <p className={`text-sm text-gray-700 leading-relaxed ${isExpanded ? "" : "line-clamp-6"}`}>
                        {book.description}
                      </p>
                      {book.description.length > 300 && (
                        <button
                          onClick={() => toggleDescription(book.id)}
                          className="text-xs text-orange-600 hover:text-orange-700 font-bold uppercase"
                        >
                          {isExpanded ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {status === "read" ? (
                      // Show rating buttons and unmark button for read books
                      <div className="space-y-2">
                        <div className="flex gap-6 md:gap-8 justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const currentRating = bookRatings.get(bookId)
                              const newRating = currentRating === "loved" ? null : "loved"
                              onSetBookRating?.(bookId, newRating as "loved" | "liked" | "didnt-like" | null)
                            }}
                            className={`p-2 rounded transition-colors ${
                              bookRatings.get(bookId) === "loved"
                                ? "bg-pink-100 text-pink-600"
                                : "text-gray-400 hover:text-pink-600 hover:bg-pink-50"
                            }`}
                            title="I loved this book"
                          >
                            <Heart className={`w-5 h-5 ${bookRatings.get(bookId) === "loved" ? "fill-current" : ""}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const currentRating = bookRatings.get(bookId)
                              const newRating = currentRating === "liked" ? null : "liked"
                              onSetBookRating?.(bookId, newRating as "loved" | "liked" | "didnt-like" | null)
                            }}
                            className={`p-2 rounded transition-colors ${
                              bookRatings.get(bookId) === "liked"
                                ? "bg-blue-100 text-blue-600"
                                : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                            }`}
                            title="I liked this book"
                          >
                            <ThumbsUp className={`w-5 h-5 ${bookRatings.get(bookId) === "liked" ? "fill-current" : ""}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              const currentRating = bookRatings.get(bookId)
                              const newRating = currentRating === "didnt-like" ? null : "didnt-like"
                              onSetBookRating?.(bookId, newRating as "loved" | "liked" | "didnt-like" | null)
                            }}
                            className={`p-2 rounded transition-colors ${
                              bookRatings.get(bookId) === "didnt-like"
                                ? "bg-gray-100 text-gray-600"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                            }`}
                            title="I didn't like this book or gave up on it"
                          >
                            <ThumbsDown className={`w-5 h-5 ${bookRatings.get(bookId) === "didnt-like" ? "fill-current" : ""}`} />
                          </button>
                        </div>
                        {onUnmarkAsRead && (
                          <div className="flex justify-center">
                      <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUnmarkAsRead(bookId, book.title, getAuthorName(book))
                              }}
                              disabled={isBookUpdating}
                              className="h-6 px-1.5 text-[10px] font-normal border-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 bg-transparent"
                              title="Unmark as read"
                            >
                              <RotateCcw className="w-3 h-3 mr-0.5" />
                              Unmark
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Show Read/Want/Pass buttons for unread books
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Button
                          variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(bookId, book.title, getAuthorName(book))}
                        disabled={isBookUpdating}
                          className="h-8 px-2 md:px-3 text-xs font-bold border-2 border-gray-400 text-gray-800 hover:bg-orange-50 bg-white flex-shrink-0"
                          title="Mark as read"
                      >
                        <BookCheck className="w-3 h-3 mr-1 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                        Read
                      </Button>
                      <Button
                        variant={status === "want" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleMarkAsWant(bookId, book.title, getAuthorName(book))}
                        disabled={isBookUpdating}
                        className={`h-8 px-2 md:px-3 text-xs font-bold border-2 flex-shrink-0 ${
                          status === "want"
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            : "border-gray-400 text-gray-800 hover:bg-orange-50 bg-white"
                        }`}
                        title={status === "want" ? "Remove from want to read" : "Add to want to read"}
                      >
                        <BookmarkPlus className="w-3 h-3 mr-1 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                        Want
                      </Button>
                      <Button
                        variant={status === "pass" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleDontWant(bookId, book.title, getAuthorName(book))}
                        disabled={isBookUpdating}
                        className={`h-8 px-2 md:px-3 text-xs font-bold border-2 flex-shrink-0 ${
                          status === "pass"
                            ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                            : "border-gray-400 text-gray-800 hover:bg-orange-50 bg-white"
                        }`}
                        title={status === "pass" ? "Remove from pass list" : "Mark as pass"}
                      >
                        <BookX className="w-3 h-3 mr-1 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                        Pass
                      </Button>
                      </div>
                    )}
                    </div>

                    {showRecommendButton && onRecommendClick && (
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRecommendClick(book)
                          }}
                          className="h-8 px-3 text-xs font-bold border-2 border-amber-400 text-amber-800 hover:bg-amber-50 bg-white"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Recommend
                        </Button>
                      </div>
                    )}

                    {/* Platform Links */}
                    {platforms.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-red-600 uppercase tracking-wide">Find on:</div>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {platforms.slice(0, 4).map((platform, index) => (
                            <Button
                              key={`${platform.name}-${platform.category || 'default'}-${index}`}
                              variant="outline"
                              size="sm"
                              onClick={() => openPlatformLink(book, platform)}
                              className="border-2 border-black text-black hover:bg-orange-50 bg-white text-xs font-bold h-8 px-3"
                            >
                              {platform.name === "Kindle" && (
                                <BookCheck className="w-3 h-3 mr-1 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                              )}
                              {platform.name === "Audible" && (
                                <Headphones className="w-3 h-3 mr-1 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                              )}
                              {platform.name === "Books" && (
                                <ShoppingCart className="w-3 h-3 mr-1 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                              )}
                              {!["Kindle", "Audible", "Books"].includes(platform.name) && (
                                <Globe className="w-3 h-3 mr-1 drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]" />
                              )}
                              {platform.name === "Books" ? "Print" : 
                               platform.name === "OverDrive/Libby" ? "Library" : 
                               platform.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Series Books Button */}
                    {book.seriesInfo && (() => {
                      // Normalize series name for matching (case-insensitive, trim whitespace)
                      const normalizeSeriesName = (name: string) => name.toLowerCase().trim()
                      const currentSeriesName = normalizeSeriesName(book.seriesInfo.name)
                      
                      const seriesBooks = books
                        .filter(b => {
                          if (!b.seriesInfo) return false
                          const bSeriesName = normalizeSeriesName(b.seriesInfo.name)
                          return bSeriesName === currentSeriesName && getAuthorName(b) === bookAuthor
                        })
                        .sort((a, b) => {
                          // Sort by series number first, then by publication date
                          if (a.seriesInfo?.number && b.seriesInfo?.number) {
                            return a.seriesInfo.number - b.seriesInfo.number
                          }
                          const dateA = new Date(a.publishedDate || "1900").getTime()
                          const dateB = new Date(b.publishedDate || "1900").getTime()
                          return dateA - dateB
                        })
                      
                      const hasOtherBooksInSeries = seriesBooks.length > 1
                      
                      return hasOtherBooksInSeries ? (
                      <div className="space-y-2">
                          <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                            {book.seriesInfo.name} Series:
                          </div>
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                                setShowSeriesForBookId(showSeriesForBookId === book.id ? null : book.id)
                            }}
                              className="border-2 border-blue-500 text-blue-700 hover:bg-blue-50 bg-white text-xs font-bold h-8 px-3"
                          >
                              <List className="w-3 h-3 mr-1" />
                              {showSeriesForBookId === book.id ? "Hide" : "Show"} Series ({seriesBooks.length} books)
                          </Button>
                        </div>
                          
                          {showSeriesForBookId === book.id && (
                            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto border-t border-blue-200 pt-3">
                              {seriesBooks.map((seriesBook) => {
                                const seriesBookId = `${seriesBook.title}-${seriesBook.author}`
                                const seriesStatus = getReadingStatus(seriesBookId)
                                const isCurrentBook = seriesBook.id === book.id
                                
                                return (
                                  <div
                                    key={seriesBook.id}
                                    className={`p-2 rounded border-2 ${
                                      isCurrentBook
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 bg-white hover:bg-gray-50"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          {seriesBook.seriesInfo?.number && (
                                            <Badge
                                              variant="outline"
                                              className="border-blue-300 text-blue-700 bg-blue-50 text-xs px-1.5 py-0 font-bold"
                                            >
                                              #{seriesBook.seriesInfo.number}
                                            </Badge>
                                          )}
                                          <h4 className={`text-sm font-bold ${isCurrentBook ? "text-blue-900" : "text-gray-900"}`}>
                                            {seriesBook.title}
                                          </h4>
                      </div>
                                        {seriesBook.publishedDate && (
                                          <p className="text-xs text-gray-600">
                                            {seriesBook.publishedDate}
                                          </p>
                                        )}
                                        <Badge
                                          className={`${getStatusColor(seriesStatus)} border border-gray-300 font-bold uppercase text-xs mt-1`}
                                        >
                                          {getStatusText(seriesStatus)}
                                        </Badge>
                  </div>
                </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ) : null
                    })()}

                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>


    </>
  )
}
