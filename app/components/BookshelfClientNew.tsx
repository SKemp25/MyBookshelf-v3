"use client"

/**
 * New BookshelfClient with Apple Books-Inspired Layout
 * 
 * This version uses:
 * - Top header with dropdown menus (View, Sort, Filter, Settings)
 * - Optional collapsible sidebar for quick filters
 * - Fixed footer with icon tools
 * - Book grid immediately visible
 * - All existing functionality preserved
 */

import { useState, useEffect } from "react"
import AccountManager from "./AccountManager"
import AuthorManager from "./AuthorManager"
import BookGrid from "./BookGrid"
import BookFilters from "./BookFilters"
import { defaultAdvancedFilters } from "@/lib/types"
import BookRecommendations from "./BookRecommendations"
import TooltipManager from "./TooltipManager"
import { 
  Search, 
  Grid3x3, 
  List, 
  ArrowUpDown,
  Filter,
  Settings,
  ChevronDown,
  BookOpen,
  User,
  Download,
  LogOut,
  X,
  Menu,
  Heart,
  BookmarkPlus,
  BookCheck,
  BookX,
  Users,
  FileText,
  HelpCircle
} from "lucide-react"
import type { Book, User as UserType, Platform, AdvancedFilterState } from "@/lib/types"
import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics"
import { normalizeAuthorName } from "./AuthorManager"
import { saveUserAuthors } from "@/lib/database"
import { deduplicateBooks } from "@/lib/utils"
import DataExport from "./DataExport"
import { APIErrorBoundary, ComponentErrorBoundary } from "./ErrorBoundary"
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
import { Badge } from "@/components/ui/badge"
import { useIsMobile } from "@/hooks/use-mobile"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import AdvancedFilters from "./AdvancedFilters"

interface BookshelfClientProps {
  user: any
  userProfile: any
}

// Helper function to get author name from book
const getBookAuthor = (book: Book): string => {
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

// Color themes (imported from original)
export type ColorTheme = 'orange' | 'blue' | 'green' | 'purple' | 'teal' | 'neutral'

export const colorThemes = {
  orange: {
    name: 'Penguin Orange',
    description: 'Classic Penguin Books inspired',
    bgGradient: 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600',
    headerGradient: 'bg-gradient-to-r from-orange-500 to-orange-600',
    accent: 'orange',
    accentLight: 'orange-50',
    accentMedium: 'orange-200',
    accentDark: 'orange-600',
    textAccent: 'text-orange-700',
    borderAccent: 'border-orange-200',
    footerColor: '#ea580c',
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

// Platform categories (simplified - will import full version)
const platformCategories = {
  Print: [
    { name: "Amazon Books", defaultUrl: "https://www.amazon.com/s?k={title}+{author}", placeholder: "https://www.amazon.com/s?k={title}+{author}" },
  ],
  Library: [
    { name: "Library", defaultUrl: "", placeholder: "https://yourlibrary.overdrive.com" },
  ],
}

export default function BookshelfClientNew({ user, userProfile }: BookshelfClientProps) {
  // All state management (same as original)
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
  const [highContrast, setHighContrast] = useState(false)
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
  
  // New layout state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showAuthorsDialog, setShowAuthorsDialog] = useState(false)
  const [showFiltersDialog, setShowFiltersDialog] = useState(false)
  
  const isMobile = useIsMobile()
  const showSidebar = !isMobile && sidebarOpen

  // TODO: Import all the useEffect hooks and data loading logic from original BookshelfClient
  // This is a placeholder - will need to copy all the data loading, filtering, etc.

  const currentTheme = colorThemes[colorTheme] || colorThemes.orange
  
  // Placeholder for filtered books - will implement full filtering logic
  const filteredAndLimitedBooks = books || []

  return (
    <div className={`min-h-screen flex flex-col ${highContrast ? 'bg-black' : currentTheme.bgGradient}`}>
      {/* Header - Sticky Top */}
      <header className={`sticky top-0 z-50 ${highContrast ? 'bg-black text-white border-b-4 border-white' : `${currentTheme.headerGradient} text-white`} shadow-sm`}>
        <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-2 md:gap-4">
          {/* Left: Sidebar Toggle & App Title */}
          <div className="flex items-center gap-2">
            {!isMobile && (
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

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-xl md:max-w-2xl mx-2 md:mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full text-sm md:text-base bg-white"
              />
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* View Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/20">
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

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/20">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden md:inline">Sort</span>
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

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/20">
                  <Filter className="w-4 h-4" />
                  <span className="hidden md:inline">Filter</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Filters</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowFiltersDialog(true)}>
                  <span className="w-full">Advanced Filters...</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/20">
                  <Settings className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
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

            {/* Account Manager */}
            <div className="scale-75 md:scale-100 origin-right">
              <AccountManager user={user} isLoggedIn={isLoggedIn} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Optional Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Optional Sidebar - Hidden on mobile, collapsible on desktop */}
        {showSidebar && (
          <aside className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
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

              {/* Status Filter */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Status</h4>
                <div className="space-y-1">
                  {["Read", "Want to Read", "Pass", "Unread"].map((status) => (
                    <label key={status} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        className="rounded"
                      />
                      <span>{status}</span>
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
        )}

        {/* Main Content - Book Grid */}
        <main className="flex-1 px-4 md:px-6 py-6 overflow-y-auto">
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

          {/* Book Grid */}
          {filteredAndLimitedBooks.length > 0 ? (
            <BookGrid
              books={filteredAndLimitedBooks}
              sortBy={sortBy}
              readBooks={readBooks}
              wantToReadBooks={wantToReadBooks}
              dontWantBooks={dontWantBooks}
              friends={friends}
              platforms={[]} // TODO: Load platforms
              userId={currentUser}
              onBookClick={(bookId) => {
                setRecentlyViewed([...recentlyViewed.filter(id => id !== bookId), bookId].slice(0, 10))
              }}
              highContrast={highContrast}
              recommendedAuthors={new Set()}
              memoryAids={[]}
              onMarkAsRead={(bookId, title, author) => {
                setReadBooks(new Set([...readBooks, bookId]))
              }}
              onMarkAsWant={(bookId, title, author) => {
                setWantToReadBooks(new Set([...wantToReadBooks, bookId]))
              }}
              onToggleDontWant={(bookId, title, author) => {
                const newSet = new Set(dontWantBooks)
                if (newSet.has(bookId)) {
                  newSet.delete(bookId)
                } else {
                  newSet.add(bookId)
                }
                setDontWantBooks(newSet)
              }}
            />
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 opacity-20">
                <BookOpen className="w-full h-full text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-orange-800 mb-2">Start Your Personal Library</h3>
              <p className="text-orange-600">Add your favorite authors to discover and organize your books.</p>
            </div>
          )}
        </main>
      </div>

      {/* Fixed Footer with Icon/Tools */}
      <footer 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
        style={{ backgroundColor: currentTheme.footerColor }}
      >
        <div className="flex items-center justify-around px-4 py-2 md:px-8 md:py-3">
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 text-white hover:bg-white/20">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
            <span className="text-xs text-white">Library</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center gap-1 h-auto py-2 text-white hover:bg-white/20"
            onClick={() => setShowAuthorsDialog(true)}
          >
            <Users className="w-5 h-5 md:w-6 md:h-6 text-white" />
            <span className="text-xs text-white">Authors</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 text-white hover:bg-white/20">
            <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
            <span className="text-xs text-white">Favorites</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 text-white hover:bg-white/20">
            <BookmarkPlus className="w-5 h-5 md:w-6 md:h-6 text-white" />
            <span className="text-xs text-white">Want to Read</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 text-white hover:bg-white/20">
            <BookCheck className="w-5 h-5 md:w-6 md:h-6 text-white" />
            <span className="text-xs text-white">Finished</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2 text-white hover:bg-white/20">
            <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
            <span className="text-xs text-white">Export</span>
          </Button>
        </div>
      </footer>
      
      {/* Spacer to prevent content from being hidden behind fixed footer */}
      <div className="h-16 md:h-20"></div>

      {/* Dialogs for Settings, Authors, Filters */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Preferences</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p className="text-sm text-gray-600">Settings will be integrated here</p>
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
              onBooksFound={(newBooks) => {
                setBooks([...books, ...newBooks])
              }}
              onAuthorsChange={(newAuthors) => {
                setAuthors(newAuthors)
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
              authors={authors}
              showHeartedBooks={showHeartedBooks}
              setShowHeartedBooks={setShowHeartedBooks}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


