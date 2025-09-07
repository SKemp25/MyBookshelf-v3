export function cn(...inputs: (string | undefined | null | boolean | Record<string, boolean>)[]) {
  return inputs
    .filter(Boolean)
    .map((input) => {
      if (typeof input === "string") return input
      if (typeof input === "object" && input !== null) {
        return Object.entries(input)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ")
      }
      return ""
    })
    .join(" ")
    .trim()
}

export function deduplicateBooks(books: any[]) {
  const bookGroups = new Map<string, any[]>()

  // First, filter out free preview editions and group books by normalized title+author
  books.forEach((book) => {
    const title = book.title?.toLowerCase() || ""
    const description = book.description?.toLowerCase() || ""

    if (
      title.includes("free preview") ||
      title.includes("sample") ||
      description.includes("free preview") ||
      description.includes("sample chapter")
    ) {
      return
    }

    // Create unique key from normalized title and author
    const normalizedTitle = title
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
    const author = book.authors?.[0] || book.author || "unknown"
    const key = `${normalizedTitle}-${author}`.toLowerCase()

    if (!bookGroups.has(key)) {
      bookGroups.set(key, [])
    }
    bookGroups.get(key)!.push(book)
  })

  // For each group, select the best version (original publication)
  const result: any[] = []
  
  bookGroups.forEach((bookGroup) => {
    if (bookGroup.length === 1) {
      result.push(bookGroup[0])
      return
    }

    // Sort books to prioritize original publications
    const sortedBooks = bookGroup.sort((a, b) => {
      // Priority 1: Earlier publication date
      const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date('9999-12-31')
      const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date('9999-12-31')
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime()
      }

      // Priority 2: Prefer original publishers over reprints
      const publisherA = a.publisher?.toLowerCase() || ""
      const publisherB = b.publisher?.toLowerCase() || ""
      
      // Common original publishers (prioritize these)
      const originalPublishers = [
        "faber and faber", "faber & faber", "faber",
        "vintage", "vintage books",
        "penguin", "penguin books", "penguin random house",
        "harpercollins", "harper collins",
        "simon & schuster", "simon and schuster",
        "macmillan", "st. martin's press", "st martin's press",
        "little, brown", "little brown",
        "doubleday", "knopf", "random house",
        "houghton mifflin", "houghton mifflin harcourt",
        "fsg", "farrar, straus and giroux", "farrar straus giroux",
        "grove press", "atlantic monthly press",
        "w. w. norton", "ww norton", "norton"
      ]

      const isOriginalA = originalPublishers.some(pub => publisherA.includes(pub))
      const isOriginalB = originalPublishers.some(pub => publisherB.includes(pub))

      if (isOriginalA && !isOriginalB) return -1
      if (!isOriginalA && isOriginalB) return 1

      // Priority 3: Prefer books with more complete information
      const completenessA = (a.description ? 1 : 0) + (a.pageCount ? 1 : 0) + (a.thumbnail ? 1 : 0)
      const completenessB = (b.description ? 1 : 0) + (b.pageCount ? 1 : 0) + (b.thumbnail ? 1 : 0)
      
      if (completenessA !== completenessB) {
        return completenessB - completenessA
      }

      // Priority 4: Prefer books without special edition indicators
      const specialIndicators = ["edition", "reprint", "reissue", "anniversary", "special", "collector", "deluxe"]
      const hasSpecialA = specialIndicators.some(indicator => 
        a.title?.toLowerCase().includes(indicator) || a.description?.toLowerCase().includes(indicator)
      )
      const hasSpecialB = specialIndicators.some(indicator => 
        b.title?.toLowerCase().includes(indicator) || b.description?.toLowerCase().includes(indicator)
      )

      if (hasSpecialA && !hasSpecialB) return 1
      if (!hasSpecialA && hasSpecialB) return -1

      return 0
    })

    // Take the best book (first in sorted array)
    result.push(sortedBooks[0])
  })

  return result
}
