"use client"

/**
 * Apple Books-Inspired Layout Component
 * 
 * Layout Option 1 (Classic Apple Books Style) with:
 * - Fixed footer with icon/tools
 * - Optional collapsible sidebar (hidden on mobile)
 * - Optimized for tablet landscape viewing
 */

import { useState } from "react"
import { 
  Search, 
  Grid3x3, 
  List, 
  Image as ImageIcon,
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
  FileText
} from "lucide-react"
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

interface AppleBooksLayoutProps {
  // This is a design mockup - props will be defined when implementing
}

export default function AppleBooksLayout({}: AppleBooksLayoutProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "cover">("grid")
  const [sortBy, setSortBy] = useState("newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const isMobile = useIsMobile()
  
  // Sidebar should be closed by default on mobile
  const showSidebar = !isMobile && sidebarOpen

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Sticky Top */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-2 md:gap-4">
          {/* Left: Sidebar Toggle & App Title */}
          <div className="flex items-center gap-2">
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            )}
            <button className="text-lg md:text-xl font-bold text-gray-900 hover:text-orange-600 transition-colors">
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
                className="pl-10 w-full text-sm md:text-base"
              />
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* View Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {viewMode === "grid" && <Grid3x3 className="w-4 h-4" />}
                  {viewMode === "list" && <List className="w-4 h-4" />}
                  {viewMode === "cover" && <ImageIcon className="w-4 h-4" />}
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
                <DropdownMenuItem onClick={() => setViewMode("cover")}>
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Cover Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Sort
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
                <Button variant="ghost" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Filters</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span className="w-full">By Author</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="w-full">By Genre</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span className="w-full">By Status</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span className="w-full">Advanced Filters...</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Authors & Books
                </DropdownMenuItem>
                <DropdownMenuItem>
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
                <div className="space-y-1">
                  {["Naomi Alderman", "Madeline Miller", "Kate Atkinson"].map((author) => (
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
                      <span>{author}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Genres Filter */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Genres</h4>
                <div className="space-y-1">
                  {["Fiction", "Mystery", "Romance", "Science Fiction"].map((genre) => (
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
                        checked={selectedStatus.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStatus([...selectedStatus, status])
                          } else {
                            setSelectedStatus(selectedStatus.filter(s => s !== status))
                          }
                        }}
                        className="rounded"
                      />
                      <span>{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedAuthors.length > 0 || selectedGenres.length > 0 || selectedStatus.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAuthors([])
                    setSelectedGenres([])
                    setSelectedStatus([])
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
          {/* This is where the book grid would go */}
          <div className={`grid gap-4 md:gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8"
              : viewMode === "list"
              ? "grid-cols-1"
              : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
          }`}>
          {/* Mock book cards for design preview */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((i) => (
            <div key={i} className="group cursor-pointer">
              {/* Book Cover */}
              <div className="aspect-[2/3] bg-gradient-to-br from-orange-200 to-orange-400 rounded-lg shadow-md hover:shadow-xl transition-shadow mb-2 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-white opacity-50" />
              </div>
              
              {/* Book Info */}
              <div className="text-center">
                <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                  Book Title {i}
                </h3>
                <p className="text-xs text-gray-600 mb-1">
                  Author Name
                </p>
                <span className="inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                  Read
                </span>
              </div>
            </div>
          ))}
          </div>
        </main>
      </div>

      {/* Fixed Footer with Icon/Tools */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around px-4 py-2 md:px-8 md:py-3">
          {/* Quick Actions */}
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-xs">Library</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-xs">Authors</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2">
            <Heart className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-xs">Favorites</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2">
            <BookmarkPlus className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-xs">Want to Read</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2">
            <BookCheck className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-xs">Finished</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2">
            <FileText className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-xs">Export</span>
          </Button>
        </div>
      </footer>
      
      {/* Spacer to prevent content from being hidden behind fixed footer */}
      <div className="h-16 md:h-20"></div>
    </div>
  )
}

