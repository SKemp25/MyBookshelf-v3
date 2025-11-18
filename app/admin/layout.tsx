import type React from "react"
import { Metadata } from "next"
import { AdminNav } from "./AdminNav"

export const metadata: Metadata = {
  title: "Admin Portal - MyBookshelf Management",
  description: "Administrative dashboard for managing MyBookshelf system",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="mx-auto max-w-5xl space-y-6 px-4">
        <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-slate-100">
          <AdminNav />
        </div>
        <div className="rounded-2xl bg-white/90 p-6 shadow ring-1 ring-slate-100">{children}</div>
      </div>
    </div>
  )
}
