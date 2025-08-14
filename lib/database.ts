export interface UserData {
  books: any[]
  authors: string[]
  readBooks: string[]
  wantToReadBooks: string[]
  dontWantBooks: string[]
  sharedBooks: string[]
  friends: string[]
  platforms: any[]
  preferences: any
}

function saveToLocalStorage(key: string, data: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data))
  }
}

function loadFromLocalStorage(key: string) {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  }
  return null
}

// Save user profile data
export async function saveUserProfile(userId: string, profileData: any) {
  saveToLocalStorage(`bookshelf_user_${userId}`, profileData)
}

// Load user profile data
export async function loadUserProfile(userId: string) {
  return loadFromLocalStorage(`bookshelf_user_${userId}`)
}

// Save user books
export async function saveUserBooks(userId: string, books: any[]) {
  const existingData = loadFromLocalStorage("personal_bookshelf") || {}
  saveToLocalStorage("personal_bookshelf", { ...existingData, books })
}

// Load user books
export async function loadUserBooks(userId: string) {
  const data = loadFromLocalStorage("personal_bookshelf")
  return data?.books || []
}

// Update book reading status
export async function updateBookStatus(
  userId: string,
  bookId: string,
  status: "read" | "want" | "unread" | "dont-want",
) {
  const data = loadFromLocalStorage("personal_bookshelf") || {}
  const books = data.books || []
  const bookIndex = books.findIndex((book: any) => (book.id || `${book.title}-${book.author}`) === bookId)
  if (bookIndex !== -1) {
    books[bookIndex].readingStatus = status
    saveToLocalStorage("personal_bookshelf", { ...data, books })
  }
}

// Save user authors
export async function saveUserAuthors(userId: string, authors: string[]) {
  const existingData = loadFromLocalStorage("personal_bookshelf") || {}
  saveToLocalStorage("personal_bookshelf", { ...existingData, authors })
}

// Load user authors
export async function loadUserAuthors(userId: string) {
  const data = loadFromLocalStorage("personal_bookshelf")
  return data?.authors || []
}

// Migrate localStorage data to database (no-op for localStorage-only mode)
export async function migrateLocalStorageToDatabase(userId: string) {
  console.log("Migration not needed - using localStorage only")
  return Promise.resolve()
}

// Sync all user data to localStorage
export async function syncUserDataToDatabase(userId: string, userData: UserData) {
  saveToLocalStorage("personal_bookshelf", {
    books: userData.books,
    authors: userData.authors,
    readBooks: userData.readBooks,
    wantToReadBooks: userData.wantToReadBooks,
    dontWantBooks: userData.dontWantBooks,
  })
  saveToLocalStorage(`bookshelf_user_${userId}`, userData.preferences)
}

// Load all user data from localStorage
export async function loadUserDataFromDatabase(userId: string): Promise<UserData> {
  const personalData = loadFromLocalStorage("personal_bookshelf") || {}
  const userPrefs = loadFromLocalStorage(`bookshelf_user_${userId}`) || {}

  return {
    books: personalData.books || [],
    authors: personalData.authors || [],
    readBooks: personalData.readBooks || [],
    wantToReadBooks: personalData.wantToReadBooks || [],
    dontWantBooks: personalData.dontWantBooks || [],
    sharedBooks: personalData.sharedBooks || [],
    friends: personalData.friends || [],
    platforms: personalData.platforms || [],
    preferences: userPrefs,
  }
}
