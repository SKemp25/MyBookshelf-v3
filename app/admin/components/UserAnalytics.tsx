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
  Mail, 
  Calendar,
  BookOpen,
  UserPlus,
  TrendingUp,
  Clock
} from "lucide-react"
import type { UserActivity } from "@/lib/adminAnalytics"

interface UserAnalyticsProps {
  users: UserActivity[]
}

export default function UserAnalytics({ users }: UserAnalyticsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<keyof UserActivity>("lastLogin")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterBy, setFilterBy] = useState<"all" | "active" | "inactive">("all")

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const isActive = new Date(user.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      if (filterBy === "active") return matchesSearch && isActive
      if (filterBy === "inactive") return matchesSearch && !isActive
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

  const handleSort = (column: keyof UserActivity) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const exportUserData = () => {
    const csvHeaders = [
      'Name',
      'Email',
      'Last Login',
      'Total Logins',
      'Books Added',
      'Authors Added',
      'Books Read',
      'Want to Read',
      'Created At'
    ].join(',')

    const csvRows = filteredUsers.map(user => [
      `"${user.name}"`,
      `"${user.email}"`,
      `"${new Date(user.lastLogin).toLocaleDateString()}"`,
      user.totalLogins,
      user.booksAdded,
      user.authorsAdded,
      user.booksRead,
      user.wantToReadBooks,
      `"${new Date(user.createdAt).toLocaleDateString()}"`
    ].join(','))

    const csvContent = [csvHeaders, ...csvRows].join('\n')
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `mybookshelf-users-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getEngagementLevel = (user: UserActivity) => {
    if (user.booksAdded > 10 && user.totalLogins > 5) return "high"
    if (user.booksAdded >= 5 || user.totalLogins >= 3) return "medium"
    return "low"
  }

  const getEngagementColor = (level: string) => {
    switch (level) {
      case "high": return "bg-green-100 text-green-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const isUserActive = (user: UserActivity) => {
    return new Date(user.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(isUserActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Engagement</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => getEngagementLevel(user) === "high").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Books/User</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.length > 0 ? Math.round(users.reduce((sum, user) => sum + user.booksAdded, 0) / users.length) : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
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
                All Users
              </Button>
              <Button
                variant={filterBy === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterBy("active")}
              >
                Active
              </Button>
              <Button
                variant={filterBy === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterBy("inactive")}
              >
                Inactive
              </Button>
            </div>
            <Button onClick={exportUserData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("name")}
                  >
                    Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("email")}
                  >
                    Email {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("lastLogin")}
                  >
                    Last Login {sortBy === "lastLogin" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("totalLogins")}
                  >
                    Logins {sortBy === "totalLogins" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("booksAdded")}
                  >
                    Books {sortBy === "booksAdded" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort("booksRead")}
                  >
                    Read {sortBy === "booksRead" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const engagementLevel = getEngagementLevel(user)
                  const active = isUserActive(user)
                  
                  return (
                    <TableRow key={user.userId}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{user.totalLogins}</TableCell>
                      <TableCell>{user.booksAdded}</TableCell>
                      <TableCell>{user.booksRead}</TableCell>
                      <TableCell>
                        <Badge className={getEngagementColor(engagementLevel)}>
                          {engagementLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={active ? "default" : "secondary"}>
                          {active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
