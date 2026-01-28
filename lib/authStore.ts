"use client"

export type StoredUser = {
  email: string
  fullName: string
  password: string
  createdAt: string
  lastLoginAt?: string
  loginCount: number
}

const USERS_KEY = "bookshelf_users"
const CURRENT_USER_KEY = "bookshelf_current_user"
const IS_LOGGED_IN_KEY = "bookshelf_is_logged_in"

function isBrowser() {
  return typeof window !== "undefined"
}

function readUsers(): Record<string, StoredUser> {
  if (!isBrowser()) return {}
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}")
  } catch {
    return {}
  }
}

function writeUsers(users: Record<string, StoredUser>) {
  if (!isBrowser()) return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function listUsers(): StoredUser[] {
  const users = readUsers()
  return Object.values(users).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getCurrentUserEmail(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(CURRENT_USER_KEY)
}

export function setCurrentUserEmail(email: string) {
  if (!isBrowser()) return
  const normalizedEmail = email.toLowerCase().trim()
  localStorage.setItem(CURRENT_USER_KEY, normalizedEmail)
  localStorage.setItem(IS_LOGGED_IN_KEY, "true")
}

export function clearCurrentUser() {
  if (!isBrowser()) return
  localStorage.removeItem(CURRENT_USER_KEY)
  localStorage.setItem(IS_LOGGED_IN_KEY, "false")
}

export function registerUser(fullName: string, email: string, password: string) {
  const users = readUsers()
  const key = email.toLowerCase().trim()

  if (users[key]) {
    return { error: "An account with this email already exists. Please sign in instead." }
  }

  const now = new Date().toISOString()
  users[key] = {
    email: email.trim(),
    fullName: fullName.trim(),
    password: password,
    createdAt: now,
    lastLoginAt: now,
    loginCount: 1,
  }

  writeUsers(users)
  setCurrentUserEmail(key)
  return { success: true }
}

export function authenticateUser(email: string, password: string) {
  if (!isBrowser()) {
    return { error: "Authentication not available" }
  }

  const users = readUsers()
  const key = email.toLowerCase().trim()
  const user = users[key]

  if (!user) {
    return { error: "User not found. Please sign up first." }
  }

  const storedPassword = (user.password || "").trim()
  const providedPassword = (password || "").trim()
  if (storedPassword !== providedPassword) {
    return { error: "Invalid password" }
  }

  user.loginCount = (user.loginCount || 0) + 1
  user.lastLoginAt = new Date().toISOString()
  writeUsers(users)
  setCurrentUserEmail(key)
  return { success: true }
}

export function removeUser(email: string) {
  const users = readUsers()
  const key = email.toLowerCase()
  if (!users[key]) return false

  delete users[key]
  writeUsers(users)
  if (getCurrentUserEmail()?.toLowerCase() === key) {
    clearCurrentUser()
  }
  localStorage.removeItem(`bookshelf_user_${email}`)
  localStorage.removeItem(`bookshelf_data_${email}`)
  return true
}

