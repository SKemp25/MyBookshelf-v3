"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Send, User, Mail, MessageSquare } from "lucide-react"
import type { Book, Author, Friend, SentRecommendation } from "../lib/types"

interface RecommendBookModalProps {
  book: Book
  authors: Author[]
  friends: Friend[]
  onRecommendationSent: (recommendation: SentRecommendation) => void
}

export default function RecommendBookModal({ book, authors, friends, onRecommendationSent }: RecommendBookModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState("")
  const [customName, setCustomName] = useState("")
  const [customEmail, setCustomEmail] = useState("")
  const [customPhone, setCustomPhone] = useState("")
  const [message, setMessage] = useState("Thought you'd like this!")
  const [sendMethod, setSendMethod] = useState<"email" | "sms" | "both">("email")
  const [isSending, setIsSending] = useState(false)

  const getAuthorName = (authorId: string) => {
    return authors.find((a) => a.id === authorId)?.name || "Unknown Author"
  }

  const resetForm = () => {
    setSelectedFriend("")
    setCustomName("")
    setCustomEmail("")
    setCustomPhone("")
    setMessage("Thought you'd like this!")
    setSendMethod("email")
  }

  const handleFriendSelect = (friendId: string) => {
    setSelectedFriend(friendId)
    if (friendId) {
      const friend = friends.find((f) => f.id === friendId)
      if (friend) {
        setCustomName(friend.name)
        setCustomEmail(friend.email)
        setCustomPhone(friend.phone || "")
      }
    } else {
      setCustomName("")
      setCustomEmail("")
      setCustomPhone("")
    }
  }

  const canSend = () => {
    const hasName = customName.trim().length > 0
    const hasEmail = sendMethod === "email" || sendMethod === "both" ? customEmail.trim().length > 0 : true
    const hasPhone = sendMethod === "sms" || sendMethod === "both" ? customPhone.trim().length > 0 : true
    return hasName && hasEmail && hasPhone && message.trim().length > 0
  }

  const sendRecommendation = async () => {
    if (!canSend()) return

    setIsSending(true)

    // Simulate sending delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const recommendation: SentRecommendation = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: getAuthorName(book.authorId),
      recipientName: customName.trim(),
      recipientEmail: customEmail.trim() || undefined,
      recipientPhone: customPhone.trim() || undefined,
      message: message.trim(),
      sentAt: new Date().toISOString(),
      method: sendMethod,
    }

    onRecommendationSent(recommendation)
    setIsSending(false)
    setIsOpen(false)
    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs border-pink-200 text-pink-700 hover:bg-pink-50 bg-transparent"
        >
          <Heart className="w-2 h-2 mr-1" />
          Recommend
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-orange-800">Recommend "{book.title}"</DialogTitle>
          <DialogDescription className="sr-only">
            Send a recommendation for this book to a friend via email or SMS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-900">
              {typeof book.title === "string" ? book.title : "Unknown Title"}
            </h4>
            <p className="text-sm text-orange-700">
              by {typeof getAuthorName(book.authorId) === "string" ? getAuthorName(book.authorId) : "Unknown Author"}
            </p>
            {book.publishedDate && (
              <p className="text-xs text-orange-600 mt-1">
                Published: {typeof book.publishedDate === "string" ? book.publishedDate : "Unknown Date"}
              </p>
            )}
          </div>

          {friends.length > 0 && (
            <div>
              <Label>Quick Select Friend</Label>
              <Select value={selectedFriend} onValueChange={handleFriendSelect}>
                <SelectTrigger className="border-orange-200">
                  <SelectValue placeholder="Choose a friend or enter custom details" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom recipient</SelectItem>
                  {friends.map((friend) => (
                    <SelectItem key={friend.id} value={friend.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span>{friend.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="recipient-name">Recipient Name *</Label>
              <Input
                id="recipient-name"
                placeholder="Friend's name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="border-orange-200"
              />
            </div>
            <div>
              <Label htmlFor="send-method">Send Via</Label>
              <Select value={sendMethod} onValueChange={(value: "email" | "sms" | "both") => setSendMethod(value)}>
                <SelectTrigger className="border-orange-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      Email
                    </div>
                  </SelectItem>
                  <SelectItem value="sms">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3 h-3" />
                      SMS
                    </div>
                  </SelectItem>
                  <SelectItem value="both">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3 h-3" />
                      <MessageSquare className="w-3 h-3" />
                      Both
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(sendMethod === "email" || sendMethod === "both") && (
            <div>
              <Label htmlFor="recipient-email">Email Address *</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="friend@example.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="border-orange-200"
              />
            </div>
          )}

          {(sendMethod === "sms" || sendMethod === "both") && (
            <div>
              <Label htmlFor="recipient-phone">Phone Number *</Label>
              <Input
                id="recipient-phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="border-orange-200"
              />
            </div>
          )}

          <div>
            <Label htmlFor="message">Personal Message</Label>
            <textarea
              id="message"
              placeholder="Add a personal note..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={sendRecommendation}
              disabled={!canSend() || isSending}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isSending ? "Sending..." : `Send via ${sendMethod}`}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>

          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
            💡 Your friend will receive a beautiful recommendation with book details and your personal message!
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
