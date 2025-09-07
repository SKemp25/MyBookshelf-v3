import type React from "react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Portal - MyBookshelf Management",
  description: "Administrative dashboard for managing MyBookshelf system",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
