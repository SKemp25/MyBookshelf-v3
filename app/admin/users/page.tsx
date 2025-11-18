"use client"

import { useMemo, useState } from "react"
import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { listUsers, removeUser, StoredUser } from "@/lib/authStore"
import { Trash2 } from "lucide-react"

const formatDate = (value?: string) => {
  if (!value) return "—"
  const date = new Date(value)
  return date.toLocaleString()
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StoredUser[]>([])
  const [query, setQuery] = useState("")

  const refresh = () => {
    setUsers(listUsers())
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return users
    const q = query.toLowerCase()
    return users.filter(
      (user) => user.email.toLowerCase().includes(q) || user.fullName.toLowerCase().includes(q),
    )
  }, [users, query])

  const handleRemove = (email: string) => {
    if (!confirm(`Remove ${email}? This only affects your local admin view.`)) return
    removeUser(email)
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">User Directory</h1>
          <p className="text-sm text-slate-600">Accounts Created in this Browser</p>
        </div>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="w-64"
          />
          <Button variant="outline" onClick={refresh}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-slate-700">
            {filtered.length} {filtered.length === 1 ? "user" : "users"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Logins</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                    No users match your search.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>
                    <div className="font-medium text-slate-900">{user.fullName}</div>
                  </TableCell>
                  <TableCell className="text-slate-700">{user.email}</TableCell>
                  <TableCell className="text-sm text-slate-600">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-sm text-slate-600">{formatDate(user.lastLoginAt)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.loginCount ?? 0}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(user.email)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

