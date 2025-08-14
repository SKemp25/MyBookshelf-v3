import { type NextRequest, NextResponse } from "next/server"

// Mock book data for demonstration
const mockBooks = [
  {
    id: "1",
    title: "White Teeth",
    authors: ["Zadie Smith"],
    publishedDate: "2000",
    description: "A brilliant debut novel exploring multicultural Britain through the lives of two families.",
    thumbnail: "/placeholder.svg?height=200&width=150&text=White+Teeth",
    pageCount: 448,
    language: "en",
    genre: "Literary Fiction",
    isbn: "9780140276336",
    publisher: "Penguin Books",
  },
  {
    id: "2",
    title: "On Beauty",
    authors: ["Zadie Smith"],
    publishedDate: "2005",
    description: "A novel about family, friendship, and the meaning of beauty in contemporary life.",
    thumbnail: "/placeholder.svg?height=200&width=150&text=On+Beauty",
    pageCount: 445,
    language: "en",
    genre: "Literary Fiction",
    isbn: "9780141019451",
    publisher: "Penguin Books",
  },
  {
    id: "3",
    title: "NW",
    authors: ["Zadie Smith"],
    publishedDate: "2012",
    description: "A novel set in northwest London, following the lives of four characters.",
    thumbnail: "/placeholder.svg?height=200&width=150&text=NW",
    pageCount: 333,
    language: "en",
    genre: "Literary Fiction",
    isbn: "9780241144305",
    publisher: "Penguin Books",
  },
  {
    id: "4",
    title: "Midnight's Children",
    authors: ["Salman Rushdie"],
    publishedDate: "1981",
    description: "A masterpiece of magical realism about India's transition from British colonialism to independence.",
    thumbnail: "/placeholder.svg?height=200&width=150&text=Midnight's+Children",
    pageCount: 647,
    language: "en",
    genre: "Magical Realism",
    isbn: "9780140118247",
    publisher: "Penguin Books",
    seriesInfo: null,
  },
  {
    id: "5",
    title: "The Satanic Verses",
    authors: ["Salman Rushdie"],
    publishedDate: "1988",
    description: "A controversial novel blending magical realism with religious themes.",
    thumbnail: "/placeholder.svg?height=200&width=150&text=The+Satanic+Verses",
    pageCount: 547,
    language: "en",
    genre: "Magical Realism",
    isbn: "9780140143355",
    publisher: "Penguin Books",
  },
  {
    id: "6",
    title: "Atonement",
    authors: ["Ian McEwan"],
    publishedDate: "2001",
    description: "A sweeping novel about guilt, forgiveness, and the power of imagination.",
    thumbnail: "/placeholder.svg?height=200&width=150&text=Atonement",
    pageCount: 351,
    language: "en",
    genre: "Literary Fiction",
    isbn: "9780099429791",
    publisher: "Penguin Books",
  },
  {
    id: "7",
    title: "Saturday",
    authors: ["Ian McEwan"],
    publishedDate: "2005",
    description: "A novel set over the course of a single day in London.",
    thumbnail: "/placeholder.svg?height=200&width=150&text=Saturday",
    pageCount: 289,
    language: "en",
    genre: "Literary Fiction",
    isbn: "9780099469681",
    publisher: "Penguin Books",
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const author = searchParams.get("author")
  const includeAll = searchParams.get("includeAll") === "true"

  if (!author) {
    return NextResponse.json({ error: "Author parameter is required" }, { status: 400 })
  }

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Filter books by author
  const authorBooks = mockBooks.filter((book) =>
    book.authors.some((bookAuthor) => bookAuthor.toLowerCase().includes(author.toLowerCase())),
  )

  // If includeAll is false, only return Penguin books (for demo, we'll return all since our mock data is all Penguin)
  const filteredBooks = includeAll ? authorBooks : authorBooks

  return NextResponse.json(filteredBooks)
}
