"use client"

import { useState, useEffect } from "react"
import AccountManager from "./AccountManager"
import AuthorManager from "./AuthorManager"
import BookGrid from "./BookGrid"
import BookFilters from "./BookFilters"
import { defaultAdvancedFilters } from "@/lib/types"
import BookRecommendations from "./BookRecommendations"
import ReadingStatsCard from "./ReadingStatsCard"
import { ChevronDown, ChevronUp, Users, BookOpen, Settings, Activity } from "lucide-react"
import type { Book, User as UserType, Platform, AdvancedFilterState } from "@/lib/types"
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics"
import { normalizeAuthorName } from "./AuthorManager"
import { saveUserAuthors } from "@/lib/database"
import DataExport from "./DataExport"
import { APIErrorBoundary, ComponentErrorBoundary } from "./ErrorBoundary"

interface BookshelfClientProps {
  user: any // Updated comment to reflect localStorage-based auth system
  userProfile: any // Updated comment to reflect localStorage-based user profile
}

export default function BookshelfClient({ user, userProfile }: BookshelfClientProps) {
  const isLoggedIn = typeof window !== "undefined" ? localStorage.getItem("bookshelf_is_logged_in") === "true" : false
  const currentUser = typeof window !== "undefined" ? localStorage.getItem("bookshelf_current_user") || "" : ""

  const [authors, setAuthors] = useState<string[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [readBooks, setReadBooks] = useState<Set<string>>(new Set())
  const [wantToReadBooks, setWantToReadBooks] = useState<Set<string>>(new Set())
  const [dontWantBooks, setDontWantBooks] = useState<Set<string>>(new Set())
  const [sharedBooks, setSharedBooks] = useState<Set<string>>(new Set())
  const [friends, setFriends] = useState<string[]>([])
  const [selectedAuthor, setSelectedAuthor] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["en"])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>(defaultAdvancedFilters)
  const [isAuthorsOpen, setIsAuthorsOpen] = useState(true)
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(true)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false) // Added analytics section state
  const [platforms, setPlatforms] = useState<Platform[]>([
    { name: "Kindle", url: "", enabled: true },
    { name: "Audible", url: "", enabled: false },
    { name: "Books", url: "", enabled: false },
    { name: "Library", url: "", enabled: false },
  ])
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const [userState, setUserState] = useState<UserType>({
    name: "My Bookshelf",
    email: "",
    phone: "",
    location: "",
    preferredLanguages: ["en"],
    preferredGenres: [],
    preferredAgeRange: [],
    settings: {
      defaultLanguage: "en",
      preferredPlatforms: ["Kindle"],
      readingMethods: ["Print Books", "E-books", "Audiobooks"],
    },
    publicationTypePreferences: [],
    readingMethod: ["Print Books", "E-books", "Audiobooks"],
    ageRange: "",
    suggestNewAuthors: false,
  })

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const userPrefsKey = `bookshelf_user_${currentUser}`
      const savedUserPrefs = localStorage.getItem(userPrefsKey)

      if (savedUserPrefs) {
        try {
          const userPrefs = JSON.parse(savedUserPrefs)
          setUserState((prev) => ({
            ...prev,
            name: userPrefs.name || currentUser,
            email: userPrefs.email || currentUser,
            phone: userPrefs.phone || "",
            location: userPrefs.location || "",
            preferredLanguages: userPrefs.preferredLanguages || ["en"],
            preferredGenres: userPrefs.preferredGenres || [],
            ageRange: userPrefs.ageRange || "",
            readingMethod: userPrefs.readingMethod || ["Print Books", "E-books", "Audiobooks"],
            publicationTypePreferences: userPrefs.publicationTypePreferences || [],
            suggestNewAuthors: userPrefs.suggestNewAuthors || false,
          }))
        } catch (error) {
          console.error("Error loading user preferences:", error)
        }
      }
    }
  }, [isLoggedIn, currentUser])

  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const userPrefsKey = `bookshelf_user_${currentUser}`
      localStorage.setItem(userPrefsKey, JSON.stringify(userState))
    }
  }, [userState, isLoggedIn, currentUser])

  useEffect(() => {
    const loadUserData = async () => {
      if (!isLoggedIn || !currentUser) return

      try {
        const savedData = localStorage.getItem("personal_bookshelf")
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          setAuthors(parsedData.authors || [])
          setBooks(parsedData.books || [])
          setReadBooks(new Set(parsedData.readBooks || []))
          setWantToReadBooks(new Set(parsedData.wantToReadBooks || []))
          setDontWantBooks(new Set(parsedData.dontWantBooks || []))
          setSharedBooks(new Set(parsedData.sharedBooks || []))
          setFriends(parsedData.friends || [])
          setPlatforms(parsedData.platforms || platforms)
        }
        setIsDataLoaded(true)
      } catch (error) {
        console.error("Error loading user data:", error)
        setIsDataLoaded(true)
      }
    }

    loadUserData()
  }, [isLoggedIn, currentUser])

  useEffect(() => {
    if (!isLoggedIn || !isDataLoaded) return

    const dataToSave = {
      authors,
      books,
      readBooks: Array.from(readBooks),
      wantToReadBooks: Array.from(wantToReadBooks),
      dontWantBooks: Array.from(dontWantBooks),
      user: userState,
      platforms,
      friends,
      sharedBooks: Array.from(sharedBooks),
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem("personal_bookshelf", JSON.stringify(dataToSave))
  }, [
    authors,
    books,
    readBooks,
    wantToReadBooks,
    dontWantBooks,
    userState,
    platforms,
    friends,
    sharedBooks,
    isLoggedIn,
    isDataLoaded,
  ])

  useEffect(() => {
    if (isDataLoaded && authors.length === 0 && books.length === 0 && isLoggedIn) {
      setShowOnboarding(true)
    } else {
      setShowOnboarding(false)
    }
  }, [authors.length, books.length, isDataLoaded, isLoggedIn])

  const getAgeRangeKeywords = (ageRange: string) => {
    const keywords = {
      "Children (0-12)": [
        "children",
        "kids",
        "juvenile",
        "picture book",
        "early reader",
        "beginning reader",
        "ages 0",
        "ages 1",
        "ages 2",
        "ages 3",
        "ages 4",
        "ages 5",
        "ages 6",
        "ages 7",
        "ages 8",
        "ages 9",
        "ages 10",
        "ages 11",
        "ages 12",
        "kindergarten",
        "preschool",
        "toddler",
        "baby",
        "infant",
      ],
      "Young Adult (13-17)": [
        "young adult",
        "ya",
        "teen",
        "teenage",
        "adolescent",
        "high school",
        "ages 13",
        "ages 14",
        "ages 15",
        "ages 16",
        "ages 17",
        "coming of age",
        "first love",
        "school drama",
      ],
      "Adult (18+)": [
        "adult",
        "mature",
        "fiction",
        "non-fiction",
        "romance",
        "mystery",
        "thriller",
        "literary",
        "contemporary",
        "historical",
        "biography",
        "memoir",
        "business",
        "self-help",
        "philosophy",
        "science",
        "politics",
      ],
    }
    return keywords[ageRange] || []
  }

  const matchesAgeRange = (book: Book, ageRange: string) => {
    if (!ageRange) return true

    const keywords = getAgeRangeKeywords(ageRange)
    const searchText = `${book.title} ${book.description || ""} ${(book.categories || []).join(" ")}`.toLowerCase()

    if (ageRange === "Children (0-12)") {
      return keywords.some((keyword) => searchText.includes(keyword.toLowerCase()))
    }

    if (ageRange === "Young Adult (13-17)") {
      return keywords.some((keyword) => searchText.includes(keyword.toLowerCase()))
    }

    if (ageRange === "Adult (18+)") {
      const childKeywords = getAgeRangeKeywords("Children (0-12)")
      const yaKeywords = getAgeRangeKeywords("Young Adult (13-17)")
      const isChildrens = childKeywords.some((keyword) => searchText.includes(keyword.toLowerCase()))
      const isYA = yaKeywords.some((keyword) => searchText.includes(keyword.toLowerCase()))
      return !isChildrens && !isYA
    }

    return true
  }

  const isRerelease = (book: Book) => {
    const title = book.title.toLowerCase()
    const description = (book.description || "").toLowerCase()

    // Common rerelease indicators
    const rereleaseKeywords = [
      "tie-in",
      "movie tie-in",
      "tv tie-in",
      "netflix tie-in",
      "film tie-in",
      "movie edition",
      "tv edition",
      "television edition",
      "film edition",
      "anniversary edition",
      "special edition",
      "collector's edition",
      "deluxe edition",
      "premium edition",
      "limited edition",
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
    ]

    return rereleaseKeywords.some((keyword) => title.includes(keyword) || description.includes(keyword))
  }

  const filteredBooks = (books || []).filter((book) => {
    // Search filter - search in title and author
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const titleMatch = book.title?.toLowerCase().includes(query) || false
      const authorMatch = book.author?.toLowerCase().includes(query) || false
      if (!titleMatch && !authorMatch) {
        return false
      }
    }

    if ((userState.preferredLanguages || []).length > 0) {
      const bookLanguage = book.language || "en"
      if (!userState.preferredLanguages.includes(bookLanguage)) {
        return false
      }
    }

    if (isRerelease(book)) {
      return false
    }

    if (userState.ageRange && !matchesAgeRange(book, userState.ageRange)) {
      return false
    }

    if (selectedAuthor && book.author !== selectedAuthor) {
      return false
    }

    if ((selectedGenres || []).length > 0) {
      const bookGenres = book.categories || []
      const hasMatchingGenre = selectedGenres.some((genre) =>
        bookGenres.some((bookGenre) => bookGenre.toLowerCase().includes(genre.toLowerCase())),
      )
      if (!hasMatchingGenre) {
        return false
      }
    }

    const safeAdvancedFilters = advancedFilters || defaultAdvancedFilters

    if (safeAdvancedFilters.upcomingOnly) {
      if (!book.publishedDate) return false

      try {
        const bookDate = new Date(book.publishedDate)
        const now = new Date()

        // Check if date is valid
        if (isNaN(bookDate.getTime())) {
          return false
        }

        // Only show books with future publication dates
        if (bookDate <= now) {
          return false
        }
      } catch (error) {
        return false
      }
    }

    if (safeAdvancedFilters.title && !book.title.toLowerCase().includes(safeAdvancedFilters.title.toLowerCase())) {
      return false
    }

    if (safeAdvancedFilters.excludeWords && typeof safeAdvancedFilters.excludeWords === "string") {
      const excludeWords = safeAdvancedFilters.excludeWords
        .toLowerCase()
        .split(",")
        .map((w) => w.trim())
      const bookText = `${book.title} ${book.description || ""}`.toLowerCase()
      if (excludeWords.some((word) => bookText.includes(word))) {
        return false
      }
    }

    if (safeAdvancedFilters.description && book.description) {
      if (!book.description.toLowerCase().includes(safeAdvancedFilters.description.toLowerCase())) {
        return false
      }
    }

    if (safeAdvancedFilters.fromDate && book.publishedDate) {
      if (book.publishedDate < safeAdvancedFilters.fromDate) {
        return false
      }
    }

    if (safeAdvancedFilters.toDate && book.publishedDate) {
      if (book.publishedDate > safeAdvancedFilters.toDate) {
        return false
      }
    }

    if (Array.isArray(safeAdvancedFilters.readingStatus) && safeAdvancedFilters.readingStatus.length > 0) {
      const bookId = `${book.title}-${book.author}`
      let matchesAnyStatus = false

      for (const status of safeAdvancedFilters.readingStatus) {
        if (status === "read" && (readBooks || new Set()).has(bookId)) {
          matchesAnyStatus = true
          break
        }
        if (status === "want-to-read" && (wantToReadBooks || new Set()).has(bookId)) {
          matchesAnyStatus = true
          break
        }
        if (status === "dont-want" && (dontWantBooks || new Set()).has(bookId)) {
          matchesAnyStatus = true
          break
        }
        if (
          status === "unread" &&
          !(readBooks || new Set()).has(bookId) &&
          !(wantToReadBooks || new Set()).has(bookId) &&
          !(dontWantBooks || new Set()).has(bookId)
        ) {
          matchesAnyStatus = true
          break
        }
      }

      if (!matchesAnyStatus) {
        return false
      }
    }

    const bookId = `${book.title}-${book.author}`
    if ((dontWantBooks || new Set()).has(bookId) && safeAdvancedFilters.readingStatus !== "dont-want") {
      return false
    }

    return true
  })

  const getDefaultPlatformUrl = (platformName: string) => {
    const userPlatform = platforms.find((p) => p.name === platformName)
    if (userPlatform && userPlatform.url) {
      return userPlatform.url
    }

    switch (platformName) {
      case "Kindle":
        return "https://read.amazon.com/kindle"
      case "Audible":
        return "https://www.audible.com/"
      case "Books":
        return "https://www.amazon.com/s?k={title}&i=stripbooks"
      case "Library":
        return "https://libbyapp.com"
      default:
        return ""
    }
  }

  const enabledPlatforms = (platforms || [])
    .filter((platform) => platform.enabled)
    .map((platform) => ({
      ...platform,
      url: platform.url || getDefaultPlatformUrl(platform.name),
    }))

  const onBooksFound = (newBooks: Book[]) => {
    // The AuthorManager already filters books by author, so we don't need to double-filter here
    setBooks((prevBooks) => {
      const existingTitles = new Set(prevBooks.map((b) => `${b.title}-${b.author}`))
      const uniqueNewBooks = newBooks.filter((book) => !existingTitles.has(`${book.title}-${book.author}`))
      return [...prevBooks, ...uniqueNewBooks]
    })
  }

  const cleanupBooksForRemovedAuthors = () => {
    const currentAuthorNames = authors.map((name) => name.toLowerCase())
    setBooks((prevBooks) => prevBooks.filter((book) => currentAuthorNames.includes(book.author.toLowerCase())))
  }

  useEffect(() => {
    if (isDataLoaded) {
      cleanupBooksForRemovedAuthors()
    }
  }, [authors, isDataLoaded])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
      <header className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg overflow-hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden bg-white text-black p-2 rounded-lg border-2 border-black hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="bg-white border-4 border-black rounded-full px-4 md:px-6 py-2">
                <h1 className="text-black font-black text-lg md:text-xl tracking-tight">MY BOOKCASE</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="scale-75 md:scale-100 origin-right">
                <AccountManager user={user} isLoggedIn={isLoggedIn} />
              </div>
            </div>
          </div>

          {showOnboarding && (
            <div className="absolute top-full left-4 mt-2 md:hidden z-50">
              <div className="bg-yellow-400 text-black px-3 py-2 rounded-lg border-2 border-black shadow-lg animate-bounce">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs font-bold">Start here! Add your favorite authors</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <aside className={`md:col-span-1 space-y-6 ${isMobileMenuOpen ? "block" : "hidden md:block"}`}>
            <div className="md:hidden flex justify-between items-center mb-4">
              <h2 className="text-white font-bold text-lg">Menu</h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="bg-white text-black p-1 rounded border-2 border-black"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-lg border-4 border-black p-4">
              <button
                onClick={() => setIsAuthorsOpen(!isAuthorsOpen)}
                className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide mb-3 hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  AUTHORS & BOOKS
                </div>
                {isAuthorsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isAuthorsOpen && (
                <APIErrorBoundary>
                  <ComponentErrorBoundary componentName="Author Manager">
                    <AuthorManager
                      authors={authors}
                      setAuthors={setAuthors}
                      userId={currentUser || "guest"}
                      onBooksFound={onBooksFound}
                    />
                  </ComponentErrorBoundary>
                </APIErrorBoundary>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-lg border-4 border-black p-4">
              <button
                onClick={() => setIsRecommendationsOpen(!isRecommendationsOpen)}
                className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide mb-3 hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  RECOMMENDATIONS
                </div>
                {isRecommendationsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isRecommendationsOpen && (
                <APIErrorBoundary>
                  <ComponentErrorBoundary componentName="Book Recommendations">
                    <BookRecommendations
                      authors={authors}
                      books={books}
                      readBooks={readBooks}
                      wantToReadBooks={wantToReadBooks}
                      user={userState}
                      onBookClick={(book) => {
                    // Add the book to the collection
                    setBooks((prevBooks) => {
                      const existingTitles = new Set(prevBooks.map((b) => `${b.title}-${b.author}`))
                      if (!existingTitles.has(`${book.title}-${book.author}`)) {
                        return [book, ...prevBooks] // Add book to the beginning of the array instead of the end
                      }
                      return prevBooks
                    })

                    // Add the author to the authors list if not already present
                    const bookAuthor = book.author || book.authors?.[0]
                    if (bookAuthor) {
                      const normalizedAuthor = normalizeAuthorName(bookAuthor)
                      setAuthors((prevAuthors) => {
                        const authorExists = prevAuthors.some(author => 
                          author.toLowerCase() === normalizedAuthor.toLowerCase()
                        )
                        if (!authorExists) {
                          const updatedAuthors = [...prevAuthors, normalizedAuthor].sort((a, b) => {
                            const getLastName = (name: string) => name.trim().split(" ").pop()?.toLowerCase() || ""
                            return getLastName(a).localeCompare(getLastName(b))
                          })
                          
                          // Save to database and track analytics
                          if (currentUser) {
                            saveUserAuthors(currentUser, updatedAuthors).catch(error => 
                              console.error("Error saving authors to database:", error)
                            )
                            
                            trackEvent(currentUser, {
                              event_type: ANALYTICS_EVENTS.AUTHOR_ADDED,
                              event_data: {
                                author_name: normalizedAuthor,
                                total_authors: updatedAuthors.length,
                                source: "recommendation_click",
                                timestamp: new Date().toISOString(),
                              },
                            }).catch(error => 
                              console.error("Error tracking author addition:", error)
                            )
                          }
                          
                          return updatedAuthors
                        }
                        return prevAuthors
                      })
                    }

                    setTimeout(() => {
                      const bookElement = document.querySelector(`[data-book-id="${book.id}"]`)
                      if (bookElement) {
                        bookElement.scrollIntoView({ behavior: "smooth", block: "center" })
                      }
                    }, 100)
                  }}
                    />
                  </ComponentErrorBoundary>
                </APIErrorBoundary>
              )}
            </div>

            {isLoggedIn && currentUser && (
              <div className="bg-white rounded-lg shadow-lg border-4 border-black p-4">
                <button
                  onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                  className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide mb-3 hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Reading Analytics
                  </div>
                  {isAnalyticsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isAnalyticsOpen && (
                  <ComponentErrorBoundary componentName="Reading Analytics">
                    <ReadingStatsCard userId={currentUser} />
                  </ComponentErrorBoundary>
                )}
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg border-4 border-black p-4">
              <button
                onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
                className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide mb-3 hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  MY PREFERENCES
                </div>
                {isPreferencesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {isPreferencesOpen && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-red-600 font-bold text-sm uppercase tracking-wide">Account Information</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={userState.name}
                          onChange={(e) => {
                            const capitalizedValue = e.target.value
                              .split(" ")
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                              .join(" ")
                            setUserState((prev) => ({ ...prev, name: capitalizedValue }))
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={userState.email}
                          onChange={(e) => setUserState((prev) => ({ ...prev, email: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={userState.phone}
                          onChange={(e) => setUserState((prev) => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          value={userState.location}
                          onChange={(e) => setUserState((prev) => ({ ...prev, location: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-red-600 font-bold text-sm uppercase tracking-wide">Languages</h3>
                    <div className="space-y-1">
                      {["English", "Spanish", "French", "German", "Italian", "Portuguese"].map((lang, index) => {
                        const langCode = ["en", "es", "fr", "de", "it", "pt"][index]
                        return (
                          <label key={langCode} className="flex items-center text-xs">
                            <input
                              type="checkbox"
                              checked={userState.preferredLanguages.includes(langCode)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setUserState((prev) => ({
                                    ...prev,
                                    preferredLanguages: [...prev.preferredLanguages, langCode],
                                  }))
                                } else {
                                  setUserState((prev) => ({
                                    ...prev,
                                    preferredLanguages: prev.preferredLanguages.filter((l) => l !== langCode),
                                  }))
                                }
                              }}
                              className="mr-2"
                            />
                            {lang}
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-red-600 font-bold text-sm uppercase tracking-wide">Age Range</h3>
                    <div className="space-y-1">
                      {["Adult (18+)", "Young Adult (13-17)", "Children (0-12)"].map((range) => (
                        <label key={range} className="flex items-center text-xs">
                          <input
                            type="radio"
                            name="ageRange"
                            checked={userState.ageRange === range}
                            onChange={() => setUserState((prev) => ({ ...prev, ageRange: range }))}
                            className="mr-2"
                          />
                          {range}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-red-600 font-bold text-sm uppercase tracking-wide">Genres</h3>
                    <div className="space-y-1">
                      {[
                        "Fiction",
                        "Mystery",
                        "Romance",
                        "Science Fiction",
                        "Fantasy",
                        "Thriller",
                        "Historical Fiction",
                        "Biography",
                        "Non-fiction",
                        "Self-help",
                        "Business",
                        "Health",
                        "Travel",
                        "Cooking",
                        "Art",
                        "Religion",
                        "Philosophy",
                        "Science",
                        "Technology",
                        "Politics",
                      ].map((genre) => (
                        <label key={genre} className="flex items-center text-xs">
                          <input
                            type="checkbox"
                            checked={userState.preferredGenres.includes(genre)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUserState((prev) => ({
                                  ...prev,
                                  preferredGenres: [...prev.preferredGenres, genre],
                                }))
                              } else {
                                setUserState((prev) => ({
                                  ...prev,
                                  preferredGenres: prev.preferredGenres.filter((g) => g !== genre),
                                }))
                              }
                            }}
                            className="mr-2"
                          />
                          {genre}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-red-600 font-bold text-sm uppercase tracking-wide">Recommendations</h3>
                    <div className="space-y-1">
                      <label className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={userState.suggestNewAuthors || false}
                          onChange={(e) => {
                            setUserState((prev) => ({
                              ...prev,
                              suggestNewAuthors: e.target.checked,
                            }))
                          }}
                          className="mr-2"
                        />
                        Suggest new authors
                      </label>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-red-600 font-bold text-sm uppercase tracking-wide">Publication Type</h3>
                    <div className="space-y-1">
                      {["Novels", "Short Stories", "Poetry", "Non-Fiction", "Biography/Memoir", "Essays"].map(
                        (type) => (
                          <label key={type} className="flex items-center text-xs">
                            <input
                              type="checkbox"
                              checked={userState.publicationTypePreferences.includes(type)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setUserState((prev) => ({
                                    ...prev,
                                    publicationTypePreferences: [...prev.publicationTypePreferences, type],
                                  }))
                                } else {
                                  setUserState((prev) => ({
                                    ...prev,
                                    publicationTypePreferences: prev.publicationTypePreferences.filter(
                                      (t) => t !== type,
                                    ),
                                  }))
                                }
                              }}
                              className="mr-2"
                            />
                            {type}
                          </label>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-red-600 font-bold text-sm uppercase tracking-wide">Reading Platform</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="flex items-center text-xs mb-1">
                          <input
                            type="checkbox"
                            checked={platforms.find((p) => p.name === "Kindle")?.enabled || false}
                            onChange={(e) => {
                              setPlatforms((prev) =>
                                prev.map((p) => (p.name === "Kindle" ? { ...p, enabled: e.target.checked } : p)),
                              )
                            }}
                            className="mr-2"
                          />
                          Kindle
                        </label>
                        <input
                          type="url"
                          value={platforms.find((p) => p.name === "Kindle")?.url || "https://read.amazon.com/kindle"}
                          onChange={(e) => {
                            setPlatforms((prev) =>
                              prev.map((p) => (p.name === "Kindle" ? { ...p, url: e.target.value } : p)),
                            )
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="https://read.amazon.com/kindle"
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-xs mb-1">
                          <input
                            type="checkbox"
                            checked={platforms.find((p) => p.name === "Audible")?.enabled || false}
                            onChange={(e) => {
                              setPlatforms((prev) =>
                                prev.map((p) => (p.name === "Audible" ? { ...p, enabled: e.target.checked } : p)),
                              )
                            }}
                            className="mr-2"
                          />
                          Audible
                        </label>
                        <input
                          type="url"
                          value={platforms.find((p) => p.name === "Audible")?.url || "https://www.audible.com/"}
                          onChange={(e) => {
                            setPlatforms((prev) =>
                              prev.map((p) => (p.name === "Audible" ? { ...p, url: e.target.value } : p)),
                            )
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="https://www.audible.com/"
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-xs mb-1">
                          <input
                            type="checkbox"
                            checked={platforms.find((p) => p.name === "Books")?.enabled || false}
                            onChange={(e) => {
                              setPlatforms((prev) =>
                                prev.map((p) => (p.name === "Books" ? { ...p, enabled: e.target.checked } : p)),
                              )
                            }}
                            className="mr-2"
                          />
                          Print
                        </label>
                        <input
                          type="url"
                          value={
                            platforms.find((p) => p.name === "Books")?.url ||
                            "https://www.amazon.com/s?k={title}&i=stripbooks"
                          }
                          onChange={(e) => {
                            setPlatforms((prev) =>
                              prev.map((p) => (p.name === "Books" ? { ...p, url: e.target.value } : p)),
                            )
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="https://www.amazon.com/s?k={title}&i=stripbooks"
                        />
                      </div>
                      <div>
                        <label className="flex items-center text-xs mb-1">
                          <input
                            type="checkbox"
                            checked={platforms.find((p) => p.name === "Library")?.enabled || false}
                            onChange={(e) => {
                              setPlatforms((prev) =>
                                prev.map((p) => (p.name === "Library" ? { ...p, enabled: e.target.checked } : p)),
                              )
                            }}
                            className="mr-2"
                          />
                          Library
                        </label>
                        <input
                          type="url"
                          value={
                            platforms.find((p) => p.name === "Library")?.url ||
                            "https://libbyapp.com"
                          }
                          onChange={(e) => {
                            setPlatforms((prev) =>
                              prev.map((p) => (p.name === "Library" ? { ...p, url: e.target.value } : p)),
                            )
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="https://libbyapp.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Just enter your library URL (e.g., libbyapp.com, overdrive.com). We'll automatically search for the book!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <main className="md:col-span-4 space-y-6">
            <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6">
              <BookFilters
                authors={authors}
                selectedAuthor={selectedAuthor}
                setSelectedAuthor={setSelectedAuthor}
                sortBy={sortBy}
                setSortBy={setSortBy}
                selectedLanguages={selectedLanguages}
                setSelectedLanguages={setSelectedLanguages}
                selectedGenres={selectedGenres}
                setSelectedGenres={setSelectedGenres}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                userPreferences={userState}
                advancedFilters={advancedFilters}
                onFiltersChange={setAdvancedFilters}
                books={books}
              />
            </div>

            <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-red-600 font-bold text-lg uppercase tracking-wide flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    My Bookshelf
                  </h2>
                  <div className="bg-white border-2 border-black rounded-lg px-2 py-0.5">
                    <span className="text-black font-black text-xs">
                      READING PROGRESS {readBooks.size} OF {books.length}
                    </span>
                  </div>
                  <DataExport 
                    books={books}
                    authors={authors}
                    readBooks={readBooks}
                    wantToReadBooks={wantToReadBooks}
                    dontWantBooks={dontWantBooks}
                    userProfile={userState}
                  />
                </div>
                <div className="bg-orange-100 border border-orange-200 rounded-lg px-2 py-0.5">
                  <span className="text-orange-800 font-medium text-xs">
                    {filteredBooks.length} of {books.length} books
                  </span>
                </div>
              </div>

              <BookGrid
                books={filteredBooks}
                sortBy={sortBy}
                readBooks={readBooks}
                wantToReadBooks={wantToReadBooks}
                dontWantBooks={dontWantBooks}
                sharedBooks={sharedBooks}
                friends={friends}
                platforms={enabledPlatforms}
                userId={currentUser}
                onMarkAsRead={(bookId, title, author) => {
                  setReadBooks((prev) => new Set([...prev, bookId]))
                  setWantToReadBooks((prev) => {
                    const newSet = new Set(prev)
                    newSet.delete(bookId)
                    return newSet
                  })

                  if (isLoggedIn) {
                    const book = books.find((b) => `${b.title}-${b.author}` === bookId)
                    trackEvent(currentUser, {
                      event_type: ANALYTICS_EVENTS.BOOK_MARKED_READ,
                      book_id: bookId,
                      book_title: title,
                      book_author: author,
                      event_data: {
                        genres: book?.categories || [],
                        timestamp: new Date().toISOString(),
                      },
                    })
                  }
                }}
                onMarkAsWant={(bookId, title, author) => {
                  setWantToReadBooks((prev) => new Set([...prev, bookId]))
                  setReadBooks((prev) => {
                    const newSet = new Set(prev)
                    newSet.delete(bookId)
                    return newSet
                  })

                  if (isLoggedIn) {
                    const book = books.find((b) => `${b.title}-${b.author}` === bookId)
                    trackEvent(currentUser, {
                      event_type: ANALYTICS_EVENTS.BOOK_MARKED_WANT,
                      book_id: bookId,
                      book_title: title,
                      book_author: author,
                      event_data: {
                        genres: book?.categories || [],
                        timestamp: new Date().toISOString(),
                      },
                    })
                  }
                }}
                onToggleDontWant={(bookId, title, author) => {
                  setDontWantBooks((prev) => {
                    const newSet = new Set(prev)
                    if (newSet.has(bookId)) {
                      newSet.delete(bookId)
                    } else {
                      newSet.add(bookId)
                    }
                    return newSet
                  })

                  if (isLoggedIn) {
                    const book = books.find((b) => `${b.title}-${b.author}` === bookId)
                    trackEvent(currentUser, {
                      event_type: ANALYTICS_EVENTS.BOOK_MARKED_PASS,
                      book_id: bookId,
                      book_title: book?.title,
                      book_author: book?.author,
                      event_data: {
                        genres: book?.categories || [],
                        timestamp: new Date().toISOString(),
                      },
                    })
                  }
                }}
                onShare={(bookId, friendName) => {
                  setSharedBooks((prev) => new Set([...prev, bookId]))
                  if (!friends.includes(friendName)) {
                    setFriends((prev) => [...prev, friendName])
                  }

                  if (isLoggedIn) {
                    const book = books.find((b) => `${b.title}-${b.author}` === bookId)
                    trackEvent(currentUser, {
                      event_type: ANALYTICS_EVENTS.BOOK_SHARED,
                      book_id: bookId,
                      book_title: book?.title,
                      book_author: book?.author,
                      event_data: {
                        friend_name: friendName,
                        timestamp: new Date().toISOString(),
                      },
                    })
                  }
                }}
              />
            </div>
          </main>
        </div>
      </div>

      <footer className="bg-orange-600 text-white py-4 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs opacity-80 mb-1">
            This site was designed by Susanna Kemp as a personal project. It is intended to reduce overwhelm and online
            clutter and is for individual use. It may not be copied without permission.
          </p>
          <p className="text-xs opacity-70 mb-2">Design inspired Penguin Books and art by James McQueen.</p>
          <p className="text-xs opacity-60">
            Data is private to your account only. It is stored locally on your device and for now will be erased if you
            clear your cache.
          </p>
        </div>
      </footer>
    </div>
  )
}
