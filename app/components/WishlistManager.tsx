"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Trash2, Heart, Calendar } from "lucide-react"

interface WishlistItem {
  id: string
  title: string
  author: string
  addedAt: string
}

interface WishlistManagerProps {
  wantToReadBooks: Set<string>
  wantToReadList: WishlistItem[]
  onRemoveFromWantToRead: (bookId: string) => void
  onMarkAsRead: (bookId: string, title: string, author: string) => void
}

export default function WishlistManager({
  wantToReadBooks,
  wantToReadList,
  onRemoveFromWantToRead,
  onMarkAsRead,
}: WishlistManagerProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (wantToReadList.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="w-12 h-12 text-orange-300 mx-auto mb-4" />
        <p className="text-orange-600 font-display text-lg mb-2">No books in your wishlist yet</p>
        <p className="text-orange-500 text-sm">Books you mark as "Want to Read" will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Heart className="w-6 h-6 text-orange-600" />
          <h3 className="text-xl font-display font-bold text-orange-800">Want to Read</h3>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          {wantToReadList.length} {wantToReadList.length === 1 ? "book" : "books"}
        </Badge>
      </div>

      <div className="space-y-3">
        {wantToReadList
          .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
          .map((item) => (
            <div
              key={item.id}
              className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-modern transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-display font-bold text-blue-900 mb-1 line-clamp-2">{item.title}</h4>
                  <p className="text-blue-700 font-medium mb-2">by {item.author}</p>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Calendar className="w-4 h-4" />
                    <span>Added {formatDate(item.addedAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    onClick={() => onMarkAsRead(item.id, item.title, item.author)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRemoveFromWantToRead(item.id)}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="pt-4 border-t border-orange-200">
        <p className="text-sm text-orange-600 text-center">
          💡 Tip: Click the green checkmark to mark a book as read, or the trash icon to remove it from your wishlist.
        </p>
      </div>
    </div>
  )
}
