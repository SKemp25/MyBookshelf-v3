"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Activity,
  Clock,
  Target,
  BarChart3,
  PieChart
} from "lucide-react"
import type { SystemMetrics, EngagementMetrics } from "@/lib/adminAnalytics"

interface SystemOverviewProps {
  systemMetrics: SystemMetrics | null
  engagementMetrics: EngagementMetrics | null
}

export default function SystemOverview({ systemMetrics, engagementMetrics }: SystemOverviewProps) {
  if (!systemMetrics || !engagementMetrics) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading system overview...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {systemMetrics.activeUsers} active today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.totalBooks}</div>
            <p className="text-xs text-muted-foreground">
              Across {systemMetrics.totalAuthors} authors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.dailyActiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((systemMetrics.dailyActiveUsers / Math.max(systemMetrics.totalUsers, 1)) * 100)}% of total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Active Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemMetrics.weeklyActiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((systemMetrics.weeklyActiveUsers / Math.max(systemMetrics.totalUsers, 1)) * 100)}% of total users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Engagement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              User Engagement Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">High Engagement</span>
                </div>
                <Badge variant="outline">{engagementMetrics.userEngagement.high}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Medium Engagement</span>
                </div>
                <Badge variant="outline">{engagementMetrics.userEngagement.medium}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Low Engagement</span>
                </div>
                <Badge variant="outline">{engagementMetrics.userEngagement.low}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Retention Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">1-Day Retention</span>
                <Badge variant="outline">{Math.round(engagementMetrics.retentionRates.day1)}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">7-Day Retention</span>
                <Badge variant="outline">{Math.round(engagementMetrics.retentionRates.day7)}%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">30-Day Retention</span>
                <Badge variant="outline">{Math.round(engagementMetrics.retentionRates.day30)}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Feature Usage Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {engagementMetrics.featureUsage.searchUsage}
              </div>
              <div className="text-sm text-blue-800">Search Queries</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {engagementMetrics.featureUsage.recommendationUsage}
              </div>
              <div className="text-sm text-green-800">Recommendation Clicks</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {engagementMetrics.featureUsage.exportUsage}
              </div>
              <div className="text-sm text-purple-800">Data Exports</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {engagementMetrics.featureUsage.filterUsage}
              </div>
              <div className="text-sm text-orange-800">Filter Applications</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Most Popular Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Most Popular Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemMetrics.mostPopularBooks.slice(0, 5).map((book, index) => (
                <div key={book.bookId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{book.title}</div>
                      <div className="text-xs text-gray-600">by {book.author}</div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {book.timesAdded + book.timesMarkedRead} interactions
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Most Popular Authors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemMetrics.mostPopularAuthors.slice(0, 5).map((author, index) => (
                <div key={author.authorName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{author.authorName}</div>
                      <div className="text-xs text-gray-600">{author.totalBooks} books</div>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {author.totalReads + author.totalWantToRead} reads
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold text-green-600">Healthy</div>
              <div className="text-sm text-gray-600">User Growth</div>
              <div className="text-xs text-gray-500 mt-1">
                {systemMetrics.totalUsers > 0 ? "Growing user base" : "No users yet"}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold text-blue-600">Active</div>
              <div className="text-sm text-gray-600">Content Library</div>
              <div className="text-xs text-gray-500 mt-1">
                {systemMetrics.totalBooks} books from {systemMetrics.totalAuthors} authors
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-lg font-semibold text-purple-600">Engaged</div>
              <div className="text-sm text-gray-600">User Activity</div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(engagementMetrics.retentionRates.day7)}% 7-day retention
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
