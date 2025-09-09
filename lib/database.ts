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
  const userDataKey = `bookshelf_data_${userId}`
  const existingData = loadFromLocalStorage(userDataKey) || {}
  saveToLocalStorage(userDataKey, { ...existingData, books })
}

// Load user books
export async function loadUserBooks(userId: string) {
  const userDataKey = `bookshelf_data_${userId}`
  const data = loadFromLocalStorage(userDataKey)
  return data?.books || []
}

// Update book reading status
export async function updateBookStatus(
  userId: string,
  bookId: string,
  status: "read" | "want" | "unread" | "dont-want",
) {
  const userDataKey = `bookshelf_data_${userId}`
  const data = loadFromLocalStorage(userDataKey) || {}
  const books = data.books || []
  const bookIndex = books.findIndex((book: any) => (book.id || `${book.title}-${book.author}`) === bookId)
  if (bookIndex !== -1) {
    books[bookIndex].readingStatus = status
    saveToLocalStorage(userDataKey, { ...data, books })
  }
}

// Save user authors
export async function saveUserAuthors(userId: string, authors: string[]) {
  const userDataKey = `bookshelf_data_${userId}`
  const existingData = loadFromLocalStorage(userDataKey) || {}
  saveToLocalStorage(userDataKey, { ...existingData, authors })
}

// Load user authors
export async function loadUserAuthors(userId: string) {
  const userDataKey = `bookshelf_data_${userId}`
  const data = loadFromLocalStorage(userDataKey)
  return data?.authors || []
}

// Migrate localStorage data to database (no-op for localStorage-only mode)
export async function migrateLocalStorageToDatabase(userId: string) {
  console.log("Migration not needed - using localStorage only")
  return Promise.resolve()
}

// Sync all user data to localStorage
export async function syncUserDataToDatabase(userId: string, userData: UserData) {
  const userDataKey = `bookshelf_data_${userId}`
  saveToLocalStorage(userDataKey, {
    books: userData.books,
    authors: userData.authors,
    readBooks: userData.readBooks,
    wantToReadBooks: userData.wantToReadBooks,
    dontWantBooks: userData.dontWantBooks,
    sharedBooks: userData.sharedBooks,
    friends: userData.friends,
    platforms: userData.platforms,
  })
  saveToLocalStorage(`bookshelf_user_${userId}`, userData.preferences)
}

// Load all user data from localStorage
export async function loadUserDataFromDatabase(userId: string): Promise<UserData> {
  const userDataKey = `bookshelf_data_${userId}`
  const userData = loadFromLocalStorage(userDataKey) || {}
  const userPrefs = loadFromLocalStorage(`bookshelf_user_${userId}`) || {}

  return {
    books: userData.books || [],
    authors: userData.authors || [],
    readBooks: userData.readBooks || [],
    wantToReadBooks: userData.wantToReadBooks || [],
    dontWantBooks: userData.dontWantBooks || [],
    sharedBooks: userData.sharedBooks || [],
    friends: userData.friends || [],
    platforms: userData.platforms || [],
    preferences: userPrefs,
  }
}
