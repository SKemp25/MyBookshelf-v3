"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, LogIn, AlertCircle, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { authenticateUser } from "@/lib/authStore"

export default function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2 text-center">
        <div className="bg-white border-4 border-black rounded-full px-6 py-2 inline-block mb-4">
          <h1 className="text-black font-black text-2xl tracking-tight">My Bookcase</h1>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-white">Welcome back</h2>
        <p className="text-lg text-orange-100">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-100 px-4 py-3 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-orange-100">
              Email
            </label>
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
            <label htmlFor="password" className="block text-sm font-medium text-orange-100">
              Password
            </label>
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80 focus:outline-none"
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

        <div className="text-center text-orange-100">
          Don't have an account?{" "}
          <Link href="/auth/sign-up" className="text-white hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </form>
    </div>
  )
}
