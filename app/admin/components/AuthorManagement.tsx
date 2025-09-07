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
  UserCheck,
  TrendingUp,
  BookOpen,
  Eye,
  Heart,
  Calendar,
  Star
} from "lucide-react"
import type { AuthorAnalytics } from "@/lib/adminAnalytics"

interface AuthorManagementProps {
  authors: AuthorAnalytics[]
}

export default function AuthorManagement({ authors }: AuthorManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<keyof AuthorAnalytics>("totalBooks")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterBy, setFilterBy] = useState<"all" | "popular" | "productive">("all")

  const filteredAuthors = authors
    .filter(author => {
      const matchesSearch = author.authorName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const isPopular = author.totalReads > 0 || author.totalWantToRead > 0
      const isProductive = author.totalBooks > 5
      
      if (filterBy === "popular") return matchesSearch && isPopular
      if (filterBy === "productive") return matchesSearch && isProductive
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

  const handleSort = (column: keyof AuthorAnalytics) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const exportAuthorData = () => {
    const csvHeaders = [
      'Author Name',
      'Total Books',
      'Times Added',
      'Total Reads',
      'Want to Read',
      'Average Rating',
      'First Added',
      'Last Activity'
    ].join(',')

    const csvRows = filteredAuthors.map(author => [
      `"${author.authorName}"`,
      author.totalBooks,
      author.timesAdded,
      author.totalReads,
      author.totalWantToRead,
      author.averageRating,
      `"${new Date(author.firstAdded).toLocaleDateString()}"`,
      `"${new Date(author.lastActivity).toLocaleDateString()}"`
    ].join(','))

    const csvContent = [csvHeaders, ...csvRows].join('\n')
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `mybookshelf-authors-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getAuthorScore = (author: AuthorAnalytics) => {
    return author.totalBooks + author.totalReads + author.totalWantToRead
  }

  const getAuthorLevel = (score: number) => {
    if (score >= 20) return "bestseller"
    if (score >= 10) return "popular"
    if (score >= 5) return "moderate"
    return "emerging"
  }

  const getAuthorColor = (level: string) => {
    switch (level) {
      case "bestseller": return "bg-purple-100 text-purple-800"
      case "popular": return "bg-green-100 text-green-800"
      case "moderate": return "bg-yellow-100 text-yellow-800"
      case "emerging": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getReadRate = (author: AuthorAnalytics) => {
    if (author.totalBooks === 0) return 0
    return Math.round((author.totalReads / author.totalBooks) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Authors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{authors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Authors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {authors.filter(author => getAuthorScore(author) >= 10).length}
            </div>
            <p className="text-xs text-muted-foreground">
              High engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {authors.reduce((sum, author) => sum + author.totalBooks, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Books/Author</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {authors.length > 0 ? Math.round(authors.reduce((sum, author) => sum + author.totalBooks, 0) / authors.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Author Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search authors by name..."
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
                All Authors
              </Button>
              <Button
                variant={filterBy === "popular" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterBy("popular")}
              >
                Popular
              </Button>
              <Button
                variant={filterBy === "productive" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterBy("productive")}
              >
                Productive
              </Button>
            </div>
            <Button onClick={exportAuthorData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Authors Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("authorName")}
                  >
                    Author {sortBy === "authorName" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("totalBooks")}
                  >
                    Books {sortBy === "totalBooks" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("timesAdded")}
                  >
                    Added {sortBy === "timesAdded" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("totalReads")}
                  >
                    Read {sortBy === "totalReads" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("totalWantToRead")}
                  >
                    Want {sortBy === "totalWantToRead" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Read Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("firstAdded")}
                  >
                    First Added {sortBy === "firstAdded" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuthors.map((author) => {
                  const authorScore = getAuthorScore(author)
                  const authorLevel = getAuthorLevel(authorScore)
                  const readRate = getReadRate(author)
                  
                  return (
                    <TableRow key={author.authorName}>
                      <TableCell className="font-medium">
                        {author.authorName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          {author.totalBooks}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <UserCheck className="w-4 h-4 text-gray-400" />
                          {author.timesAdded}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-gray-400" />
                          {author.totalReads}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-gray-400" />
                          {author.totalWantToRead}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(readRate, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{readRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAuthorColor(authorLevel)}>
                          {authorLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(author.firstAdded).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredAuthors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No authors found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
