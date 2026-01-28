import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import ErrorBoundary from "./components/ErrorBoundary"

export const metadata: Metadata = {
  title: "My Bookcase - Personal Reading Tracker",
  description: "Track your personal reading collection, discover new books, and manage your reading preferences",
  generator: "v0.app",
  icons: { icon: "/placeholder-logo.svg" },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ea580c" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="My Bookcase" />
        <link rel="apple-touch-icon" href="/placeholder.svg?height=180&width=180" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  )
}
