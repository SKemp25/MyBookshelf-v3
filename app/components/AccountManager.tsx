"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  LogIn,
  LogOut,
  UserPlus,
  Shield,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  KeyRound,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react"
import { signIn, signUp, signOut, resetPassword } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { authenticateUser, registerUser } from "@/lib/authStore"
import { Separator } from "@/components/ui/separator"

interface AccountManagerProps {
  user: any // Updated comment to reflect localStorage-based auth
  isLoggedIn: boolean
  showAuthDialog?: boolean // Allow parent to control dialog state
  onAuthDialogChange?: (open: boolean) => void // Callback when dialog state changes
}

function SubmitButton({ children, isLoading }: { children: React.ReactNode; isLoading?: boolean }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending || isLoading}
      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3"
    >
      {pending || isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      ) : (
        children
      )}
    </Button>
  )
}

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

export default function AccountManager({ user, isLoggedIn, showAuthDialog, onAuthDialogChange }: AccountManagerProps) {
  const router = useRouter()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "reset">("signin")
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: "" })
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Sync with parent-controlled dialog state
  useEffect(() => {
    if (showAuthDialog !== undefined) {
      console.log('AccountManager: Syncing showAuthDialog prop:', showAuthDialog)
      setShowAuth(showAuthDialog)
    }
  }, [showAuthDialog])
  
  // Debug: Log when showAuth changes
  useEffect(() => {
    console.log('AccountManager: showAuth state changed to:', showAuth)
  }, [showAuth])

  // Notify parent when dialog state changes
  const handleShowAuthChange = (open: boolean) => {
    setShowAuth(open)
    onAuthDialogChange?.(open)
  }

  // Listen for custom event to open auth dialog from mobile menu (fallback)
  useEffect(() => {
    const handleOpenAuth = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('AccountManager: Received openAuthDialog event')
      handleShowAuthChange(true)
    }
    
    // Use capture phase to ensure we catch it early
    window.addEventListener('openAuthDialog', handleOpenAuth, true)
    return () => {
      window.removeEventListener('openAuthDialog', handleOpenAuth, true)
    }
  }, [onAuthDialogChange])

  const [signInState, signInAction] = useActionState(signIn, null)
  const [signUpState, signUpAction] = useActionState(signUp, null)
  const [resetState, resetAction] = useActionState(resetPassword, null)

  // Handle successful signup redirect
  useEffect(() => {
    if (signUpState?.success) {
      console.log("AccountManager: Signup successful, redirecting...")
      setTimeout(() => {
        window.location.href = "/"
      }, 1500)
    }
  }, [signUpState?.success])

  const validatePassword = (pwd: string) => {
    const minLength = pwd.length >= 8
    const hasUpper = /[A-Z]/.test(pwd)
    const hasLower = /[a-z]/.test(pwd)
    const hasNumber = /\d/.test(pwd)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd)

    const score = [minLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length

    let message = ""
    if (score === 0) message = ""
    else if (score < 3) message = "Weak password"
    else if (score < 5) message = "Good password"
    else message = "Strong password"

    return { score, message, isValid: score >= 4 }
  }

  useEffect(() => {
    if (signInState?.success) {
      handleShowAuthChange(false)
      // Close modal immediately and prevent it from reopening
      // The redirect will handle the page refresh
    }
  }, [signInState, onAuthDialogChange])

  // Prevent modal from showing if user is logged in
  useEffect(() => {
    if (isLoggedIn && showAuth) {
      handleShowAuthChange(false)
    }
  }, [isLoggedIn, showAuth, onAuthDialogChange])

  const resetForm = () => {
    setPasswordStrength({ score: 0, message: "" })
    setAuthMode("signin")
  }

  const handleLogout = async () => {
    await signOut()
  }

  const handlePasswordChange = (password: string) => {
    if (authMode === "signup" && password) {
      setPasswordStrength(validatePassword(password))
    }
  }

  return (
    <>
      {isLoggedIn ? (
        <div className="flex items-center gap-2" data-account-manager>
          <form action={signOut}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 rounded-md px-2 py-1 h-auto"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="text-xs font-bold">Logout</span>
            </Button>
          </form>
        </div>
      ) : (
        <Button
          onClick={() => handleShowAuthChange(true)}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20 p-1.5 md:p-2"
          data-account-manager
        >
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:inline ml-1 text-xs md:text-sm font-medium">Login</span>
        </Button>
      )}

      <Dialog
        open={showAuth}
        onOpenChange={(open) => {
          handleShowAuthChange(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="w-[95vw] max-w-md bg-white border-orange-200 rounded-2xl max-h-[90vh] overflow-y-auto mx-4 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-orange-800 font-display text-xl sm:text-2xl flex items-center gap-2 sm:gap-3">
              <Shield className="w-5 h-5 sm:w-7 sm:h-7" />
              {authMode === "signin" && "Sign In"}
              {authMode === "signup" && "Create Account"}
              {authMode === "reset" && "Reset Password"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 py-2">
            <div className="text-center">
              <p className="text-orange-600 mb-4 sm:mb-6 text-sm sm:text-base">
                {authMode === "signin" && "Sign in to sync your bookshelf across devices and share recommendations."}
                {authMode === "signup" && "Create an account to save your reading progress and connect with friends."}
                {authMode === "reset" && "Enter your email address to reset your password."}
              </p>
            </div>

            {(signInState?.error || signUpState?.error || resetState?.error) && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">
                  {signInState?.error || signUpState?.error || resetState?.error}
                </span>
              </div>
            )}

            {(signUpState?.success || resetState?.success) && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-700">{signUpState?.success || resetState?.success}</span>
              </div>
            )}


            {authMode === "reset" && (
              <form action={resetAction} className="space-y-4">
                <div>
                  <Label htmlFor="resetEmail" className="text-orange-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-400" />
                    <Input
                      id="resetEmail"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="border-orange-200 focus:border-orange-400 pl-10"
                      required
                    />
                  </div>
                </div>
                <SubmitButton>
                  <KeyRound className="w-5 h-5 mr-2" />
                  Reset Password
                </SubmitButton>
              </form>
            )}

            {authMode === "signup" && (
              <>
                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
                    onClick={async () => {
                      setSocialLoading("google")
                      try {
                        const demoEmail = "google@demo.bookshelf.app"
                        const demoName = "Google User"
                        const socialPassword = "social_google_password"
                        
                        const users = JSON.parse(localStorage.getItem("bookshelf_users") || "{}")
                        const existingUser = users[demoEmail.toLowerCase()]
                        
                        if (existingUser) {
                          const loginResult = authenticateUser(demoEmail, socialPassword)
                          if (loginResult.error) {
                            setSocialLoading(null)
                            return
                          }
                        } else {
                          const result = registerUser(demoName, demoEmail, socialPassword)
                          if (result.error) {
                            setSocialLoading(null)
                            return
                          }
                          const userPrefsKey = `bookshelf_user_${demoEmail}`
                          const userProfile = {
                            name: demoName,
                            email: demoEmail,
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
                            memoryAids: ["Show book covers"],
                            diagnosedWithMemoryIssues: false,
                            authProvider: "google",
                            settings: {
                              defaultLanguage: "en",
                              preferredPlatforms: ["Kindle"],
                              readingMethods: ["Print Books", "E-books", "Audiobooks"],
                            },
                          }
                          localStorage.setItem(userPrefsKey, JSON.stringify(userProfile))
                        }
                        
                        localStorage.setItem("bookshelf_is_logged_in", "true")
                        localStorage.setItem("bookshelf_current_user", demoEmail)
                        localStorage.setItem("bookshelf_auth_provider", "google")
                        
                        setTimeout(() => {
                          window.location.replace(`/?_t=${Date.now()}`)
                        }, 150)
                      } catch (err) {
                        setSocialLoading(null)
                      }
                    }}
                    disabled={socialLoading === "google"}
                  >
                    {socialLoading === "google" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    <span className="ml-2">Continue with Google</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-black hover:bg-gray-900 text-white border-gray-700"
                    onClick={async () => {
                      setSocialLoading("apple")
                      try {
                        const demoEmail = "apple@demo.bookshelf.app"
                        const demoName = "Apple User"
                        const socialPassword = "social_apple_password"
                        
                        const users = JSON.parse(localStorage.getItem("bookshelf_users") || "{}")
                        const existingUser = users[demoEmail.toLowerCase()]
                        
                        if (existingUser) {
                          const loginResult = authenticateUser(demoEmail, socialPassword)
                          if (loginResult.error) {
                            setSocialLoading(null)
                            return
                          }
                        } else {
                          const result = registerUser(demoName, demoEmail, socialPassword)
                          if (result.error) {
                            setSocialLoading(null)
                            return
                          }
                          const userPrefsKey = `bookshelf_user_${demoEmail}`
                          const userProfile = {
                            name: demoName,
                            email: demoEmail,
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
                            memoryAids: ["Show book covers"],
                            diagnosedWithMemoryIssues: false,
                            authProvider: "apple",
                            settings: {
                              defaultLanguage: "en",
                              preferredPlatforms: ["Kindle"],
                              readingMethods: ["Print Books", "E-books", "Audiobooks"],
                            },
                          }
                          localStorage.setItem(userPrefsKey, JSON.stringify(userProfile))
                        }
                        
                        localStorage.setItem("bookshelf_is_logged_in", "true")
                        localStorage.setItem("bookshelf_current_user", demoEmail)
                        localStorage.setItem("bookshelf_auth_provider", "apple")
                        
                        setTimeout(() => {
                          window.location.replace(`/?_t=${Date.now()}`)
                        }, 150)
                      } catch (err) {
                        setSocialLoading(null)
                      }
                    }}
                    disabled={socialLoading === "apple"}
                  >
                    {socialLoading === "apple" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AppleIcon />}
                    <span className="ml-2">Continue with Apple</span>
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-orange-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-orange-600">Or continue with email</span>
                  </div>
                </div>

                <form action={signUpAction} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName" className="text-orange-700">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      className="border-orange-200 focus:border-orange-400"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-orange-700">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className="border-orange-200 focus:border-orange-400 pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-orange-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="border-orange-200 focus:border-orange-400 pl-10 pr-10"
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 hover:text-orange-600 focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {passwordStrength.message && (
                      <div className="mt-2 flex items-center gap-2">
                        {passwordStrength.score >= 4 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        )}
                        <span className={`text-sm ${passwordStrength.score >= 4 ? "text-green-600" : "text-orange-600"}`}>
                          {passwordStrength.message}
                        </span>
                      </div>
                    )}
                  </div>
                  <SubmitButton>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Account
                  </SubmitButton>
                </form>
              </>
            )}

            {authMode === "signin" && (
              <>
                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
                    onClick={async () => {
                      setSocialLoading("google")
                      try {
                        const demoEmail = "google@demo.bookshelf.app"
                        const demoName = "Google User"
                        const socialPassword = "social_google_password"
                        
                        const users = JSON.parse(localStorage.getItem("bookshelf_users") || "{}")
                        const existingUser = users[demoEmail.toLowerCase()]
                        
                        if (existingUser) {
                          const loginResult = authenticateUser(demoEmail, socialPassword)
                          if (loginResult.error) {
                            setSocialLoading(null)
                            return
                          }
                        } else {
                          const result = registerUser(demoName, demoEmail, socialPassword)
                          if (result.error) {
                            setSocialLoading(null)
                            return
                          }
                          const userPrefsKey = `bookshelf_user_${demoEmail}`
                          const userProfile = {
                            name: demoName,
                            email: demoEmail,
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
                            memoryAids: ["Show book covers"],
                            diagnosedWithMemoryIssues: false,
                            authProvider: "google",
                            settings: {
                              defaultLanguage: "en",
                              preferredPlatforms: ["Kindle"],
                              readingMethods: ["Print Books", "E-books", "Audiobooks"],
                            },
                          }
                          localStorage.setItem(userPrefsKey, JSON.stringify(userProfile))
                        }
                        
                        localStorage.setItem("bookshelf_is_logged_in", "true")
                        localStorage.setItem("bookshelf_current_user", demoEmail)
                        localStorage.setItem("bookshelf_auth_provider", "google")
                        
                        setTimeout(() => {
                          window.location.replace(`/?_t=${Date.now()}`)
                        }, 150)
                      } catch (err) {
                        setSocialLoading(null)
                      }
                    }}
                    disabled={socialLoading === "google"}
                  >
                    {socialLoading === "google" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                    <span className="ml-2">Continue with Google</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-black hover:bg-gray-900 text-white border-gray-700"
                    onClick={async () => {
                      setSocialLoading("apple")
                      try {
                        const demoEmail = "apple@demo.bookshelf.app"
                        const demoName = "Apple User"
                        const socialPassword = "social_apple_password"
                        
                        const users = JSON.parse(localStorage.getItem("bookshelf_users") || "{}")
                        const existingUser = users[demoEmail.toLowerCase()]
                        
                        if (existingUser) {
                          const loginResult = authenticateUser(demoEmail, socialPassword)
                          if (loginResult.error) {
                            setSocialLoading(null)
                            return
                          }
                        } else {
                          const result = registerUser(demoName, demoEmail, socialPassword)
                          if (result.error) {
                            setSocialLoading(null)
                            return
                          }
                          const userPrefsKey = `bookshelf_user_${demoEmail}`
                          const userProfile = {
                            name: demoName,
                            email: demoEmail,
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
                            memoryAids: ["Show book covers"],
                            diagnosedWithMemoryIssues: false,
                            authProvider: "apple",
                            settings: {
                              defaultLanguage: "en",
                              preferredPlatforms: ["Kindle"],
                              readingMethods: ["Print Books", "E-books", "Audiobooks"],
                            },
                          }
                          localStorage.setItem(userPrefsKey, JSON.stringify(userProfile))
                        }
                        
                        localStorage.setItem("bookshelf_is_logged_in", "true")
                        localStorage.setItem("bookshelf_current_user", demoEmail)
                        localStorage.setItem("bookshelf_auth_provider", "apple")
                        
                        setTimeout(() => {
                          window.location.replace(`/?_t=${Date.now()}`)
                        }, 150)
                      } catch (err) {
                        setSocialLoading(null)
                      }
                    }}
                    disabled={socialLoading === "apple"}
                  >
                    {socialLoading === "apple" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AppleIcon />}
                    <span className="ml-2">Continue with Apple</span>
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-orange-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-orange-600">Or continue with email</span>
                  </div>
                </div>

                <form action={signInAction} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-orange-700">
                      Email
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className="border-orange-200 focus:border-orange-400 pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-orange-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-orange-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="border-orange-200 focus:border-orange-400 pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 hover:text-orange-600 focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <SubmitButton>
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In
                  </SubmitButton>
                </form>
              </>
            )}

            <div className="text-center space-y-2">
              {authMode === "signin" && (
                <>
                  <button
                    type="button"
                    onClick={() => setAuthMode("reset")}
                    className="text-sm text-orange-600 hover:text-orange-800 underline block w-full"
                  >
                    Forgot your password?
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode("signup")}
                    className="text-sm text-orange-600 hover:text-orange-800 underline"
                  >
                    Don't have an account? Sign up
                  </button>
                </>
              )}
              {authMode === "signup" && (
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className="text-sm text-orange-600 hover:text-orange-800 underline"
                >
                  Already have an account? Sign in
                </button>
              )}
              {authMode === "reset" && (
                <button
                  type="button"
                  onClick={() => setAuthMode("signin")}
                  className="text-sm text-orange-600 hover:text-orange-800 underline"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
