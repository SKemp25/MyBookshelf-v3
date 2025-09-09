"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { X, Lightbulb } from "lucide-react"

interface ContextualTooltipProps {
  isOpen: boolean
  onClose: () => void
  targetElement?: HTMLElement | null
  title: string
  content: string
  position?: "top" | "bottom" | "left" | "right"
}

export default function ContextualTooltip({ 
  isOpen, 
  onClose, 
  targetElement, 
  title, 
  content, 
  position = "top" 
}: ContextualTooltipProps) {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && targetElement && tooltipRef.current) {
      const targetRect = targetElement.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let top = 0
      let left = 0

      switch (position) {
        case "top":
          top = targetRect.top - tooltipRect.height - 10
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2)
          break
        case "bottom":
          top = targetRect.bottom + 10
          left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2)
          break
        case "left":
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2)
          left = targetRect.left - tooltipRect.width - 10
          break
        case "right":
          top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2)
          left = targetRect.right + 10
          break
      }

      // Adjust if tooltip goes off screen
      if (left < 10) left = 10
      if (left + tooltipRect.width > viewportWidth - 10) {
        left = viewportWidth - tooltipRect.width - 10
      }
      if (top < 10) top = 10
      if (top + tooltipRect.height > viewportHeight - 10) {
        top = viewportHeight - tooltipRect.height - 10
      }

      setTooltipPosition({ top, left })
    }
  }, [isOpen, targetElement, position])

  if (!isOpen) return null

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 bg-white border-2 border-blue-500 rounded-lg shadow-xl p-4 max-w-sm"
      style={{
        top: tooltipPosition.top,
        left: tooltipPosition.left,
      }}
    >
      {/* Arrow pointing to target */}
      <div className={`absolute w-0 h-0 ${
        position === "top" ? "top-full left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-500" :
        position === "bottom" ? "bottom-full left-1/2 transform -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-blue-500" :
        position === "left" ? "left-full top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-blue-500" :
        "right-full top-1/2 transform -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-blue-500"
      }`} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-blue-800 text-sm">{title}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-blue-50"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
      </div>
    </div>
  )
}
