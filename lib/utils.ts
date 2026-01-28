// Check if a book is a special edition, graded reader, or abridged version
export function isSpecialEdition(book: any): boolean {
  const title = (book.title || "").toLowerCase()
  const description = (book.description || "").toLowerCase()
  const categories = (book.categories || []).map((cat: string) => cat.toLowerCase()).join(" ")
  const pageCount = book.pageCount || 0
  
  // Combined text for checking
  const combinedText = `${title} ${description} ${categories}`.toLowerCase()
  
  // Special edition indicators - graded readers, ELT, abridged versions
  const specialEditionIndicators = [
    "penguin readers",
    "elt graded reader",
    "graded reader",
    "elt reader",
    "english language teaching",
    "level 1", "level 2", "level 3", "level 4", "level 5", "level 6", "level 7",
    "level one", "level two", "level three", "level four", "level five", "level six", "level seven",
    "abridged", "abridged edition", "abridged version",
    "simplified", "simplified edition", "simplified version",
    "easy reader", "beginner reader", "intermediate reader",
    "adapted", "adapted edition", "adapted version",
    "retold", "retold edition",
    "oxford bookworms", "macmillan readers", "cambridge readers",
    "black cat", "green apple", "dominoes",
    "young adult reader", "ya reader" // if it's a simplified YA version
  ]
  
  // Check for special edition indicators in title/description
  if (specialEditionIndicators.some(indicator => combinedText.includes(indicator))) {
    return true
  }
  
  // Check for "Level" followed by a number (e.g., "Level 6", "Level Six")
  if (/\blevel\s+\d+\b/i.test(title) || /\blevel\s+(one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(title)) {
    return true
  }
  
  // Check for suspiciously short page counts that might indicate graded readers
  // Most full novels are 200+ pages. Graded readers are often under 100-150 pages
  // But we need to be careful - some legitimate books can be short
  // So we'll only flag if it's very short AND has other indicators
  if (pageCount > 0 && pageCount < 100 && (
    combinedText.includes("reader") || 
    combinedText.includes("graded") ||
    combinedText.includes("elt") ||
    combinedText.includes("level")
  )) {
    return true
  }
  
  // Check for "ELT" or "English Language Teaching" in any form
  if (combinedText.includes("elt") || combinedText.includes("english language teaching")) {
    return true
  }
  
  return false
}

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

export function deduplicateBooks(books: any[], userCountry: string = "US") {
  const bookGroups = new Map<string, any[]>()

  // First, filter out unwanted editions and group books by normalized title+author
  books.forEach((book) => {
    // Filter out special editions, graded readers, and abridged versions
    if (isSpecialEdition(book)) {
      return
    }
    
    const title = book.title?.toLowerCase() || ""
    const description = book.description?.toLowerCase() || ""

    // Filter out free previews, samples
    if (
      title.includes("free preview") ||
      title.includes("sample") ||
      description.includes("free preview") ||
      description.includes("sample chapter")
    ) {
      return
    }

    // Filter out special editions, reprints, and media tie-ins (title only; description often has "bestselling", etc.)
    const unwantedIndicators = [
      "netflix",
      "tv tie-in",
      "movie tie-in",
      "film tie-in",
      "television tie-in",
      "streaming tie-in",
      "now a major motion picture",
      "now a netflix series",
      "now a tv series",
      "now streaming",
      "coming soon to",
      "movie edition",
      "tv edition",
      "film edition",
      "netflix edition",
      "streaming edition",
      "television edition",
      "anniversary edition",
      "special edition",
      "collector's edition",
      "deluxe edition",
      "premium edition",
      "limited edition",
      "commemorative edition",
      "reissue",
      "reprint",
      "new edition",
      "revised edition",
      "updated edition",
      "expanded edition",
      "enhanced edition",
      "movie cover",
      "tv cover",
      "film cover",
      "netflix cover",
      "media tie-in",
      "adaptation",
      "based on the",
      "inspiration for",
      "soon to be a",
      "major motion picture",
      "blockbuster film",
      "hit series",
      "popular series",
      "bestselling series",
      "award-winning series",
    ]

    const hasUnwantedIndicator = unwantedIndicators.some(
      (indicator) => title.includes(indicator)
    )

    if (hasUnwantedIndicator) {
      return
    }

    // Create unique key from normalized title and author (without publication year to group all editions)
    // Strip out series information, subtitles, and edition indicators
    let normalizedTitle = title
      // Remove series information (e.g., ": CORMORAN STRIKE BOOK 7", "BOOK 1", etc.)
      .replace(/:\s*(book|novel|volume|vol\.?)\s*\d+/gi, "")
      .replace(/\s*\(book\s*\d+\)/gi, "")
      .replace(/\s*\[book\s*\d+\]/gi, "")
      // Remove common subtitle separators and everything after them if they indicate series
      .replace(/:\s*[^:]+(?:book|novel|volume|vol\.?)\s*\d+/gi, "")
      // Remove edition indicators from title
      .replace(/\s*\(.*edition.*\)/gi, "")
      .replace(/\s*\[.*edition.*\]/gi, "")
      // Normalize punctuation and whitespace
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
    
    const author = (book.authors?.[0] || book.author || "unknown").toLowerCase().trim()
    // Don't include publication year in key - we want to group all editions together
    const key = `${normalizedTitle}|${author}`

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
    // Default to US if no country specified
    const targetCountry = userCountry || "US"
    const countryCodes: Record<string, string> = {
      "united states": "US",
      "usa": "US",
      "us": "US",
      "united kingdom": "UK",
      "uk": "UK",
      "canada": "CA",
      "australia": "AU",
      "new zealand": "NZ",
      "ireland": "IE",
    }
    const normalizedCountry = countryCodes[targetCountry.toLowerCase()] || targetCountry.toUpperCase()

    const sortedBooks = bookGroup.sort((a, b) => {
      // Priority 1: Filter out special editions, reprints, and media tie-ins
      const unwantedIndicators = [
        "netflix", "tv tie-in", "movie tie-in", "film tie-in", "television tie-in",
        "streaming tie-in", "now a major motion picture", "now a netflix series",
        "now a tv series", "now streaming", "movie edition", "tv edition",
        "film edition", "netflix edition", "streaming edition", "television edition",
        "anniversary edition", "special edition", "collector's edition",
        "deluxe edition", "premium edition", "limited edition", "commemorative edition",
        "reissue", "reprint", "new edition", "revised edition", "updated edition",
        "expanded edition", "enhanced edition", "movie cover", "tv cover", "film cover",
        "netflix cover", "media tie-in", "adaptation", "based on the",
        "inspiration for", "soon to be a", "major motion picture", "blockbuster film",
        "hit series", "popular series", "bestselling series", "award-winning series",
      ]
      
      const titleA = (a.title || "").toLowerCase()
      const descA = (a.description || "").toLowerCase()
      const titleB = (b.title || "").toLowerCase()
      const descB = (b.description || "").toLowerCase()
      
      const hasUnwantedA = unwantedIndicators.some(ind => titleA.includes(ind) || descA.includes(ind))
      const hasUnwantedB = unwantedIndicators.some(ind => titleB.includes(ind) || descB.includes(ind))
      
      if (hasUnwantedA && !hasUnwantedB) return 1
      if (!hasUnwantedA && hasUnwantedB) return -1

      // Priority 2: Earlier publication date (original publication)
      const dateA = a.publishedDate ? new Date(a.publishedDate) : new Date("9999-12-31")
      const dateB = b.publishedDate ? new Date(b.publishedDate) : new Date("9999-12-31")

      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime()
      }

      // Priority 2: Prefer original publishers over reprints
      const publisherA = a.publisher?.toLowerCase() || ""
      const publisherB = b.publisher?.toLowerCase() || ""

      // Common original publishers (prioritize these)
      const originalPublishers = [
        "faber and faber",
        "faber & faber",
        "faber",
        "vintage",
        "vintage books",
        "penguin",
        "penguin books",
        "penguin random house",
        "harpercollins",
        "harper collins",
        "simon & schuster",
        "simon and schuster",
        "macmillan",
        "st. martin's press",
        "st martin's press",
        "little, brown",
        "little brown",
        "doubleday",
        "knopf",
        "random house",
        "houghton mifflin",
        "houghton mifflin harcourt",
        "fsg",
        "farrar, straus and giroux",
        "farrar straus giroux",
        "grove press",
        "atlantic monthly press",
        "w. w. norton",
        "ww norton",
        "norton",
      ]

      const isOriginalA = originalPublishers.some((pub) => publisherA.includes(pub))
      const isOriginalB = originalPublishers.some((pub) => publisherB.includes(pub))

      if (isOriginalA && !isOriginalB) return -1
      if (!isOriginalA && isOriginalB) return 1

      // Priority 3: Prefer books without special edition indicators (already filtered above, but double-check)
      const specialIndicators = ["edition", "reprint", "reissue", "anniversary", "special", "collector", "deluxe", "premium", "limited", "commemorative"]
      const hasSpecialA = specialIndicators.some(
        (indicator) => a.title?.toLowerCase().includes(indicator) || a.description?.toLowerCase().includes(indicator),
      )
      const hasSpecialB = specialIndicators.some(
        (indicator) => b.title?.toLowerCase().includes(indicator) || b.description?.toLowerCase().includes(indicator),
      )

      if (hasSpecialA && !hasSpecialB) return 1
      if (!hasSpecialA && hasSpecialB) return -1

      // Priority 4: Prefer books with more complete information (including ISBN)
      const completenessA = (a.description ? 1 : 0) + (a.pageCount ? 1 : 0) + (a.thumbnail ? 1 : 0) + (a.isbn ? 1 : 0)
      const completenessB = (b.description ? 1 : 0) + (b.pageCount ? 1 : 0) + (b.thumbnail ? 1 : 0) + (b.isbn ? 1 : 0)

      if (completenessA !== completenessB) {
        return completenessB - completenessA
      }

      return 0
    })

    // Take the best book (first in sorted array)
    result.push(sortedBooks[0])
  })

  return result
}
