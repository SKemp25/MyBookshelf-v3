"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Filter, X, Search, ChevronDown, ChevronUp, Heart } from "lucide-react"
import type { Book } from "../lib/types"
import AdvancedFilters, { defaultAdvancedFilters } from "./AdvancedFilters"
import type { AdvancedFilterState } from "../lib/types"

// Helper function to get author name from book (handles both old and new formats)
const getBookAuthor = (book: any): string => {
  return book.author || book.authors?.[0] || "Unknown"
}

interface BookFiltersProps {
  authors: string[]
  books: Book[]
  selectedAuthors: string[]
  sortBy: string
  selectedLanguages: string[]
  selectedGenres: string[]
  searchQuery: string
  userPreferences: any
  advancedFilters: AdvancedFilterState
  onFiltersChange: (filters: AdvancedFilterState) => void
  setSelectedAuthors: (authors: string[]) => void
  setSortBy: (sort: string) => void
  setSelectedLanguages: (languages: string[]) => void
  setSelectedGenres: (genres: string[]) => void
  setSearchQuery: (query: string) => void
  recommendedAuthors?: Set<string>
  isFiltersOpen: boolean
  setIsFiltersOpen: (open: boolean) => void
  bookRatings?: Map<string, "loved" | "liked" | "didnt-like">
  showHeartedBooks: boolean
  setShowHeartedBooks: (show: boolean) => void
}

export default function BookFilters({
  authors,
  books,
  selectedAuthors,
  sortBy,
  selectedLanguages,
  selectedGenres,
  searchQuery,
  userPreferences,
  advancedFilters,
  onFiltersChange,
  setSelectedAuthors,
  setSortBy,
  setSelectedLanguages,
  setSelectedGenres,
  setSearchQuery,
  recommendedAuthors,
  isFiltersOpen,
  setIsFiltersOpen,
  bookRatings,
  showHeartedBooks,
  setShowHeartedBooks,
}: BookFiltersProps) {
  const safeAuthors = Array.isArray(authors) ? authors : []
  const safeBooks = Array.isArray(books) ? books : []
  const safeAdvancedFilters = advancedFilters || defaultAdvancedFilters

  const bookCountByAuthor = safeAuthors.reduce(
    (acc, authorName) => {
      acc[authorName] = safeBooks.filter((book) => book && getBookAuthor(book) === authorName).length
      return acc
    },
    {} as Record<string, number>,
  )

  const clearAllFilters = () => {
    setSelectedAuthors([])
    setSearchQuery("")
  }

  return (
    <div className="text-sm font-medium text-red-700">
      <button
        data-tour="filters"
        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        className="w-full flex items-center justify-between mb-4 hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
      >
        <div className="flex items-center gap-3">
          <Filter className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-orange-700">Filters &amp; Sorting</h3>
        </div>
        {isFiltersOpen ? <ChevronUp className="w-5 h-5 text-orange-600" /> : <ChevronDown className="w-5 h-5 text-orange-600" />}
      </button>

      {isFiltersOpen && (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-orange-700">Search Books</h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-orange-200 focus:border-orange-400 focus:ring-orange-200 h-9"
              />
            </div>
            {searchQuery && (
              <p className="text-xs text-orange-600">
                Searching for: "{searchQuery}"
              </p>
            )}
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-orange-700">Sort By</h4>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="border-orange-200 focus:border-orange-400 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="author">Author (Last Name)</SelectItem>
                <SelectItem value="pages">Page Count</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Author Filter */}
          {safeAuthors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-orange-700">Filter by Author</h4>
                {(selectedAuthors.length > 0 || searchQuery) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearAllFilters}
                    className="text-orange-600 hover:text-orange-800 h-auto p-1 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(safeAuthors)).map((authorName, index) => {
                  const isSelected = selectedAuthors.includes(authorName)
                  const bookCount = bookCountByAuthor[authorName] || 0
                  const isRecommended = recommendedAuthors?.has(authorName)
                  return (
                    <Badge
                      key={`${authorName}-${index}`}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors text-xs ${
                        isSelected
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : "border-orange-300 text-orange-700 hover:bg-orange-50"
                      }`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedAuthors(selectedAuthors.filter(a => a !== authorName))
                        } else {
                          setSelectedAuthors([...selectedAuthors, authorName])
                        }
                      }}
                    >
                      {authorName} ({bookCount})
                      {isRecommended && (
                        <span className="ml-1 inline-flex items-center justify-center w-3 h-3 text-[10px] font-bold bg-blue-600 text-white rounded-full">R</span>
                      )}
                    </Badge>
                  )
                })}
              </div>
              {selectedAuthors.length > 0 && (
                <p className="text-xs text-orange-600">
                  Showing books by {selectedAuthors.length === 1 ? selectedAuthors[0] : `${selectedAuthors.length} authors`}
                </p>
              )}
            </div>
          )}

          {/* Advanced Filters */}
          <AdvancedFilters
            filters={safeAdvancedFilters}
            onFiltersChange={onFiltersChange}
            books={safeBooks}
            authors={safeAuthors.map(name => ({ id: name, name }))}
            showHeartedBooks={showHeartedBooks}
            setShowHeartedBooks={setShowHeartedBooks}
          />
        </div>
      )}
    </div>
  )
}
