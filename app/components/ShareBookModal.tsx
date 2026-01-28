"use client"

import { Label } from "@/components/ui/label"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Share2, Copy, Check, ExternalLink } from "lucide-react"
import type { Book } from "../lib/types"

interface ShareBookModalProps {
  book: Book
  author: string | { id: string; name: string } // Allow author to be either string or object
  isOpen: boolean
  onClose: () => void
  onBookShared?: (bookId: string, friendName: string, bookTitle: string) => void
}

export default function ShareBookModal({ book, author, isOpen, onClose, onBookShared }: ShareBookModalProps) {
  const [message, setMessage] = useState("")
  const [sharedBy, setSharedBy] = useState("A Book Lover")
  const [shareUrl, setShareUrl] = useState("")
  const [copied, setCopied] = useState(false)

  const getAuthorName = (author: string | { id: string; name: string }): string => {
    if (typeof author === "string") {
      return author
    }
    if (author && typeof author === "object" && "name" in author) {
      return author.name
    }
    return "Unknown Author"
  }

  const generateShareUrl = () => {
    const shareData = {
      books: [book],
      authors: [{ id: book.authorId, name: getAuthorName(author) }], // Use helper function
      message: message.trim() || undefined,
      sharedBy: sharedBy.trim() || undefined,
    }

    const encodedData = btoa(encodeURIComponent(JSON.stringify(shareData)))
    const url = `${window.location.origin}/recommendation/${encodedData}`
    setShareUrl(url)

    if (onBookShared && sharedBy.trim()) {
      onBookShared(book.id, sharedBy.trim(), book.title)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleClose = () => {
    setMessage("")
    setSharedBy("A Book Lover")
    setShareUrl("")
    setCopied(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white border-orange-200 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-orange-800 font-display text-xl flex items-center gap-3">
            <Share2 className="w-6 h-6" />
            Share Book
          </DialogTitle>
          <DialogDescription className="sr-only">
            Share this book with a friend via link, email, or message.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-1">{book.title}</h4>
            <p className="text-orange-700">by {getAuthorName(author)}</p>{" "}
            {/* Use helper function instead of direct rendering */}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="shared-by" className="text-orange-700 mb-2 block">
                Friend's Name
              </Label>
              <Input
                id="shared-by"
                value={sharedBy}
                onChange={(e) => setSharedBy(e.target.value)}
                placeholder="Who are you sharing this with?"
                className="border-orange-200 focus:border-orange-400"
              />
            </div>

            <div>
              <Label htmlFor="share-message" className="text-orange-700 mb-2 block">
                Personal Message (optional)
              </Label>
              <textarea
                id="share-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Why are you sharing this book?"
                rows={3}
                className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>

          {!shareUrl ? (
            <Button onClick={generateShareUrl} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              <Share2 className="w-4 h-4 mr-2" />
              Generate Share Link
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-orange-700 mb-2 block">Share Link</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="border-orange-200 bg-orange-50 text-sm" />
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    className={`${copied ? "bg-green-500 hover:bg-green-600" : "bg-orange-500 hover:bg-orange-600"} text-white`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => window.open(shareUrl, "_blank")}
                  variant="outline"
                  className="flex-1 border-orange-200 text-orange-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button onClick={handleClose} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
