"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Calendar, X, Heart, BookOpen } from "lucide-react"
import type { Book } from "@/lib/types"
import { fetchAuthorBooksWithCache } from "@/lib/apiCache"
import RecommendationBookModal from "./RecommendationBookModal"

interface BookRecommendationsProps {
  authors: Array<{ id: string; name: string }>
  books: Book[]
  readBooks: Set<string>
  wantToReadBooks: Set<string>
  bookRatings?: Map<string, "loved" | "liked" | "didnt-like">
  user: any
  onBookClick?: (book: Book) => void
}

// Author similarity database - maps authors to similar authors
// This could be expanded with more sophisticated matching
const similarAuthorsMap: { [key: string]: string[] } = {
  "Madeline Miller": ["Jennifer Saint", "Pat Barker", "Stephen Fry", "Natalie Haynes"],
  "Jennifer Saint": ["Madeline Miller", "Pat Barker", "Natalie Haynes", "Stephen Fry"],
  "Pat Barker": ["Madeline Miller", "Jennifer Saint", "Hilary Mantel", "Sarah Waters"],
  "Kate Atkinson": ["Ali Smith", "Sarah Waters", "Zadie Smith", "Maggie O'Farrell"],
  "Ali Smith": ["Kate Atkinson", "Sarah Waters", "Zadie Smith", "Rachel Cusk"],
  "Sarah Waters": ["Kate Atkinson", "Ali Smith", "Hilary Mantel", "Maggie O'Farrell"],
  "Zadie Smith": ["Kate Atkinson", "Ali Smith", "Rachel Cusk", "Chimamanda Ngozi Adichie"],
  "Kristin Hannah": ["Jodi Picoult", "Liane Moriarty", "Taylor Jenkins Reid", "Diane Chamberlain"],
  "Jodi Picoult": ["Kristin Hannah", "Liane Moriarty", "Diane Chamberlain", "Jacqueline Mitchard"],
  "Liane Moriarty": ["Kristin Hannah", "Jodi Picoult", "Taylor Jenkins Reid", "Marian Keyes"],
  "Taylor Jenkins Reid": ["Kristin Hannah", "Liane Moriarty", "Emily Giffin", "Elin Hilderbrand"],
  "Daniel Mason": ["Anthony Doerr", "Hanya Yanagihara", "Colson Whitehead", "Amor Towles"],
  "Anthony Doerr": ["Daniel Mason", "Amor Towles", "Hanya Yanagihara", "Ian McEwan"],
  "Hanya Yanagihara": ["Daniel Mason", "Anthony Doerr", "Colson Whitehead", "Kazuo Ishiguro"],
  "Colson Whitehead": ["Daniel Mason", "Hanya Yanagihara", "Jesmyn Ward", "Toni Morrison"],
  "Philip Pullman": ["Neil Gaiman", "Terry Pratchett", "Susanna Clarke", "Ursula K. Le Guin"],
  "Neil Gaiman": ["Philip Pullman", "Terry Pratchett", "Susanna Clarke", "China Miéville"],
  "Terry Pratchett": ["Neil Gaiman", "Philip Pullman", "Douglas Adams", "Jasper Fforde"],
  "Susanna Clarke": ["Philip Pullman", "Neil Gaiman", "Ursula K. Le Guin", "Erin Morgenstern"],
  "Stephen Fry": ["Madeline Miller", "Jennifer Saint", "Tom Holland", "Mary Beard"],
  "Hilary Mantel": ["Pat Barker", "Sarah Waters", "Maggie O'Farrell", "A.S. Byatt"],
  "Maggie O'Farrell": ["Hilary Mantel", "Kate Atkinson", "Sarah Waters", "Ali Smith"],
  "Ian McEwan": ["Anthony Doerr", "Kazuo Ishiguro", "Julian Barnes", "Martin Amis"],
  "Kazuo Ishiguro": ["Ian McEwan", "Hanya Yanagihara", "Julian Barnes", "Haruki Murakami"],
  "Amor Towles": ["Anthony Doerr", "Daniel Mason", "Ian McEwan", "Donna Tartt"],
  "Donna Tartt": ["Amor Towles", "Ian McEwan", "Jonathan Franzen", "Zadie Smith"],
  "Jonathan Franzen": ["Donna Tartt", "Zadie Smith", "David Foster Wallace", "Michael Chabon"],
  "Michael Chabon": ["Jonathan Franzen", "David Foster Wallace", "Zadie Smith", "Jennifer Egan"],
  "Jennifer Egan": ["Michael Chabon", "Jonathan Franzen", "Zadie Smith", "Rachel Kushner"],
  "Rachel Cusk": ["Ali Smith", "Zadie Smith", "Deborah Levy", "Elena Ferrante"],
  "Elena Ferrante": ["Rachel Cusk", "Deborah Levy", "Ali Smith", "Jhumpa Lahiri"],
  "Jhumpa Lahiri": ["Elena Ferrante", "Zadie Smith", "Chimamanda Ngozi Adichie", "Arundhati Roy"],
  "Chimamanda Ngozi Adichie": ["Jhumpa Lahiri", "Zadie Smith", "Arundhati Roy", "Toni Morrison"],
  "Toni Morrison": ["Chimamanda Ngozi Adichie", "Jesmyn Ward", "Colson Whitehead", "Zora Neale Hurston"],
  "Jesmyn Ward": ["Toni Morrison", "Colson Whitehead", "Chimamanda Ngozi Adichie", "Ta-Nehisi Coates"],
  "Ursula K. Le Guin": ["Susanna Clarke", "Philip Pullman", "Neil Gaiman", "Octavia Butler"],
  "Octavia Butler": ["Ursula K. Le Guin", "N.K. Jemisin", "Margaret Atwood", "Ursula K. Le Guin"],
  "Margaret Atwood": ["Octavia Butler", "Ursula K. Le Guin", "Doris Lessing", "Angela Carter"],
  "N.K. Jemisin": ["Octavia Butler", "Ursula K. Le Guin", "Nnedi Okorafor", "Ann Leckie"],
}

// Helper to infer author gender from name (simple heuristic)
function inferAuthorGender(authorName: string): "male" | "female" | "unknown" {
  const name = authorName.toLowerCase()
  // Common female first names
  const femaleNames = ["madeline", "jennifer", "kate", "ali", "sarah", "zadie", "kristin", "jodi", "liane", "taylor", "susan", "elena", "rachel", "jennifer", "maggie", "hilary", "toni", "jesmyn", "ursula", "octavia", "margaret", "natalie", "diane", "jacqueline", "marian", "emily", "elin", "deborah", "arundhati", "zora", "nnedi", "ann", "doris", "angela"]
  // Common male first names
  const maleNames = ["stephen", "daniel", "philip", "neil", "terry", "anthony", "hanya", "colson", "ian", "kazuo", "amor", "donna", "jonathan", "michael", "david", "tom", "julian", "martin", "haruki", "ta-nehisi"]
  
  const firstName = name.split(" ")[0]
  if (femaleNames.includes(firstName)) return "female"
  if (maleNames.includes(firstName)) return "male"
  return "unknown"
}

// Get average publication year from loved books
function getAveragePublicationYear(books: Book[]): number | null {
  const years: number[] = []
  books.forEach(book => {
    if (book.publishedDate) {
      const year = parseInt(book.publishedDate.substring(0, 4))
      if (!isNaN(year)) years.push(year)
    }
  })
  if (years.length === 0) return null
  return Math.round(years.reduce((a, b) => a + b, 0) / years.length)
}

// Get common genres from loved books
function getCommonGenres(books: Book[]): string[] {
  const genreCounts: { [key: string]: number } = {}
  books.forEach(book => {
    const genres = book.categories || book.genre ? [book.genre || ""] : []
    genres.forEach(genre => {
      if (genre) {
        const normalized = genre.toLowerCase()
        genreCounts[normalized] = (genreCounts[normalized] || 0) + 1
      }
    })
  })
  // Return top 3 most common genres
  return Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre)
}

// Find similar authors based on loved book authors
function findSimilarAuthors(
  lovedBookAuthors: string[],
  existingAuthors: string[],
  rejectedAuthors: Set<string>,
  lovedBooks: Book[]
): string[] {
  const similarAuthors = new Set<string>()
  const avgYear = getAveragePublicationYear(lovedBooks)
  const commonGenres = getCommonGenres(lovedBooks)
  
  // Get gender distribution of loved authors
  const lovedAuthorGenders = lovedBookAuthors.map(inferAuthorGender)
  const femaleCount = lovedAuthorGenders.filter(g => g === "female").length
  const maleCount = lovedAuthorGenders.filter(g => g === "male").length
  const totalKnown = femaleCount + maleCount
  
  // Calculate percentages
  const femalePercentage = totalKnown > 0 ? (femaleCount / totalKnown) * 100 : 0
  const malePercentage = totalKnown > 0 ? (maleCount / totalKnown) * 100 : 0
  
  // Determine preferred gender (50% or more threshold)
  const preferFemale = femalePercentage >= 50
  const preferMale = malePercentage >= 50
  
  // Find similar authors from the map
  const femaleAuthors: string[] = []
  const maleAuthors: string[] = []
  const unknownAuthors: string[] = []
  
  lovedBookAuthors.forEach(author => {
    const similar = similarAuthorsMap[author] || []
    similar.forEach(simAuthor => {
      // Filter out existing authors and rejected authors
      if (!existingAuthors.includes(simAuthor) && !rejectedAuthors.has(simAuthor)) {
        const simGender = inferAuthorGender(simAuthor)
        if (simGender === "female") {
          femaleAuthors.push(simAuthor)
        } else if (simGender === "male") {
          maleAuthors.push(simAuthor)
        } else {
          unknownAuthors.push(simAuthor)
        }
      }
    })
  })
  
  // Remove duplicates
  const uniqueFemale = Array.from(new Set(femaleAuthors))
  const uniqueMale = Array.from(new Set(maleAuthors))
  const uniqueUnknown = Array.from(new Set(unknownAuthors))
  
  // Sort based on preference: if 50%+ are women, ONLY show women; if 50%+ are men, ONLY show men
  let sortedAuthors: string[] = []
  
  if (preferFemale) {
    // User prefers women - ONLY show women authors, exclude men completely
    sortedAuthors = [...uniqueFemale, ...uniqueUnknown] // Include unknown in case they're women
  } else if (preferMale) {
    // User prefers men - ONLY show men authors, exclude women completely
    sortedAuthors = [...uniqueMale, ...uniqueUnknown] // Include unknown in case they're men
  } else {
    // Mixed or unknown - show all but still prioritize based on majority
    if (femaleCount > maleCount) {
      sortedAuthors = [...uniqueFemale, ...uniqueMale, ...uniqueUnknown]
    } else if (maleCount > femaleCount) {
      sortedAuthors = [...uniqueMale, ...uniqueFemale, ...uniqueUnknown]
    } else {
      sortedAuthors = [...uniqueFemale, ...uniqueMale, ...uniqueUnknown]
    }
  }
  
  return sortedAuthors
}

export default function BookRecommendations({
  authors,
  books,
  readBooks,
  wantToReadBooks,
  bookRatings = new Map(),
  user,
  onBookClick,
}: BookRecommendationsProps) {
  const [currentRecommendation, setCurrentRecommendation] = useState<Book | null>(null)
  const [currentAuthor, setCurrentAuthor] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rejectedBooks, setRejectedBooks] = useState<Set<string>>(new Set())
  const [rejectedAuthors, setRejectedAuthors] = useState<Set<string>>(new Set())
  const [triedAuthors, setTriedAuthors] = useState<Set<string>>(new Set())

  // Load rejected authors from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`bookshelf_rejected_authors_${user.id}`)
        if (saved) {
          const savedAuthors = JSON.parse(saved)
          setRejectedAuthors(new Set(savedAuthors))
        }
      } catch (error) {
        console.error("Error loading rejected authors:", error)
      }
    }
  }, [user?.id])

  // Save rejected authors to localStorage whenever they change
  useEffect(() => {
    if (user?.id && rejectedAuthors.size > 0) {
      try {
        localStorage.setItem(
          `bookshelf_rejected_authors_${user.id}`,
          JSON.stringify(Array.from(rejectedAuthors))
        )
      } catch (error) {
        console.error("Error saving rejected authors:", error)
      }
    }
  }, [rejectedAuthors, user?.id])

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

  // Find and fetch a book from a similar author
  const findNextRecommendation = async () => {
    setLoading(true)
    
    try {
      // Get loved books
      const lovedBookIds = new Set<string>()
      bookRatings.forEach((rating, bookId) => {
        if (rating === "loved") {
          lovedBookIds.add(bookId)
        }
      })

      if (lovedBookIds.size === 0) {
        setCurrentRecommendation(null)
        setCurrentAuthor(null)
        setLoading(false)
        return
      }

      // Get authors from loved books
      const lovedBookAuthors = new Set<string>()
      const lovedBooks: Book[] = []
      books.forEach((book) => {
        const bookId = `${book.title}-${book.author}`
        if (lovedBookIds.has(bookId)) {
          const authorName = getAuthorName(book)
          if (authorName && authorName !== "Unknown Author") {
            lovedBookAuthors.add(authorName)
            lovedBooks.push(book)
          }
        }
      })

      if (lovedBookAuthors.size === 0) {
        setCurrentRecommendation(null)
        setCurrentAuthor(null)
        setLoading(false)
        return
      }

      const existingAuthors = authors.map(a => a.name)
      
      // Load persisted rejected authors from localStorage
      let persistedRejectedAuthors = rejectedAuthors
      if (user?.id) {
        try {
          const saved = localStorage.getItem(`bookshelf_rejected_authors_${user.id}`)
          if (saved) {
            const savedAuthors = JSON.parse(saved)
            persistedRejectedAuthors = new Set([...Array.from(rejectedAuthors), ...savedAuthors])
          }
        } catch (error) {
          console.error("Error loading persisted rejected authors:", error)
        }
      }
      
      // Find similar authors (using persisted rejected authors)
      const similarAuthors = findSimilarAuthors(
        Array.from(lovedBookAuthors),
        existingAuthors,
        persistedRejectedAuthors,
        lovedBooks
      )

      if (similarAuthors.length === 0) {
        setCurrentRecommendation(null)
        setCurrentAuthor(null)
        setLoading(false)
        return
      }

      // Try each similar author until we find a book
        const existingBookIds = new Set(books.map((book) => book.id))
        const existingBookTitles = new Set(
          books.map((book) => `${(book.title || "").toLowerCase()}-${getAuthorName(book).toLowerCase()}`),
        )

      for (const authorName of similarAuthors) {
        // Skip if we've already tried this author
        if (triedAuthors.has(authorName)) continue
        
        try {
          // Fetch books by this author
          const authorBooks = await fetchAuthorBooksWithCache(authorName)
          
          if (!authorBooks || authorBooks.length === 0) {
            setTriedAuthors(prev => new Set([...prev, authorName]))
            continue
          }

          // Filter to find a suitable book
          const suitableBooks = authorBooks
            .filter((item: any) => {
              const book = item as any
              
              // Convert API response to Book format
              const bookId = book.id || `${book.title}-${book.author}`
              const bookTitle = book.title || ""
              const bookAuthor = book.author || book.authors?.[0] || ""
              
              // Skip if already in collection
              if (existingBookIds.has(bookId)) return false
              
              const bookKey = `${bookTitle.toLowerCase()}-${bookAuthor.toLowerCase()}`
          if (existingBookTitles.has(bookKey)) return false
              
              // Skip rejected books
              if (rejectedBooks.has(bookId)) return false
              
              // Skip if no title or author
              if (!bookTitle || !bookAuthor) return false
              
              // Prefer books with descriptions
              if (!book.description || book.description.length < 50) return false

          // Filter by user language preferences
          if (user?.preferredLanguages && user.preferredLanguages.length > 0) {
            const bookLanguage = book.language || "en"
                if (!user.preferredLanguages.includes(bookLanguage)) return false
          }

          // Get book metadata for filtering
          const bookTitle = (book.title || "").toLowerCase()
          const bookCategories = book.categories || []
          const bookGenre = book.genre || ""
          const bookDescription = (book.description || "").toLowerCase()
          
          // Combine all text for analysis
          const combinedText = `${bookTitle} ${bookGenres.join(" ")} ${bookGenre} ${bookDescription}`.toLowerCase()
          const bookGenres = [
            ...bookCategories.map((cat: string) => cat.toLowerCase()),
            bookGenre.toLowerCase()
          ]
          
          // ALWAYS exclude these types of books regardless of preferences:
          // 1. Books about writers/authors (biographies of authors)
          const authorBiographyIndicators = [
            "biography of", "life of", "story of", "memoir of",
            "the life and work", "the letters of", "the diaries of",
            "collected letters", "selected letters", "correspondence",
            "a writer's life", "a novelist's", "a poet's"
          ]
          if (authorBiographyIndicators.some(indicator => combinedText.includes(indicator))) {
            return false
          }
          
          // 2. Collections and anthologies
          const collectionIndicators = [
            "collected stories", "collected works", "collected poems",
            "short stories", "story collection", "stories",
            "anthology", "anthologies", "selected stories",
            "complete stories", "best stories", "selected works",
            "the collected", "the complete", "volume 1", "volume 2"
          ]
          if (collectionIndicators.some(indicator => combinedText.includes(indicator))) {
            return false
          }
          
          // 3. Non-fiction when Fiction is preferred
          if (user?.preferredGenres && user.preferredGenres.length > 0) {
            const preferredGenres = user.preferredGenres.map((g: string) => g.toLowerCase())
            const hasFiction = preferredGenres.some(g => g.includes("fiction"))
            const hasNonFiction = preferredGenres.some(g => 
              g.includes("non-fiction") || g.includes("nonfiction") || g.includes("non fiction")
            )
            
            if (hasFiction && !hasNonFiction) {
              // User only wants Fiction - strictly exclude non-fiction
              const nonFictionIndicators = [
                "non-fiction", "nonfiction", "non fiction",
                "biography", "autobiography", "biographical", "memoir",
                "history", "historical", "historian",
                "reference", "academic", "scholarly",
                "essay", "essays", "essay collection",
                "self-help", "self help",
                "business", "economics", "finance",
                "science", "technology", "mathematics",
                "philosophy", "psychology", "sociology",
                "art", "art history", "criticism",
                "literary criticism", "literary analysis"
              ]
              
              if (nonFictionIndicators.some(indicator => combinedText.includes(indicator))) {
                return false // Exclude non-fiction
              }
              
              // Also check if categories are clearly non-fiction
              const nonFictionCategories = ["biography", "autobiography", "history", "reference", "academic"]
              if (bookCategories.some(cat => nonFictionCategories.includes(cat.toLowerCase()))) {
                return false
              }
            }
            
            // Check for genre matches (only if we haven't excluded it already)
            let hasMatchingGenre = false
            for (const preferredGenre of preferredGenres) {
              // Check if any book genre/category matches the preferred genre
              if (bookGenres.some(bg => {
                const bgLower = bg.toLowerCase()
                const prefLower = preferredGenre.toLowerCase()
                return bgLower.includes(prefLower) || prefLower.includes(bgLower)
              })) {
                hasMatchingGenre = true
                break
              }
            }
            
            // If no genre match found and user has genre preferences, exclude the book
            if (!hasMatchingGenre && preferredGenres.length > 0) {
              return false
            }
          }

          return true
        })
            .map((item: any) => {
              // Convert to Book format
              let publishedDate = item.publishedDate || ""
              if (publishedDate && publishedDate.length === 4) {
                publishedDate = `${publishedDate}-01-01`
              }
              
              return {
                id: item.id || `${item.title}-${item.author}`,
                title: item.title || "Unknown Title",
                author: item.author || item.authors?.[0] || "Unknown Author",
                authors: item.authors || [item.author],
                publishedDate: publishedDate || "Unknown Date",
                description: item.description || "",
                categories: item.categories || [],
                language: item.language || "en",
                pageCount: item.pageCount || 0,
                thumbnail: item.thumbnail || item.imageUrl || "",
              } as Book
            })

          if (suitableBooks.length > 0) {
            // Pick a random book from suitable books
            const selectedBook = suitableBooks[Math.floor(Math.random() * suitableBooks.length)]
            setCurrentRecommendation(selectedBook)
            setCurrentAuthor(authorName)
            setLoading(false)
            return
          }
          
          // Mark this author as tried
          setTriedAuthors(prev => new Set([...prev, authorName]))
        } catch (error) {
          console.error(`Error fetching books for ${authorName}:`, error)
          setTriedAuthors(prev => new Set([...prev, authorName]))
          continue
        }
      }

      // If we've tried all authors, reset tried authors and try again
      if (triedAuthors.size >= similarAuthors.length) {
        setTriedAuthors(new Set())
      }

      setCurrentRecommendation(null)
      setCurrentAuthor(null)
      setLoading(false)
      } catch (error) {
      console.error("Error finding recommendation:", error)
      setCurrentRecommendation(null)
      setCurrentAuthor(null)
        setLoading(false)
      }
  }

  const handleBookClick = (book: Book) => {
    setSelectedBook(book)
    setIsModalOpen(true)
  }

  const handleAddBook = (book: Book) => {
    if (onBookClick) {
      onBookClick(book)
    }
    // After adding, find next recommendation
    setTimeout(() => findNextRecommendation(), 500)
  }

  const handleReject = () => {
    if (currentRecommendation) {
      setRejectedBooks(prev => new Set([...prev, currentRecommendation.id]))
    }
    if (currentAuthor) {
      setRejectedAuthors(prev => new Set([...prev, currentAuthor]))
      setTriedAuthors(prev => new Set([...prev, currentAuthor]))
    }
    // Find next recommendation
    findNextRecommendation()
  }

  const handleBlockAuthor = () => {
    if (currentAuthor) {
      // Permanently block this author
      setRejectedAuthors(prev => {
        const updated = new Set([...prev, currentAuthor])
        // Save to localStorage immediately
        if (user?.id) {
          try {
            localStorage.setItem(
              `bookshelf_rejected_authors_${user.id}`,
              JSON.stringify(Array.from(updated))
            )
          } catch (error) {
            console.error("Error saving blocked author:", error)
          }
        }
        return updated
      })
      setTriedAuthors(prev => new Set([...prev, currentAuthor]))
      // Find next recommendation
      findNextRecommendation()
    }
  }

  const handleRefresh = () => {
    // Reset tried authors to get fresh recommendations
    setTriedAuthors(new Set())
    findNextRecommendation()
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
    
    if (hasLovedBooks && authors.length > 0 && !currentRecommendation) {
      findNextRecommendation()
    } else if (!hasLovedBooks) {
      setCurrentRecommendation(null)
      setCurrentAuthor(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authors.length, books.length, lovedBooksKey])

  const hasLovedBooks = useMemo(() => {
    return Array.from(bookRatings.values()).some(rating => rating === "loved")
  }, [bookRatings])

  if (!hasLovedBooks) {
    return (
      <div className="text-center py-6">
        <p className="text-blue-600 text-sm mb-1">No recommendations yet</p>
        <p className="text-blue-500 text-xs">Mark books you loved with a ❤️ to get personalized recommendations!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
          <p className="text-blue-500 text-sm">Finding your next read...</p>
        </div>
      ) : currentRecommendation ? (
            <div className="space-y-3">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-start gap-3">
              {currentRecommendation.thumbnail && (
                <img
                  src={currentRecommendation.thumbnail || "/placeholder.svg"}
                  alt={currentRecommendation.title}
                  className="w-16 h-24 object-cover rounded shadow-md flex-shrink-0 cursor-pointer"
                  onClick={() => handleBookClick(currentRecommendation)}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 cursor-pointer" onClick={() => handleBookClick(currentRecommendation)}>
                    <h4 className="font-semibold text-blue-900 text-base mb-1">{currentRecommendation.title}</h4>
                    <p className="text-blue-700 text-sm mb-2">by {getAuthorName(currentRecommendation)}</p>
                    {currentRecommendation.publishedDate && (
                      <div className="flex items-center gap-1 mb-2">
                        {isUpcomingPublication(currentRecommendation) && <Calendar className="w-3 h-3 text-green-600" />}
                        <p className={`text-xs ${isUpcomingPublication(currentRecommendation) ? "text-green-600 font-medium" : "text-blue-600"}`}>
                          {isUpcomingPublication(currentRecommendation) ? "Coming " : ""}
                          {currentRecommendation.publishedDate}
                                </p>
                              </div>
                            )}
                          </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReject()
                    }}
                    className="p-1.5 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                    title="Not interested"
                    aria-label="Not interested"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                        </div>

                {currentRecommendation.description && (
                  <p className="text-gray-700 text-xs line-clamp-3 mb-3 cursor-pointer" onClick={() => handleBookClick(currentRecommendation)}>
                    {currentRecommendation.description}
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleBookClick(currentRecommendation)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRefresh}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs h-8"
                      title="Get another recommendation"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBlockAuthor}
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 text-xs h-7"
                    title="Permanently block this author from recommendations"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Block {getAuthorName(currentRecommendation)}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-blue-600 text-sm mb-1">No more recommendations</p>
          <p className="text-blue-500 text-xs">Try refreshing or mark more books as loved!</p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="mt-2 border-blue-200 text-blue-600 hover:bg-blue-50 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>
      )}

      {/* Recommendation Book Modal */}
      <RecommendationBookModal
        book={selectedBook}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddBook={handleAddBook}
        onAddAuthor={() => {}} // Not used in new system - user adds books, not authors
        onPass={handleReject}
      />
    </div>
  )
}
