"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { listUsers, StoredUser } from "@/lib/authStore"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const formatNumber = (value: number) => new Intl.NumberFormat().format(value)

interface UserProfile {
  ageRange?: string
  dateOfBirth?: string
  preferredGenres?: string[]
  [key: string]: any
}

interface AuthorData {
  author: string
  count: number
}

export default function AdminAnalyticsPage() {
  const [users, setUsers] = useState<StoredUser[]>([])

  useEffect(() => {
    setUsers(listUsers())
  }, [])

  const stats = useMemo(() => {
    if (users.length === 0) {
      return {
        totalUsers: 0,
        activeToday: 0,
        averageLogins: 0,
        newestUser: null as StoredUser | null,
        ageDistribution: [] as { name: string; value: number }[],
        topAuthors: [] as AuthorData[],
      }
    }

    const totalUsers = users.length
    const activeToday = users.filter((user) => {
      if (!user.lastLoginAt) return false
      const lastLogin = new Date(user.lastLoginAt)
      const today = new Date()
      return (
        lastLogin.getFullYear() === today.getFullYear() &&
        lastLogin.getMonth() === today.getMonth() &&
        lastLogin.getDate() === today.getDate()
      )
    }).length

    const averageLogins =
      users.reduce((sum, user) => sum + (user.loginCount || 0), 0) / Math.max(totalUsers, 1)

    const newestUser = [...users].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]

    // Calculate age distribution
    const ageCounts: Record<string, number> = {}
    const authorCounts: Record<string, number> = {}

    users.forEach((user) => {
      // Get user profile from localStorage
      try {
        const userProfileKey = `bookshelf_user_${user.email}`
        const profileData = localStorage.getItem(userProfileKey)
        if (profileData) {
          const profile: UserProfile = JSON.parse(profileData)
          
          // Track age range
          if (profile.ageRange) {
            ageCounts[profile.ageRange] = (ageCounts[profile.ageRange] || 0) + 1
          } else if (profile.dateOfBirth) {
            // Calculate age from date of birth
            const birthDate = new Date(profile.dateOfBirth)
            const today = new Date()
            const age = today.getFullYear() - birthDate.getFullYear()
            const monthDiff = today.getMonth() - birthDate.getMonth()
            const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age
            
            let ageRange = "Unknown"
            if (actualAge < 13) ageRange = "Children (0-12)"
            else if (actualAge < 18) ageRange = "Young Adult (13-17)"
            else ageRange = "Adult (18+)"
            
            ageCounts[ageRange] = (ageCounts[ageRange] || 0) + 1
          } else {
            ageCounts["Not specified"] = (ageCounts["Not specified"] || 0) + 1
          }
        } else {
          ageCounts["Not specified"] = (ageCounts["Not specified"] || 0) + 1
        }

        // Get authors from user data
        const userDataKey = `bookshelf_data_${user.email}`
        const userDataStr = localStorage.getItem(userDataKey)
        if (userDataStr) {
          const userData = JSON.parse(userDataStr)
          const authors = userData.authors || []
          authors.forEach((author: string) => {
            authorCounts[author] = (authorCounts[author] || 0) + 1
          })
        }
      } catch (error) {
        console.error("Error processing user data:", error)
      }
    })

    const ageDistribution = Object.entries(ageCounts).map(([name, value]) => ({
      name,
      value,
    }))

    const topAuthors = Object.entries(authorCounts)
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalUsers,
      activeToday,
      averageLogins,
      newestUser,
      ageDistribution,
      topAuthors,
    }
  }, [users])

  const COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-600">Local snapshot for this browser</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total users</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">
            {formatNumber(stats.totalUsers)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Active today</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">
            {formatNumber(stats.activeToday)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Average logins</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">
            {stats.averageLogins.toFixed(1)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Most recent signup</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.newestUser ? (
              <div>
                <div className="font-medium text-slate-900">{stats.newestUser.fullName}</div>
                <div className="text-sm text-slate-600">{stats.newestUser.email}</div>
                <Badge variant="outline" className="mt-2">
                  {new Date(stats.newestUser.createdAt).toLocaleDateString()}
                </Badge>
              </div>
            ) : (
              <p className="text-sm text-slate-600">No users yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Age Distribution Chart */}
      {stats.ageDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.ageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.ageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Authors Chart */}
      {stats.topAuthors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Authors</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats.topAuthors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="author" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#f97316" name="Number of Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

