"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  BookOpen, 
  UserCheck, 
  TrendingUp, 
  Activity,
  Download,
  RefreshCw,
  Settings,
  BarChart3,
  Eye,
  Clock
} from "lucide-react"
import { 
  collectUserActivity, 
  collectBookAnalytics, 
  collectAuthorAnalytics,
  calculateSystemMetrics,
  calculateEngagementMetrics,
  exportAdminData,
  type UserActivity,
  type BookAnalytics,
  type AuthorAnalytics,
  type SystemMetrics,
  type EngagementMetrics
} from "@/lib/adminAnalytics"
import UserAnalytics from "./UserAnalytics"
import BookManagement from "./BookManagement"
import AuthorManagement from "./AuthorManagement"
import SystemOverview from "./SystemOverview"
import EngagementDashboard from "./EngagementDashboard"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null)
  const [users, setUsers] = useState<UserActivity[]>([])
  const [books, setBooks] = useState<BookAnalytics[]>([])
  const [authors, setAuthors] = useState<AuthorAnalytics[]>([])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const userData = collectUserActivity()
      const bookData = collectBookAnalytics()
      const authorData = collectAuthorAnalytics()
      const systemData = calculateSystemMetrics()
      const engagementData = calculateEngagementMetrics()

      setUsers(userData)
      setBooks(bookData)
      setAuthors(authorData)
      setSystemMetrics(systemData)
      setEngagementMetrics(engagementData)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Error loading admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleExportData = () => {
    const data = exportAdminData()
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `mybookshelf-admin-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">MyBookshelf Admin Portal</h1>
              <p className="text-gray-600 mt-1">
                System management and analytics dashboard
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleExportData} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                {systemMetrics?.activeUsers || 0} active today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics?.totalBooks || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across {systemMetrics?.totalAuthors || 0} authors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {engagementMetrics?.userEngagement.high || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                High engagement users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retention</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(engagementMetrics?.retentionRates.day7 || 0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                7-day retention rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Books
            </TabsTrigger>
            <TabsTrigger value="authors" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Authors
            </TabsTrigger>
            <TabsTrigger value="engagement" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Engagement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SystemOverview 
              systemMetrics={systemMetrics}
              engagementMetrics={engagementMetrics}
            />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserAnalytics users={users} />
          </TabsContent>

          <TabsContent value="books" className="space-y-6">
            <BookManagement books={books} />
          </TabsContent>

          <TabsContent value="authors" className="space-y-6">
            <AuthorManagement authors={authors} />
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6">
            <EngagementDashboard 
              engagementMetrics={engagementMetrics}
              systemMetrics={systemMetrics}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
