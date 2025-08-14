"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, TrendingUp, Target, Calendar, Award, Activity } from "lucide-react"
import { getUserReadingStats, type ReadingStats } from "@/lib/analytics"

interface ReadingStatsCardProps {
  userId: string
}

export default function ReadingStatsCard({ userId }: ReadingStatsCardProps) {
  const [stats, setStats] = useState<ReadingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return

      try {
        const userStats = await getUserReadingStats(userId)
        setStats(userStats)
      } catch (error) {
        console.error("Error loading reading stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [userId])

  if (isLoading) {
    return (
      <Card className="bg-white border-4 border-black shadow-lg">
        <CardHeader>
          <CardTitle className="text-red-600 font-bold text-sm uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Reading Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="bg-white border-4 border-black shadow-lg">
        <CardHeader>
          <CardTitle className="text-red-600 font-bold text-sm uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Reading Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Start reading to see your analytics!</p>
        </CardContent>
      </Card>
    )
  }

  const completionRate = stats.totalBooks > 0 ? Math.round((stats.booksRead / stats.totalBooks) * 100) : 0

  return (
    <Card className="bg-white border-4 border-black shadow-lg">
      <CardHeader>
        <CardTitle className="text-red-600 font-bold text-sm uppercase tracking-wide flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Reading Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-green-50 border-2 border-black rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BookOpen className="w-3 h-3 text-green-600" />
              <span className="text-xs font-bold text-green-800 uppercase">Books Read</span>
            </div>
            <div className="text-lg font-black text-black">{stats.booksRead}</div>
          </div>

          <div className="text-center p-3 bg-blue-50 border-2 border-black rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-3 h-3 text-blue-600" />
              <span className="text-xs font-bold text-blue-800 uppercase">Want to Read</span>
            </div>
            <div className="text-lg font-black text-black">{stats.booksWanted}</div>
          </div>
        </div>

        {/* Reading Streak */}
        {stats.readingStreak > 0 && (
          <div className="text-center p-3 bg-orange-50 border-2 border-black rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="w-3 h-3 text-orange-600" />
              <span className="text-xs font-bold text-orange-800 uppercase">Reading Streak</span>
            </div>
            <div className="text-lg font-black text-black">{stats.readingStreak} days</div>
          </div>
        )}

        {/* Completion Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase">Completion Rate</span>
            <span className="text-xs font-black text-black">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 border border-black">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Average Books Per Month */}
        {stats.averageBooksPerMonth > 0 && (
          <div className="flex items-center justify-between p-2 bg-gray-50 border border-black rounded">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-gray-600" />
              <span className="text-xs font-bold text-gray-700 uppercase">Monthly Average</span>
            </div>
            <span className="text-xs font-black text-black">{stats.averageBooksPerMonth} books</span>
          </div>
        )}

        {/* Favorite Genres */}
        {stats.favoriteGenres.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-700 uppercase">Top Genres</h4>
            <div className="flex flex-wrap gap-1">
              {stats.favoriteGenres.slice(0, 3).map((genre) => (
                <Badge key={genre} variant="outline" className="text-xs border-black text-black bg-white font-bold">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Total Authors */}
        <div className="flex items-center justify-between p-2 bg-purple-50 border border-black rounded">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-purple-600" />
            <span className="text-xs font-bold text-purple-700 uppercase">Authors Followed</span>
          </div>
          <span className="text-xs font-black text-black">{stats.totalAuthors}</span>
        </div>
      </CardContent>
    </Card>
  )
}
