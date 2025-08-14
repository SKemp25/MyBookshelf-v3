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
  const seen = new Set<string>()

  return books.filter((book) => {
    // Filter out free preview editions
    const title = book.title?.toLowerCase() || ""
    const description = book.description?.toLowerCase() || ""

    if (
      title.includes("free preview") ||
      title.includes("sample") ||
      description.includes("free preview") ||
      description.includes("sample chapter")
    ) {
      return false
    }

    // Create unique key from normalized title and author
    const normalizedTitle = title
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim()
    const author = book.authors?.[0] || "unknown"
    const key = `${normalizedTitle}-${author}`.toLowerCase()

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}
