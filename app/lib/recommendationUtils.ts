import type { Author, Book, User } from "./types"
import { fetchRecommendationsWithCache } from "@/lib/apiCache"

interface RecommendationParams {
  authors: Author[]
  books: Book[]
  readBooks: Set<string>
  wantToReadBooks: Set<string>
  dontWantBooks: Set<string>
  userGroups: string[]
  userPreferences?: User // Added user preferences
}

export async function generateRecommendations({
  authors,
  books,
  readBooks,
  wantToReadBooks,
  dontWantBooks,
  userPreferences,
}: RecommendationParams): Promise<Book[]> {
  if (!authors || authors.length === 0) {
    return []
  }

  const existingBookIds = new Set(books.map((book) => book.id))
  const existingBookTitles = new Set(
    books.map((book) => `${book.title.toLowerCase()}-${book.author?.toLowerCase() || ""}`),
  )

  const preferredGenres = userPreferences?.preferredGenres || []
  const preferredLanguages = userPreferences?.preferredLanguages || ["en"]

  const recommendations: Book[] = []

  try {
    // Get recommendations based on existing authors
    for (const authorName of authors.slice(0, 3)) {
      const searchQueries = [
        `author:"${authorName}" subject:fiction -subject:romance -subject:"romantic fiction"`,
        `author:"${authorName}" subject:mystery`,
        `author:"${authorName}" subject:thriller`,
        `author:"${authorName}" subject:literary`,
      ]

      if (preferredGenres.length > 0) {
        preferredGenres.forEach((genre) => {
          const genreQuery = genre.toLowerCase().replace(/[^a-z0-9\s]/g, "")
          searchQueries.unshift(`author:"${authorName}" subject:"${genreQuery}"`)
        })
      }

      // Use cached API call for recommendations
      try {
        const apiResults = await fetchRecommendationsWithCache(
          authorNames.slice(0, 3), // Limit to first 3 authors
          preferredGenres.slice(0, 2), // Limit to first 2 genres
          preferredLanguages
        )

        if (apiResults.length > 0) {
          const newBooks = apiResults
              .filter((item: any) => {
                const volumeInfo = item.volumeInfo

                if (!volumeInfo.title || !volumeInfo.authors || !volumeInfo.authors.length) return false
                if (!volumeInfo.publishedDate || !volumeInfo.description) return false
                if (volumeInfo.title.toLowerCase().includes("preview")) return false
                if (volumeInfo.title.toLowerCase().includes("sample")) return false

                if (preferredGenres.length > 0 && volumeInfo.categories) {
                  const bookGenres = volumeInfo.categories.map((cat: string) => cat.toLowerCase())
                  const hasPreferredGenre = preferredGenres.some((prefGenre) =>
                    bookGenres.some(
                      (bookGenre) =>
                        bookGenre.includes(prefGenre.toLowerCase()) || prefGenre.toLowerCase().includes(bookGenre),
                    ),
                  )

                  const hasUnwantedGenre = bookGenres.some(
                    (genre) => genre.includes("romance") || genre.includes("romantic") || genre.includes("erotica"),
                  )

                  if (
                    !hasPreferredGenre ||
                    (hasUnwantedGenre && !preferredGenres.some((g) => g.toLowerCase().includes("romance")))
                  ) {
                    return false
                  }
                }

                return true
              })
              .map((item: any) => {
                const volumeInfo = item.volumeInfo
                const authorName = volumeInfo.authors[0]

                return {
                  id: item.id,
                  title: volumeInfo.title,
                  author: authorName,
                  authorId: authorName,
                  authors: volumeInfo.authors,
                  description: volumeInfo.description,
                  publishedDate: volumeInfo.publishedDate,
                  pageCount: volumeInfo.pageCount,
                  categories: volumeInfo.categories || [],
                  thumbnail: volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:"),
                  language: volumeInfo.language || "en",
                  genre: volumeInfo.categories?.[0] || "Fiction",
                  seriesInfo: null,
                } as Book
              })
              .filter((book: Book) => {
                // Filter out books already in collection
                if (existingBookIds.has(book.id)) return false

                const bookKey = `${book.title.toLowerCase()}-${book.author?.toLowerCase() || ""}`
                if (existingBookTitles.has(bookKey)) return false

                // Filter out books by authors already in collection (we want new authors)
                const bookAuthor = book.author?.toLowerCase() || ""
                const existingAuthors = authors.map((a) => a.toLowerCase())
                if (existingAuthors.includes(bookAuthor)) return false

                if (preferredLanguages.length > 0 && !preferredLanguages.includes(book.language || "en")) {
                  return false
                }

                return true
              })

            recommendations.push(...newBooks)
          }
        } catch (error) {
          console.error("Error fetching recommendations:", error)
        }

        // Break after first successful query for this author
        if (recommendations.length > 0) break
      }

      // Stop if we have enough recommendations
      if (recommendations.length >= 20) break
    }

    if (preferredGenres.length > 0) {
      for (const genre of preferredGenres.slice(0, 2)) {
        try {
          const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=subject:"${encodeURIComponent(genre)}" -subject:romance&maxResults=5&orderBy=relevance&printType=books&langRestrict=${preferredLanguages[0] || "en"}`,
          )

          if (response.ok) {
            const data = await response.json()

            if (data.items) {
              const genreBooks = data.items
                .filter((item: any) => {
                  const volumeInfo = item.volumeInfo
                  return volumeInfo.title && volumeInfo.authors && volumeInfo.publishedDate && volumeInfo.description
                })
                .map((item: any) => {
                  const volumeInfo = item.volumeInfo
                  const authorName = volumeInfo.authors[0]

                  return {
                    id: item.id,
                    title: volumeInfo.title,
                    author: authorName,
                    authorId: authorName,
                    authors: volumeInfo.authors,
                    description: volumeInfo.description,
                    publishedDate: volumeInfo.publishedDate,
                    pageCount: volumeInfo.pageCount,
                    categories: volumeInfo.categories || [],
                    thumbnail: volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:"),
                    language: volumeInfo.language || "en",
                    genre: volumeInfo.categories?.[0] || genre,
                    seriesInfo: null,
                  } as Book
                })
                .filter((book: Book) => {
                  if (existingBookIds.has(book.id)) return false

                  const bookKey = `${book.title.toLowerCase()}-${book.author?.toLowerCase() || ""}`
                  if (existingBookTitles.has(bookKey)) return false

                  return true
                })

              recommendations.push(...genreBooks)
            }
          }
        } catch (error) {
          console.error(`Error fetching genre recommendations for ${genre}:`, error)
        }
      }
    }

    // Remove duplicates and score recommendations
    const uniqueRecommendations = recommendations.filter(
      (book, index, self) => index === self.findIndex((b) => b.id === book.id),
    )

    // Score and sort recommendations
    const scoredRecommendations = uniqueRecommendations.map((book) => {
      let score = Math.random() * 10 // Base random score for variety

      if (preferredGenres.length > 0 && book.categories) {
        const bookGenres = book.categories.map((cat) => cat.toLowerCase())
        const matchesPreferredGenre = preferredGenres.some((prefGenre) =>
          bookGenres.some(
            (bookGenre) => bookGenre.includes(prefGenre.toLowerCase()) || prefGenre.toLowerCase().includes(bookGenre),
          ),
        )
        if (matchesPreferredGenre) score += 25
      }

      // Prefer books with descriptions
      if (book.description && book.description.length > 100) score += 15

      // Prefer books with thumbnails
      if (book.thumbnail) score += 10

      // Prefer recent publications
      if (book.publishedDate) {
        const year = new Date(book.publishedDate).getFullYear()
        const currentYear = new Date().getFullYear()
        const yearDiff = currentYear - year
        if (yearDiff <= 3) score += 20
        else if (yearDiff <= 10) score += 10
        else if (yearDiff <= 20) score += 5
      }

      // Prefer reasonable page counts
      if (book.pageCount && book.pageCount >= 150 && book.pageCount <= 600) {
        score += 8
      }

      return { book, score }
    })

    return scoredRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((item) => item.book)
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return []
  }
}
