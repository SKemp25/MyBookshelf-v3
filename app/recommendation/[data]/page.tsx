"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Heart, User, Calendar, MessageSquare, ExternalLink } from "lucide-react"

interface RecommendationData {
  bookTitle: string
  bookAuthor: string
  senderName: string
  message: string
  sentAt: string
  bookDetails?: {
    publishedDate?: string
    genre?: string
    description?: string
    thumbnail?: string
    isbn?: string
  }
}

export default function RecommendationPage() {
  const params = useParams()
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadRecommendation = () => {
      try {
        const encodedData = params.data as string
        if (!encodedData) {
          throw new Error("No recommendation data found")
        }

        // Decode the base64 data
        const decodedData = atob(encodedData)
        const recommendationData: RecommendationData = JSON.parse(decodedData)

        setRecommendation(recommendationData)
      } catch (err) {
        console.error("Error loading recommendation:", err)
        setError("Failed to load recommendation data")
      } finally {
        setLoading(false)
      }
    }

    loadRecommendation()
  }, [params.data])

  const handleFindBook = () => {
    if (recommendation) {
      const title = typeof recommendation.bookTitle === "string" ? recommendation.bookTitle : "Unknown Title"
      const author = typeof recommendation.bookAuthor === "string" ? recommendation.bookAuthor : "Unknown Author"
      const searchQuery = encodeURIComponent(`${title} ${author}`)
      window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank")
    }
  }

  const handleFindOnAmazon = () => {
    if (recommendation) {
      const title = typeof recommendation.bookTitle === "string" ? recommendation.bookTitle : "Unknown Title"
      const author = typeof recommendation.bookAuthor === "string" ? recommendation.bookAuthor : "Unknown Author"
      const searchQuery = encodeURIComponent(`${title} ${author}`)
      window.open(`https://www.amazon.com/s?k=${searchQuery}`, "_blank")
    }
  }

  const handleFindOnGoodreads = () => {
    if (recommendation) {
      const title = typeof recommendation.bookTitle === "string" ? recommendation.bookTitle : "Unknown Title"
      const author = typeof recommendation.bookAuthor === "string" ? recommendation.bookAuthor : "Unknown Author"
      const searchQuery = encodeURIComponent(`${title} ${author}`)
      window.open(`https://www.goodreads.com/search?q=${searchQuery}`, "_blank")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-cream-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-orange-700 font-display text-xl">Loading recommendation...</p>
        </div>
      </div>
    )
  }

  if (error || !recommendation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-cream-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto bg-white border-red-200">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <BookOpen className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Recommendation Not Found</h2>
            <p className="text-red-600 mb-4">{error || "The recommendation link appears to be invalid or expired."}</p>
            <Button
              onClick={() => window.close()}
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-cream-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white/95 backdrop-blur-sm text-orange-900 px-8 py-5 mx-auto max-w-md rounded-2xl shadow-modern-lg border border-orange-200">
            <h1 className="text-3xl font-bold tracking-wider font-display">BOOK RECOMMENDATION</h1>
          </div>
        </div>

        {/* Main Recommendation Card */}
        <Card className="bg-white border-orange-200 shadow-modern-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <Heart className="w-6 h-6" />A Book Recommendation for You
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Book Details */}
              <div className="text-center">
                {recommendation.bookDetails?.thumbnail && (
                  <img
                    src={recommendation.bookDetails.thumbnail || "/placeholder.svg"}
                    alt={recommendation.bookTitle}
                    className="w-32 h-48 object-cover rounded-lg shadow-md mx-auto mb-4"
                  />
                )}
                <h2 className="text-2xl font-bold text-orange-900 mb-2">
                  {typeof recommendation.bookTitle === "string" ? recommendation.bookTitle : "Unknown Title"}
                </h2>
                <p className="text-xl text-orange-700 mb-4">
                  by {typeof recommendation.bookAuthor === "string" ? recommendation.bookAuthor : "Unknown Author"}
                </p>

                {recommendation.bookDetails && (
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {recommendation.bookDetails.publishedDate && (
                      <Badge variant="outline" className="border-orange-200 text-orange-700">
                        <Calendar className="w-3 h-3 mr-1" />
                        {typeof recommendation.bookDetails.publishedDate === "string"
                          ? recommendation.bookDetails.publishedDate
                          : "Unknown Date"}
                      </Badge>
                    )}
                    {recommendation.bookDetails.genre && (
                      <Badge variant="outline" className="border-orange-200 text-orange-700">
                        {typeof recommendation.bookDetails.genre === "string"
                          ? recommendation.bookDetails.genre
                          : "Unknown Genre"}
                      </Badge>
                    )}
                  </div>
                )}

                {recommendation.bookDetails?.description && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 max-w-lg mx-auto">
                    {recommendation.bookDetails.description}
                  </p>
                )}
              </div>

              {/* Sender Info */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-800">
                    Recommended by{" "}
                    {typeof recommendation.senderName === "string" ? recommendation.senderName : "Unknown Sender"}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-orange-700 italic">
                    "{typeof recommendation.message === "string" ? recommendation.message : "No message"}"
                  </p>
                </div>
                <p className="text-xs text-orange-500 mt-2">
                  Sent on {new Date(recommendation.sentAt).toLocaleDateString()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleFindBook}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  size="lg"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Search for this Book
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleFindOnAmazon}
                    variant="outline"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent"
                  >
                    Find on Amazon
                  </Button>
                  <Button
                    onClick={handleFindOnGoodreads}
                    variant="outline"
                    className="border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent"
                  >
                    Find on Goodreads
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-orange-600 text-sm">This recommendation was sent through the Penguin Book Tracker app</p>
        </div>
      </div>
    </div>
  )
}
