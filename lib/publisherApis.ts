export interface PublisherBook {
  title: string
  author: string
  isbn: string
  publishDate: string
  publisher: string
  description?: string
  coverUrl?: string
  genre?: string
}

// Publisher API configurations
const PUBLISHER_APIS = {
  penguinRandomHouse: {
    baseUrl: "https://api.penguinrandomhouse.com/resources/v2",
    // Note: This would require API key registration
    apiKey: process.env.PRH_API_KEY,
  },
  // Add other publishers as needed
}

export async function fetchUpcomingReleasesByAuthor(authorName: string): Promise<PublisherBook[]> {
  const books: PublisherBook[] = []

  try {
    if (PUBLISHER_APIS.penguinRandomHouse.apiKey) {
      const prhBooks = await fetchFromPenguinRandomHouse(authorName)
      books.push(...prhBooks)
    } else {
      console.log("PRH API key not available, skipping publisher API")
    }

    // Could add other publishers here
    // const hcBooks = await fetchFromHarperCollins(authorName);
    // books.push(...hcBooks);
  } catch (error) {
    console.error("Error fetching from publisher APIs:", error)
  }

  return books
}

async function fetchFromPenguinRandomHouse(authorName: string): Promise<PublisherBook[]> {
  const books: PublisherBook[] = []

  try {
    if (!PUBLISHER_APIS.penguinRandomHouse.apiKey) {
      console.log("PRH API key not configured, skipping PRH API")
      return books
    }

    // Search for upcoming releases by this author
    const searchUrl = `${PUBLISHER_APIS.penguinRandomHouse.baseUrl}/title?author=${encodeURIComponent(authorName)}&showComingSoon=true&format=json`

    const response = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${PUBLISHER_APIS.penguinRandomHouse.apiKey}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 403) {
        console.log(`PRH API access denied (403) - API key may be invalid or expired`)
      } else if (response.status === 401) {
        console.log(`PRH API unauthorized (401) - API key may be missing or invalid`)
      } else {
        console.log(`PRH API error: ${response.status}`)
      }
      // Return empty array instead of throwing error
      return books
    }

    const data = await response.json()

    if (data.data && data.data.titles) {
      for (const title of data.data.titles) {
        // Only include books that are actually by this author
        const bookAuthor = title.authorsText || title.authors?.[0]?.display || ""
        if (
          bookAuthor.toLowerCase().includes(authorName.toLowerCase()) ||
          authorName.toLowerCase().includes(bookAuthor.toLowerCase())
        ) {
          books.push({
            title: title.title || "",
            author: bookAuthor,
            isbn: title.isbn || title.isbn13 || "",
            publishDate: title.onsaleDate || title.publicationDate || "",
            publisher: "Penguin Random House",
            description: title.description || title.keynote || "",
            coverUrl: title.jacketUrl || title.coverUrl || "",
            genre: title.categories?.[0] || title.genre || "",
          })
        }
      }
    }
  } catch (error) {
    console.error("Error fetching from Penguin Random House:", error)
    // Scraping would require additional setup and CORS handling
  }

  return books
}

// Fallback web scraping for when APIs are not available
async function scrapeUpcomingReleases(authorName: string): Promise<PublisherBook[]> {
  console.log(`Publisher API not available for ${authorName}, falling back to Google Books API`)
  return []
}

// Convert PublisherBook to our internal Book format
export function convertPublisherBookToBook(publisherBook: PublisherBook): any {
  return {
    id: publisherBook.isbn || `${publisherBook.title}-${publisherBook.author}`.replace(/\s+/g, "-"),
    title: publisherBook.title,
    author: publisherBook.author,
    authorId: publisherBook.author,
    publishedDate: publisherBook.publishDate,
    description: publisherBook.description || "",
    thumbnail:
      publisherBook.coverUrl ||
      `/placeholder.svg?height=200&width=150&query=${encodeURIComponent(publisherBook.title)}`,
    language: "en", // Default to English, could be enhanced
    pageCount: 0, // Not available from publisher APIs typically
    categories: publisherBook.genre ? [publisherBook.genre] : [],
    publisher: publisherBook.publisher,
    isbn: publisherBook.isbn,
    status: "unread" as const,
  }
}
