"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, FileText, Database, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Book } from "@/lib/types"

interface DataExportProps {
  books: Book[]
  authors: string[]
  readBooks: Set<string>
  wantToReadBooks: Set<string>
  dontWantBooks: Set<string>
  userProfile: any
}

export default function DataExport({ 
  books, 
  authors, 
  readBooks, 
  wantToReadBooks, 
  dontWantBooks, 
  userProfile 
}: DataExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const exportToJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      userProfile,
      authors,
      books: books.map(book => ({
        ...book,
        readingStatus: readBooks.has(`${book.title}-${book.author}`) ? 'read' :
                      wantToReadBooks.has(`${book.title}-${book.author}`) ? 'want-to-read' :
                      dontWantBooks.has(`${book.title}-${book.author}`) ? 'dont-want' : 'unread'
      })),
      statistics: {
        totalBooks: books.length,
        readBooks: readBooks.size,
        wantToReadBooks: wantToReadBooks.size,
        dontWantBooks: dontWantBooks.size,
        totalAuthors: authors.length
      }
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `mybookshelf-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Export Successful!",
      description: "Your bookshelf data has been downloaded as JSON.",
    })
  }

  const exportToCSV = () => {
    const csvHeaders = [
      'Title',
      'Author', 
      'Published Date',
      'Page Count',
      'Language',
      'Categories',
      'Reading Status',
      'Description'
    ].join(',')

    const csvRows = books.map(book => {
      const readingStatus = readBooks.has(`${book.title}-${book.author}`) ? 'Read' :
                           wantToReadBooks.has(`${book.title}-${book.author}`) ? 'Want to Read' :
                           dontWantBooks.has(`${book.title}-${book.author}`) ? "Don't Want" : 'Unread'
      
      return [
        `"${book.title?.replace(/"/g, '""') || ''}"`,
        `"${book.author?.replace(/"/g, '""') || ''}"`,
        `"${book.publishedDate || ''}"`,
        book.pageCount || '',
        `"${book.language || ''}"`,
        `"${(book.categories || []).join('; ')}"`,
        `"${readingStatus}"`,
        `"${(book.description || '').replace(/"/g, '""').replace(/\n/g, ' ').substring(0, 200)}"`
      ].join(',')
    })

    const csvContent = [csvHeaders, ...csvRows].join('\n')
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `mybookshelf-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Export Successful!",
      description: "Your bookshelf data has been downloaded as CSV.",
    })
  }

  const exportToText = () => {
    const textContent = `MY BOOKSHELF EXPORT
Generated: ${new Date().toLocaleDateString()}

USER PROFILE:
Name: ${userProfile?.name || 'N/A'}
Email: ${userProfile?.email || 'N/A'}
Preferred Languages: ${(userProfile?.preferredLanguages || []).join(', ')}
Age Range: ${userProfile?.ageRange || 'N/A'}

STATISTICS:
Total Books: ${books.length}
Read Books: ${readBooks.size}
Want to Read: ${wantToReadBooks.size}
Don't Want: ${dontWantBooks.size}
Total Authors: ${authors.length}

AUTHORS:
${authors.map(author => `• ${author}`).join('\n')}

BOOKS:
${books.map(book => {
  const readingStatus = readBooks.has(`${book.title}-${book.author}`) ? '[READ]' :
                       wantToReadBooks.has(`${book.title}-${book.author}`) ? '[WANT TO READ]' :
                       dontWantBooks.has(`${book.title}-${book.author}`) ? "[DON'T WANT]" : '[UNREAD]'
  return `${readingStatus} "${book.title}" by ${book.author} (${book.publishedDate || 'Unknown date'})`
}).join('\n')}
`

    const dataBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `mybookshelf-export-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Export Successful!",
      description: "Your bookshelf data has been downloaded as text.",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white border-orange-200 text-orange-700 hover:bg-orange-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <Database className="w-5 h-5" />
            Export Your Bookshelf Data
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">Backup Your Data</p>
                <p>Export your bookshelf data to keep a backup. This includes all your books, authors, reading status, and preferences.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <strong>Export Summary:</strong>
              <ul className="mt-1 space-y-1">
                <li>• {books.length} books</li>
                <li>• {authors.length} authors</li>
                <li>• {readBooks.size} read books</li>
                <li>• {wantToReadBooks.size} want to read</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button 
                onClick={exportToJSON}
                variant="outline"
                className="justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export as JSON (Complete Data)
              </Button>
              
              <Button 
                onClick={exportToCSV}
                variant="outline"
                className="justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export as CSV (Spreadsheet)
              </Button>
              
              <Button 
                onClick={exportToText}
                variant="outline"
                className="justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export as Text (Readable)
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
