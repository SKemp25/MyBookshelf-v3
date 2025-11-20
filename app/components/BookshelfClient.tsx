"use client"

import { useState, useEffect } from "react"
import AccountManager from "./AccountManager"
import AuthorManager from "./AuthorManager"
import BookGrid from "./BookGrid"
import BookFilters from "./BookFilters"
import AdvancedFilters from "./AdvancedFilters"
import { defaultAdvancedFilters } from "@/lib/types"
import BookRecommendations from "./BookRecommendations"
import TooltipManager from "./TooltipManager"
import { ChevronDown, ChevronUp, Users, BookOpen, Settings, HelpCircle, Search, Grid3x3, List, Image as ImageIcon, ArrowUpDown, Filter, User, Download, LogOut, LogIn, X, Menu, Heart, BookmarkPlus, BookCheck, BookX, FileText } from "lucide-react"
import type { Book, User as UserType, Platform, AdvancedFilterState } from "@/lib/types"
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics"
import { normalizeAuthorName } from "./AuthorManager"
import { saveUserAuthors } from "@/lib/database"
import { deduplicateBooks } from "@/lib/utils"
import DataExport from "./DataExport"
import { APIErrorBoundary, ComponentErrorBoundary } from "./ErrorBoundary"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { signOut } from "@/lib/actions"

interface BookshelfClientProps {
  user: any // Updated comment to reflect localStorage-based auth system
  userProfile: any // Updated comment to reflect localStorage-based user profile
}

// Helper function to get author name from book (handles both old and new formats)
const getBookAuthor = (book: any): string => {
  return book.author || book.authors?.[0] || "Unknown"
}

// Define color themes inspired by artistic palettes
export type ColorTheme = 'orange' | 'blue' | 'green' | 'purple' | 'teal' | 'neutral'

export const colorThemes = {
  orange: {
    name: 'Penguin Orange',
    description: 'Classic Penguin Books inspired',
    bgGradient: 'bg-gradient-to-br from-orange-100 via-orange-50 to-orange-100',
    headerGradient: 'bg-gradient-to-r from-orange-200 to-orange-300',
    accent: 'orange',
    accentLight: 'orange-50',
    accentMedium: 'orange-200',
    accentDark: 'orange-600',
    textAccent: 'text-orange-700',
    borderAccent: 'border-orange-200',
    footerColor: '#fb923c',
  },
  blue: {
    name: 'Literary Blue',
    description: 'Calming blue tones',
    bgGradient: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600',
    headerGradient: 'bg-gradient-to-r from-blue-500 to-blue-600',
    accent: 'blue',
    accentLight: 'blue-50',
    accentMedium: 'blue-200',
    accentDark: 'blue-600',
    textAccent: 'text-blue-700',
    borderAccent: 'border-blue-200',
    footerColor: '#2563eb',
  },
  green: {
    name: 'British Racing Green',
    description: 'Classic dark green palette',
    bgGradient: 'bg-gradient-to-br from-green-800 via-green-900 to-green-950',
    headerGradient: 'bg-gradient-to-r from-green-900 to-green-950',
    accent: 'green',
    accentLight: 'green-50',
    accentMedium: 'green-200',
    accentDark: 'green-900',
    textAccent: 'text-green-900',
    borderAccent: 'border-green-200',
    footerColor: '#14532d',
  },
  purple: {
    name: 'Creative Purple',
    description: 'Artistic purple tones',
    bgGradient: 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600',
    headerGradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
    accent: 'purple',
    accentLight: 'purple-50',
    accentMedium: 'purple-200',
    accentDark: 'purple-600',
    textAccent: 'text-purple-700',
    borderAccent: 'border-purple-200',
    footerColor: '#9333ea',
  },
  teal: {
    name: 'Modern Teal',
    description: 'Contemporary teal palette',
    bgGradient: 'bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600',
    headerGradient: 'bg-gradient-to-r from-teal-500 to-teal-600',
    accent: 'teal',
    accentLight: 'teal-50',
    accentMedium: 'teal-200',
    accentDark: 'teal-600',
    textAccent: 'text-teal-700',
    borderAccent: 'border-teal-200',
    footerColor: '#0d9488',
  },
  neutral: {
    name: 'Neutral',
    description: 'Subtle gray tones',
    bgGradient: 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500',
    headerGradient: 'bg-gradient-to-r from-gray-500 to-gray-600',
    accent: 'gray',
    accentLight: 'gray-50',
    accentMedium: 'gray-200',
    accentDark: 'gray-600',
    textAccent: 'text-gray-700',
    borderAccent: 'border-gray-200',
    footerColor: '#4b5563',
  },
}

// Define platform options by category (outside component to prevent recreation on every render)
const platformCategories = {
  Print: [
    { name: "Amazon Books", defaultUrl: "https://www.amazon.com/s?k={title}&i=stripbooks", placeholder: "https://www.amazon.com/s?k={title}&i=stripbooks" },
    { name: "Barnes & Noble", defaultUrl: "https://www.barnesandnoble.com/s/{title}", placeholder: "https://www.barnesandnoble.com/s/{title}" },
    { name: "Bookshop.org", defaultUrl: "https://bookshop.org/books?keywords={title}", placeholder: "https://bookshop.org/books?keywords={title}" },
    { name: "IndieBound", defaultUrl: "https://www.indiebound.org/search/book?keys={title}", placeholder: "https://www.indiebound.org/search/book?keys={title}" },
  ],
  Audio: [
    { name: "Audible", defaultUrl: "https://www.audible.com/search?keywords={title}", placeholder: "https://www.audible.com/search?keywords={title}" },
    { name: "Libro.fm", defaultUrl: "https://libro.fm/search?q={title}", placeholder: "https://libro.fm/search?q={title}" },
    { name: "Spotify", defaultUrl: "https://open.spotify.com/search/{title}", placeholder: "https://open.spotify.com/search/{title}" },
    { name: "Apple Books", defaultUrl: "https://books.apple.com/us/search?term={title}", placeholder: "https://books.apple.com/us/search?term={title}" },
  ],
  Ebook: [
    { name: "Kindle", defaultUrl: "https://read.amazon.com/kindle-library", placeholder: "https://read.amazon.com/kindle-library" },
    { name: "Kobo", defaultUrl: "https://www.kobo.com/us/en/search?query={title}", placeholder: "https://www.kobo.com/us/en/search?query={title}" },
    { name: "Apple Books", defaultUrl: "https://books.apple.com/us/search?term={title}", placeholder: "https://books.apple.com/us/search?term={title}" },
    { name: "Google Play Books", defaultUrl: "https://play.google.com/store/books/search?q={title}", placeholder: "https://play.google.com/store/books/search?q={title}" },
  ],
  Library: [
    { name: "WorldCat", defaultUrl: "https://www.worldcat.org/search?q={title}", placeholder: "https://www.worldcat.org/search?q={title}" },
    { name: "Library", defaultUrl: "", placeholder: "https://yourlibrary.overdrive.com or https://libbyapp.com/library/yourlibrary" },
    { name: "Hoopla", defaultUrl: "https://www.hoopladigital.com/search?q={title}", placeholder: "https://www.hoopladigital.com/search?q={title}" },
    { name: "Local Library", defaultUrl: "", placeholder: "Enter your library's catalog URL" },
  ],
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
  const [footerView, setFooterView] = useState<"library" | "favorites" | "want-to-read" | "finished" | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  // Initialize color theme from localStorage if available
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('bookshelf_color_theme') as ColorTheme | null
      if (savedTheme && colorThemes[savedTheme as ColorTheme]) {
        return savedTheme as ColorTheme
      }
    }
    return 'orange'
  })
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([])

  // Collapsible sections for Preferences
  const [isAccountInfoOpen, setIsAccountInfoOpen] = useState(false)
  const [isReadingPrefsOpen, setIsReadingPrefsOpen] = useState(false)
  const [isDisplaySettingsOpen, setIsDisplaySettingsOpen] = useState(false)
  const [isReadingPlatformsOpen, setIsReadingPlatformsOpen] = useState(false)
  const [isDataSupportOpen, setIsDataSupportOpen] = useState(false)

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
  
  // Initialize platforms state - will be loaded from localStorage in useEffect
  const [platforms, setPlatforms] = useState<Platform[]>([
    { name: "Kindle", url: "https://read.amazon.com/kindle-library", enabled: true, category: "Ebook" },
  ])
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  
  // New Apple Books layout state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showAuthorsDialog, setShowAuthorsDialog] = useState(false)
  const [showFiltersDialog, setShowFiltersDialog] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const isMobileLayout = useIsMobile()
  const showSidebar = sidebarOpen // Show sidebar on all devices when open

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
              // Get existing books by this author to use as reference
              const existingBooksByAuthor = books.filter(book => {
                const bookAuthor = getBookAuthor(book)
                return normalizeAuthorName(bookAuthor).toLowerCase() === normalizeAuthorName(author).toLowerCase()
              })
              
              // Validate books against existing books if we have any
              const validatedBooks = authorBooks.filter((item: any) => {
                const apiAuthor = item.volumeInfo?.authors?.[0] || item.author || ""
                if (!apiAuthor) return false
                
                const bookAuthor = normalizeAuthorName(apiAuthor).toLowerCase()
                const searchedAuthor = normalizeAuthorName(author).toLowerCase()
                
                // Require exact name match (after normalization)
                if (bookAuthor !== searchedAuthor) {
                  return false
                }
                
                // If we have existing books by this author, use them as reference
                if (existingBooksByAuthor.length > 0) {
                  // Check if this book's metadata is consistent with existing books
                  // Look at categories/genres - if existing books are fiction, exclude non-fiction
                  const existingGenres = new Set(
                    existingBooksByAuthor
                      .flatMap(b => b.categories || [])
                      .map(g => g.toLowerCase())
                  )
                  
                  const bookCategories = (item.volumeInfo?.categories || []).map((c: string) => c.toLowerCase())
                  const bookDescription = (item.volumeInfo?.description || "").toLowerCase()
                  
                  // If existing books are clearly fiction, exclude books that are clearly non-fiction
                  const hasFictionGenre = Array.from(existingGenres).some(g => 
                    g.includes("fiction") || g.includes("novel") || g.includes("literature")
                  )
                  
                  if (hasFictionGenre) {
                    const nonFictionIndicators = [
                      "biography", "autobiography", "history", "historical", 
                      "non-fiction", "nonfiction", "reference", "academic"
                    ]
                    const isNonFiction = nonFictionIndicators.some(indicator =>
                      bookCategories.some(c => c.includes(indicator)) ||
                      bookDescription.includes(indicator)
                    )
                    if (isNonFiction) {
                      return false
                    }
                  }
                  
                  // If existing books are clearly non-fiction, exclude books that are clearly fiction
                  const hasNonFictionGenre = Array.from(existingGenres).some(g =>
                    g.includes("biography") || g.includes("history") || g.includes("non-fiction")
                  )
                  
                  if (hasNonFictionGenre) {
                    const fictionIndicators = ["fiction", "novel", "literature", "romance", "mystery", "thriller"]
                    const isFiction = fictionIndicators.some(indicator =>
                      bookCategories.some(c => c.includes(indicator)) ||
                      bookDescription.includes(indicator)
                    )
                    if (isFiction && !bookCategories.some(c => c.includes("biography") || c.includes("history"))) {
                      return false
                    }
                  }
                }
                
                return true
              })
              
              allBooks.push(...validatedBooks)
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

  // Load color theme from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('bookshelf_color_theme') as ColorTheme | null
      if (savedTheme && colorThemes[savedTheme as ColorTheme]) {
        setColorTheme(savedTheme as ColorTheme)
      }
    }
  }, [])

  // Save color theme to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bookshelf_color_theme', colorTheme)
    }
  }, [colorTheme])

  // Load platforms from localStorage (only once when user logs in)
  const [platformsLoaded, setPlatformsLoaded] = useState(false)
  useEffect(() => {
    if (isLoggedIn && currentUser && !platformsLoaded) {
      const savedPlatforms = localStorage.getItem(`platforms_${currentUser}`)
      if (savedPlatforms) {
        try {
          const parsed = JSON.parse(savedPlatforms)
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Migrate old "OverDrive/Libby" entries to "Library"
            const migrated = parsed.map((platform: Platform) => {
              if (platform.name === "OverDrive/Libby" || platform.name === "OverDrive" || platform.name === "Libby") {
                return {
                  ...platform,
                  name: "Library",
                  category: "Library" as const,
                }
              }
              return platform
            })
            
            // Remove duplicates - keep only one "Library" entry if multiple exist
            const libraryPlatforms = migrated.filter((p: Platform) => p.name === "Library" && p.category === "Library")
            const otherPlatforms = migrated.filter((p: Platform) => !(p.name === "Library" && p.category === "Library"))
            
            // If multiple library platforms exist, keep the enabled one, or the first one
            const uniqueLibrary = libraryPlatforms.length > 0 
              ? [libraryPlatforms.find((p: Platform) => p.enabled) || libraryPlatforms[0]]
              : []
            
            const deduplicated = [...otherPlatforms, ...uniqueLibrary]
            setPlatforms(deduplicated)
            setPlatformsLoaded(true)
          }
        } catch (e) {
          console.error("Error parsing saved platforms:", e)
          setPlatformsLoaded(true)
        }
      } else {
        setPlatformsLoaded(true)
      }
    }
  }, [isLoggedIn, currentUser, platformsLoaded])

  // Save platforms to localStorage (with debounce to prevent excessive saves)
  useEffect(() => {
    if (isLoggedIn && currentUser && platforms.length > 0) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`platforms_${currentUser}`, JSON.stringify(platforms))
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [platforms, isLoggedIn, currentUser])

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
    // Create bookId once at the start of the filter function
    const bookId = `${book.title}-${getBookAuthor(book)}`
    
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
          const nonFictionIndicators = [
            "non-fiction", "nonfiction", "non fiction",
            "biography", "autobiography", "biographical", "memoir",
            "history", "historical", 
            "reference", "academic", "scholarly",
            "essay", "essays", "essay series",
            "exploration", "thought-provoking", "era-defining",
            "radio", "podcast", "series"
          ]
          const combinedText = `${bookGenres.join(" ")} ${bookGenre} ${bookDescription}`.toLowerCase()
          if (nonFictionIndicators.some(indicator => combinedText.includes(indicator))) {
            return false
          }
          // Fiction should match if it has fiction-related categories
          const fictionIndicators = ["fiction", "novel", "literary fiction", "literature"]
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


    if (safeAdvancedFilters.seriesOnly) {
      // Only show books that are part of a series
      if (!book.seriesInfo || !book.seriesInfo.name) {
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

    // Filter by hearted books (loved rating) - also check footer view
    if (showHeartedBooks || footerView === "favorites") {
      const rating = bookRatings.get(bookId)
      if (rating !== "loved") {
        return false
      }
    }

    // Filter by footer view
    if (footerView === "want-to-read") {
      if (!wantToReadBooks.has(bookId)) {
        return false
      }
    } else if (footerView === "finished") {
      if (!readBooks.has(bookId)) {
        return false
      }
    } else if (footerView === "library") {
      // Library shows all books (no additional filter)
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
    if ((dontWantBooks || new Set()).has(bookId) && !(safeAdvancedFilters as any).showPassedBooks) {
      return false // Hide passed books unless explicitly shown
    }

    
    return true
  })

    // Apply deduplication to ensure only original published versions are shown
    const deduplicatedBase = deduplicateBooks(base, userState.country || "US")

    const showN = userState.settings?.showLastNBooks
    if (showN && showN !== "all") {
      const grouped: Record<string, Book[]> = {}
      deduplicatedBase.forEach((b) => {
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
    return deduplicatedBase
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
    // Remove duplicate library platforms - keep only one
    .reduce((acc: Platform[], platform: Platform) => {
      // If this is a library platform, check if we already have one
      if (platform.category === "Library" || platform.name === "Library" || platform.name === "OverDrive/Libby") {
        const hasLibrary = acc.some(p => 
          p.category === "Library" || p.name === "Library" || p.name === "OverDrive/Libby"
        )
        if (!hasLibrary) {
          // Normalize library platform name to "Library"
          acc.push({
            ...platform,
            name: "Library",
            category: "Library",
          })
        }
      } else {
        acc.push(platform)
      }
      return acc
    }, [])
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

  const currentTheme = colorThemes[colorTheme] || colorThemes.orange

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${highContrast ? 'bg-black' : currentTheme.bgGradient}`}>
      {/* Header - Sticky Top */}
      <header className={`sticky top-0 z-50 ${highContrast ? 'bg-black text-white border-b-4 border-white' : `${currentTheme.headerGradient} text-white`} shadow-sm`}>
        <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-2 md:gap-4">
          {/* Left: Sidebar Toggle & App Title */}
          <div className="flex items-center gap-2">
            {!isMobileLayout && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-white hover:bg-white/20"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            )}
              <button
                onClick={() => {
                  setSearchQuery("")
                  setSelectedAuthors([])
                  setSelectedGenres([])
                  setAdvancedFilters(defaultAdvancedFilters)
                }}
              className="text-lg md:text-xl font-bold text-white hover:opacity-80 transition-opacity"
              >
              MY BOOKCASE
              </button>
            </div>

          {/* Center: Search Bar - More space on mobile */}
          <div className={`flex-1 ${isMobileLayout ? 'mx-2' : 'max-w-xl md:max-w-2xl mx-2 md:mx-8'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full text-sm md:text-base bg-white text-black placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Right: Mobile Menu (hamburger) or Desktop Action Buttons */}
          {isMobileLayout ? (
            <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2 text-white hover:bg-white/20">
                  <Menu className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Quick Filters */}
                <DropdownMenuItem onClick={() => { setSidebarOpen(!sidebarOpen); setMobileMenuOpen(false); }}>
                  <Filter className="w-4 h-4 mr-2" />
                  Quick Filters
                </DropdownMenuItem>
                
                {/* View Options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      {viewMode === "grid" && <Grid3x3 className="w-4 h-4 mr-2" />}
                      {viewMode === "list" && <List className="w-4 h-4 mr-2" />}
                      {viewMode === "cover" && <ImageIcon className="w-4 h-4 mr-2" />}
                      View
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="left">
                    <DropdownMenuItem onClick={() => { setViewMode("grid"); setMobileMenuOpen(false); }}>
                      <Grid3x3 className="w-4 h-4 mr-2" />
                      Grid View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setViewMode("list"); setMobileMenuOpen(false); }}>
                      <List className="w-4 h-4 mr-2" />
                      List View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setViewMode("cover"); setMobileMenuOpen(false); }}>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Cover Only
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Sort Options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Sort
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="left">
                    <DropdownMenuItem onClick={() => { setSortBy("newest"); setMobileMenuOpen(false); }}>
                      Newest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("oldest"); setMobileMenuOpen(false); }}>
                      Oldest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("title"); setMobileMenuOpen(false); }}>
                      Title A-Z
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("author"); setMobileMenuOpen(false); }}>
                      Author A-Z
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortBy("pages"); setMobileMenuOpen(false); }}>
                      Most Pages
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Advanced Filters - Opens directly */}
                <DropdownMenuItem onClick={() => { setShowFiltersDialog(true); setMobileMenuOpen(false); }}>
                  <Filter className="w-4 h-4 mr-2" />
                  Advanced Filters
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Settings Options */}
                <DropdownMenuItem onClick={() => { setShowAuthorsDialog(true); setMobileMenuOpen(false); }}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Authors & Books
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setShowSettingsDialog(true); setMobileMenuOpen(false); }}>
                  <User className="w-4 h-4 mr-2" />
                  My Preferences
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Login/Logout */}
                {isLoggedIn ? (
                  <form action={signOut}>
                    <DropdownMenuItem asChild>
                      <button type="submit" className="w-full flex items-center cursor-pointer">
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </DropdownMenuItem>
                  </form>
                ) : (
                  <DropdownMenuItem onClick={() => { setShowAuthDialog(true); setMobileMenuOpen(false); }}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
          <div className="flex items-center gap-0.5 md:gap-2 flex-shrink-0">
            {/* View Dropdown - Hide on mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-white hover:bg-white/20 p-2">
                  {viewMode === "grid" && <Grid3x3 className="w-4 h-4" />}
                  {viewMode === "list" && <List className="w-4 h-4" />}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>View</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setViewMode("grid")}>
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  Grid View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode("list")}>
                  <List className="w-4 h-4 mr-2" />
                  List View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown - Hide on mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-white hover:bg-white/20 p-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden lg:inline">Sort</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("title")}>
                  Title A-Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("author")}>
                  Author A-Z
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("pages")}>
                  Most Pages
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filter Button - Opens Advanced Filters directly */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 md:gap-2 text-white hover:bg-white/20 p-1.5 md:p-2"
              onClick={() => setShowFiltersDialog(true)}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden lg:inline">Filter</span>
            </Button>

            {/* Settings Dropdown - Always visible */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 md:gap-2 text-white hover:bg-white/20 p-1.5 md:p-2">
                  <Settings className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3 hidden sm:inline" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowAuthorsDialog(true)}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Authors & Books
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                  <User className="w-4 h-4 mr-2" />
                  My Preferences
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Account Manager - Always visible on desktop */}
            <div className="flex-shrink-0">
                <AccountManager user={user} isLoggedIn={isLoggedIn} />
              </div>
            </div>
          )}
          </div>
      </header>

      {/* Main Content Area with Optional Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Optional Sidebar - Overlay on mobile, side panel on desktop */}
        {showSidebar && (
          <>
            {/* Mobile overlay backdrop */}
            {isMobileLayout && (
              <div 
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            <aside className={`${isMobileLayout ? 'fixed left-0 top-0 bottom-0 z-50 shadow-2xl' : 'relative'} w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto`}>
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">Quick Filters</h3>
              
              {/* Authors Filter */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Authors</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {authors.slice(0, 10).map((author) => (
                    <label key={author} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedAuthors.includes(author)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAuthors([...selectedAuthors, author])
                          } else {
                            setSelectedAuthors(selectedAuthors.filter(a => a !== author))
                          }
                        }}
                        className="rounded"
                      />
                      <span className="truncate">{author}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Genres Filter */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Genres</h4>
                <div className="space-y-1">
                  {["Fiction", "Mystery", "Romance", "Science Fiction", "Fantasy", "Thriller", "Historical Fiction", "Memoir/Biography"].map((genre) => (
                    <label key={genre} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(genre)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGenres([...selectedGenres, genre])
                          } else {
                            setSelectedGenres(selectedGenres.filter(g => g !== genre))
                          }
                        }}
                        className="rounded"
                      />
                      <span>{genre}</span>
                    </label>
                  ))}
            </div>
        </div>

              {/* Clear Filters */}
              {(selectedAuthors.length > 0 || selectedGenres.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAuthors([])
                    setSelectedGenres([])
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </aside>
          </>
        )}

        {/* Main Content - Book Grid */}
        <main className="flex-1 px-4 md:px-6 py-6 overflow-y-auto" style={{ maxHeight: isMobileLayout ? 'calc(100vh - 180px)' : 'calc(100vh - 140px)' }}>
          {/* Reading Progress */}
          <div className="mb-4 flex items-center justify-between">
            <div className="bg-white border-2 border-black rounded-lg px-3 py-1">
                    <span className="text-black font-black text-xs">
                READING PROGRESS {filteredAndLimitedBooks.filter(book => readBooks.has(`${book.title}-${book.author}`)).length} OF {filteredAndLimitedBooks.length}
                    </span>
                  </div>
            <div className="bg-orange-100 border border-orange-200 rounded-lg px-3 py-1">
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
                viewMode={viewMode}
                onSortChange={setSortBy}
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
          </main>
        </div>

      {/* Fixed Footer with Icon/Tools */}
      <footer 
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 shadow-lg"
        style={{ backgroundColor: currentTheme.footerColor }}
      >
        <div className="flex items-center justify-around px-4 py-2 md:px-8 md:py-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center gap-1 h-auto py-2 ${footerView === "library" ? "bg-white/20" : ""}`}
            onClick={() => setFooterView(footerView === "library" ? null : "library")}
          >
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
            <span className="text-xs text-white">Library</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center gap-1 h-auto py-2 ${footerView === null ? "" : ""}`}
            onClick={() => setShowAuthorsDialog(true)}
          >
            <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
            <span className="text-xs text-white">Authors</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center gap-1 h-auto py-2 ${footerView === "favorites" ? "bg-white/20" : ""}`}
            onClick={() => setFooterView(footerView === "favorites" ? null : "favorites")}
          >
            <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
            <span className="text-xs text-white">Favorites</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center gap-1 h-auto py-2 ${footerView === "want-to-read" ? "bg-white/20" : ""}`}
            onClick={() => setFooterView(footerView === "want-to-read" ? null : "want-to-read")}
          >
            <BookmarkPlus className="w-5 h-5 md:w-6 md:h-6 text-white" />
            <span className="text-xs text-white">Want to Read</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center gap-1 h-auto py-2 ${footerView === "finished" ? "bg-white/20" : ""}`}
            onClick={() => setFooterView(footerView === "finished" ? null : "finished")}
          >
            <BookCheck className="w-5 h-5 md:w-6 md:h-6 text-white" />
            <span className="text-xs text-white">Finished</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => setShowExportDialog(true)}
          >
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
            <span className="text-xs text-white">Export</span>
          </Button>
        </div>
      </footer>
      
      {/* Spacer to prevent content from being hidden behind fixed footer */}
      <div className="h-16 md:h-20"></div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <DataExport 
              books={filteredAndLimitedBooks}
              authors={authors}
              readBooks={readBooks}
              wantToReadBooks={wantToReadBooks}
              dontWantBooks={dontWantBooks}
              userProfile={userState}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Old sidebar content - now in dialogs */}
      {false && (
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

            <div className={`bg-white rounded-lg shadow-lg border-4 border-black ${isAuthorsOpen ? 'p-2 md:p-4' : 'p-2 md:p-4 pb-0'}`}>
              <button
                data-tour="authors"
                onClick={() => setIsAuthorsOpen(!isAuthorsOpen)}
                className={`w-full flex items-center text-red-600 font-bold text-[10px] md:text-sm uppercase tracking-wide hover:bg-orange-50 p-2 md:p-4 -m-2 md:-m-4 rounded transition-colors ${isAuthorsOpen ? 'mb-3' : 'mb-0'}`}
              >
                <BookOpen className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 mr-1 md:mr-2" />
                <span className="flex-1 text-left min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">AUTHORS & BOOKS</span>
                {isAuthorsOpen ? <ChevronUp className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 ml-1 md:ml-2" /> : <ChevronDown className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 ml-1 md:ml-2" />}
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
              <div className={`bg-white rounded-lg shadow-lg border-4 border-black ${isRecommendationsOpen ? 'p-2 md:p-4' : 'p-2 md:p-4 pb-0'}`}>
              <button
                data-tour="recommendations"
                onClick={() => setIsRecommendationsOpen(!isRecommendationsOpen)}
                  className={`w-full flex items-center text-red-600 font-bold text-[10px] md:text-sm uppercase tracking-wide hover:bg-orange-50 p-2 md:p-4 -m-2 md:-m-4 rounded transition-colors ${isRecommendationsOpen ? 'mb-3' : 'mb-0'}`}
                >
                  <Users className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 mr-1 md:mr-2" />
                  <span className="flex-1 text-left min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">RECOMMENDATIONS</span>
                  {isRecommendationsOpen ? <ChevronUp className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 ml-1 md:ml-2" /> : <ChevronDown className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 ml-1 md:ml-2" />}
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


            <div className={`bg-white rounded-lg shadow-lg border-4 border-black ${isPreferencesOpen ? 'p-2 md:p-4' : 'p-2 md:p-4 pb-0'}`}>
              <button
                data-tour="settings"
                onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
                className={`w-full flex items-center text-red-600 font-bold text-[10px] md:text-sm uppercase tracking-wide hover:bg-orange-50 p-2 md:p-4 -m-2 md:-m-4 rounded transition-colors ${isPreferencesOpen ? 'mb-3' : 'mb-0'}`}
              >
                <Settings className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 mr-1 md:mr-2" />
                <span className="flex-1 text-left min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">MY PREFERENCES</span>
                {isPreferencesOpen ? <ChevronUp className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 ml-1 md:ml-2" /> : <ChevronDown className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0 ml-1 md:ml-2" />}
              </button>

              {isPreferencesOpen && (
                  <div className="space-y-3">
                  {/* Account Information - Collapsible */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsAccountInfoOpen(!isAccountInfoOpen)}
                      className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
                    >
                      <span>Account Information</span>
                      {isAccountInfoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isAccountInfoOpen && (
                      <div className="space-y-2 pl-2">
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
                    )}
                  </div>

                  {/* Reading Preferences - Collapsible */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsReadingPrefsOpen(!isReadingPrefsOpen)}
                      className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
                    >
                      <span>Reading Preferences</span>
                      {isReadingPrefsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isReadingPrefsOpen && (
                      <div className="space-y-3 pl-2">
                  <div className="space-y-3">
                          <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Languages</h4>
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
                          <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Reading Age Range</h4>
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
                          <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Genres</h4>
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
                          <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Recommendations</h4>
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
                          <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Publication Type</h4>
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

                        {/* Limit Books per Author */}
                  <div className="space-y-3">
                          <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Limit Books per Author</h4>
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
                      </div>
                    )}
                  </div>

                  {/* Reading Platforms - Collapsible */}
                    <div className="space-y-2">
                    <button
                      onClick={() => setIsReadingPlatformsOpen(!isReadingPlatformsOpen)}
                      className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
                    >
                      <span>Reading Platforms</span>
                      {isReadingPlatformsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isReadingPlatformsOpen && (
                      <div className="space-y-4 pl-2">
                        <p className="text-xs text-gray-600 mb-3">Select your preferred platforms for each reading format. You can choose multiple options per category.</p>
                        
                        {Object.entries(platformCategories).map(([category, options]) => (
                      <div key={category} className="space-y-2 border-l-2 border-orange-200 pl-3">
                        <h4 className="text-orange-700 font-semibold text-xs uppercase tracking-wide">{category}</h4>
                        <div className="space-y-2">
                          {options.map((option) => {
                            const platform = platforms.find((p) => p.name === option.name && p.category === category)
                            const isEnabled = platform?.enabled || false
                            const url = platform?.url || option.defaultUrl

                            return (
                              <div key={option.name} className="space-y-1">
                                <label className="flex items-center text-xs">
                          <input
                            type="checkbox"
                                    checked={isEnabled}
                            onChange={(e) => {
                                      if (e.target.checked) {
                                        // Add or enable platform
                                        const existing = platforms.find((p) => p.name === option.name && p.category === category)
                                        if (existing) {
                              setPlatforms((prev) =>
                                            prev.map((p) =>
                                              p.name === option.name && p.category === category
                                                ? { ...p, enabled: true }
                                                : p
                                            )
                                          )
                                        } else {
                                          setPlatforms((prev) => [
                                            ...prev,
                                            {
                                              name: option.name,
                                              url: option.defaultUrl,
                                              enabled: true,
                                              category: category as "Print" | "Audio" | "Ebook" | "Library",
                                            },
                                          ])
                                        }
                                      } else {
                                        // Disable platform
                              setPlatforms((prev) =>
                                          prev.map((p) =>
                                            p.name === option.name && p.category === category
                                              ? { ...p, enabled: false }
                                              : p
                              )
                                        )
                                      }
                            }}
                            className="mr-2"
                          />
                                  {option.name}
                        </label>
                                {isEnabled && (
                        <input
                          type="url"
                                    value={url}
                          onChange={(e) => {
                            setPlatforms((prev) =>
                                        prev.map((p) =>
                                          p.name === option.name && p.category === category
                                            ? { ...p, url: e.target.value }
                                            : p
                                        )
                            )
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    placeholder={option.placeholder || option.defaultUrl}
                        />
                                )}
                      </div>
                            )
                          })}
                      </div>
                      </div>
                    ))}
                    
                        <p className="text-xs text-gray-500 mt-3">
                          <strong>Note:</strong> For OverDrive/Libby libraries, enter the OverDrive base URL (e.g., https://mcplmd.overdrive.com). 
                          If you have a Libby URL like https://libbyapp.com/library/mcplmd, we'll automatically convert it to the OverDrive format.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Display & Settings - Collapsible */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsDisplaySettingsOpen(!isDisplaySettingsOpen)}
                      className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
                    >
                      <span>Display & Settings</span>
                      {isDisplaySettingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isDisplaySettingsOpen && (
                      <div className="space-y-3 pl-2">
                        {/* Display Settings */}
                        <div className="space-y-3">
                          <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Display Settings</h4>
                    
                    {/* Color Theme Selector */}
                    <div className="space-y-2">
                      <Label className="text-sm text-orange-700">Color Theme</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(colorThemes) as [ColorTheme, typeof colorThemes[ColorTheme]][]).map(([key, theme]) => {
                          const isSelected = colorTheme === key
                          const borderClass = isSelected ? (
                            key === 'orange' ? 'border-orange-600 bg-orange-50' :
                            key === 'blue' ? 'border-blue-600 bg-blue-50' :
                            key === 'green' ? 'border-green-600 bg-green-50' :
                            key === 'purple' ? 'border-purple-600 bg-purple-50' :
                            key === 'teal' ? 'border-teal-600 bg-teal-50' :
                            'border-gray-600 bg-gray-50'
                          ) : 'border-gray-200 bg-white hover:border-gray-300'
                          
                          const textClass = isSelected ? (
                            key === 'orange' ? 'text-orange-700' :
                            key === 'blue' ? 'text-blue-700' :
                            key === 'green' ? 'text-green-700' :
                            key === 'purple' ? 'text-purple-700' :
                            key === 'teal' ? 'text-teal-700' :
                            'text-gray-700'
                          ) : 'text-gray-700'
                          
                          return (
                            <button
                              key={key}
                              onClick={() => setColorTheme(key)}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${borderClass}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${
                                  key === 'orange' ? 'from-orange-400 to-orange-600' :
                                  key === 'blue' ? 'from-blue-400 to-blue-600' :
                                  key === 'green' ? 'from-green-800 to-green-950' :
                                  key === 'purple' ? 'from-purple-400 to-purple-600' :
                                  key === 'teal' ? 'from-teal-400 to-teal-600' :
                                  'from-gray-300 to-gray-500'
                                }`} />
                                <span className={`text-xs font-semibold ${textClass}`}>
                                  {theme.name}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">{theme.description}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* High Contrast Toggle */}
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="high-contrast" className="text-sm text-orange-700 cursor-pointer">
                        High Contrast Mode
                      </Label>
                      <Switch
                        id="high-contrast"
                        checked={highContrast}
                        onCheckedChange={setHighContrast}
                        className="data-[state=checked]:bg-orange-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Increases contrast for better visibility
                        </p>
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Data & Support - Collapsible */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsDataSupportOpen(!isDataSupportOpen)}
                      className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
                    >
                      <span>Data & Support</span>
                      {isDataSupportOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isDataSupportOpen && (
                      <div className="space-y-3 pl-2">
                  {/* Data Export Section */}
                  <div className="space-y-3">
                          <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Data Export</h4>
                    <div className="p-3 bg-orange-50 rounded border border-orange-200">
                      <DataExport 
                              books={filteredAndLimitedBooks}
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
                          <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Help & Support</h4>
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
        )}

      {/* Dialogs for Settings, Authors, Filters */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Preferences</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="space-y-6">
              {/* Account Information - Collapsible */}
              <div className="space-y-2">
                <button
                  onClick={() => setIsAccountInfoOpen(!isAccountInfoOpen)}
                  className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
                >
                  <span>Account Information</span>
                  {isAccountInfoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isAccountInfoOpen && (
                  <div className="space-y-2 pl-2">
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
                )}
      </div>

              {/* Reading Preferences - Collapsible */}
              <div className="space-y-2">
                <button
                  onClick={() => setIsReadingPrefsOpen(!isReadingPrefsOpen)}
                  className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
                >
                  <span>Reading Preferences</span>
                  {isReadingPrefsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isReadingPrefsOpen && (
                  <div className="space-y-3 pl-2">
                    <div className="space-y-3">
                      <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Languages</h4>
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
                      <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Reading Age Range</h4>
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
                      <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Genres</h4>
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
                      <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Recommendations</h4>
                      <label className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={userState.suggestNewAuthors || false}
                          onChange={(e) => setUserState((prev) => ({ ...prev, suggestNewAuthors: e.target.checked }))}
                          className="mr-2"
                        />
                        Suggest new authors
                      </label>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Publication Type</h4>
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

                    {/* Limit Books per Author */}
                    <div className="space-y-3">
                      <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Limit Books per Author</h4>
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
                  </div>
                )}
              </div>

              {/* Reading Platforms - Collapsible */}
              <div className="space-y-2">
                <button
                  onClick={() => setIsReadingPlatformsOpen(!isReadingPlatformsOpen)}
                  className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
                >
                  <span>Reading Platforms</span>
                  {isReadingPlatformsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isReadingPlatformsOpen && (
                  <div className="space-y-4 pl-2">
                    {Object.entries(platformCategories).map(([category, categoryPlatforms]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">{category}</h4>
                        {categoryPlatforms.map((platform) => {
                          const platformKey = `${category}_${platform.name}`
                          const isEnabled = platforms.some(p => p.name === platform.name && p.category === category)
                          const platformData = platforms.find(p => p.name === platform.name && p.category === category)
                          
                          return (
                            <div key={platformKey} className="space-y-2 pl-2">
                              <label className="flex items-center text-xs">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      const newPlatform: Platform = {
                                        name: platform.name,
                                        url: platform.defaultUrl || "",
                                        enabled: true,
                                        category: category as "Print" | "Audio" | "Ebook" | "Library",
                                      }
                                      setPlatforms((prev) => [...prev, newPlatform])
                                    } else {
                                      setPlatforms((prev) => prev.filter(p => !(p.name === platform.name && p.category === category)))
                                    }
                                  }}
                                  className="mr-2"
                                />
                                {platform.name}
                              </label>
                              {isEnabled && (
                                <input
                                  type="text"
                                  value={platformData?.url || platform.defaultUrl || ""}
                                  onChange={(e) => {
                                    setPlatforms((prev) => prev.map(p => 
                                      p.name === platform.name && p.category === category
                                        ? { ...p, url: e.target.value }
                                        : p
                                    ))
                                  }}
                                  placeholder={platform.placeholder || `Enter URL for ${platform.name}`}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Display & Settings - Collapsible */}
              <div className="space-y-2">
                <button
                  onClick={() => setIsDisplaySettingsOpen(!isDisplaySettingsOpen)}
                  className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
                >
                  <span>Display & Settings</span>
                  {isDisplaySettingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isDisplaySettingsOpen && (
                  <div className="space-y-3 pl-2">
                    {/* Color Theme Selection */}
                    <div className="space-y-3">
                      <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Color Theme</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(colorThemes).map(([key, theme]) => {
                          const isSelected = colorTheme === key
                          const borderClass = isSelected ? (
                            key === 'orange' ? 'border-orange-600 bg-orange-50' :
                            key === 'blue' ? 'border-blue-600 bg-blue-50' :
                            key === 'green' ? 'border-green-600 bg-green-50' :
                            key === 'purple' ? 'border-purple-600 bg-purple-50' :
                            key === 'teal' ? 'border-teal-600 bg-teal-50' :
                            'border-gray-600 bg-gray-50'
                          ) : 'border-gray-200 bg-white hover:border-gray-300'
                          
                          const textClass = isSelected ? (
                            key === 'orange' ? 'text-orange-700' :
                            key === 'blue' ? 'text-blue-700' :
                            key === 'green' ? 'text-green-700' :
                            key === 'purple' ? 'text-purple-700' :
                            key === 'teal' ? 'text-teal-700' :
                            'text-gray-700'
                          ) : 'text-gray-700'
                          
                          return (
                            <button
                              key={key}
                              onClick={() => setColorTheme(key)}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${borderClass}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${
                                  key === 'orange' ? 'from-orange-400 to-orange-600' :
                                  key === 'blue' ? 'from-blue-400 to-blue-600' :
                                  key === 'green' ? 'from-green-800 to-green-950' :
                                  key === 'purple' ? 'from-purple-400 to-purple-600' :
                                  key === 'teal' ? 'from-teal-400 to-teal-600' :
                                  'from-gray-300 to-gray-500'
                                }`} />
                                <span className={`text-xs font-semibold ${textClass}`}>
                                  {theme.name}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">{theme.description}</p>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* High Contrast Toggle */}
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="high-contrast" className="text-sm text-orange-700 cursor-pointer">
                        High Contrast Mode
                      </Label>
                      <Switch
                        id="high-contrast"
                        checked={highContrast}
                        onCheckedChange={setHighContrast}
                        className="data-[state=checked]:bg-orange-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Increases contrast for better visibility
                    </p>
                  </div>
                )}
              </div>

              {/* Data & Support - Collapsible */}
              <div className="space-y-2">
                <button
                  onClick={() => setIsDataSupportOpen(!isDataSupportOpen)}
                  className="w-full flex items-center justify-between text-red-600 font-bold text-sm uppercase tracking-wide hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
                >
                  <span>Data & Support</span>
                  {isDataSupportOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isDataSupportOpen && (
                  <div className="space-y-3 pl-2">
                    {/* Data Export Section */}
                    <div className="space-y-3">
                      <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Data Export</h4>
                      <div className="p-3 bg-orange-50 rounded border border-orange-200">
                        <DataExport 
                          books={filteredAndLimitedBooks}
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
                      <h4 className="text-red-600 font-bold text-xs uppercase tracking-wide">Help & Support</h4>
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <button
                          onClick={() => {
                            setIsTooltipTourActive(true)
                            setShowSettingsDialog(false)
                          }}
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAuthorsDialog} onOpenChange={setShowAuthorsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Authors & Books</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <AuthorManager
              authors={authors}
              setAuthors={setAuthors}
              userId={currentUser || "guest"}
              onBooksFound={onBooksFound}
              onAuthorsChange={(newAuthors) => {
                setAuthors(newAuthors)
                if (currentUser) {
                  localStorage.setItem(`authors_${currentUser}`, JSON.stringify(newAuthors))
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showFiltersDialog} onOpenChange={setShowFiltersDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Filters</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <AdvancedFilters
              filters={advancedFilters}
              onFiltersChange={setAdvancedFilters}
              books={books}
              authors={authors.map(name => ({ id: name, name }))}
              showHeartedBooks={showHeartedBooks}
              setShowHeartedBooks={setShowHeartedBooks}
            />
          </div>
        </DialogContent>
      </Dialog>

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
