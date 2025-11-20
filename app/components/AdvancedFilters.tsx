"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Filter, X, Plus, ChevronDown, ChevronUp, Heart } from "lucide-react"
import type { Book, Author, AdvancedFilterState } from "../lib/types"

// Define AdvancedFiltersProps interface directly in this file
interface AdvancedFiltersProps {
  filters: AdvancedFilterState
  onFiltersChange: (filters: AdvancedFilterState) => void
  books: Book[]
  authors: Author[]
  showHeartedBooks?: boolean
  setShowHeartedBooks?: (show: boolean) => void
}

export const defaultAdvancedFilters: AdvancedFilterState = {
  singleAuthorOnly: false,
  hasDescription: false,
  seriesOnly: false,
  readingStatus: [],
  genre: "all",
  yearRange: {
    start: "",
    end: "",
  },
  hasCover: false,
  titleContains: "",
  excludeWords: [],
  upcomingOnly: false,
  showPassedBooks: false,
}

export default function AdvancedFilters({ filters, onFiltersChange, books, authors, showHeartedBooks, setShowHeartedBooks }: AdvancedFiltersProps) {
  const [newExcludeWord, setNewExcludeWord] = useState("")
  const [isCollapsed, setIsCollapsed] = useState(false)

  const safeFilters = {
    ...defaultAdvancedFilters,
    ...filters,
    excludeWords: Array.isArray(filters?.excludeWords) ? filters.excludeWords : [],
    readingStatus: Array.isArray(filters?.readingStatus) ? filters.readingStatus : [],
    yearRange: filters?.yearRange || { start: "", end: "" },
  }

  const updateFilter = (key: keyof AdvancedFilterState, value: any) => {
    onFiltersChange({
      ...safeFilters,
      [key]: value,
    })
  }

  const updateYearRange = (key: "start" | "end", value: string) => {
    onFiltersChange({
      ...safeFilters,
      yearRange: {
        ...safeFilters.yearRange,
        [key]: value,
      },
    })
  }

  const updateReadingStatus = (status: string, checked: boolean) => {
    const currentStatuses = Array.isArray(safeFilters.readingStatus) ? safeFilters.readingStatus : []
    let newStatuses
    if (checked) {
      newStatuses = [...currentStatuses, status]
    } else {
      newStatuses = currentStatuses.filter((s) => s !== status)
    }
    updateFilter("readingStatus", newStatuses)
  }

  const addExcludeWord = () => {
    const currentExcludeWords = Array.isArray(safeFilters.excludeWords) ? safeFilters.excludeWords : []
    if (newExcludeWord.trim() && !currentExcludeWords.includes(newExcludeWord.trim().toLowerCase())) {
      onFiltersChange({
        ...safeFilters,
        excludeWords: [...currentExcludeWords, newExcludeWord.trim().toLowerCase()],
      })
      setNewExcludeWord("")
    }
  }

  const removeExcludeWord = (word: string) => {
    const currentExcludeWords = Array.isArray(safeFilters.excludeWords) ? safeFilters.excludeWords : []
    onFiltersChange({
      ...safeFilters,
      excludeWords: currentExcludeWords.filter((w) => w !== word),
    })
  }

  const resetFilters = () => {
    onFiltersChange(defaultAdvancedFilters)
  }

  const activeFiltersCount = Object.entries(safeFilters).filter(([key, value]) => {
    if (key === "yearRange") {
      const range = value as { start: string; end: string }
      return range.start !== "" || range.end !== ""
    }
    if (key === "excludeWords") {
      return Array.isArray(value) && value.length > 0
    }
    if (key === "readingStatus") {
      return Array.isArray(value) && value.length > 0
    }
    if (typeof value === "boolean") {
      return value === true
    }
    if (typeof value === "string") {
      return value !== "" && value !== "all"
    }
    return false
  }).length

  return (
    <div className="space-y-2">
      {/* Header - outside the card */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 hover:bg-orange-50 p-2 -m-2 rounded transition-colors"
        >
          {isCollapsed ? <ChevronDown className="w-3 h-3 text-orange-600 flex-shrink-0" /> : <ChevronUp className="w-3 h-3 text-orange-600 flex-shrink-0" />}
          <Filter className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <span className="text-sm font-medium text-orange-700">Advanced Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </button>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-orange-600 hover:text-orange-800 h-auto px-2 py-1 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>
      {/* Content - inside the card */}
      {!isCollapsed && (
        <Card className="bg-white border-orange-200">
          <CardContent className="space-y-3 pt-2">
          {/* Publication Settings */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-orange-700">Publication Settings</div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="upcoming-only"
                  checked={safeFilters.upcomingOnly}
                  onCheckedChange={(checked) => updateFilter("upcomingOnly", checked)}
                  className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label htmlFor="upcoming-only" className="text-sm text-orange-700">
                  Show upcoming releases only
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="single-author"
                  checked={safeFilters.singleAuthorOnly}
                  onCheckedChange={(checked) => updateFilter("singleAuthorOnly", checked)}
                  className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label htmlFor="single-author" className="text-sm text-orange-700">
                  Single author only
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-description"
                  checked={safeFilters.hasDescription}
                  onCheckedChange={(checked) => updateFilter("hasDescription", checked)}
                  className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label htmlFor="has-description" className="text-sm text-orange-700">
                  Has description
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="series-only"
                  checked={safeFilters.seriesOnly}
                  onCheckedChange={(checked) => updateFilter("seriesOnly", checked)}
                  className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label htmlFor="series-only" className="text-sm text-orange-700">
                  Series books only
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-cover"
                  checked={safeFilters.hasCover}
                  onCheckedChange={(checked) => updateFilter("hasCover", checked)}
                  className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label htmlFor="has-cover" className="text-sm text-orange-700">
                  Has cover image
                </Label>
              </div>
            </div>
          </div>

                <div className="space-y-2">
                  <div className="text-sm font-bold text-orange-700">Show/Hide</div>
                  <div className="space-y-2">
              {/* Show heart books only */}
              {setShowHeartedBooks && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-loved-books"
                    checked={showHeartedBooks || false}
                    onCheckedChange={(checked) => setShowHeartedBooks(checked as boolean)}
                    className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  />
                  <Label htmlFor="show-loved-books" className="text-sm text-orange-700 flex items-center gap-1.5">
                    Show <Heart className="w-4 h-4 text-pink-600 fill-pink-600" /> books only
                  </Label>
                </div>
              )}
              {/* Show Passed Books */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-passed-books"
                  checked={safeFilters.showPassedBooks || false}
                  onCheckedChange={(checked) => updateFilter("showPassedBooks", checked)}
                  className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <Label htmlFor="show-passed-books" className="text-sm text-orange-700">
                  Show Passed books
                </Label>
              </div>
              {[
                { value: "read", label: "Hide Read books" },
                { value: "unread", label: "Hide Unread books" },
                { value: "want-to-read", label: "Hide Want to read books" },
              ].map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={safeFilters.readingStatus?.includes(status.value) || false}
                    onCheckedChange={(checked) => updateReadingStatus(status.value, checked as boolean)}
                    className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  />
                  <Label htmlFor={`status-${status.value}`} className="text-sm text-orange-700">
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Genre Filter */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-orange-700">Genre</div>
            <Select value={safeFilters.genre} onValueChange={(value) => updateFilter("genre", value)}>
              <SelectTrigger className="border-orange-200 focus:border-orange-400 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                <SelectItem value="Fiction">Fiction</SelectItem>
                <SelectItem value="Non-Fiction">Non-Fiction</SelectItem>
                <SelectItem value="Biography/Autobiography">Biography/Autobiography</SelectItem>
                <SelectItem value="Mystery/Thriller">Mystery/Thriller</SelectItem>
                <SelectItem value="Romance">Romance</SelectItem>
                <SelectItem value="Science Fiction">Science Fiction</SelectItem>
                <SelectItem value="Fantasy">Fantasy</SelectItem>
                <SelectItem value="Historical Fiction">Historical Fiction</SelectItem>
                <SelectItem value="Literary Fiction">Literary Fiction</SelectItem>
                <SelectItem value="Poetry">Poetry</SelectItem>
                <SelectItem value="Drama/Plays">Drama/Plays</SelectItem>
                <SelectItem value="Philosophy">Philosophy</SelectItem>
                <SelectItem value="History">History</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="Self-Help">Self-Help</SelectItem>
                <SelectItem value="Travel">Travel</SelectItem>
                <SelectItem value="Cooking">Cooking</SelectItem>
                <SelectItem value="Art/Design">Art/Design</SelectItem>
                <SelectItem value="Religion/Spirituality">Religion/Spirituality</SelectItem>
                <SelectItem value="Politics">Politics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Year Range */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-orange-700">Publication Year</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="year-start" className="text-xs text-orange-600">
                  From
                </Label>
                <Input
                  id="year-start"
                  type="number"
                  placeholder="1900"
                  value={safeFilters.yearRange.start}
                  onChange={(e) => updateYearRange("start", e.target.value)}
                  className="border-orange-200 focus:border-orange-400 h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="year-end" className="text-xs text-orange-600">
                  To (today: {new Date().getFullYear()}, future dates allowed)
                </Label>
                <Input
                  id="year-end"
                  type="number"
                  placeholder="No limit"
                  value={safeFilters.yearRange.end}
                  onChange={(e) => updateYearRange("end", e.target.value)}
                  className="border-orange-200 focus:border-orange-400 h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Titles Contain */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-orange-700">Titles Contain</div>
            <Input
              id="title-contains"
              placeholder="Search in titles..."
              value={safeFilters.titleContains}
              onChange={(e) => updateFilter("titleContains", e.target.value)}
              className="border-orange-200 focus:border-orange-400 h-8 text-sm"
            />
          </div>

          {/* Exclude Words */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-orange-700">Titles Do Not Contain</div>
            <div className="flex gap-2">
              <Input
                placeholder="Word to exclude..."
                value={newExcludeWord}
                onChange={(e) => setNewExcludeWord(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addExcludeWord()}
                className="border-orange-200 focus:border-orange-400 h-8 text-sm"
              />
              <Button
                onClick={addExcludeWord}
                disabled={!newExcludeWord.trim()}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 h-8 px-3"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            {Array.isArray(safeFilters.excludeWords) && safeFilters.excludeWords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {safeFilters.excludeWords.map((word) => (
                  <Badge key={word} variant="secondary" className="bg-red-100 text-red-800 border-red-200 text-xs">
                    {word}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExcludeWord(word)}
                      className="ml-1 h-3 w-3 p-0 hover:bg-red-200"
                    >
                      <X className="w-2 h-2" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
