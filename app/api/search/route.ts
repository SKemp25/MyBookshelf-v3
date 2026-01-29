import { NextRequest, NextResponse } from "next/server"

type NormalizedBook = {
  id: string
  title: string
  author: string
  authors: string[]
  publishedDate: string
  description: string
  thumbnail: string
  language: string
  isbn: string
  publisher: string
  categories: string[]
}

function normalizeLang(lang: string | null | undefined): string {
  const l = (lang || "").toLowerCase().trim()
  if (!l) return "en"
  if (l === "eng") return "en"
  return l
}

function toPublishedDate(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}-01-01`
  }
  if (typeof value === "string") {
    const s = value.trim()
    if (!s) return "Unknown Date"
    if (/^\d{4}$/.test(s)) return `${s}-01-01`
    return s
  }
  return "Unknown Date"
}

function asArrayStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string") as string[]
  return []
}

function mapGoogleItems(items: any[] | undefined): NormalizedBook[] {
  if (!Array.isArray(items)) return []
  return items.map((item) => {
    const volumeInfo = item?.volumeInfo || {}
    const authors = asArrayStrings(volumeInfo.authors)
    const author = authors[0] || "Unknown Author"
    const isbn =
      volumeInfo?.industryIdentifiers?.find((id: any) => id?.type === "ISBN_13")?.identifier ||
      volumeInfo?.industryIdentifiers?.find((id: any) => id?.type === "ISBN_10")?.identifier ||
      ""
    const thumb =
      volumeInfo?.imageLinks?.thumbnail?.replace("http:", "https:") ||
      volumeInfo?.imageLinks?.smallThumbnail?.replace("http:", "https:") ||
      ""

    return {
      id: String(item?.id || `GB-${(volumeInfo?.title || "unknown").replace(/\s+/g, "")}-${author.replace(/\s+/g, "")}`),
      title: String(volumeInfo?.title || "Unknown Title"),
      author,
      authors: authors.length > 0 ? authors : [author],
      publishedDate: toPublishedDate(volumeInfo?.publishedDate),
      description: String(volumeInfo?.description || ""),
      thumbnail: String(thumb || ""),
      language: normalizeLang(volumeInfo?.language),
      isbn: String(isbn || ""),
      publisher: String(volumeInfo?.publisher || ""),
      categories: asArrayStrings(volumeInfo?.categories),
    }
  })
}

function mapOpenLibraryDocs(docs: any[] | undefined): NormalizedBook[] {
  if (!Array.isArray(docs)) return []
  return docs.map((doc) => {
    const authors = asArrayStrings(doc?.author_name)
    const author = authors[0] || "Unknown Author"
    const workKey: string = typeof doc?.key === "string" ? doc.key : ""
    const coverId = doc?.cover_i
    const thumbnail =
      typeof coverId === "number"
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : ""
    const isbn = Array.isArray(doc?.isbn) && typeof doc.isbn[0] === "string" ? doc.isbn[0] : ""
    const publisher =
      Array.isArray(doc?.publisher) && typeof doc.publisher[0] === "string" ? doc.publisher[0] : ""
    const languageRaw =
      Array.isArray(doc?.language) && typeof doc.language[0] === "string" ? doc.language[0] : ""

    return {
      id: workKey ? `OL${workKey}` : `OL-${String(doc?.edition_key?.[0] || doc?.cover_edition_key || doc?.title || "unknown")}`,
      title: String(doc?.title || "Unknown Title"),
      author,
      authors: authors.length > 0 ? authors : [author],
      publishedDate: toPublishedDate(doc?.first_publish_year),
      description: "",
      thumbnail,
      language: normalizeLang(languageRaw),
      isbn,
      publisher,
      categories: asArrayStrings(doc?.subject).slice(0, 20),
    }
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const q = (searchParams.get("q") || "").trim()
  const author = (searchParams.get("author") || "").trim()
  const title = (searchParams.get("title") || "").trim()
  const lang = normalizeLang(searchParams.get("lang") || "en")
  const maxResults = Math.min(Math.max(parseInt(searchParams.get("maxResults") || "10", 10) || 10, 1), 40)

  const googleQuery = (() => {
    if (q) return q
    if (author && title) return `intitle:${title} inauthor:${author}`
    if (author) return `inauthor:"${author}"`
    if (title) return `intitle:${title}`
    return ""
  })()

  if (!googleQuery) {
    return NextResponse.json({ error: "Provide q, title, author, or a combination." }, { status: 400 })
  }

  // 1) Try Google Books first (fast + rich metadata)
  try {
    const googleUrl = new URL("https://www.googleapis.com/books/v1/volumes")
    googleUrl.searchParams.set("q", googleQuery)
    googleUrl.searchParams.set("maxResults", String(maxResults))
    googleUrl.searchParams.set("printType", "books")
    if (lang) googleUrl.searchParams.set("langRestrict", lang)

    const resp = await fetch(googleUrl.toString(), { cache: "no-store" })
    if (resp.ok) {
      const data = await resp.json()
      const books = mapGoogleItems(data?.items)
      if (books.length > 0) return NextResponse.json(books)
    }

    // If rate-limited or otherwise failing, fall through to OpenLibrary.
  } catch {
    // ignore and fall back
  }

  // 2) Fallback: OpenLibrary Search API (no key; server-side avoids browser CORS blocks)
  try {
    const olUrl = new URL("https://openlibrary.org/search.json")
    olUrl.searchParams.set("limit", String(Math.min(maxResults * 5, 100)))
    if (author) olUrl.searchParams.set("author", author)
    if (title) olUrl.searchParams.set("title", title)
    if (!author && !title && q) {
      // OpenLibrary uses 'q' for general search
      olUrl.searchParams.set("q", q)
    }
    // OpenLibrary uses 3-letter language codes like "eng"
    if (lang === "en") olUrl.searchParams.set("language", "eng")

    const resp = await fetch(olUrl.toString(), { cache: "no-store" })
    if (!resp.ok) {
      return NextResponse.json([], { status: 200 })
    }
    const data = await resp.json()
    const books = mapOpenLibraryDocs(data?.docs).slice(0, maxResults)
    return NextResponse.json(books, { status: 200 })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

