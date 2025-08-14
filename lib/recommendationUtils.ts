import type { RecommendationParams, Book } from "./types"

export async function generateRecommendations({
  authors,
  books,
  readBooks,
  wantToReadBooks,
  dontWantBooks,
  userPreferences,
}: RecommendationParams): Promise<Book[]> {
  console.log("📚 Generating recommendations for different authors...")
  console.log("User's authors:", authors)
  console.log("User preferences:", userPreferences)

  // Get existing book titles and authors to avoid duplicates
  const existingBookTitles = new Set(books.map((book) => book.title.toLowerCase().trim()))
  const existingBookIds = new Set(books.map((book) => book.id))
  const existingAuthors = new Set(
    authors.map((author) => (typeof author === "string" ? author.toLowerCase() : author.name?.toLowerCase() || "")),
  )

  const allRecommendations = getCuratedRecommendationsBasedOnAuthors(userPreferences, authors)
  console.log("All curated recommendations:", allRecommendations.length)

  const filteredRecommendations = allRecommendations.filter((book) => {
    // Skip if already in collection
    if (existingBookIds.has(book.id)) {
      console.log("Filtered out (existing ID):", book.title)
      return false
    }

    // Skip if already marked by user
    if (readBooks.has(book.id) || wantToReadBooks.has(book.id) || dontWantBooks.has(book.id)) {
      console.log("Filtered out (user marked):", book.title)
      return false
    }

    const bookAuthor = book.author?.toLowerCase() || book.authors?.[0]?.toLowerCase() || ""
    if (existingAuthors.has(bookAuthor)) {
      console.log("Filtered out (same author):", book.title, "by", bookAuthor)
      return false
    }

    return true
  })

  console.log(`✅ Generated ${filteredRecommendations.length} recommendations by different authors`)
  return filteredRecommendations.slice(0, 10)
}

function getCuratedRecommendationsBasedOnAuthors(userPreferences?: any, authors?: any[]): Book[] {
  const userAuthors =
    authors?.map((author) => (typeof author === "string" ? author.toLowerCase() : author.name?.toLowerCase() || "")) ||
    []

  // Map user's authors to similar authors and genres
  const authorRecommendationMap: Record<string, Book[]> = {
    "pat barker": [
      {
        id: "rec-pat-barker-1",
        title: "The Song of Achilles",
        author: "Madeline Miller",
        authorId: "madeline-miller",
        authors: ["Madeline Miller"],
        publishedDate: "2011-09-20",
        description: "A stunning retelling of the Iliad from the perspective of Patroclus and Achilles.",
        thumbnail: "/song-of-achilles-cover.png",
        pageCount: 416,
        language: "en",
        genre: "Historical Fiction",
        isbn: "9780062060624",
        publisher: "Ecco",
        averageRating: 4.4,
        ratingsCount: 45000,
        previewLink: "",
        infoLink: "",
      },
      {
        id: "rec-pat-barker-2",
        title: "Ariadne",
        author: "Jennifer Saint",
        authorId: "jennifer-saint",
        authors: ["Jennifer Saint"],
        publishedDate: "2021-05-04",
        description: "The story of Ariadne, princess of Crete, who helped Theseus escape the labyrinth.",
        thumbnail: "/abstract-book-cover.png",
        pageCount: 336,
        language: "en",
        genre: "Historical Fiction",
        isbn: "9781472273932",
        publisher: "Wildfire",
        averageRating: 4.2,
        ratingsCount: 28000,
        previewLink: "",
        infoLink: "",
      },
      {
        id: "rec-pat-barker-3",
        title: "All the Light We Cannot See",
        author: "Anthony Doerr",
        authorId: "anthony-doerr",
        authors: ["Anthony Doerr"],
        publishedDate: "2014-05-06",
        description: "A blind French girl and a German boy's paths collide in occupied France during WWII.",
        thumbnail: "/all-the-light-we-cannot-see-cover.png",
        pageCount: 544,
        language: "en",
        genre: "Historical Fiction",
        isbn: "9781476746586",
        publisher: "Scribner",
        averageRating: 4.3,
        ratingsCount: 38000,
        previewLink: "",
        infoLink: "",
      },
    ],
    "kate atkinson": [
      {
        id: "rec-kate-atkinson-1",
        title: "Autumn",
        author: "Ali Smith",
        authorId: "ali-smith",
        authors: ["Ali Smith"],
        publishedDate: "2016-10-20",
        description: "The first novel in the Seasonal Quartet, exploring art, time, love, and hope.",
        thumbnail: "/autumn-ali-smith-book-cover.png",
        pageCount: 272,
        language: "en",
        genre: "Literary Fiction",
        isbn: "9780241207086",
        publisher: "Hamish Hamilton",
        averageRating: 4.1,
        ratingsCount: 15000,
        previewLink: "",
        infoLink: "",
      },
      {
        id: "rec-kate-atkinson-2",
        title: "Nineteen Minutes",
        author: "Jodi Picoult",
        authorId: "jodi-picoult",
        authors: ["Jodi Picoult"],
        publishedDate: "2007-03-06",
        description: "A powerful novel about a school shooting and its aftermath on a small town.",
        thumbnail: "/nineteen-minutes-book-cover.png",
        pageCount: 455,
        language: "en",
        genre: "Literary Fiction",
        isbn: "9780743496735",
        publisher: "Atria Books",
        averageRating: 4.3,
        ratingsCount: 32000,
        previewLink: "",
        infoLink: "",
      },
    ],
    "kristin hannah": [
      {
        id: "rec-kristin-hannah-1",
        title: "All the Light We Cannot See",
        author: "Anthony Doerr",
        authorId: "anthony-doerr",
        authors: ["Anthony Doerr"],
        publishedDate: "2014-05-06",
        description: "A blind French girl and a German boy's paths collide in occupied France during WWII.",
        thumbnail: "/all-the-light-we-cannot-see-cover.png",
        pageCount: 544,
        language: "en",
        genre: "Historical Fiction",
        isbn: "9781476746586",
        publisher: "Scribner",
        averageRating: 4.3,
        ratingsCount: 38000,
        previewLink: "",
        infoLink: "",
      },
      {
        id: "rec-kristin-hannah-2",
        title: "The Book Thief",
        author: "Markus Zusak",
        authorId: "markus-zusak",
        authors: ["Markus Zusak"],
        publishedDate: "2005-09-01",
        description: "A story about a young girl living in Nazi Germany who steals books and shares them with others.",
        thumbnail: "/abstract-book-cover.png",
        pageCount: 552,
        language: "en",
        genre: "Historical Fiction",
        isbn: "9780375842207",
        publisher: "Knopf Books",
        averageRating: 4.4,
        ratingsCount: 45000,
        previewLink: "",
        infoLink: "",
      },
    ],
  }

  // General high-quality recommendations for any user
  const generalRecommendations: Book[] = [
    {
      id: "general-1",
      title: "The Seven Husbands of Evelyn Hugo",
      author: "Taylor Jenkins Reid",
      authorId: "taylor-jenkins-reid",
      authors: ["Taylor Jenkins Reid"],
      publishedDate: "2017-06-13",
      description: "A reclusive Hollywood icon finally tells her story to a young journalist.",
      thumbnail: "/seven-husbands-evelyn-hugo.png",
      pageCount: 400,
      language: "en",
      genre: "Literary Fiction",
      isbn: "9781501161933",
      publisher: "Atria Books",
      averageRating: 4.5,
      ratingsCount: 50000,
      previewLink: "",
      infoLink: "",
    },
    {
      id: "general-2",
      title: "The Ocean at the End of the Lane",
      author: "Neil Gaiman",
      authorId: "neil-gaiman",
      authors: ["Neil Gaiman"],
      publishedDate: "2013-06-18",
      description: "A middle-aged man returns to his childhood home and remembers a magical and terrifying event.",
      thumbnail: "/ocean-end-lane-book-cover.png",
      pageCount: 181,
      language: "en",
      genre: "Fantasy",
      isbn: "9780062255655",
      publisher: "William Morrow",
      averageRating: 4.2,
      ratingsCount: 35000,
      previewLink: "",
      infoLink: "",
    },
    {
      id: "general-3",
      title: "Project Hail Mary",
      author: "Andy Weir",
      authorId: "andy-weir",
      authors: ["Andy Weir"],
      publishedDate: "2021-05-04",
      description: "A lone astronaut must save humanity in this thrilling space adventure.",
      thumbnail: "/project-hail-mary.png",
      pageCount: 496,
      language: "en",
      genre: "Science Fiction",
      isbn: "9780593135204",
      publisher: "Ballantine Books",
      averageRating: 4.6,
      ratingsCount: 35000,
      previewLink: "",
      infoLink: "",
    },
  ]

  // Get recommendations based on user's authors
  let recommendations: Book[] = []

  for (const userAuthor of userAuthors) {
    if (authorRecommendationMap[userAuthor]) {
      recommendations.push(...authorRecommendationMap[userAuthor])
    }
  }

  // If no specific recommendations found, use general recommendations
  if (recommendations.length === 0) {
    recommendations = generalRecommendations
  } else {
    // Add some general recommendations to the mix
    recommendations.push(...generalRecommendations.slice(0, 2))
  }

  // Remove duplicates by ID
  const uniqueRecommendations = recommendations.filter(
    (book, index, self) => index === self.findIndex((b) => b.id === book.id),
  )

  // Filter by user preferences if available
  let filteredBooks = uniqueRecommendations

  if (userPreferences?.preferredGenres && userPreferences.preferredGenres.length > 0) {
    const genreFiltered = filteredBooks.filter((book) => {
      const bookGenre = book.genre?.toLowerCase() || ""
      const bookDescription = book.description?.toLowerCase() || ""
      return userPreferences.preferredGenres.some(
        (genre: string) => bookGenre.includes(genre.toLowerCase()) || bookDescription.includes(genre.toLowerCase()),
      )
    })

    // If genre filtering results in no books, return all books instead
    filteredBooks = genreFiltered.length > 0 ? genreFiltered : filteredBooks
    console.log("After genre filtering:", filteredBooks.length, "books")
  }

  if (userPreferences?.preferredLanguages && userPreferences.preferredLanguages.length > 0) {
    const langFiltered = filteredBooks.filter((book) => {
      const bookLanguage = book.language || "en"
      return userPreferences.preferredLanguages.includes(bookLanguage)
    })

    // If language filtering results in no books, return all books instead
    filteredBooks = langFiltered.length > 0 ? langFiltered : filteredBooks
    console.log("After language filtering:", filteredBooks.length, "books")
  }

  // Sort by rating and publication date
  return filteredBooks.sort((a, b) => {
    // First by rating (higher first)
    if (a.averageRating !== b.averageRating) {
      return (b.averageRating || 0) - (a.averageRating || 0)
    }
    // Then by publication date (newer first)
    const dateA = new Date(a.publishedDate || "1900-01-01")
    const dateB = new Date(b.publishedDate || "1900-01-01")
    return dateB.getTime() - dateA.getTime()
  })
}
