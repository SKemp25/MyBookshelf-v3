"use client"

import { useState, useEffect } from "react"
import AccountManager from "./AccountManager"
import AuthorManager from "./AuthorManager"
import BookGrid from "./BookGrid"
import BookFilters from "./BookFilters"
import { defaultAdvancedFilters } from "@/lib/types"
import BookRecommendations from "./BookRecommendations"
import TooltipManager from "./TooltipManager"
import { ChevronDown, ChevronUp, Users, BookOpen, Settings, HelpCircle } from "lucide-react"
import type { Book, User as UserType, Platform, AdvancedFilterState } from "@/lib/types"
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics"
import { normalizeAuthorName } from "./AuthorManager"
import { saveUserAuthors } from "@/lib/database"
import { deduplicateBooks } from "@/lib/utils"
import DataExport from "./DataExport"
import { APIErrorBoundary, ComponentErrorBoundary } from "./ErrorBoundary"
import { Card, CardContent } from "@/components/ui/card"

interface BookshelfClientProps {
  user: any // Updated comment to reflect localStorage-based auth system
  userProfile: any // Updated comment to reflect localStorage-based user profile
}

// Helper function to get author name from book (handles both old and new formats)
const getBookAuthor = (book: any): string => {
  return book.author || book.authors?.[0] || "Unknown"
}

export default function BookshelfClient({ user, userProfile }: BookshelfClientProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState("")
  const [isHydrated, setIsHydrated] = useState(false)

  const [authors, setAuthors] = useState<string[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [readBooks, setReadBooks] = useState<Set<string>>(new Set())
  const [wantToReadBooks, setWantToReadBooks] = useState<Set<string>>(new Set())
  const [dontWantBooks, setDontWantBooks] = useState<Set<string>>(new Set())
  const [bookRatings, setBookRatings] = useState<Map<string, "loved" | "liked" | "didnt-like">>(new Map())
  const [friends, setFriends] = useState<string[]>([])
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>("newest")
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["en"])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showHeartedBooks, setShowHeartedBooks] = useState<boolean>(false)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>(defaultAdvancedFilters)
  const [isAuthorsOpen, setIsAuthorsOpen] = useState(false)
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([])

  // Handle hydration and check login state
  useEffect(() => {
    // Set hydrated immediately to prevent infinite loading
    setIsHydrated(true)
    
    const checkLoginState = () => {
      try {
        const loggedIn = localStorage.getItem("bookshelf_is_logged_in") === "true"
        const user = localStorage.getItem("bookshelf_current_user") || ""
        console.log("Checking login state:", { loggedIn, user })
        setIsLoggedIn(loggedIn)
        setCurrentUser(user)
      } catch (error) {
        console.error("Error checking login state:", error)
        // Still set hydrated even if there's an error
        setIsHydrated(true)
      }
    }
    
    // Check immediately
    checkLoginState()
    
    // Listen for storage changes (in case login happens in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bookshelf_is_logged_in" || e.key === "bookshelf_current_user") {
        console.log("Storage changed, re-checking login state")
        checkLoginState()
      }
    }
    
    window.addEventListener("storage", handleStorageChange)
    
    // Also check on window focus (in case login happened and page was redirected)
    const handleFocus = () => {
      checkLoginState()
    }
    window.addEventListener("focus", handleFocus)
    
    // Re-check after a short delay to catch any race conditions
    const timeoutId = setTimeout(() => {
      checkLoginState()
    }, 200)
    
    // Also check when the page becomes visible (handles tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkLoginState()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    
    // Safety timeout - force hydration after 2 seconds even if something goes wrong
    const safetyTimeout = setTimeout(() => {
      setIsHydrated(true)
    }, 2000)
    
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      clearTimeout(timeoutId)
      clearTimeout(safetyTimeout)
    }
  }, [])
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const [isRecentlyViewedOpen, setIsRecentlyViewedOpen] = useState(false) // Added recently viewed section state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false) // Added filters section state
  const [isTooltipTourActive, setIsTooltipTourActive] = useState(false) // Added contextual tooltip tour state
  const [recommendedAuthors, setRecommendedAuthors] = useState<Set<string>>(new Set())
  const [platforms, setPlatforms] = useState<Platform[]>([
    { name: "Kindle", url: "", enabled: true },
    { name: "Audible", url: "", enabled: false },
    { name: "Books", url: "", enabled: false },
    { name: "Library", url: "https://www.worldcat.org", enabled: false },
  ])
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  const [userState, setUserState] = useState<UserType>({
    name: "My Bookshelf",
    email: "",
    phone: "",
    country: "",
    cityState: "",
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
    dateOfBirth: "",
    preferredReadingTime: "",
    readingGoal: 0,
    memoryAids: ["Show book covers"], // Default to showing book covers
    diagnosedWithMemoryIssues: false,
  })

  // Fetch books for all existing authors when component loads
  useEffect(() => {
    const fetchBooksForAuthors = async () => {
      if (!isDataLoaded || !authors.length || books.length > 0) {
        return
      }
      try {
        const { fetchAuthorBooksWithCache } = await import("@/lib/apiCache")
        const allBooks: Book[] = []
        for (const author of authors) {
          try {
            const authorBooks = await fetchAuthorBooksWithCache(author)
            if (authorBooks && authorBooks.length > 0) {
              allBooks.push(...authorBooks)
            }
          } catch (error) {
            console.error(`Error fetching books for ${author}:`, error)
          }
        }
        if (allBooks.length > 0) {
          const deduplicatedBooks = deduplicateBooks(allBooks, userState.country || "US")
          setBooks(deduplicatedBooks)
        }
      } catch (error) {
        console.error("Error fetching books for authors:", error)
      }
    }
    fetchBooksForAuthors()
  }, [isDataLoaded, authors])

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
            country: userPrefs.country || "",
            cityState: userPrefs.cityState || "",
            preferredLanguages: userPrefs.preferredLanguages || ["en"],
            preferredGenres: userPrefs.preferredGenres || [],
            preferredAgeRange: userPrefs.preferredAgeRange || [],
            ageRange: userPrefs.ageRange || "",
            readingMethod: userPrefs.readingMethod || ["Print Books", "E-books", "Audiobooks"],
            publicationTypePreferences: userPrefs.publicationTypePreferences || [],
            suggestNewAuthors: userPrefs.suggestNewAuthors || false,
            dateOfBirth: userPrefs.dateOfBirth || "",
            preferredReadingTime: userPrefs.preferredReadingTime || "",
            readingGoal: userPrefs.readingGoal || 0,
            memoryAids: userPrefs.memoryAids && userPrefs.memoryAids.length > 0 ? userPrefs.memoryAids : ["Show book covers"], // Default to showing book covers if not set
            diagnosedWithMemoryIssues: userPrefs.diagnosedWithMemoryIssues || false,
            settings: userPrefs.settings || prev.settings, // Preserve settings
          }))
          console.log("User profile loaded:", { name: userPrefs.name, email: userPrefs.email })
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
        // Load user-specific data
        const userDataKey = `bookshelf_data_${currentUser}`
        const savedData = localStorage.getItem(userDataKey)
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          setAuthors(parsedData.authors || [])
          const normalizedBooks = (parsedData.books || []).map((b: any) => ({
            ...b,
            author: b?.author || (Array.isArray(b?.authors) ? b.authors[0] : b?.author) || "Unknown",
            authors: Array.isArray(b?.authors) && b.authors.length > 0 ? b.authors : (b?.author ? [b.author] : []),
          }))
          setBooks(deduplicateBooks(normalizedBooks, userState.country || "US"))
          setReadBooks(new Set(parsedData.readBooks || []))
          setWantToReadBooks(new Set(parsedData.wantToReadBooks || []))
          setDontWantBooks(new Set(parsedData.dontWantBooks || []))
          setFriends(parsedData.friends || [])
          setPlatforms(parsedData.platforms || platforms)
          setRecommendedAuthors(new Set(parsedData.recommendedAuthors || []))
          // Load book ratings
          if (parsedData.bookRatings) {
            setBookRatings(new Map(Object.entries(parsedData.bookRatings)))
          }
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
    if (!isLoggedIn || !isDataLoaded || !currentUser) return

    const userDataKey = `bookshelf_data_${currentUser}`
    const dataToSave = {
      authors,
      books,
      readBooks: Array.from(readBooks),
      wantToReadBooks: Array.from(wantToReadBooks),
      dontWantBooks: Array.from(dontWantBooks),
      bookRatings: Object.fromEntries(bookRatings),
      user: userState,
      platforms,
      friends,
      recommendedAuthors: Array.from(recommendedAuthors),
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(userDataKey, JSON.stringify(dataToSave))
  }, [
    authors,
    books,
    readBooks,
    wantToReadBooks,
    dontWantBooks,
    bookRatings,
    userState,
    platforms,
    friends,
    recommendedAuthors,
    isLoggedIn,
    isDataLoaded,
    currentUser,
  ])

  useEffect(() => {
    if (isDataLoaded && authors.length === 0 && books.length === 0 && isLoggedIn) {
      setShowOnboarding(true)
    } else {
      setShowOnboarding(false)
    }
  }, [authors.length, books.length, isDataLoaded, isLoggedIn])

  // Show contextual tooltip tour on first login
  useEffect(() => {
    if (isLoggedIn && currentUser && isDataLoaded) {
      const hasSeenTour = localStorage.getItem(`bookshelf_tour_seen_${currentUser}`)
      if (!hasSeenTour) {
        // Small delay to ensure UI is ready
        setTimeout(() => {
          setIsTooltipTourActive(true)
        }, 1000)
      }
    }
  }, [isLoggedIn, currentUser, isDataLoaded])

  const getAgeRangeKeywords = (ageRange: string) => {
    const keywords: Record<string, string[]> = {
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
    }
    return keywords[ageRange] || []
  }

  const matchesAgeRange = (book: Book, ageRange: string) => {
    if (!ageRange) return true

    // For 18+, show all books (no filtering)
    if (ageRange === "Adult (18+)") {
      return true
    }

    const keywords = getAgeRangeKeywords(ageRange)
    const searchText = `${book.title || ""} ${book.description || ""} ${(book.categories || []).join(" ")}`.toLowerCase()

    // For children's books (0-12), only match if explicitly children's content
    if (ageRange === "Children (0-12)") {
      return keywords.some((keyword: string) => searchText.includes(keyword.toLowerCase()))
    }

    // For teen books (13-17), only match if explicitly teen/YA content
    if (ageRange === "Young Adult (13-17)") {
      return keywords.some((keyword: string) => searchText.includes(keyword.toLowerCase()))
    }

    return true
  }

  const isRerelease = (book: Book) => {
    const title = (book.title || "").toLowerCase()
    const description = (book.description || "").toLowerCase()

    // If the book is published in the future (2025+), it's likely a legitimate new book, not a rerelease
    if (book.publishedDate) {
      const bookYear = new Date(book.publishedDate).getFullYear()
      if (bookYear >= 2025) {
        return false // Don't filter out future books as rereleases
      }
    }

    // Common rerelease indicators - comprehensive list to filter out special editions
    const rereleaseKeywords = [
      // Tie-ins
      "tie-in",
      "movie tie-in",
      "tv tie-in",
      "netflix tie-in",
      "film tie-in",
      "television tie-in",
      "streaming tie-in",
      "media tie-in",
      
      // Editions
      "movie edition",
      "tv edition",
      "television edition",
      "film edition",
      "netflix edition",
      "streaming edition",
      "anniversary edition",
      "special edition",
      "collector's edition",
      "deluxe edition",
      "premium edition",
      "limited edition",
      "exclusive edition",
      "gift edition",
      "holiday edition",
      "christmas edition",
      "boxed set",
      "box set",
      
      // Reprints and reissues
      "reissue",
      "reprint",
      "new edition",
      "revised edition",
      "updated edition",
      "expanded edition",
      "enhanced edition",
      "second edition",
      "third edition",
      "fourth edition",
      "fifth edition",
      
      // Covers
      "movie cover",
      "tv cover",
      "film cover",
      "netflix cover",
      "streaming cover",
      
      // Media adaptations
      "now a major motion picture",
      "now a netflix series",
      "now a tv series",
      "now streaming",
      "coming soon to",
      "now on netflix",
      "now on tv",
      "now in theaters",
      "now a movie",
      "now a film",
      "now a series",
      
      // Other indicators
      "adaptation",
      "based on the",
      "film adaptation",
      "tv adaptation",
      "movie adaptation",
      "netflix adaptation",
      "streaming adaptation",
      "cinematic edition",
      "theatrical edition",
      "director's cut",
      "extended edition",
      "uncut edition",
      "complete edition",
      "definitive edition",
      "author's preferred edition",
      "restored edition",
      "remastered edition",
      "digital edition",
      "ebook edition",
      "kindle edition",
      "audiobook edition",
      "audio edition",
      "large print edition",
      "large print",
      "dyslexia friendly",
      "dyslexia-friendly",
      "accessible edition",
      "braille edition",
      "sign language edition",
    ]

    return rereleaseKeywords.some((keyword) => title.includes(keyword) || description.includes(keyword))
  }

  const filteredAndLimitedBooks = (() => {
    const base = (books || []).filter((book) => {
    
    // Search filter - search in title and author
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const titleMatch = (book.title || "").toLowerCase().includes(query)
      const authorMatch = (getBookAuthor(book) || "").toLowerCase().includes(query)
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

    // Age range filtering: Only filter for 0-12 and 13-17, 18+ shows all books
    if (userState.ageRange && !matchesAgeRange(book, userState.ageRange)) {
      return false
    }

    // Only show books by authors in your authors list
    const bookAuthor = getBookAuthor(book)
    // Use case-insensitive matching to handle normalization differences
    const authorMatches = authors.some(author => 
      author.toLowerCase().trim() === bookAuthor.toLowerCase().trim() ||
      normalizeAuthorName(author).toLowerCase() === normalizeAuthorName(bookAuthor).toLowerCase()
    )
    if (!authorMatches) {
      return false
    }

    // Filter by selected authors if any are selected
    if (selectedAuthors.length > 0) {
      const selectedAuthorMatches = selectedAuthors.some(selectedAuthor =>
        selectedAuthor.toLowerCase().trim() === bookAuthor.toLowerCase().trim() ||
        normalizeAuthorName(selectedAuthor).toLowerCase() === normalizeAuthorName(bookAuthor).toLowerCase()
      )
      if (!selectedAuthorMatches) {
        return false
      }
    }

    const safeAdvancedFilters = advancedFilters || defaultAdvancedFilters

    // Genre filtering - check both selectedGenres and advancedFilters.genre
    const genreFilters: string[] = []
    if ((selectedGenres || []).length > 0) {
      genreFilters.push(...selectedGenres)
    }
    if (safeAdvancedFilters.genre && safeAdvancedFilters.genre !== "all") {
      genreFilters.push(safeAdvancedFilters.genre)
    }

    if (genreFilters.length > 0) {
      const bookGenres = (book.categories || []).map(g => g.toLowerCase())
      const bookGenre = (book.genre || "").toLowerCase()
      const bookDescription = (book.description || "").toLowerCase()
      
      // More precise genre matching - avoid substring matches that cause false positives
      const hasMatchingGenre = genreFilters.some((filterGenre) => {
        const filterLower = filterGenre.toLowerCase()
        
        // Exact match in categories
        if (bookGenres.some(bg => bg === filterLower)) return true
        
        // Check for "Fiction" vs "Non-Fiction" distinction
        if (filterLower === "fiction") {
          // Fiction should NOT match if book has "non-fiction", "biography", "history", etc.
          const nonFictionIndicators = ["non-fiction", "nonfiction", "biography", "autobiography", "history", "biographical", "reference", "academic", "scholarly"]
          if (nonFictionIndicators.some(indicator => 
            bookGenres.some(bg => bg.includes(indicator)) || 
            bookDescription.includes(indicator) ||
            bookGenre.includes(indicator)
          )) {
            return false
          }
          // Fiction should match if it has fiction-related categories
          const fictionIndicators = ["fiction", "novel", "literary fiction"]
          return fictionIndicators.some(indicator => 
            bookGenres.some(bg => bg.includes(indicator)) || 
            bookDescription.includes(indicator) ||
            bookGenre.includes(indicator)
          )
        }
        
        if (filterLower === "non-fiction" || filterLower === "nonfiction") {
          // Non-fiction should match if it has non-fiction indicators
          const nonFictionIndicators = ["non-fiction", "nonfiction", "biography", "autobiography", "history", "biographical", "reference", "academic", "scholarly", "essay", "memoir"]
          return nonFictionIndicators.some(indicator => 
            bookGenres.some(bg => bg.includes(indicator)) || 
            bookDescription.includes(indicator) ||
            bookGenre.includes(indicator)
          )
        }
        
        // For other genres, use substring matching but be more careful
        return bookGenres.some((bookGenre) => {
          const normalizedBookGenre = bookGenre.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
          const normalizedFilter = filterLower.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
          return normalizedBookGenre.includes(normalizedFilter) || normalizedFilter.includes(normalizedBookGenre)
        }) || bookGenre.includes(filterLower) || bookDescription.includes(filterLower)
      })
      
      if (!hasMatchingGenre) {
        return false
      }
    }


    if (safeAdvancedFilters.upcomingOnly) {
      if (!book.publishedDate) return false

      try {
        const now = new Date()
        let bookDate: Date
        const dateStr = book.publishedDate.trim()
        
        // Handle different date formats
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

        // Only show books with future publication dates
        if (bookDate <= now) {
          return false
        }
      } catch (error) {
        console.error("Error parsing date for upcoming filter:", book.publishedDate, error)
        return false
      }
    }

    if (safeAdvancedFilters.title && !(book.title || "").toLowerCase().includes(safeAdvancedFilters.title.toLowerCase())) {
      return false
    }

    if (safeAdvancedFilters.excludeWords && typeof safeAdvancedFilters.excludeWords === "string") {
      const excludeWords = safeAdvancedFilters.excludeWords
        .toLowerCase()
        .split(",")
        .map((w) => w.trim())
      const bookText = `${book.title || ""} ${book.description || ""}`.toLowerCase()
      if (excludeWords.some((word) => bookText.includes(word))) {
        return false
      }
    }

    if (safeAdvancedFilters.description && book.description) {
      if (!book.description.toLowerCase().includes(safeAdvancedFilters.description.toLowerCase())) {
        return false
      }
    }

    // Filter by hearted books (loved rating)
    if (showHeartedBooks) {
      const bookId = `${book.title}-${getBookAuthor(book)}`
      const rating = bookRatings.get(bookId)
      if (rating !== "loved") {
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

    // Year range filtering
    if (safeAdvancedFilters.yearRange) {
      const { start, end } = safeAdvancedFilters.yearRange
      if (book.publishedDate && (start.trim() || end.trim())) {
        try {
          const bookDate = new Date(book.publishedDate)
          if (isNaN(bookDate.getTime())) {
            return false // Invalid date
          }
          
          const bookYear = bookDate.getFullYear()
          
          
          if (start.trim() && bookYear < parseInt(start)) {
            return false
          }
          
          if (end.trim() && bookYear > parseInt(end)) {
            return false
          }
        } catch (error) {
          return false
        }
      }
    }

    // Hide books based on selected statuses to hide
    if (Array.isArray(safeAdvancedFilters.readingStatus) && safeAdvancedFilters.readingStatus.length > 0) {
      const bookId = `${book.title}-${book.author}`
      
      // Check if this book should be hidden based on its status
      for (const statusToHide of safeAdvancedFilters.readingStatus) {
        if (statusToHide === "read" && (readBooks || new Set()).has(bookId)) {
          return false // Hide this book
        }
        if (statusToHide === "want-to-read" && (wantToReadBooks || new Set()).has(bookId)) {
          return false // Hide this book
        }
        if (
          statusToHide === "unread" &&
          !(readBooks || new Set()).has(bookId) &&
          !(wantToReadBooks || new Set()).has(bookId) &&
          !(dontWantBooks || new Set()).has(bookId)
        ) {
          return false // Hide this book (it has no status)
        }
      }
    }

    // Hide passed books by default unless showPassedBooks is true
    const bookId = `${book.title}-${book.author}`
    if ((dontWantBooks || new Set()).has(bookId) && !(safeAdvancedFilters as any).showPassedBooks) {
      return false // Hide passed books unless explicitly shown
    }

    
    return true
  })

    const showN = userState.settings?.showLastNBooks
    if (showN && showN !== "all") {
      const grouped: Record<string, Book[]> = {}
      base.forEach((b) => {
        const key = b.author || "Unknown"
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(b)
      })
      const result: Book[] = []
      Object.values(grouped).forEach((arr) => {
        const sorted = [...arr].sort((a, b) => new Date(b.publishedDate || "1900").getTime() - new Date(a.publishedDate || "1900").getTime())
        result.push(...sorted.slice(0, Number(showN)))
      })
      return result
    }
    return base
  })()

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
        return "https://www.worldcat.org"
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
    setBooks((prevBooks) => {
      // Simple approach: just add new books, filter out any with missing authors
      const validNewBooks = newBooks.filter(book => {
        const author = getBookAuthor(book)
        return author && author !== "Unknown" && author !== "UNKNOWN AUTHOR" && author.trim() !== ""
      })
      
      // Remove duplicates based on book ID
      const existingIds = new Set(prevBooks.map(book => book.id))
      const uniqueNewBooks = validNewBooks.filter(book => !existingIds.has(book.id))
      
      const allBooks = [...prevBooks, ...uniqueNewBooks]
      
      // Deduplicate using the improved deduplicateBooks function
      const deduplicatedBooks = deduplicateBooks(allBooks, userState.country || "US")
      
      return deduplicatedBooks
    })
  }

  // Track recently viewed books for memory support
  const trackRecentlyViewed = (bookId: string) => {
    setRecentlyViewed(prev => {
      const updated = [bookId, ...prev.filter(id => id !== bookId)].slice(0, 5) // Keep last 5
      return updated
    })
  }

  // Scroll to a specific book card
  const scrollToBook = (bookId: string) => {
    // Find the book card element by data-book-id
    const bookElement = document.querySelector(`[data-book-id="${bookId}"]`)
    if (bookElement) {
      // Add a temporary highlight effect
      bookElement.classList.add('ring-4', 'ring-orange-400', 'ring-opacity-75')
      
      // Scroll to the element with smooth behavior
      bookElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      })
      
      // Remove the highlight after 2 seconds
      setTimeout(() => {
        bookElement.classList.remove('ring-4', 'ring-orange-400', 'ring-opacity-75')
      }, 2000)
    }
  }

  // Simplified approach - no cleanup function, just add books directly

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${highContrast ? 'bg-black' : 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600'}`}>
      <header className={`relative shadow-lg overflow-hidden ${
        highContrast 
          ? "bg-black text-white border-b-4 border-white" 
          : "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
      }`}>
        <div className="container mx-auto px-4 py-4">
          {/* Accessibility Controls */}
          <div className="flex justify-end gap-2 mb-2">
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors border-2 ${
                highContrast 
                  ? 'bg-white text-black border-white' 
                  : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
              }`}
              title="Toggle High Contrast Mode"
            >
              {highContrast ? '✓ High Contrast' : 'High Contrast'}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => {
                  const newState = !isMobileMenuOpen
                  setIsMobileMenuOpen(newState)
                  
                  // Scroll to top when opening mobile menu to ensure it's visible
                  if (newState) {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }
                }}
                className={`md:hidden p-2 rounded-lg border-2 transition-colors ${
                  isMobileMenuOpen 
                    ? "bg-orange-500 text-white border-orange-600" 
                    : "bg-white text-black border-black hover:bg-gray-100"
                }`}
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Make "My Bookshelf" clickable to reset filters */}
              <button
                onClick={() => {
                  setIsAuthorsOpen(true)
                  setIsRecommendationsOpen(true)
                  setSearchQuery("")
                  setSelectedAuthors([])
                  setSelectedLanguages(["en"])
                  setSelectedGenres([])
                  setAdvancedFilters(defaultAdvancedFilters)
                }}
                className="bg-white border-4 border-black rounded-full px-4 md:px-6 py-2 hover:bg-orange-50 transition-colors"
                title="Click to clear all filters and show all books"
              >
                <h1 className="text-black font-black text-lg md:text-xl tracking-tight">MY BOOKCASE</h1>
              </button>
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
          {/* Mobile: Show main content first, then sidebar */}
          <main className={`md:col-span-4 space-y-6 ${isMobileMenuOpen ? "order-2" : "order-1 md:order-2"}`}>
            <div className="bg-white rounded-lg shadow-lg border-4 border-black p-6">
              <BookFilters
                authors={authors}
                recommendedAuthors={recommendedAuthors}
                selectedAuthors={selectedAuthors}
                setSelectedAuthors={setSelectedAuthors}
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
                isFiltersOpen={isFiltersOpen}
                setIsFiltersOpen={setIsFiltersOpen}
                bookRatings={bookRatings}
                showHeartedBooks={showHeartedBooks}
                setShowHeartedBooks={setShowHeartedBooks}
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
                      READING PROGRESS {filteredAndLimitedBooks.filter(book => readBooks.has(`${book.title}-${book.author}`)).length} OF {filteredAndLimitedBooks.length}
                    </span>
                  </div>
                </div>
                <div className="bg-orange-100 border border-orange-200 rounded-lg px-2 py-0.5">
                  <span className="text-orange-800 font-medium text-xs">
                    {filteredAndLimitedBooks.length} {filteredAndLimitedBooks.length === 1 ? 'book' : 'books'} shown
                  </span>
                </div>
              </div>

              <div data-tour="books">
                <BookGrid
                  books={filteredAndLimitedBooks}
                sortBy={sortBy}
                readBooks={readBooks}
                wantToReadBooks={wantToReadBooks}
                dontWantBooks={dontWantBooks}
                friends={friends}
                platforms={enabledPlatforms}
                userId={currentUser}
                onBookClick={trackRecentlyViewed}
                highContrast={highContrast}
                recommendedAuthors={recommendedAuthors}
                memoryAids={userState.memoryAids || []}
                onAddAuthor={async (authorName) => {
                  // Add the author to the authors list if not already present
                  const normalizedAuthor = normalizeAuthorName(authorName)
                  const authorExists = authors.some(author => 
                    author.toLowerCase() === normalizedAuthor.toLowerCase()
                  )
                  
                  if (!authorExists) {
                    const updatedAuthors = [...authors, normalizedAuthor].sort((a, b) => {
                      const getLastName = (name: string) => name.trim().split(" ").pop()?.toLowerCase() || ""
                      return getLastName(a).localeCompare(getLastName(b))
                    })
                    
                    setAuthors(updatedAuthors)
                    
                    // Mark as recommended origin
                    setRecommendedAuthors((prev) => new Set([...Array.from(prev), normalizedAuthor]))
                    
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
                          source: "book_card_add_author",
                          timestamp: new Date().toISOString(),
                        },
                      }).catch(error => 
                        console.error("Error tracking author addition:", error)
                      )
                    }
                    
                    // Fetch all books by this author
                    try {
                      const { fetchAuthorBooksWithCache } = await import("@/lib/apiCache")
                      const authorBooks = await fetchAuthorBooksWithCache(normalizedAuthor)
                      if (authorBooks && authorBooks.length > 0) {
                        // Add all books by this author
                        onBooksFound(authorBooks)
                      }
                    } catch (error) {
                      console.error("Error fetching author books:", error)
                    }
                  }
                }}
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
                onUnmarkAsRead={(bookId, title, author) => {
                  setReadBooks((prev) => {
                    const newSet = new Set(prev)
                    newSet.delete(bookId)
                    return newSet
                  })

                  if (isLoggedIn) {
                    const book = books.find((b) => `${b.title}-${b.author}` === bookId)
                    trackEvent(currentUser, {
                      event_type: ANALYTICS_EVENTS.BOOK_MARKED_UNREAD,
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
                onSetBookRating={(bookId, rating) => {
                  setBookRatings((prev) => {
                    const newMap = new Map(prev)
                    if (rating) {
                      newMap.set(bookId, rating)
                    } else {
                      newMap.delete(bookId)
                    }
                    return newMap
                  })
                  
                  if (isLoggedIn && currentUser) {
                    const book = books.find((b) => `${b.title}-${b.author}` === bookId)
                    trackEvent(currentUser, {
                      event_type: ANALYTICS_EVENTS.BOOK_MARKED_READ,
                      book_id: bookId,
                      book_title: book?.title || "",
                      book_author: book?.author || "",
                      event_data: {
                        rating: rating,
                        timestamp: new Date().toISOString(),
                      },
                    }).catch(err => console.error("Error tracking rating:", err))
                  }
                }}
                bookRatings={bookRatings}
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
                sharedBooks={new Set()}
                />
              </div>
            </div>
          </main>

          <aside className={`md:col-span-1 space-y-6 ${isMobileMenuOpen ? "block order-1" : "hidden md:block order-2 md:order-1"}`}>
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
                data-tour="authors"
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
                      onAuthorsChange={(newAuthors) => {
                        setAuthors(newAuthors)
                        // Also save to localStorage
                        if (currentUser) {
                          localStorage.setItem(`authors_${currentUser}`, JSON.stringify(newAuthors))
                        }
                      }}
                    />
                  </ComponentErrorBoundary>
                </APIErrorBoundary>
              )}
            </div>

            {userState.suggestNewAuthors && (
              <div className="bg-white rounded-lg shadow-lg border-4 border-black p-4">
                <button
                  data-tour="recommendations"
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
                  <Card className="bg-white border-orange-200">
                    <CardContent className="p-4">
                      <APIErrorBoundary>
                        <ComponentErrorBoundary componentName="Book Recommendations">
                          <BookRecommendations
                      authors={authors.map(name => ({ id: name, name }))}
                  books={books}
                  readBooks={readBooks}
                  wantToReadBooks={wantToReadBooks}
                  bookRatings={bookRatings}
                  user={userState}
                  onBookClick={async (book) => {
                    // Add the single book and include the author with just this one book
                    const bookAuthor = book.author || book.authors?.[0]
                    if (bookAuthor) {
                      const normalizedAuthor = normalizeAuthorName(bookAuthor)
                      const authorExists = authors.some(author => 
                        author.toLowerCase() === normalizedAuthor.toLowerCase()
                      )
                      
                      if (!authorExists) {
                        const updatedAuthors = [...authors, normalizedAuthor].sort((a, b) => {
                          const getLastName = (name: string) => name.trim().split(" ").pop()?.toLowerCase() || ""
                          return getLastName(a).localeCompare(getLastName(b))
                        })
                        
                        setAuthors(updatedAuthors)
                        
                        // Mark as recommended origin
                        setRecommendedAuthors((prev) => new Set([...Array.from(prev), normalizedAuthor]))
                        
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
                              source: "recommendation_book_click",
                              timestamp: new Date().toISOString(),
                            },
                          }).catch(error => 
                            console.error("Error tracking author addition:", error)
                          )
                        }
                      }
                    }
                    
                    // Add just the single book
                    onBooksFound([book])

                    setTimeout(() => {
                      const bookElement = document.querySelector(`[data-book-id="${book.id}"]`)
                      if (bookElement) {
                        bookElement.scrollIntoView({ behavior: "smooth", block: "center" })
                      }
                    }, 100)
                  }}
                  onAuthorClick={async (authorName) => {
                    // Add the author to the authors list if not already present
                    const normalizedAuthor = normalizeAuthorName(authorName)
                    const authorExists = authors.some(author => 
                      author.toLowerCase() === normalizedAuthor.toLowerCase()
                    )
                    
                    if (!authorExists) {
                      const updatedAuthors = [...authors, normalizedAuthor].sort((a, b) => {
                        const getLastName = (name: string) => name.trim().split(" ").pop()?.toLowerCase() || ""
                        return getLastName(a).localeCompare(getLastName(b))
                      })
                      
                      setAuthors(updatedAuthors)
                      
                      // Mark as recommended origin
                      setRecommendedAuthors((prev) => new Set([...Array.from(prev), normalizedAuthor]))
                      
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
                            source: "recommendation_author_click",
                            timestamp: new Date().toISOString(),
                          },
                        }).catch(error => 
                          console.error("Error tracking author addition:", error)
                        )
                      }
                      
                      // Fetch all books by this author
                      try {
                        const { fetchAuthorBooksWithCache } = await import("@/lib/apiCache")
                        const authorBooks = await fetchAuthorBooksWithCache(normalizedAuthor)
                        if (authorBooks && authorBooks.length > 0) {
                          // Add all books by this author
                          onBooksFound(authorBooks)
                        }
                      } catch (error) {
                        console.error("Error fetching author books:", error)
                      }
                    }
                  }}
                />
                        </ComponentErrorBoundary>
                      </APIErrorBoundary>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}


            <div className="bg-white rounded-lg shadow-lg border-4 border-black p-4">
              <button
                data-tour="settings"
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
                        <label className="block text-xs font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          value={userState.name}
                          required
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
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                        <input
                          type="email"
                          value={userState.email}
                          required
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
                        <label className="block text-xs font-medium text-gray-700 mb-1">City and State</label>
                        <input
                          type="text"
                          value={userState.cityState || ""}
                          onChange={(e) => setUserState((prev) => ({ ...prev, cityState: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="e.g., New York, NY"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                        <input
                          type="text"
                          value={userState.country || ""}
                          onChange={(e) => setUserState((prev) => ({ ...prev, country: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="e.g., United States"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={userState.dateOfBirth || ""}
                          onChange={(e) => setUserState((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Memory Aid Preferences</label>
                        <div className="space-y-1 mt-1">
                          <label className="flex items-center text-xs">
                            <input
                              type="checkbox"
                              checked={userState.diagnosedWithMemoryIssues || false}
                              onChange={(e) => setUserState((prev) => ({ ...prev, diagnosedWithMemoryIssues: e.target.checked }))}
                              className="mr-2"
                            />
                            Have you been diagnosed with memory issues?
                          </label>
                          <label className="flex items-center text-xs">
                            <input
                              type="checkbox"
                              checked={(userState.memoryAids || []).includes("Show book covers")}
                              onChange={(e) => {
                                const currentAids = userState.memoryAids || []
                                if (e.target.checked) {
                                  setUserState((prev) => ({ ...prev, memoryAids: [...currentAids, "Show book covers"] }))
                                } else {
                                  setUserState((prev) => ({ ...prev, memoryAids: currentAids.filter((a) => a !== "Show book covers") }))
                                }
                              }}
                              className="mr-2"
                            />
                            Show book covers
                          </label>
                        </div>
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
                    <h3 className="text-red-600 font-bold text-sm uppercase tracking-wide">Reading Age Range</h3>
                    <div className="space-y-1">
                      {[
                        { label: "0-12", value: "Children (0-12)" },
                        { label: "13-17", value: "Young Adult (13-17)" },
                        { label: "18+", value: "Adult (18+)" },
                      ].map(({ label, value }) => (
                        <label key={value} className="flex items-center text-xs">
                          <input
                            type="radio"
                            name="ageRange"
                            checked={userState.ageRange === value}
                            onChange={() => setUserState((prev) => ({ ...prev, ageRange: value }))}
                            className="mr-2"
                          />
                          {label}
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
                        "Memoir/Biography",
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

                  {/* Show last N books setting */}
                  <div className="space-y-3">
                    <h3 className="text-red-600 font-bold text-sm uppercase tracking-wide">Limit Books per Author</h3>
                    <div className="flex flex-wrap gap-3 text-xs">
                      {([3,5,10] as const).map((n) => (
                        <label key={n} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="showLastNBooks"
                            checked={userState.settings?.showLastNBooks === n}
                            onChange={() => setUserState((prev) => ({ ...prev, settings: { ...prev.settings, showLastNBooks: n } }))}
                          />
                          Last {n}
                        </label>
                      ))}
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="showLastNBooks"
                          checked={userState.settings?.showLastNBooks === "all" || userState.settings?.showLastNBooks === undefined}
                          onChange={() => setUserState((prev) => ({ ...prev, settings: { ...prev.settings, showLastNBooks: "all" } }))}
                        />
                        All
                      </label>
                    </div>
                    <p className="text-xs text-gray-600">Show only the most recent publications per author to reduce overwhelm.</p>
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
                            "https://www.worldcat.org"
                          }
                          onChange={(e) => {
                            setPlatforms((prev) =>
                              prev.map((p) => (p.name === "Library" ? { ...p, url: e.target.value } : p)),
                            )
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="https://www.worldcat.org"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          For OverDrive/Libby libraries: Enter the OverDrive base URL (e.g., https://mcplmd.overdrive.com). 
                          If you have a Libby URL like https://libbyapp.com/library/mcplmd, we'll automatically convert it to the OverDrive format.
                          For other libraries: Enter your library's catalog URL.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Data Export Section */}
                  <div className="space-y-3">
                    <h3 className="text-red-600 font-bold text-sm uppercase tracking-wide">Data Export</h3>
                    <div className="p-3 bg-orange-50 rounded border border-orange-200">
                      <DataExport 
                books={books}
                        authors={authors}
                        readBooks={readBooks}
                        wantToReadBooks={wantToReadBooks}
                        dontWantBooks={dontWantBooks}
                        userProfile={userState}
              />
                    </div>
            </div>

                  {/* Help & Support Section */}
                  <div className="space-y-3">
                    <h3 className="text-red-600 font-bold text-sm uppercase tracking-wide">Help & Support</h3>
                    <div className="p-3 bg-blue-50 rounded border border-blue-200">
                      <button
                        onClick={() => setIsTooltipTourActive(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors font-medium"
                      >
                        <HelpCircle className="w-4 h-4" />
                        Show App Tour
                      </button>
                      <p className="text-xs text-blue-600 mt-2 text-center">
                        Take a guided tour to learn how to use all features
                      </p>
                  </div>
                </div>
                </div>
              )}
              </div>

            {/* Recently Viewed Section for Memory Support */}
            {recentlyViewed.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg border-4 border-black p-4">
                <button
                  onClick={() => setIsRecentlyViewedOpen(!isRecentlyViewedOpen)}
                  className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide mb-3 hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>🕒</span>
                    RECENTLY VIEWED
            </div>
                  {isRecentlyViewedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isRecentlyViewedOpen && (
                  <div className="space-y-2">
                  {recentlyViewed.slice(0, 3).map((bookId) => {
                    const book = books.find(b => b.id === bookId)
                    if (!book) return null
                    return (
                      <div
                        key={bookId}
                        className="p-2 bg-orange-50 rounded border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors group"
                        onClick={() => scrollToBook(bookId)}
                        title="Click to scroll to book"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-800 truncate">
                              {book.title}
                </div>
                            <div className="text-xs text-gray-600 truncate">
                              by {getBookAuthor(book)}
                </div>
              </div>
                          <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
            </div>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                )}
              </div>
            )}
          </aside>
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

      {/* Contextual Tooltip Tour */}
      <TooltipManager
        isActive={isTooltipTourActive}
        onComplete={() => {
          setIsTooltipTourActive(false)
          // Mark tour as seen for this user
          if (currentUser) {
            localStorage.setItem(`bookshelf_tour_seen_${currentUser}`, "true")
          }
        }}
      />
    </div>
  )
}
