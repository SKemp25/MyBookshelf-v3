"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Filter, X } from "lucide-react"
import type { Book } from "../lib/types"
import AdvancedFilters, { type AdvancedFilterState, defaultAdvancedFilters } from "./AdvancedFilters"

interface BookFiltersProps {
  authors: string[]
  books: Book[]
  selectedAuthor: string
  sortBy: string
  selectedLanguages: string[]
  selectedGenres: string[]
  userPreferences: any
  advancedFilters: AdvancedFilterState
  onFiltersChange: (filters: AdvancedFilterState) => void
  setSelectedAuthor: (author: string) => void
  setSortBy: (sort: string) => void
  setSelectedLanguages: (languages: string[]) => void
  setSelectedGenres: (genres: string[]) => void
}

export default function BookFilters({
  authors,
  books,
  selectedAuthor,
  sortBy,
  selectedLanguages,
  selectedGenres,
  userPreferences,
  advancedFilters,
  onFiltersChange,
  setSelectedAuthor,
  setSortBy,
  setSelectedLanguages,
  setSelectedGenres,
}: BookFiltersProps) {
  const safeAuthors = Array.isArray(authors) ? authors : []
  const safeBooks = Array.isArray(books) ? books : []
  const safeAdvancedFilters = advancedFilters || defaultAdvancedFilters

  const bookCountByAuthor = safeAuthors.reduce(
    (acc, authorName) => {
      acc[authorName] = safeBooks.filter((book) => book && book.author === authorName).length
      return acc
    },
    {} as Record<string, number>,
  )

  const clearAllFilters = () => {
    setSelectedAuthor("")
  }

  return (
    <div className="text-sm font-medium text-red-700">
      <div className="flex items-center gap-3 mb-4">
        <Filter className="w-6 h-6 text-orange-600" />
        <h3 className="text-lg font-semibold text-orange-700">Filters &amp; Sorting</h3>
      </div>

      {/* Sort By */}
      <div className="space-y-3">
        <h4 className="text-base font-semibold text-red-700">Sort By</h4>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="border-orange-200 focus:border-orange-400">
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
      {safeAuthors.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-semibold text-gray-800">Filter by Author</h4>
            {selectedAuthor && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearAllFilters}
                className="text-orange-600 hover:text-orange-800 h-auto p-1"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {safeAuthors.map((authorName) => {
              const isSelected = selectedAuthor === authorName
              const bookCount = bookCountByAuthor[authorName] || 0
              return (
                <Badge
                  key={authorName}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "border-orange-300 text-orange-700 hover:bg-orange-50"
                  }`}
                  onClick={() => setSelectedAuthor(isSelected ? "" : authorName)}
                >
                  {authorName} ({bookCount})
                </Badge>
              )
            })}
          </div>
          {selectedAuthor && <p className="text-sm text-orange-600">Showing books by {selectedAuthor}</p>}
        </div>
      )}

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={safeAdvancedFilters}
        onFiltersChange={onFiltersChange}
        books={safeBooks}
        authors={safeAuthors}
      />
    </div>
  )
}
