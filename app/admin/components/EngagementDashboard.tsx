"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  Users, 
  Activity,
  Target,
  BarChart3,
  PieChart,
  Clock,
  Award
} from "lucide-react"
import type { SystemMetrics, EngagementMetrics } from "@/lib/adminAnalytics"

interface EngagementDashboardProps {
  engagementMetrics: EngagementMetrics | null
  systemMetrics: SystemMetrics | null
}

export default function EngagementDashboard({ engagementMetrics, systemMetrics }: EngagementDashboardProps) {
  if (!engagementMetrics || !systemMetrics) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading engagement dashboard...
      </div>
    )
  }

  const totalUsers = systemMetrics.totalUsers
  const highEngagementUsers = engagementMetrics.userEngagement.high
  const mediumEngagementUsers = engagementMetrics.userEngagement.medium
  const lowEngagementUsers = engagementMetrics.userEngagement.low

  const highEngagementRate = totalUsers > 0 ? (highEngagementUsers / totalUsers) * 100 : 0
  const mediumEngagementRate = totalUsers > 0 ? (mediumEngagementUsers / totalUsers) * 100 : 0
  const lowEngagementRate = totalUsers > 0 ? (lowEngagementUsers / totalUsers) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Engagement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Engagement</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{highEngagementUsers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(highEngagementRate)}% of total users
            </p>
            <Progress value={highEngagementRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Engagement</CardTitle>
            <Activity className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mediumEngagementUsers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(mediumEngagementRate)}% of total users
            </p>
            <Progress value={mediumEngagementRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Engagement</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowEngagementUsers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(lowEngagementRate)}% of total users
            </p>
            <Progress value={lowEngagementRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Retention Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            User Retention Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {Math.round(engagementMetrics.retentionRates.day1)}%
              </div>
              <div className="text-sm font-medium">1-Day Retention</div>
              <div className="text-xs text-gray-500 mt-1">
                Users who return within 24 hours
              </div>
              <Progress value={engagementMetrics.retentionRates.day1} className="mt-3" />
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {Math.round(engagementMetrics.retentionRates.day7)}%
              </div>
              <div className="text-sm font-medium">7-Day Retention</div>
              <div className="text-xs text-gray-500 mt-1">
                Users who return within a week
              </div>
              <Progress value={engagementMetrics.retentionRates.day7} className="mt-3" />
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {Math.round(engagementMetrics.retentionRates.day30)}%
              </div>
              <div className="text-sm font-medium">30-Day Retention</div>
              <div className="text-xs text-gray-500 mt-1">
                Users who return within a month
              </div>
              <Progress value={engagementMetrics.retentionRates.day30} className="mt-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Usage Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Feature Usage Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Search Functionality</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{engagementMetrics.featureUsage.searchUsage} uses</span>
                <Badge variant="outline">
                  {totalUsers > 0 ? Math.round((engagementMetrics.featureUsage.searchUsage / totalUsers) * 100) : 0}% adoption
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Recommendation System</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{engagementMetrics.featureUsage.recommendationUsage} clicks</span>
                <Badge variant="outline">
                  {totalUsers > 0 ? Math.round((engagementMetrics.featureUsage.recommendationUsage / totalUsers) * 100) : 0}% adoption
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium">Data Export</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{engagementMetrics.featureUsage.exportUsage} exports</span>
                <Badge variant="outline">
                  {totalUsers > 0 ? Math.round((engagementMetrics.featureUsage.exportUsage / totalUsers) * 100) : 0}% adoption
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium">Filtering System</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{engagementMetrics.featureUsage.filterUsage} applications</span>
                <Badge variant="outline">
                  {totalUsers > 0 ? Math.round((engagementMetrics.featureUsage.filterUsage / totalUsers) * 100) : 0}% adoption
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Activity Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              User Activity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">High Activity Users</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${highEngagementRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8">{Math.round(highEngagementRate)}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Medium Activity Users</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ width: `${mediumEngagementRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8">{Math.round(mediumEngagementRate)}%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Low Activity Users</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ width: `${lowEngagementRate}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8">{Math.round(lowEngagementRate)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Engagement Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-green-800">Strong Retention</div>
                  <div className="text-sm text-green-600">
                    {Math.round(engagementMetrics.retentionRates.day7)}% 7-day retention
                  </div>
                </div>
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-blue-800">Active User Base</div>
                  <div className="text-sm text-blue-600">
                    {systemMetrics.dailyActiveUsers} daily active users
                  </div>
                </div>
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-medium text-purple-800">Content Engagement</div>
                  <div className="text-sm text-purple-600">
                    {systemMetrics.totalBooks} books in circulation
                  </div>
                </div>
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Engagement Improvement Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowEngagementRate > 50 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="font-medium text-red-800">High Low-Engagement Rate</div>
                <div className="text-sm text-red-600">
                  {Math.round(lowEngagementRate)}% of users have low engagement. Consider implementing onboarding improvements and feature tutorials.
                </div>
              </div>
            )}
            
            {engagementMetrics.retentionRates.day7 < 30 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="font-medium text-yellow-800">Low 7-Day Retention</div>
                <div className="text-sm text-yellow-600">
                  Only {Math.round(engagementMetrics.retentionRates.day7)}% of users return within a week. Consider adding email reminders or push notifications.
                </div>
              </div>
            )}
            
            {engagementMetrics.featureUsage.recommendationUsage < totalUsers && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-medium text-blue-800">Underutilized Recommendations</div>
                <div className="text-sm text-blue-600">
                  Recommendation system could be more prominent. Consider improving the recommendation algorithm or UI placement.
                </div>
              </div>
            )}
            
            {highEngagementRate > 30 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="font-medium text-green-800">Strong User Engagement</div>
                <div className="text-sm text-green-600">
                  {Math.round(highEngagementRate)}% of users show high engagement. Consider implementing user rewards or advanced features for power users.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
