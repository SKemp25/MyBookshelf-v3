"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Search, 
  Filter, 
  Download, 
  BookOpen,
  TrendingUp,
  Eye,
  Heart,
  Share2,
  Calendar
} from "lucide-react"
import type { BookAnalytics } from "@/lib/adminAnalytics"

interface BookManagementProps {
  books: BookAnalytics[]
}

export default function BookManagement({ books }: BookManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<keyof BookAnalytics>("timesAdded")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterBy, setFilterBy] = useState<"all" | "popular" | "recent">("all")

  const filteredBooks = books
    .filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.author.toLowerCase().includes(searchTerm.toLowerCase())
      
      const isPopular = book.timesAdded > 1 || book.timesMarkedRead > 0
      const isRecent = new Date(book.firstAdded) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      if (filterBy === "popular") return matchesSearch && isPopular
      if (filterBy === "recent") return matchesSearch && isRecent
      return matchesSearch
    })
    .sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal
      }
      
      return 0
    })

  const handleSort = (column: keyof BookAnalytics) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const exportBookData = () => {
    const csvHeaders = [
      'Title',
      'Author',
      'Times Added',
      'Times Read',
      'Want to Read',
      'Times Shared',
      'Recommendation Clicks',
      'First Added',
      'Last Activity'
    ].join(',')

    const csvRows = filteredBooks.map(book => [
      `"${book.title}"`,
      `"${book.author}"`,
      book.timesAdded,
      book.timesMarkedRead,
      book.timesMarkedWantToRead,
      book.timesShared,
      book.recommendationClicks,
      `"${new Date(book.firstAdded).toLocaleDateString()}"`,
      `"${new Date(book.lastActivity).toLocaleDateString()}"`
    ].join(','))

    const csvContent = [csvHeaders, ...csvRows].join('\n')
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `mybookshelf-books-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getPopularityScore = (book: BookAnalytics) => {
    return book.timesAdded + book.timesMarkedRead + book.timesMarkedWantToRead + book.recommendationClicks
  }

  const getPopularityLevel = (score: number) => {
    if (score >= 10) return "high"
    if (score >= 5) return "medium"
    if (score >= 2) return "low"
    return "minimal"
  }

  const getPopularityColor = (level: string) => {
    switch (level) {
      case "high": return "bg-green-100 text-green-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-orange-100 text-orange-800"
      case "minimal": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{books.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Books</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {books.filter(book => getPopularityScore(book) >= 5).length}
            </div>
            <p className="text-xs text-muted-foreground">
              High engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reads</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {books.reduce((sum, book) => sum + book.timesMarkedRead, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Want to Read</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {books.reduce((sum, book) => sum + book.timesMarkedWantToRead, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Book Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search books by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterBy === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterBy("all")}
              >
                All Books
              </Button>
              <Button
                variant={filterBy === "popular" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterBy("popular")}
              >
                Popular
              </Button>
              <Button
                variant={filterBy === "recent" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterBy("recent")}
              >
                Recent
              </Button>
            </div>
            <Button onClick={exportBookData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Books Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("title")}
                  >
                    Title {sortBy === "title" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("author")}
                  >
                    Author {sortBy === "author" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("timesAdded")}
                  >
                    Added {sortBy === "timesAdded" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("timesMarkedRead")}
                  >
                    Read {sortBy === "timesMarkedRead" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("timesMarkedWantToRead")}
                  >
                    Want {sortBy === "timesMarkedWantToRead" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("recommendationClicks")}
                  >
                    Rec Clicks {sortBy === "recommendationClicks" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Popularity</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("firstAdded")}
                  >
                    First Added {sortBy === "firstAdded" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => {
                  const popularityScore = getPopularityScore(book)
                  const popularityLevel = getPopularityLevel(popularityScore)
                  
                  return (
                    <TableRow key={book.bookId}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {book.title}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {book.author}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          {book.timesAdded}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-gray-400" />
                          {book.timesMarkedRead}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-gray-400" />
                          {book.timesMarkedWantToRead}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Share2 className="w-4 h-4 text-gray-400" />
                          {book.recommendationClicks}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPopularityColor(popularityLevel)}>
                          {popularityLevel} ({popularityScore})
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(book.firstAdded).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No books found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
