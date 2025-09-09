"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import type { Author, Book } from "../lib/types"
import { normalizeAuthorName } from "./AuthorManager"
import { fetchAuthorBooksWithCache } from "@/lib/apiCache"

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
    if (!importText.trim()) {
      setImportResult({
        success: false,
        message: "Please enter some text to import.",
        authors: 0,
        books: 0,
      })
      return
    }

    setIsProcessing(true)
    setImportResult(null)

    try {
      // Split by lines and filter out empty lines
      const lines = importText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      if (lines.length === 0) {
        setImportResult({
          success: false,
          message: "No valid lines found in the input.",
          authors: 0,
          books: 0,
        })
        return
      }

      const authors: Author[] = []
      const books: Book[] = []

      // Process each line as either an author or book
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Check if line contains " - " which might indicate "Author - Book Title"
        if (line.includes(" - ")) {
          const [authorName, bookTitle] = line.split(" - ", 2)
          if (authorName && bookTitle) {
            const normalizedAuthorName = normalizeAuthorName(authorName.trim())
            // Find or create author
            let author = authors.find((a) => a.name.toLowerCase() === normalizedAuthorName.toLowerCase())
            if (!author) {
              author = {
                id: `import-author-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: normalizedAuthorName,
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
              authors: [normalizedAuthorName],
            }
            books.push(book)
          }
        } else {
          // Check if this might be a book title (contains common book words or is longer)
          const lineTrimmed = line.trim()
          const isLikelyBookTitle = lineTrimmed.length > 10 || 
            /^(the|a|an)\s/i.test(lineTrimmed) ||
            /book|novel|story|tale|chronicle|memoir|biography|autobiography/i.test(lineTrimmed)
          
          if (isLikelyBookTitle) {
            // Try to search for this as a book title
            try {
              const response = await fetch(
                `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(lineTrimmed)}&maxResults=1`
              )
              const data = await response.json()
              
              if (data.items && data.items.length > 0) {
                const bookData = data.items[0]
                const bookTitle = bookData.volumeInfo.title
                const bookAuthors = bookData.volumeInfo.authors || []
                
                if (bookAuthors.length > 0) {
                  // Add the primary author
                  const primaryAuthor = bookAuthors[0]
                  const normalizedAuthorName = normalizeAuthorName(primaryAuthor)
                  
                  let author = authors.find((a) => a.name.toLowerCase() === normalizedAuthorName.toLowerCase())
                  if (!author) {
                    author = {
                      id: `import-author-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                      name: normalizedAuthorName,
                    }
                    authors.push(author)
                  }
                  
                  // Create the book
                  const book: Book = {
                    id: bookData.id || `import-book-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                    title: bookTitle,
                    authorId: author.id,
                    publishedDate: bookData.volumeInfo.publishedDate || new Date().getFullYear().toString(),
                    genre: bookData.volumeInfo.categories?.[0] || "Unknown",
                    language: bookData.volumeInfo.language || "en",
                    pageCount: bookData.volumeInfo.pageCount || 0,
                    description: bookData.volumeInfo.description || "",
                    thumbnail: bookData.volumeInfo.imageLinks?.thumbnail || "",
                    isbn: bookData.volumeInfo.industryIdentifiers?.find((id: any) => id.type === "ISBN_13")?.identifier || 
                          bookData.volumeInfo.industryIdentifiers?.find((id: any) => id.type === "ISBN_10")?.identifier || "",
                    publisher: bookData.volumeInfo.publisher || "",
                    seriesInfo: null,
                    authors: bookAuthors,
                  }
                  books.push(book)
                }
              }
            } catch (error) {
              console.error(`Error searching for book "${lineTrimmed}":`, error)
              // Fall back to treating as author name
              const normalizedAuthorName = normalizeAuthorName(lineTrimmed)
              if (normalizedAuthorName && !authors.find((a) => a.name.toLowerCase() === normalizedAuthorName.toLowerCase())) {
                const author: Author = {
                  id: `import-author-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                  name: normalizedAuthorName,
                }
                authors.push(author)
              }
            }
          } else {
            // Treat as author name only
            const normalizedAuthorName = normalizeAuthorName(lineTrimmed)
            if (normalizedAuthorName && !authors.find((a) => a.name.toLowerCase() === normalizedAuthorName.toLowerCase())) {
              const author: Author = {
                id: `import-author-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
                name: normalizedAuthorName,
              }
              authors.push(author)
            }
          }
        }
      }

      // Fetch books for authors to ensure we have a fuller set
      for (const author of authors) {
        try {
          const apiResults = await fetchAuthorBooksWithCache(author.name)

          const authorBooks = apiResults
            .filter((item: any) => {
              const apiAuthor = item.volumeInfo.authors?.[0] || ""
              const searchedAuthor = author.name.toLowerCase()
              const bookAuthor = apiAuthor.toLowerCase()

              if (bookAuthor === searchedAuthor) return true

              const searchedWords = searchedAuthor
                .split(/[\s,]+/)
                .filter((word) => word.length > 1)
                .map((word) => word.toLowerCase())

              const bookWords = bookAuthor
                .split(/[\s,]+/)
                .filter((word) => word.length > 1)
                .map((word) => word.toLowerCase())

              return searchedWords.every((w) => bookWords.includes(w))
            })
            .map((item: any) => {
              let publishedDate = item.volumeInfo.publishedDate
              if (publishedDate) {
                let dateObj: Date
                if (publishedDate.length === 4) {
                  dateObj = new Date(`${publishedDate}-01-01`)
                  publishedDate = `${publishedDate}-01-01`
                } else if (publishedDate.length === 7) {
                  dateObj = new Date(`${publishedDate}-01`)
                  publishedDate = `${publishedDate}-01`
                } else {
                  dateObj = new Date(publishedDate)
                }
                const now = new Date()
                const twoYearsFromNow = new Date()
                twoYearsFromNow.setFullYear(now.getFullYear() + 2)
                if (dateObj > twoYearsFromNow || isNaN(dateObj.getTime())) {
                  publishedDate = null as any
                }
              }

              const primaryAuthor = item.volumeInfo.authors?.[0] || author.name

              return {
                id: item.id,
                title: item.volumeInfo.title,
                author: primaryAuthor,
                authorId: author.id,
                publishedDate: publishedDate || new Date().getFullYear().toString(),
                genre: item.volumeInfo.categories?.[0] || "Unknown",
                language: item.volumeInfo.language || "en",
                pageCount: item.volumeInfo.pageCount || 0,
                description: item.volumeInfo.description || "",
                thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:") || "",
                isbn:
                  item.volumeInfo.industryIdentifiers?.find((id: any) => id.type === "ISBN_13")?.identifier ||
                  item.volumeInfo.industryIdentifiers?.find((id: any) => id.type === "ISBN_10")?.identifier ||
                  "",
                publisher: item.volumeInfo.publisher,
                seriesInfo: null,
                authors: item.volumeInfo.authors || [primaryAuthor],
              } as Book
            })

          // Merge without duplicates by title-author combo
          const existingKeys = new Set(books.map((b) => `${b.title}::${(b as any).author || (b as any).authors?.[0] || ""}`))
          for (const bk of authorBooks) {
            const key = `${bk.title}::${(bk as any).author || (bk as any).authors?.[0] || ""}`
            if (!existingKeys.has(key)) {
              books.push(bk)
              existingKeys.add(key)
            }
          }
        } catch (error) {
          console.error(`Error fetching books for author ${author.name}:`, error)
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
      console.error("Import error:", error)
      setImportResult({
        success: false,
        message: `An error occurred during import: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
          Import multiple authors and books at once. Enter one per line. Supports:
          <br />• Author names (e.g., "Margaret Atwood")
          <br />• "Author - Book Title" format (e.g., "Zadie Smith - White Teeth")
          <br />• Book titles (e.g., "The Handmaid's Tale" - will find the author automatically)
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
The Handmaid's Tale
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
          <br />• Book titles (will automatically find the author)
          <br />• Plain text files (.txt)
        </div>
      </CardContent>
    </Card>
  )
}
