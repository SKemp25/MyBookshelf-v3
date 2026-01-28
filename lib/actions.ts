"use client"

import { trackEvent, ANALYTICS_EVENTS } from "@/lib/analytics"
import { authenticateUser, registerUser, clearCurrentUser } from "./authStore"

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
    const result = authenticateUser(email.toString(), password.toString())
    if (result.error) return result

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
  if (!formData) return { error: "Form data is missing" }

  const email = formData.get("email")
  const password = formData.get("password")
  const fullName = formData.get("fullName")

  if (!email || !password || !fullName) {
    return { error: "All fields are required to create an account" }
  }

  try {
    if (typeof window === "undefined") {
      return { error: "Authentication not available" }
    }

    const result = registerUser(fullName.toString(), email.toString(), password.toString())
    if (result.error) return result

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

    try {
      await trackEvent(email.toString(), { event_type: ANALYTICS_EVENTS.SIGNUP })
      await trackEvent(email.toString(), { event_type: ANALYTICS_EVENTS.LOGIN })
    } catch (_) {}

    return { success: true }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "Unable to create account. Please try again." }
  }
}

export async function signOut() {
  try {
    clearCurrentUser()
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
