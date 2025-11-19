"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, FileText, Database, AlertCircle, FileDown } from "lucide-react"
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

  const getReadingStatus = (book: Book): string => {
    const bookId = `${book.title}-${book.author}`
    if (readBooks.has(bookId)) return 'Read'
    if (wantToReadBooks.has(bookId)) return 'Want'
    if (dontWantBooks.has(bookId)) return 'Pass'
    return 'Unread'
  }

  const exportToCSV = () => {
    const csvHeaders = [
      'Title',
      'Author', 
      'Status',
      'Published Date',
      'Page Count',
      'Language',
      'Categories',
      'Description'
    ].join(',')

    const csvRows = books.map(book => {
      const status = getReadingStatus(book)
      
      return [
        `"${book.title?.replace(/"/g, '""') || ''}"`,
        `"${book.author?.replace(/"/g, '""') || ''}"`,
        `"${status}"`,
        `"${book.publishedDate || ''}"`,
        book.pageCount || '',
        `"${book.language || ''}"`,
        `"${(book.categories || []).join('; ')}"`,
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
Pass: ${dontWantBooks.size}
Total Authors: ${authors.length}

AUTHORS:
${authors.map(author => `• ${author}`).join('\n')}

BOOKS:
${books.map(book => {
  const status = getReadingStatus(book)
  const statusTag = status === 'Read' ? '[READ]' :
                   status === 'Want' ? '[WANT]' :
                   status === 'Pass' ? '[PASS]' : '[UNREAD]'
  return `${statusTag} "${book.title}" by ${book.author} (${book.publishedDate || 'Unknown date'})`
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

  const exportToPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const { jsPDF } = await import('jspdf')
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      const lineHeight = 7
      let yPos = margin

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          doc.addPage()
          yPos = margin
          return true
        }
        return false
      }

      // Title
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('MY BOOKSHELF', pageWidth / 2, yPos, { align: 'center' })
      yPos += lineHeight * 1.5

      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += lineHeight * 2

      // User Profile Section
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('USER PROFILE', margin, yPos)
      yPos += lineHeight

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Name: ${userProfile?.name || 'N/A'}`, margin, yPos)
      yPos += lineHeight
      doc.text(`Email: ${userProfile?.email || 'N/A'}`, margin, yPos)
      yPos += lineHeight * 2

      // Statistics Section
      checkPageBreak(lineHeight * 6)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('STATISTICS', margin, yPos)
      yPos += lineHeight

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Books: ${books.length}`, margin, yPos)
      yPos += lineHeight
      doc.text(`Read: ${readBooks.size}  |  Want: ${wantToReadBooks.size}  |  Pass: ${dontWantBooks.size}`, margin, yPos)
      yPos += lineHeight
      doc.text(`Total Authors: ${authors.length}`, margin, yPos)
      yPos += lineHeight * 2

      // Authors Section
      checkPageBreak(lineHeight * 3)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('AUTHORS', margin, yPos)
      yPos += lineHeight

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      authors.forEach(author => {
        checkPageBreak(lineHeight)
        doc.text(`• ${author}`, margin + 5, yPos)
        yPos += lineHeight
      })
      yPos += lineHeight

      // Books Section
      checkPageBreak(lineHeight * 3)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('BOOKS', margin, yPos)
      yPos += lineHeight

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      
      // Group books by status
      const booksByStatus = {
        Read: books.filter(book => getReadingStatus(book) === 'Read'),
        Want: books.filter(book => getReadingStatus(book) === 'Want'),
        Pass: books.filter(book => getReadingStatus(book) === 'Pass'),
        Unread: books.filter(book => getReadingStatus(book) === 'Unread')
      }

      // Print each status group
      Object.entries(booksByStatus).forEach(([status, statusBooks]) => {
        if (statusBooks.length === 0) return

        checkPageBreak(lineHeight * 2)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`${status.toUpperCase()} (${statusBooks.length})`, margin, yPos)
        yPos += lineHeight * 1.2

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        
        statusBooks.forEach(book => {
          checkPageBreak(lineHeight * 2)
          const title = book.title || 'Unknown Title'
          const author = book.author || 'Unknown Author'
          const date = book.publishedDate || 'Unknown date'
          
          // Check if title fits on one line
          const titleWidth = doc.getTextWidth(title)
          const maxWidth = pageWidth - margin * 2 - 10
          
          if (titleWidth > maxWidth) {
            // Split title across multiple lines
            const words = title.split(' ')
            let currentLine = ''
            words.forEach((word, index) => {
              const testLine = currentLine + (currentLine ? ' ' : '') + word
              if (doc.getTextWidth(testLine) > maxWidth && currentLine) {
                doc.text(`  ${currentLine}`, margin + 5, yPos)
                yPos += lineHeight
                currentLine = word
              } else {
                currentLine = testLine
              }
              if (index === words.length - 1) {
                doc.text(`  ${currentLine}`, margin + 5, yPos)
                yPos += lineHeight
              }
            })
          } else {
            doc.text(`  ${title}`, margin + 5, yPos)
            yPos += lineHeight
          }
          
          doc.setFont('helvetica', 'italic')
          doc.text(`    by ${author} (${date})`, margin + 5, yPos)
          yPos += lineHeight * 1.2
          doc.setFont('helvetica', 'normal')
        })
        
        yPos += lineHeight * 0.5
      })

      // Save the PDF
      doc.save(`mybookshelf-export-${new Date().toISOString().split('T')[0]}.pdf`)

      toast({
        title: "Export Successful!",
        description: "Your bookshelf data has been downloaded as PDF.",
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({
        title: "Export Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    }
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
                onClick={exportToPDF}
                variant="outline"
                className="justify-start bg-orange-50 border-orange-300 hover:bg-orange-100"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export as PDF (Print-Friendly)
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
