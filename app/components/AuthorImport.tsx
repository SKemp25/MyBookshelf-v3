"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import type { Author, Book } from "../lib/types"

interface AuthorImportProps {
  onBulkImport: (books: Book[], authors: Author[]) => void
}

export default function AuthorImport({ onBulkImport }: AuthorImportProps) {
  const [importText, setImportText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    authors: number
    books: number
  } | null>(null)

  const processImport = async () => {
    if (!importText.trim()) return

    setIsProcessing(true)
    setImportResult(null)

    try {
      // Split by lines and filter out empty lines
      const lines = importText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      const authors: Author[] = []
      const books: Book[] = []

      // Process each line as either an author or book
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Check if line contains " - " which might indicate "Author - Book Title"
        if (line.includes(" - ")) {
          const [authorName, bookTitle] = line.split(" - ", 2)
          if (authorName && bookTitle) {
            // Find or create author
            let author = authors.find((a) => a.name.toLowerCase() === authorName.trim().toLowerCase())
            if (!author) {
              author = {
                id: `import-author-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: authorName.trim(),
              }
              authors.push(author)
            }

            // Create book
            const book: Book = {
              id: `import-book-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
              title: bookTitle.trim(),
              authorId: author.id,
              publishedDate: new Date().getFullYear().toString(),
              genre: "Unknown",
              language: "en",
              pageCount: 0,
              description: "",
              thumbnail: "",
              isbn: "",
              publisher: "",
              seriesInfo: null,
              authors: [authorName.trim()],
            }
            books.push(book)
          }
        } else {
          // Treat as author name only
          const authorName = line.trim()
          if (authorName && !authors.find((a) => a.name.toLowerCase() === authorName.toLowerCase())) {
            const author: Author = {
              id: `import-author-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
              name: authorName,
            }
            authors.push(author)
          }
        }
      }

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (authors.length > 0 || books.length > 0) {
        onBulkImport(books, authors)
        setImportResult({
          success: true,
          message: "Import completed successfully!",
          authors: authors.length,
          books: books.length,
        })
        setImportText("")
      } else {
        setImportResult({
          success: false,
          message: "No valid authors or books found in the input.",
          authors: 0,
          books: 0,
        })
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: "An error occurred during import. Please check your input format.",
        authors: 0,
        books: 0,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/plain") {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setImportText(content)
      }
      reader.readAsText(file)
    }
  }

  return (
    <Card className="bg-white border-orange-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Upload className="w-5 h-5" />
          Bulk Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-orange-600">
          Import multiple authors and books at once. Enter one per line, or use "Author - Book Title" format.
        </div>

        {/* File Upload */}
        <div>
          <Label htmlFor="file-upload" className="text-orange-700">
            Upload Text File
          </Label>
          <Input
            id="file-upload"
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="border-orange-200 focus:border-orange-400"
          />
        </div>

        {/* Text Input */}
        <div>
          <Label htmlFor="import-text" className="text-orange-700">
            Or Paste Text
          </Label>
          <textarea
            id="import-text"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={`Examples:
Margaret Atwood
Zadie Smith - White Teeth
Ian McEwan - Atonement
Haruki Murakami`}
            rows={8}
            className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
          />
        </div>

        {/* Import Button */}
        <Button
          onClick={processImport}
          disabled={!importText.trim() || isProcessing}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Import Authors & Books
            </>
          )}
        </Button>

        {/* Import Result */}
        {importResult && (
          <div
            className={`p-3 rounded-lg border ${
              importResult.success
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {importResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="font-medium">{importResult.message}</span>
            </div>
            {importResult.success && (
              <div className="text-sm">
                Imported: {importResult.authors} authors, {importResult.books} books
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-orange-500 bg-orange-50 p-3 rounded-lg">
          <strong>Supported formats:</strong>
          <br />• Author names (one per line)
          <br />• "Author - Book Title" format
          <br />• Plain text files (.txt)
        </div>
      </CardContent>
    </Card>
  )
}
