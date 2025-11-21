"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorLog {
  id: string
  message: string
  stack?: string
  timestamp: Date
  type: "error" | "warning" | "info"
}

let errorLogs: ErrorLog[] = []
let errorListeners: ((errors: ErrorLog[]) => void)[] = []

export function logError(error: Error | string, type: "error" | "warning" | "info" = "error") {
  const errorLog: ErrorLog = {
    id: `${Date.now()}-${Math.random()}`,
    message: typeof error === "string" ? error : error.message,
    stack: typeof error === "string" ? undefined : error.stack,
    timestamp: new Date(),
    type,
  }
  
  errorLogs.push(errorLog)
  
  // Keep only last 50 errors
  if (errorLogs.length > 50) {
    errorLogs = errorLogs.slice(-50)
  }
  
  // Also log to console
  if (type === "error") {
    console.error("ErrorLogger:", errorLog.message, errorLog.stack)
  } else if (type === "warning") {
    console.warn("ErrorLogger:", errorLog.message)
  } else {
    console.log("ErrorLogger:", errorLog.message)
  }
  
  // Save to localStorage for persistence
  try {
    const saved = localStorage.getItem("bookshelf_error_logs")
    const logs = saved ? JSON.parse(saved) : []
    logs.push({
      ...errorLog,
      timestamp: errorLog.timestamp.toISOString(),
    })
    // Keep only last 20 in localStorage
    const recentLogs = logs.slice(-20)
    localStorage.setItem("bookshelf_error_logs", JSON.stringify(recentLogs))
  } catch (e) {
    console.error("Failed to save error log:", e)
  }
  
  // Notify listeners
  errorListeners.forEach(listener => listener([...errorLogs]))
}

export function getErrorLogs(): ErrorLog[] {
  return [...errorLogs]
}

export function clearErrorLogs() {
  errorLogs = []
  localStorage.removeItem("bookshelf_error_logs")
  errorListeners.forEach(listener => listener([]))
}

export function subscribeToErrors(listener: (errors: ErrorLog[]) => void) {
  errorListeners.push(listener)
  return () => {
    errorListeners = errorListeners.filter(l => l !== listener)
  }
}

export default function ErrorLogger() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [showDetails, setShowDetails] = useState<string | null>(null)

  useEffect(() => {
    // Load saved errors
    try {
      const saved = localStorage.getItem("bookshelf_error_logs")
      if (saved) {
        const logs = JSON.parse(saved).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }))
        setErrors(logs)
      }
    } catch (e) {
      console.error("Failed to load error logs:", e)
    }

    // Subscribe to new errors
    const unsubscribe = subscribeToErrors((newErrors) => {
      setErrors(newErrors)
    })

    // Global error handlers
    const handleError = (event: ErrorEvent) => {
      logError(event.error || new Error(event.message), "error")
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError(
        event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason)),
        "error"
      )
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      unsubscribe()
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  if (errors.length === 0 && !isOpen) {
    return null
  }

  const recentErrors = errors.slice(-5).reverse()

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-sm">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          variant="destructive"
          size="sm"
          className="shadow-lg"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          {errors.length} Error{errors.length !== 1 ? "s" : ""}
        </Button>
      ) : (
        <div className="bg-white border-2 border-red-500 rounded-lg shadow-xl p-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Error Log ({errors.length})
            </h3>
            <div className="flex gap-2">
              <Button
                onClick={clearErrorLogs}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Clear
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {recentErrors.map((error) => (
              <div
                key={error.id}
                className="border border-red-200 rounded p-2 bg-red-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-red-800 truncate">
                      {error.message}
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      {error.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {error.stack && (
                    <Button
                      onClick={() =>
                        setShowDetails(
                          showDetails === error.id ? null : error.id
                        )
                      }
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                    >
                      {showDetails === error.id ? "Hide" : "Details"}
                    </Button>
                  )}
                </div>
                {showDetails === error.id && error.stack && (
                  <pre className="text-xs text-red-700 mt-2 p-2 bg-red-100 rounded overflow-auto max-h-40">
                    {error.stack}
                  </pre>
                )}
              </div>
            ))}
          </div>

          {errors.length > 5 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              Showing last 5 of {errors.length} errors
            </p>
          )}

          <div className="mt-3 pt-3 border-t border-gray-200">
            <Button
              onClick={() => {
                const logs = errors.map(e => ({
                  message: e.message,
                  stack: e.stack,
                  timestamp: e.timestamp.toISOString(),
                }))
                const text = JSON.stringify(logs, null, 2)
                navigator.clipboard.writeText(text).then(() => {
                  alert("Error logs copied to clipboard!")
                }).catch(() => {
                  // Fallback: show in alert
                  alert(text.substring(0, 500))
                })
              }}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              Copy All Logs
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

