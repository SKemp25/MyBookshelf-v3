"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Calendar, User } from "lucide-react"
import type { Author, Book } from "@/lib/types"

interface BookRecommendationsProps {
  authors: Author[]
  books: Book[]
  readBooks: Set<string>
  wantToReadBooks: Set<string>
  user: any
  onBookClick?: (book: Book) => void
}

export default function BookRecommendations({
  authors,
  books,
  readBooks,
  wantToReadBooks,
  user,
  onBookClick,
}: BookRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Book[]>([])
  const [authorRecommendations, setAuthorRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

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

    const existingAuthors = authors.map((author) => {
      if (typeof author === "string") {
        return author
      } else if (author && typeof author === "object" && author.name) {
        return author.name
      } else {
        return "Unknown Author"
      }
    })

    const authorMap: { [key: string]: string[] } = {
      "Pat Barker": ["Madeline Miller", "Jennifer Saint", "Stephen Fry"],
      "Kate Atkinson": ["Ali Smith", "Sarah Waters", "Zadie Smith"],
      "Kristin Hannah": ["Jodi Picoult", "Liane Moriarty", "Taylor Jenkins Reid"],
      "Daniel Mason": ["Anthony Doerr", "Hanya Yanagihara", "Colson Whitehead"],
      "Philip Pullman": ["Neil Gaiman", "Terry Pratchett", "Susanna Clarke"],
    }

    const potentialAuthors = new Set<string>()
    existingAuthors.forEach((author) => {
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

    setTimeout(() => {
      try {
        const existingBookIds = new Set(books.map((book) => book.id))
        const existingBookTitles = new Set(
          books.map((book) => `${book.title.toLowerCase()}-${getAuthorName(book).toLowerCase()}`),
        )

        const filteredRecommendations = curatedRecommendations.filter((book) => {
          if (existingBookIds.has(book.id)) return false
          const bookKey = `${book.title.toLowerCase()}-${getAuthorName(book).toLowerCase()}`
          if (existingBookTitles.has(bookKey)) return false

          // Filter by user language preferences
          if (user?.preferredLanguages && user.preferredLanguages.length > 0) {
            const bookLanguage = book.language || "en"
            if (!user.preferredLanguages.includes(bookLanguage)) {
              return false
            }
          }

          return true
        })

        setRecommendations(filteredRecommendations)

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
    if (onBookClick) {
      onBookClick(book)
    }
  }

  useEffect(() => {
    if (authors.length > 0) {
      generateNewRecommendations()
    } else {
      setRecommendations([])
      setAuthorRecommendations([])
    }
  }, [authors.length, books.length, readBooks.size, wantToReadBooks.size])

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-blue-600 text-sm">Finding books for you...</p>
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
                    className="p-2 bg-gradient-to-r from-orange-50 to-red-50 rounded border border-orange-200 hover:shadow-sm transition-shadow cursor-pointer"
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
              {authors.length === 0 ? (
                <>
                  <p className="text-blue-600 text-sm mb-1">No recommendations yet</p>
                  <p className="text-blue-500 text-xs">Add your favorite authors to get book suggestions!</p>
                </>
              ) : (
                <>
                  <p className="text-blue-600 text-sm mb-1">Generating recommendations...</p>
                  <p className="text-blue-500 text-xs">Based on your favorite authors</p>
                </>
              )}
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
                    className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow cursor-pointer"
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
                              <Badge variant="outline" className="border-blue-300 text-blue-700 text-xs px-1 py-0">
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

              <div className="pt-2 border-t border-blue-200">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generateNewRecommendations}
                  disabled={loading}
                  className="w-full h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "..." : "Refresh"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
