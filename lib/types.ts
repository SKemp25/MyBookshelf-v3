export interface Author {
  id: string
  name: string
  bio?: string
  birthYear?: number
  nationality?: string
  genres?: string[]
}

export interface Book {
  id: string
  title: string
  author: string
  authorId?: string
  publishedDate: string
  genre?: string
  language?: string
  pageCount?: number
  description?: string
  thumbnail?: string
  isbn?: string
  publisher?: string
  seriesInfo?: {
    name: string
    number: number
  }
  authors?: string[]
  categories?: string[]
}

export interface Platform {
  name: string
  url: string
  enabled: boolean
  category?: "Print" | "Audio" | "Ebook" | "Library"
}

export interface PlatformOption {
  name: string
  defaultUrl: string
  placeholder?: string
}

export interface PlatformCategory {
  category: "Print" | "Audio" | "Ebook" | "Library"
  label: string
  options: PlatformOption[]
}

export interface BookGroup {
  id: string
  name: string
  description: string
  members: GroupMember[]
  currentBook?: string
  nextMeeting?: string
  isPrivate: boolean
  tags: string[]
}

export interface GroupMember {
  id: string
  name: string
  role: "admin" | "member"
  joinedAt: string
}

export interface Friend {
  id: string
  name: string
  email?: string
  phone?: string
  favoriteGenres?: string[]
  booksInCommon?: number
  lastRecommendation?: string
  addedAt: string
}

export interface SentRecommendation {
  id: string
  bookId: string
  bookTitle: string
  bookAuthor: string
  recipientName: string
  recipientEmail?: string
  recipientPhone?: string
  recipientType: "email" | "sms" | "both"
  message: string
  sentAt: string
  status: "sent" | "delivered" | "read"
}

export interface User {
  id?: string
  name: string
  email: string
  phone?: string
  country?: string
  cityState?: string
  preferredLanguages: string[]
  preferredGenres: string[]
  preferredAgeRange?: string[]
  publicationTypePreferences: string[]
  readingMethod: string[]
  ageRange: string
  suggestNewAuthors?: boolean // Added suggestNewAuthors property for author recommendations
  showRecommendButton?: boolean // Show Recommend button on books; opens Google Books for similar titles
  createdAt?: string
  dateOfBirth?: string
  preferredReadingTime?: string
  readingGoal?: number
  memoryAids?: string[]
  diagnosedWithMemoryIssues?: boolean // Track if user has been diagnosed with memory issues
  settings: {
    defaultLanguage: string
    preferredPlatforms: string[]
    readingMethods?: string[]
    emailNotifications?: boolean
    smsNotifications?: boolean
    // Limit visible books per author in the UI; 'all' to disable limiting
    showLastNBooks?: number | "all"
  }
}

export type AdvancedFilterState = {
  singleAuthorOnly?: boolean
  hasDescription?: boolean
  seriesOnly?: boolean
  readingStatus?: string[]
  genre?: string
  yearRange?: {
    start: string
    end: string
  }
  minPages?: string
  hasCover?: boolean
  title?: string
  titleContains?: string
  excludeWords?: string[] | string
  upcomingOnly: boolean
  description?: string
  fromDate?: string
  toDate?: string
}

export const defaultAdvancedFilters: AdvancedFilterState = {
  singleAuthorOnly: false,
  hasDescription: false,
  seriesOnly: false,
  readingStatus: [],
  genre: "all",
  yearRange: {
    start: "",
    end: "",
  },
  minPages: "",
  hasCover: false,
  title: "",
  titleContains: "",
  excludeWords: [],
  upcomingOnly: false,
  description: "",
  fromDate: "",
  toDate: "",
}

export type FilterState = {
  status: string
  genre: string
  rating: string
  author: string
  language: string
  decade: string
  series: string
  tags: string[]
  pageRange: [number, number]
  yearRange: [number, number]
}

export type SortOption = "title" | "author" | "year" | "rating" | "pages" | "dateAdded" | "status"

export type ViewMode = "grid" | "list" | "compact"

export type ReadingStatus = "read" | "currently-reading" | "want-to-read"

export interface BookNote {
  id: string
  bookId: string
  content: string
  page?: number
  chapter?: string
  createdAt: string
  updatedAt: string
  tags: string[]
  isPrivate: boolean
}

export interface ReadingGoal {
  id: string
  year: number
  targetBooks: number
  currentBooks: number
  targetPages?: number
  currentPages?: number
  createdAt: string
  updatedAt: string
}

export interface ReadingSession {
  id: string
  bookId: string
  startTime: string
  endTime?: string
  pagesRead: number
  notes?: string
  location?: string
  mood?: string
}

export interface WishlistItem {
  id: string
  title: string
  author: string
  addedAt: string
  priority?: "low" | "medium" | "high"
  notes?: string
  estimatedPrice?: number
  availableFormats?: string[]
}

export interface RecommendationParams {
  authors: string[]
  books: Book[]
  readBooks: Set<string>
  wantToReadBooks: Set<string>
  dontWantBooks: Set<string>
  userGroups: string[]
  userPreferences?: User
}
