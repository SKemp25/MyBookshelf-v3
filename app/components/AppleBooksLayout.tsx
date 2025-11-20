"use client"

/**
 * Apple Books-Inspired Layout Component
 * 
 * This is a design mockup showing Layout Option 1 (Classic Apple Books Style)
 * Optimized for tablet landscape viewing
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
  LogOut
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

interface AppleBooksLayoutProps {
  // This is a design mockup - props will be defined when implementing
}

export default function AppleBooksLayout({}: AppleBooksLayoutProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "cover">("grid")
  const [sortBy, setSortBy] = useState("newest")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Sticky Top */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-3 gap-4">
          {/* Left: App Title */}
          <button className="text-xl font-bold text-gray-900 hover:text-orange-600 transition-colors">
            MY BOOKCASE
          </button>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
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

      {/* Main Content - Book Grid */}
      <main className="px-6 py-6">
        {/* This is where the book grid would go */}
        <div className="grid grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-6">
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
  )
}

