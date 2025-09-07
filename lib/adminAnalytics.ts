// Admin Analytics System for MyBookshelf
// This system collects and aggregates user activity data for admin dashboard

export interface UserActivity {
  userId: string
  email: string
  name: string
  lastLogin: string
  totalLogins: number
  booksAdded: number
  authorsAdded: number
  booksRead: number
  booksWantToRead: number
  recommendationsClicked: number
  searchesPerformed: number
  sessionDuration: number
  createdAt: string
}

export interface BookAnalytics {
  bookId: string
  title: string
  author: string
  timesAdded: number
  timesMarkedRead: number
  timesMarkedWantToRead: number
  timesShared: number
  recommendationClicks: number
  firstAdded: string
  lastActivity: string
}

export interface AuthorAnalytics {
  authorName: string
  totalBooks: number
  timesAdded: number
  totalReads: number
  totalWantToRead: number
  averageRating: number
  firstAdded: string
  lastActivity: string
}

export interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalBooks: number
  totalAuthors: number
  totalRecommendations: number
  averageSessionDuration: number
  mostPopularBooks: BookAnalytics[]
  mostPopularAuthors: AuthorAnalytics[]
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
}

export interface EngagementMetrics {
  userEngagement: {
    high: number // Users with >10 books and >5 sessions
    medium: number // Users with 5-10 books or 3-5 sessions
    low: number // Users with <5 books and <3 sessions
  }
  featureUsage: {
    searchUsage: number
    recommendationUsage: number
    exportUsage: number
    filterUsage: number
  }
  retentionRates: {
    day1: number
    day7: number
    day30: number
  }
}

// Data collection functions
export function collectUserActivity(): UserActivity[] {
  if (typeof window === 'undefined') return []
  
  const users: UserActivity[] = []
  const userData = localStorage.getItem('bookshelf_users')
  
  if (userData) {
    const parsedUsers = JSON.parse(userData)
    
    Object.entries(parsedUsers).forEach(([email, userData]: [string, any]) => {
      const personalData = localStorage.getItem('personal_bookshelf')
      const userPrefs = localStorage.getItem(`bookshelf_user_${email}`)
      
      let booksAdded = 0
      let authorsAdded = 0
      let booksRead = 0
      let booksWantToRead = 0
      
      if (personalData) {
        const data = JSON.parse(personalData)
        booksAdded = data.books?.length || 0
        authorsAdded = data.authors?.length || 0
        booksRead = data.readBooks?.length || 0
        booksWantToRead = data.wantToReadBooks?.length || 0
      }
      
      users.push({
        userId: email,
        email: email,
        name: userData.fullName || email,
        lastLogin: userData.lastLoginAt || userData.createdAt,
        totalLogins: userData.loginCount || 1,
        booksAdded,
        authorsAdded,
        booksRead,
        booksWantToRead,
        recommendationsClicked: 0, // Would need to track this separately
        searchesPerformed: 0, // Would need to track this separately
        sessionDuration: 0, // Would need to track this separately
        createdAt: userData.createdAt || new Date().toISOString()
      })
    })
  }
  
  return users
}

export function collectBookAnalytics(): BookAnalytics[] {
  if (typeof window === 'undefined') return []
  
  const books: BookAnalytics[] = []
  const personalData = localStorage.getItem('personal_bookshelf')
  
  if (personalData) {
    const data = JSON.parse(personalData)
    const bookList = data.books || []
    const readBooks = data.readBooks || []
    const wantToReadBooks = data.wantToReadBooks || []
    
    bookList.forEach((book: any) => {
      const bookId = `${book.title}-${book.author}`
      books.push({
        bookId,
        title: book.title,
        author: book.author,
        timesAdded: 1,
        timesMarkedRead: readBooks.includes(bookId) ? 1 : 0,
        timesMarkedWantToRead: wantToReadBooks.includes(bookId) ? 1 : 0,
        timesShared: 0, // Would need to track this separately
        recommendationClicks: 0, // Would need to track this separately
        firstAdded: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      })
    })
  }
  
  return books
}

export function collectAuthorAnalytics(): AuthorAnalytics[] {
  if (typeof window === 'undefined') return []
  
  const authors: AuthorAnalytics[] = []
  const personalData = localStorage.getItem('personal_bookshelf')
  
  if (personalData) {
    const data = JSON.parse(personalData)
    const authorList = data.authors || []
    const bookList = data.books || []
    const readBooks = data.readBooks || []
    const wantToReadBooks = data.wantToReadBooks || []
    
    authorList.forEach((authorName: string) => {
      const authorBooks = bookList.filter((book: any) => book.author === authorName)
      const authorReadBooks = authorBooks.filter((book: any) => 
        readBooks.includes(`${book.title}-${book.author}`)
      )
      const authorWantToReadBooks = authorBooks.filter((book: any) => 
        wantToReadBooks.includes(`${book.title}-${book.author}`)
      )
      
      authors.push({
        authorName,
        totalBooks: authorBooks.length,
        timesAdded: 1,
        totalReads: authorReadBooks.length,
        totalWantToRead: authorWantToReadBooks.length,
        averageRating: 0, // Would need rating system
        firstAdded: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      })
    })
  }
  
  return authors
}

export function calculateSystemMetrics(): SystemMetrics {
  const users = collectUserActivity()
  const books = collectBookAnalytics()
  const authors = collectAuthorAnalytics()
  
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const activeUsers = users.filter(user => 
    new Date(user.lastLogin) > oneDayAgo
  ).length
  
  const dailyActiveUsers = users.filter(user => 
    new Date(user.lastLogin) > oneDayAgo
  ).length
  
  const weeklyActiveUsers = users.filter(user => 
    new Date(user.lastLogin) > oneWeekAgo
  ).length
  
  const monthlyActiveUsers = users.filter(user => 
    new Date(user.lastLogin) > oneMonthAgo
  ).length
  
  // Sort books by popularity (times added + times marked read)
  const mostPopularBooks = books
    .sort((a, b) => (b.timesAdded + b.timesMarkedRead) - (a.timesAdded + a.timesMarkedRead))
    .slice(0, 10)
  
  // Sort authors by popularity (total books + total reads)
  const mostPopularAuthors = authors
    .sort((a, b) => (b.totalBooks + b.totalReads) - (a.totalBooks + a.totalReads))
    .slice(0, 10)
  
  return {
    totalUsers: users.length,
    activeUsers,
    totalBooks: books.length,
    totalAuthors: authors.length,
    totalRecommendations: 0, // Would need to track this
    averageSessionDuration: 0, // Would need to track this
    mostPopularBooks,
    mostPopularAuthors,
    dailyActiveUsers,
    weeklyActiveUsers,
    monthlyActiveUsers
  }
}

export function calculateEngagementMetrics(): EngagementMetrics {
  const users = collectUserActivity()
  
  const userEngagement = {
    high: users.filter(user => user.booksAdded > 10 && user.totalLogins > 5).length,
    medium: users.filter(user => 
      (user.booksAdded >= 5 && user.booksAdded <= 10) || 
      (user.totalLogins >= 3 && user.totalLogins <= 5)
    ).length,
    low: users.filter(user => user.booksAdded < 5 && user.totalLogins < 3).length
  }
  
  const featureUsage = {
    searchUsage: users.reduce((sum, user) => sum + user.searchesPerformed, 0),
    recommendationUsage: users.reduce((sum, user) => sum + user.recommendationsClicked, 0),
    exportUsage: 0, // Would need to track this
    filterUsage: 0 // Would need to track this
  }
  
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const retentionRates = {
    day1: users.filter(user => new Date(user.lastLogin) > oneDayAgo).length / Math.max(users.length, 1) * 100,
    day7: users.filter(user => new Date(user.lastLogin) > oneWeekAgo).length / Math.max(users.length, 1) * 100,
    day30: users.filter(user => new Date(user.lastLogin) > oneMonthAgo).length / Math.max(users.length, 1) * 100
  }
  
  return {
    userEngagement,
    featureUsage,
    retentionRates
  }
}

// Export data for admin dashboard
export function exportAdminData() {
  return {
    users: collectUserActivity(),
    books: collectBookAnalytics(),
    authors: collectAuthorAnalytics(),
    systemMetrics: calculateSystemMetrics(),
    engagementMetrics: calculateEngagementMetrics(),
    exportDate: new Date().toISOString()
  }
}
