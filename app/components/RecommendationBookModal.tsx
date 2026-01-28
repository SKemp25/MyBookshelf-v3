"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, BookOpen, X } from "lucide-react"
import type { Book } from "../lib/types"

interface RecommendationBookModalProps {
  book: Book | null
  isOpen: boolean
  onClose: () => void
  onAddBook: (book: Book) => void
  onAddAuthor: (authorName: string) => void
  onPass?: () => void
}

export default function RecommendationBookModal({ 
  book, 
  isOpen, 
  onClose, 
  onAddBook, 
  onAddAuthor,
  onPass
}: RecommendationBookModalProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  
  if (!book) return null

  const getAuthorName = (book: Book) => {
    return book.author || book.authors?.[0] || "Unknown Author"
  }

  const isUpcomingPublication = (dateString: string) => {
    const publicationDate = new Date(dateString)
    const today = new Date()
    return publicationDate > today
  }

  const authorName = getAuthorName(book)
  const isUpcoming = book.publishedDate ? isUpcomingPublication(book.publishedDate) : false
  
  // Reset expanded state when modal closes
  const handleClose = () => {
    setIsDescriptionExpanded(false)
    onClose()
  }
  
  const descriptionLength = book.description?.length || 0
  const shouldShowReadMore = descriptionLength > 200
  const truncatedDescription = shouldShowReadMore && !isDescriptionExpanded
    ? book.description?.substring(0, 200) + "..."
    : book.description

  const handleAddBook = () => {
    onAddBook(book)
    onClose()
  }

  const handleAddAuthor = () => {
    onAddAuthor(authorName)
    onClose()
  }

  const handlePass = () => {
    if (onPass) {
      onPass()
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-blue-800">Book Recommendation</DialogTitle>
          <DialogDescription className="sr-only">
            View book details, description, and add to your bookshelf or pass.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Book Details Card */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-4">
              {book.thumbnail && (
                <img
                  src={book.thumbnail || "/placeholder.svg"}
                  alt={book.title}
                  className="w-16 h-20 object-cover rounded shadow-sm flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 text-lg line-clamp-2 mb-1">
                      {book.title}
                    </h4>
                    <p className="text-blue-700 text-sm mb-2 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      by {authorName}
                    </p>
                    {book.publishedDate && (
                      <div className="flex items-center gap-1 mb-2">
                        {isUpcoming && <Calendar className="w-3 h-3 text-green-600" />}
                        <p className={`text-sm ${isUpcoming ? "text-green-600 font-medium" : "text-blue-600"}`}>
                          {isUpcoming ? "Coming " : ""}
                          {book.publishedDate}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    {isUpcoming && (
                      <Badge
                        variant="outline"
                        className="border-emerald-500 text-emerald-700 bg-emerald-50 text-xs px-2 py-0.5 font-medium"
                      >
                        UPCOMING
                      </Badge>
                    )}
                    {book.seriesInfo && (
                      <Badge variant="outline" className="border-blue-300 text-blue-700 text-xs px-1 py-0">
                        #{book.seriesInfo.number}
                      </Badge>
                    )}
                  </div>
                </div>

                {book.description && (
                  <div className="mb-3">
                    <p className="text-gray-600 text-sm">
                      {truncatedDescription}
                    </p>
                    {shouldShowReadMore && (
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1 underline"
                      >
                        {isDescriptionExpanded ? "Read less" : "Read more"}
                      </button>
                    )}
                  </div>
                )}

                {book.pageCount && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <BookOpen className="w-3 h-3" />
                    {book.pageCount} pages
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-blue-700 mb-2">
              Choose how to add this recommendation:
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleAddBook}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Add Book
              </Button>
              <Button
                onClick={handleAddAuthor}
                variant="outline"
                className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <User className="w-4 h-4 mr-2" />
                Add Author
              </Button>
              {onPass && (
                <Button
                  onClick={handlePass}
                  variant="outline"
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Pass
                </Button>
              )}
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <div className="font-medium mb-1">What's the difference?</div>
              <div className="space-y-1">
                <div><strong>Add Book:</strong> Adds just this book and includes the author with only this one book</div>
                <div><strong>Add Author:</strong> Adds the author and fetches ALL their books</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
