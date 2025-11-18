"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Loader2, UserPlus, AlertCircle, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { registerUser } from "@/lib/authStore"

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.84c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23s.43 3.45 1.18 4.93l2.85-2.84.81-.62z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
)

export default function SignUpForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setError("")
    // Clear any localStorage errors that might persist
    localStorage.removeItem("auth_error")
  }, [])

  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      const target = event.target
      if (target instanceof HTMLInputElement) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 300)
      }
    }

    document.addEventListener("focusin", handleFocus)
    return () => document.removeEventListener("focusin", handleFocus)
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log("🚀 SIGNUP FORM SUBMITTED - THIS SHOULD APPEAR!")
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const formData = new FormData(e.currentTarget)
      const fullName = (formData.get("fullName") as string)?.trim()
      const email = (formData.get("email") as string)?.trim().toLowerCase()
      const password = formData.get("password") as string
      const result = registerUser(fullName, email, password)
      console.log("SignUp result:", result)

      if (result.error) {
        console.log("SignUp form: Error path taken")
        setError(result.error)
        localStorage.setItem("auth_error", result.error)
      } else if (result.success) {
        console.log("SignUp form: Success path taken")
        // Account created successfully - redirect immediately
        // Set login state in localStorage
        localStorage.setItem("bookshelf_is_logged_in", "true")
        localStorage.setItem("bookshelf_current_user", email)

        // Save user profile data with all required fields
        const userPrefsKey = `bookshelf_user_${email}`
        const userProfile = {
          name: fullName,
          email: email,
          phone: "",
          country: "",
          cityState: "",
          preferredLanguages: ["en"],
          preferredGenres: [],
          preferredAgeRange: [],
          ageRange: "",
          readingMethod: ["Print Books", "E-books", "Audiobooks"],
          publicationTypePreferences: [],
          suggestNewAuthors: false,
          dateOfBirth: "",
          preferredReadingTime: "",
          readingGoal: 0,
          memoryAids: ["Show book covers"], // Default to showing book covers
          diagnosedWithMemoryIssues: false,
          settings: {
            defaultLanguage: "en",
            preferredPlatforms: ["Kindle"],
            readingMethods: ["Print Books", "E-books", "Audiobooks"],
          },
        }
        localStorage.setItem(userPrefsKey, JSON.stringify(userProfile))
        console.log("User profile saved:", userProfile)
        
        // Verify the data was saved
        const verify = localStorage.getItem(userPrefsKey)
        console.log("Verification - profile in localStorage:", verify ? "✓ Saved" : "✗ Not saved")

        // Clear form
        e.currentTarget.reset()
        
        // Small delay to ensure localStorage is written, then redirect
        setTimeout(() => {
          console.log("SignUp form: Redirecting to home page")
          window.location.href = "/"
        }, 50)
        
        return // Exit early to prevent setLoading(false)
      } else {
        console.log("SignUp form: Neither error nor success path taken")
        console.log("SignUp form: Result object:", JSON.stringify(result))
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    }

    setLoading(false)
  }

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setSocialLoading(provider)
    setError("")
    
    try {
      // Simulate OAuth flow - in production, this would redirect to OAuth provider
      // For now, we'll create a demo account with social provider info
      const demoEmail = `${provider}_${Date.now()}@demo.bookshelf.app`
      const demoName = provider === "google" ? "Google User" : "Apple User"
      
      // Register user with a generated password (not used for social login)
      const result = registerUser(demoName, demoEmail, `social_${Date.now()}`)
      
      if (result.error) {
        setError(result.error)
        setSocialLoading(null)
        return
      }
      
      // Set login state
      localStorage.setItem("bookshelf_is_logged_in", "true")
      localStorage.setItem("bookshelf_current_user", demoEmail)
      localStorage.setItem("bookshelf_auth_provider", provider)
      
      // Save user profile data
      const userPrefsKey = `bookshelf_user_${demoEmail}`
      const userProfile = {
        name: demoName,
        email: demoEmail,
        phone: "",
        location: "",
        preferredLanguages: ["en"],
        preferredGenres: [],
        ageRange: "",
        readingMethod: ["Print Books", "E-books", "Audiobooks"],
        publicationTypePreferences: [],
        suggestNewAuthors: false,
        authProvider: provider,
      }
      localStorage.setItem(userPrefsKey, JSON.stringify(userProfile))
      
      // Redirect to home
      router.push("/")
      setTimeout(() => {
        window.location.href = "/"
      }, 100)
    } catch (err) {
      setError(`Failed to sign in with ${provider}. Please try again.`)
      setSocialLoading(null)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 my-4">
      <div className="space-y-2 text-center">
        <div className="bg-white border-4 border-black rounded-full px-6 py-2 inline-block mb-4">
          <h1 className="text-black font-black text-2xl tracking-tight">My Bookcase</h1>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Create Account</h2>
        <p className="text-lg text-orange-100">Start building your personal library</p>
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
              onClick={() => handleSocialLogin("google")}
              disabled={socialLoading === "google"}
            >
              {socialLoading === "google" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
              <span className="ml-2">Continue with Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full bg-black hover:bg-gray-900 text-white border-gray-700"
              onClick={() => handleSocialLogin("apple")}
              disabled={socialLoading === "apple"}
            >
              {socialLoading === "apple" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AppleIcon />}
              <span className="ml-2">Continue with Apple</span>
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/5 px-2 text-white/60">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="bg-red-500/10 border-red-500/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-100">{error}</AlertDescription>
              </Alert>
            )}
            
            

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-orange-100">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Smith"
                  autoComplete="name"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-orange-100">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-orange-100">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                    required
                    className="bg-white/10 border-white/20 text-white focus:border-white/40 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg font-medium rounded-lg h-[60px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-orange-100">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-white hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </div>
  )
}
