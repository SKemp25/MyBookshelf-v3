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
} from "lucide-react"
import { signIn, signUp, signOut, resetPassword } from "@/lib/actions"
import { useRouter } from "next/navigation"

interface AccountManagerProps {
  user: any // Updated comment to reflect localStorage-based auth
  isLoggedIn: boolean
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

export default function AccountManager({ user, isLoggedIn }: AccountManagerProps) {
  const router = useRouter()
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "reset">("signin")
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: "" })

  const [signInState, signInAction] = useActionState(signIn, null)
  const [signUpState, signUpAction] = useActionState(signUp, null)
  const [resetState, resetAction] = useActionState(resetPassword, null)

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
      setShowAuth(false)
      router.refresh()
    }
  }, [signInState, router])

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
        <div className="flex items-center gap-2">
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
          onClick={() => setShowAuth(true)}
          variant="outline"
          size="sm"
          className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 hover:border-orange-300 bg-white"
        >
          <LogIn className="w-4 h-4 mr-2" />
          <span>Login</span>
        </Button>
      )}

      <Dialog
        open={showAuth}
        onOpenChange={(open) => {
          setShowAuth(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-md bg-white border-orange-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-orange-800 font-display text-2xl flex items-center gap-3">
              <Shield className="w-7 h-7" />
              {authMode === "signin" && "Sign In"}
              {authMode === "signup" && "Create Account"}
              {authMode === "reset" && "Reset Password"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-orange-600 mb-6">
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
                      type="password"
                      placeholder="Enter your password"
                      className="border-orange-200 focus:border-orange-400 pl-10"
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      required
                    />
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
            )}

            {authMode === "signin" && (
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
                      type="password"
                      placeholder="Enter your password"
                      className="border-orange-200 focus:border-orange-400 pl-10"
                      required
                    />
                  </div>
                </div>
                <SubmitButton>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </SubmitButton>
              </form>
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
