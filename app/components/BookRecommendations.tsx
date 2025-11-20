"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Calendar, User } from "lucide-react"
import type { Author, Book } from "@/lib/types"
import RecommendationBookModal from "./RecommendationBookModal"

interface BookRecommendationsProps {
  authors: Author[]
  books: Book[]
  readBooks: Set<string>
  wantToReadBooks: Set<string>
  bookRatings?: Map<string, "loved" | "liked" | "didnt-like">
  user: any
  onBookClick?: (book: Book) => void
  onAuthorClick?: (authorName: string) => void
}

export default function BookRecommendations({
  authors,
  books,
  readBooks,
  wantToReadBooks,
  bookRatings = new Map(),
  user,
  onBookClick,
  onAuthorClick,
}: BookRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Book[]>([])
  const [authorRecommendations, setAuthorRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [passedBooks, setPassedBooks] = useState<Set<string>>(new Set())
  const [refreshCounter, setRefreshCounter] = useState(0)

  const curatedRecommendations: Book[] = [
    {
      id: "rec-1",
      title: "The Song of Achilles",
      author: "Madeline Miller",
      authorId: "Madeline Miller",
      publishedDate: "2011-09-20",
      description:
        "A tale of gods, kings, immortal fame and the human heart, The Song of Achilles is a dazzling literary feat that brilliantly reimagines Homer's enduring masterwork, The Iliad.",
      pageCount: 416,
      categories: ["Historical Fiction", "Mythology"],
      thumbnail: "/song-of-achilles-cover.png",
      language: "en",
    },
    {
      id: "rec-2",
      title: "Circe",
      author: "Madeline Miller",
      authorId: "Madeline Miller",
      publishedDate: "2018-04-10",
      description:
        "In the house of Helios, god of the sun and mightiest of the Titans, a daughter is born. But Circe is a strange child—not powerful, like her father, nor viciously alluring like her mother.",
      pageCount: 393,
      categories: ["Historical Fiction", "Mythology"],
      thumbnail: "/placeholder-tsbaq.png",
      language: "en",
    },
    {
      id: "rec-3",
      title: "The Seven Husbands of Evelyn Hugo",
      author: "Taylor Jenkins Reid",
      authorId: "Taylor Jenkins Reid",
      publishedDate: "2017-06-13",
      description:
        "Aging and reclusive Hollywood movie icon Evelyn Hugo is finally ready to tell the truth about her glamorous and scandalous life.",
      pageCount: 400,
      categories: ["Historical Fiction", "Romance"],
      thumbnail: "/seven-husbands-evelyn-hugo.png",
      language: "en",
    },
    {
      id: "rec-4",
      title: "All the Light We Cannot See",
      author: "Anthony Doerr",
      authorId: "Anthony Doerr",
      publishedDate: "2014-05-06",
      description:
        "From the highly acclaimed, multiple award-winning Anthony Doerr, the beautiful, stunningly ambitious instant New York Times bestseller about a blind French girl and a German boy whose paths collide in occupied France as both try to survive the devastation of World War II.",
      pageCount: 531,
      categories: ["Historical Fiction", "War"],
      thumbnail: "/all-the-light-we-cannot-see-cover.png",
      language: "en",
    },
    {
      id: "rec-5",
      title: "The Midnight Library",
      author: "Matt Haig",
      authorId: "Matt Haig",
      publishedDate: "2020-08-13",
      description:
        "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
      pageCount: 288,
      categories: ["Literary Fiction", "Philosophy"],
      thumbnail: "/midnight-library.png",
      language: "en",
    },
    {
      id: "rec-6",
      title: "Klara and the Sun",
      author: "Kazuo Ishiguro",
      authorId: "Kazuo Ishiguro",
      publishedDate: "2021-03-02",
      description:
        "From the Nobel Prize-winning author of Never Let Me Go and The Remains of the Day, a beautiful novel about an artificial friend and the human heart.",
      pageCount: 320,
      categories: ["Science Fiction", "Literary Fiction"],
      thumbnail: "/klara-and-the-sun.png",
      language: "en",
    },
    {
      id: "rec-7",
      title: "Project Hail Mary",
      author: "Andy Weir",
      authorId: "Andy Weir",
      publishedDate: "2021-05-04",
      description:
        "Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself will perish.",
      pageCount: 496,
      categories: ["Science Fiction", "Adventure"],
      thumbnail: "/project-hail-mary.png",
      language: "en",
    },
    {
      id: "rec-8",
      title: "The Thursday Murder Club",
      author: "Richard Osman",
      authorId: "Richard Osman",
      publishedDate: "2020-09-03",
      description:
        "Four septuagenarians with a few tricks up their sleeves investigate a murder in their retirement village.",
      pageCount: 384,
      categories: ["Mystery", "Humor"],
      thumbnail: "/thursday-murder-club.png",
      language: "en",
    },
    {
      id: "rec-9",
      title: "Nineteen Minutes",
      author: "Jodi Picoult",
      authorId: "Jodi Picoult",
      publishedDate: "2007-03-06",
      description:
        "In nineteen minutes, you can mow the front lawn, color your hair, watch a third of a hockey game. In nineteen minutes, you can bake scones or get a tooth filled by a dentist.",
      pageCount: 464,
      categories: ["Contemporary Fiction", "Drama"],
      thumbnail: "/nineteen-minutes-book-cover.png",
      language: "en",
    },
    {
      id: "rec-10",
      title: "The Ocean at the End of the Lane",
      author: "Neil Gaiman",
      authorId: "Neil Gaiman",
      publishedDate: "2013-06-18",
      description:
        "A novel about memory, magic and survival, about the power of stories and the darkness inside each of us.",
      pageCount: 181,
      categories: ["Fantasy", "Literary Fiction"],
      thumbnail: "/ocean-end-lane-book-cover.png",
      language: "en",
    },
  ]

  const getAuthorName = (book: Book) => {
    if ((book as any).author) {
      return String((book as any).author)
    }
    if (book.authorId && authors && Array.isArray(authors)) {
      const author = authors.find((author) => author.id === book.authorId)
      if (author) {
        return typeof author === "string" ? author : author.name || "Unknown Author"
      }
    }
    if (book.authors && book.authors.length > 0) {
      return String(book.authors[0])
    }
    return "Unknown Author"
  }

  const isUpcomingPublication = (book: Book) => {
    if (!book.publishedDate) return false
    const now = new Date()
    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

    try {
      let bookDate
      const dateStr = book.publishedDate.trim()
      if (dateStr.match(/^\d{4}$/)) {
        bookDate = new Date(`${dateStr}-01-01`)
      } else if (dateStr.match(/^\d{4}-\d{2}$/)) {
        bookDate = new Date(`${dateStr}-01`)
      } else {
        bookDate = new Date(dateStr)
      }
      return bookDate >= now && bookDate <= sixMonthsFromNow
    } catch {
      return false
    }
  }

  const generateAuthorRecommendations = () => {
    if (!user?.suggestNewAuthors || !authors.length) return []

    // Only use authors from books that have been marked as "loved" (heart icon)
    const lovedBookIds = new Set<string>()
    bookRatings.forEach((rating, bookId) => {
      if (rating === "loved") {
        lovedBookIds.add(bookId)
      }
    })

    // Get authors only from loved books
    const lovedBookAuthors = new Set<string>()
    books.forEach((book) => {
      const bookId = `${book.title}-${book.author}`
      if (lovedBookIds.has(bookId)) {
        const authorName = getAuthorName(book)
        if (authorName && authorName !== "Unknown Author") {
          lovedBookAuthors.add(authorName)
        }
      }
    })

    // If no loved books, return empty (don't recommend based on other books)
    if (lovedBookAuthors.size === 0) {
      return []
    }

    const existingAuthors = authors.map((author) => {
      if (typeof author === "string") {
        return author
      } else if (author && typeof author === "object" && author.name) {
        return author.name
      } else {
        return "Unknown Author"
      }
    })

    // Only use authors from loved books for recommendations
    const allRelevantAuthors = Array.from(lovedBookAuthors)

    // Shared author recommendation map
    const authorMap: { [key: string]: string[] } = {
      "Pat Barker": ["Madeline Miller", "Jennifer Saint", "Stephen Fry"],
      "Kate Atkinson": ["Ali Smith", "Sarah Waters", "Zadie Smith"],
      "Kristin Hannah": ["Jodi Picoult", "Liane Moriarty", "Taylor Jenkins Reid"],
      "Daniel Mason": ["Anthony Doerr", "Hanya Yanagihara", "Colson Whitehead"],
      "Philip Pullman": ["Neil Gaiman", "Terry Pratchett", "Susanna Clarke"],
      "Madeline Miller": ["Pat Barker", "Jennifer Saint", "Stephen Fry"],
      "Jennifer Saint": ["Pat Barker", "Madeline Miller", "Stephen Fry"],
      "Ali Smith": ["Kate Atkinson", "Sarah Waters", "Zadie Smith"],
      "Sarah Waters": ["Kate Atkinson", "Ali Smith", "Zadie Smith"],
      "Zadie Smith": ["Kate Atkinson", "Ali Smith", "Sarah Waters"],
    }

    const potentialAuthors = new Set<string>()
    allRelevantAuthors.forEach((author) => {
      if (authorMap[author]) {
        authorMap[author].forEach((rec) => potentialAuthors.add(rec))
      }
    })

    return Array.from(potentialAuthors)
      .filter((author) => !existingAuthors.includes(author))
      .slice(0, 3)
  }

  const generateNewRecommendations = () => {
    setLoading(true)
    setRefreshCounter(prev => prev + 1)

    setTimeout(() => {
      try {
        // Only use books that have been marked as "loved" (heart icon) as the basis for recommendations
        const lovedBookIds = new Set<string>()
        bookRatings.forEach((rating, bookId) => {
          if (rating === "loved") {
            lovedBookIds.add(bookId)
          }
        })

        // If no loved books, don't show recommendations
        if (lovedBookIds.size === 0) {
          setRecommendations([])
          setAuthorRecommendations([])
          setLoading(false)
          return
        }

        // Get authors from loved books
        const lovedBookAuthors = new Set<string>()
        books.forEach((book) => {
          const bookId = `${book.title}-${book.author}`
          if (lovedBookIds.has(bookId)) {
            const authorName = getAuthorName(book)
            if (authorName && authorName !== "Unknown Author") {
              lovedBookAuthors.add(authorName)
            }
          }
        })

        const existingBookIds = new Set(books.map((book) => book.id))
        const existingBookTitles = new Set(
          books.map((book) => `${(book.title || "").toLowerCase()}-${getAuthorName(book).toLowerCase()}`),
        )

        // Get recommended authors based on loved book authors
        const recommendedAuthors = new Set<string>()
        const authorMap: { [key: string]: string[] } = {
          "Pat Barker": ["Madeline Miller", "Jennifer Saint", "Stephen Fry"],
          "Kate Atkinson": ["Ali Smith", "Sarah Waters", "Zadie Smith"],
          "Kristin Hannah": ["Jodi Picoult", "Liane Moriarty", "Taylor Jenkins Reid"],
          "Daniel Mason": ["Anthony Doerr", "Hanya Yanagihara", "Colson Whitehead"],
          "Philip Pullman": ["Neil Gaiman", "Terry Pratchett", "Susanna Clarke"],
          "Madeline Miller": ["Pat Barker", "Jennifer Saint", "Stephen Fry"],
          "Jennifer Saint": ["Pat Barker", "Madeline Miller", "Stephen Fry"],
          "Ali Smith": ["Kate Atkinson", "Sarah Waters", "Zadie Smith"],
          "Sarah Waters": ["Kate Atkinson", "Ali Smith", "Zadie Smith"],
          "Zadie Smith": ["Kate Atkinson", "Ali Smith", "Sarah Waters"],
        }
        
        // Get recommended authors based on loved book authors
        Array.from(lovedBookAuthors).forEach((author) => {
          if (authorMap[author]) {
            authorMap[author].forEach((rec) => recommendedAuthors.add(rec))
          }
        })

        // Filter recommendations based on authors from loved books
        const filteredRecommendations = curatedRecommendations.filter((book) => {
          if (existingBookIds.has(book.id)) return false
          const bookKey = `${(book.title || "").toLowerCase()}-${getAuthorName(book).toLowerCase()}`
          if (existingBookTitles.has(bookKey)) return false
          if (passedBooks.has(book.id)) return false

          // Only recommend books by authors similar to loved book authors
          const bookAuthor = getAuthorName(book)
          // Check if this book's author is in the recommended authors list
          if (recommendedAuthors.size > 0 && !recommendedAuthors.has(bookAuthor)) {
            return false
          }

          // Filter by user language preferences
          if (user?.preferredLanguages && user.preferredLanguages.length > 0) {
            const bookLanguage = book.language || "en"
            if (!user.preferredLanguages.includes(bookLanguage)) {
              return false
            }
          }

          return true
        })

        // Shuffle the recommendations to show different books each time
        const shuffledRecommendations = [...filteredRecommendations].sort(() => Math.random() - 0.5)
        
        // Use refresh counter to show different sets of recommendations
        const startIndex = (refreshCounter * 3) % shuffledRecommendations.length
        const endIndex = Math.min(startIndex + 3, shuffledRecommendations.length)
        
        // If we're at the end, start from the beginning but shuffle again
        let selectedRecommendations
        if (startIndex + 3 > shuffledRecommendations.length) {
          const reShuffled = [...filteredRecommendations].sort(() => Math.random() - 0.5)
          selectedRecommendations = reShuffled.slice(0, 3)
        } else {
          selectedRecommendations = shuffledRecommendations.slice(startIndex, endIndex)
        }
        
        setRecommendations(selectedRecommendations)

        if (user?.suggestNewAuthors) {
          const newAuthors = generateAuthorRecommendations()
          setAuthorRecommendations(newAuthors)
        }
      } catch (error) {
        console.error("Error generating recommendations:", error)
      } finally {
        setLoading(false)
      }
    }, 500) // Small delay to show loading state
  }

  const handleBookClick = (book: Book) => {
    setSelectedBook(book)
    setIsModalOpen(true)
  }

  const handleAddBook = (book: Book) => {
    if (onBookClick) {
      onBookClick(book)
    }
  }

  const handleAddAuthor = (authorName: string) => {
    if (onAuthorClick) {
      onAuthorClick(authorName)
    }
  }

  const handlePass = () => {
    if (selectedBook) {
      setPassedBooks(prev => new Set([...prev, selectedBook.id]))
      // Generate new recommendations after passing
      generateNewRecommendations()
    }
  }

  // Create a string representation of loved book IDs to track changes
  const lovedBooksKey = useMemo(() => {
    const lovedIds = Array.from(bookRatings.entries())
      .filter(([_, rating]) => rating === "loved")
      .map(([bookId]) => bookId)
      .sort()
      .join(",")
    return lovedIds
  }, [bookRatings])

  useEffect(() => {
    // Only generate recommendations if there are loved books
    const hasLovedBooks = lovedBooksKey.length > 0
    
    if (hasLovedBooks && authors.length > 0) {
      setRefreshCounter(0) // Reset refresh counter when dependencies change
      generateNewRecommendations()
    } else {
      setRecommendations([])
      setAuthorRecommendations([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authors.length, books.length, readBooks.size, wantToReadBooks.size, lovedBooksKey])

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
          <p className="text-blue-500 text-sm">Finding books for you...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {user?.suggestNewAuthors && authorRecommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide flex items-center gap-1">
                <User className="w-3 h-3" />
                New Authors for You
              </h4>
              <div className="space-y-1">
                {authorRecommendations.map((author) => (
                  <div
                    key={author}
                    onClick={() => onAuthorClick && onAuthorClick(author)}
                    className="p-2 bg-gradient-to-r from-orange-50 to-red-50 rounded border border-orange-100 hover:shadow-sm transition-shadow cursor-pointer"
                  >
                    <p className="text-red-700 text-xs font-medium">{author}</p>
                    <p className="text-red-600 text-xs opacity-75">Tap to explore their books</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recommendations.length === 0 ? (
            <div className="text-center py-6">
              {(() => {
                const hasLovedBooks = Array.from(bookRatings.values()).some(rating => rating === "loved")
                if (!hasLovedBooks) {
                  return (
                    <>
                      <p className="text-blue-600 text-sm mb-1">No recommendations yet</p>
                      <p className="text-blue-500 text-xs">Mark books you loved with a ❤️ to get personalized recommendations!</p>
                    </>
                  )
                }
                if (authors.length === 0) {
                  return (
                <>
                  <p className="text-blue-600 text-sm mb-1">No recommendations yet</p>
                  <p className="text-blue-500 text-xs">Add your favorite authors to get book suggestions!</p>
                </>
                  )
                }
                return (
                <>
                  <p className="text-blue-600 text-sm mb-1">Generating recommendations...</p>
                    <p className="text-blue-500 text-xs">Based on books you loved ❤️</p>
                </>
                )
              })()}
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.slice(0, 5).map((book) => {
                const authorName = getAuthorName(book)
                const isUpcoming = isUpcomingPublication(book)

                return (
                  <div
                    key={book.id}
                    onClick={() => handleBookClick(book)}
                    className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {book.thumbnail && (
                        <img
                          src={book.thumbnail || "/placeholder.svg"}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded shadow-sm flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-900 text-sm line-clamp-1">{book.title}</h4>
                            <p className="text-blue-700 text-xs mb-1">by {authorName}</p>
                            {book.publishedDate && (
                              <div className="flex items-center gap-1">
                                {isUpcoming && <Calendar className="w-3 h-3 text-green-600" />}
                                <p className={`text-xs ${isUpcoming ? "text-green-600 font-medium" : "text-blue-600"}`}>
                                  {isUpcoming ? "Coming " : ""}
                                  {book.publishedDate}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            {isUpcoming && (
                              <Badge
                                variant="outline"
                                className="border-emerald-500 text-emerald-700 bg-emerald-50 text-xs px-2 py-0.5 font-medium"
                              >
                                UPCOMING
                              </Badge>
                            )}
                            {book.seriesInfo && (
                              <Badge variant="outline" className="border-blue-200 text-blue-600 text-xs px-1 py-0">
                                #{book.seriesInfo.number}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {book.description && <p className="text-gray-600 text-xs line-clamp-2">{book.description}</p>}
                      </div>
                    </div>
                  </div>
                )
              })}

              {recommendations.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="link" className="text-xs text-blue-600 h-auto p-0">
                    Show {recommendations.length - 5} more recommendations
                  </Button>
                </div>
              )}

              <div className="pt-2 border-t border-blue-100">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateNewRecommendations}
                  disabled={loading}
                  className="w-full h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "..." : "Refresh"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recommendation Book Modal */}
      <RecommendationBookModal
        book={selectedBook}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddBook={handleAddBook}
        onAddAuthor={handleAddAuthor}
        onPass={handlePass}
      />
    </div>
  )
}
