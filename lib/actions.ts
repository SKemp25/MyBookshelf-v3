"use client"

import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics"

// Simple localStorage-based authentication
export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    // Check if user exists in localStorage
    const users = JSON.parse(localStorage.getItem("bookshelf_users") || "{}")
    const userKey = email.toString().toLowerCase()

    if (!users[userKey]) {
      return { error: "User not found. Please sign up first." }
    }

    if (users[userKey].password !== password.toString()) {
      return { error: "Invalid password" }
    }

    // Set current user
    localStorage.setItem("bookshelf_current_user", email.toString())
    localStorage.setItem("bookshelf_is_logged_in", "true")

    // Update login metadata
    try {
      users[userKey].loginCount = (users[userKey].loginCount || 0) + 1
      users[userKey].lastLoginAt = new Date().toISOString()
      localStorage.setItem("bookshelf_users", JSON.stringify(users))
    } catch (_) {}

    // Track login event
    try {
      await trackEvent(email.toString(), { event_type: ANALYTICS_EVENTS.LOGIN })
    } catch (_) {}

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

export async function signUp(prevState: any, formData: FormData) {
  console.log("signUp function called with:", { prevState, formData: formData ? "present" : "missing" })
  
  if (!formData) {
    console.log("signUp: Form data is missing")
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const fullName = formData.get("fullName")

  console.log("signUp: Extracted data:", { email, password: password ? "***" : "empty", fullName })

  if (!email || !password || !fullName) {
    console.log("signUp: Missing required fields")
    return { error: "All fields are required to create an account" }
  }

  try {
    if (typeof window === "undefined") {
      return { error: "Authentication not available" }
    }

    // Check if user already exists
    const users = JSON.parse(localStorage.getItem("bookshelf_users") || "{}")
    const userKey = email.toString().toLowerCase()

    if (users[userKey]) {
      return { error: "An account with this email already exists. Please sign in instead." }
    }

    // Create new user
    users[userKey] = {
      email: email.toString(),
      password: password.toString(),
      fullName: fullName.toString(),
      createdAt: new Date().toISOString(),
      loginCount: 1,
      lastLoginAt: new Date().toISOString(),
    }

    localStorage.setItem("bookshelf_users", JSON.stringify(users))

    // Create user profile
    const userPrefsKey = `bookshelf_user_${email.toString()}`
    const userProfile = {
      name: fullName.toString(),
      email: email.toString(),
      phone: "",
      location: "",
      preferredLanguages: ["en"],
      ageRange: "",
      preferredGenres: [],
      publicationType: "all",
    }
    localStorage.setItem(userPrefsKey, JSON.stringify(userProfile))

    // Auto sign in the new user
    localStorage.setItem("bookshelf_current_user", email.toString())
    localStorage.setItem("bookshelf_is_logged_in", "true")

    // Track signup + login events
    try {
      await trackEvent(email.toString(), { event_type: ANALYTICS_EVENTS.SIGNUP })
      await trackEvent(email.toString(), { event_type: ANALYTICS_EVENTS.LOGIN })
    } catch (_) {}

    console.log("signUp: Account created successfully for:", email.toString())
    return { success: true }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "Unable to create account. Please try again." }
  }
}

export async function signOut() {
  try {
    localStorage.removeItem("bookshelf_current_user")
    localStorage.setItem("bookshelf_is_logged_in", "false")
    window.location.href = "/"
  } catch (error) {
    console.error("Sign out error:", error)
  }
}

export async function resetPassword(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")

  if (!email) {
    return { error: "Email is required" }
  }

  // For localStorage implementation, we can't actually send emails
  // This is a placeholder that would need a real email service
  return { success: "Password reset functionality requires email service setup." }
}
