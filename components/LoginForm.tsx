"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Loader2, LogIn, AlertCircle, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authenticateUser } from "@/lib/authStore"

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
)

export default function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Check for persisted error on mount
    const persistedError = localStorage.getItem("auth_error")
    if (persistedError) {
      setError(persistedError)
      localStorage.removeItem("auth_error")
    }
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
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const formData = new FormData(e.currentTarget)
      const email = (formData.get("email") as string)?.trim().toLowerCase()
      const password = (formData.get("password") as string)?.trim()

      console.log("Login attempt:", { email, passwordLength: password?.length })

      if (!email || !password) {
        setError("Email and password are required")
        setLoading(false)
        return
      }

      const result = authenticateUser(email, password)
      console.log("Authentication result:", result)

      if (result.error) {
        setError(result.error)
        localStorage.setItem("auth_error", result.error)
        console.error("Login error:", result.error)
      } else if (result.success) {
        localStorage.removeItem("auth_error")
        console.log("Login successful, redirecting...")
        
        // Verify login state is set before redirecting
        const verifyLogin = localStorage.getItem("bookshelf_is_logged_in")
        const verifyUser = localStorage.getItem("bookshelf_current_user")
        console.log("Verification before redirect:", { verifyLogin, verifyUser })
        
        // Small delay to ensure localStorage is written, then force a hard reload
        setTimeout(() => {
          // Add a timestamp to force a fresh load and bypass cache
          const timestamp = Date.now()
          // Use window.location.replace to avoid adding to history and force a fresh load
          window.location.replace(`/?_t=${timestamp}`)
        }, 150)
        return // Don't set loading to false, let the redirect happen
      } else {
        // Fallback error if neither error nor success
        setError("Login failed. Please try again.")
        console.error("Unexpected authentication result:", result)
      }
    } catch (err) {
      console.error("Login exception:", err)
      setError("An unexpected error occurred. Please try again.")
    }

    setLoading(false)
  }

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setSocialLoading(provider)
    // TODO: Implement actual social login logic
    setTimeout(() => {
      setSocialLoading(null)
      setError(`${provider} login not yet implemented`)
    }, 1000)
  }

  return (
    <div className="w-full max-w-md space-y-8 my-4">
      <div className="space-y-2 text-center">
        <div className="bg-white border-4 border-black rounded-full px-6 py-2 inline-block mb-4">
          <h1 className="text-black font-black text-2xl tracking-tight">My Bookcase</h1>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Welcome back</h2>
        <p className="text-lg text-orange-100">Sign in to your account</p>
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
                  autoComplete="current-password"
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
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-orange-100">
        Don't have an account?{" "}
        <Link href="/auth/sign-up" className="text-white hover:underline font-medium">
          Sign up
        </Link>
      </div>
    </div>
  )
}
