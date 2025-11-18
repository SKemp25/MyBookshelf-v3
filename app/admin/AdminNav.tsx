"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/analytics", label: "Analytics" },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <div className="flex flex-wrap items-center gap-2">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              isActive ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:text-slate-900",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}

