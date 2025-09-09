"use client"

import { useState, useEffect } from "react"
import ContextualTooltip from "./ContextualTooltip"

interface TooltipStep {
  id: string
  selector: string
  title: string
  content: string
  position: "top" | "bottom" | "left" | "right"
}

const tooltipSteps: TooltipStep[] = [
  {
    id: "authors",
    selector: "[data-tour='authors']",
    title: "Add Your Authors",
    content: "Start here! Add your favorite authors and we'll find all their books for you.",
    position: "bottom"
  },
  {
    id: "recommendations",
    selector: "[data-tour='recommendations']",
    title: "Book Recommendations",
    content: "Click any book here to add it, or choose 'Add Author' to get their whole collection!",
    position: "bottom"
  },
  {
    id: "filters",
    selector: "[data-tour='filters']",
    title: "Find Your Books",
    content: "Search, filter, and sort your collection. Collapsed by default to keep things tidy.",
    position: "bottom"
  },
  {
    id: "books",
    selector: "[data-tour='books']",
    title: "Your Book Collection",
    content: "Purple borders = recommended books. Green borders = upcoming releases. Click Read/Want/Pass to organize.",
    position: "top"
  },
  {
    id: "analytics",
    selector: "[data-tour='analytics']",
    title: "Reading Stats",
    content: "See how many books you've read and track your reading progress.",
    position: "bottom"
  },
  {
    id: "settings",
    selector: "[data-tour='settings']",
    title: "Settings & Help",
    content: "Customize your experience and access this tour anytime.",
    position: "bottom"
  }
]

interface TooltipManagerProps {
  isActive: boolean
  onComplete: () => void
}

export default function TooltipManager({ isActive, onComplete }: TooltipManagerProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false)
      setCurrentStep(0)
      return
    }

    const showNextTooltip = () => {
      if (currentStep >= tooltipSteps.length) {
        onComplete()
        return
      }

      const step = tooltipSteps[currentStep]
      const element = document.querySelector(step.selector) as HTMLElement
      
      if (element) {
        setTargetElement(element)
        setIsVisible(true)
        
        // Scroll element into view
        element.scrollIntoView({ 
          behavior: "smooth", 
          block: "center",
          inline: "center"
        })
      } else {
        // If element not found, skip to next step
        setCurrentStep(prev => prev + 1)
        setTimeout(showNextTooltip, 500)
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(showNextTooltip, 500)
    return () => clearTimeout(timer)
  }, [isActive, currentStep, onComplete])

  const handleNext = () => {
    setIsVisible(false)
    setCurrentStep(prev => prev + 1)
  }

  const handleClose = () => {
    setIsVisible(false)
    onComplete()
  }

  if (!isActive || currentStep >= tooltipSteps.length) {
    return null
  }

  const currentStepData = tooltipSteps[currentStep]

  return (
    <>
      <ContextualTooltip
        isOpen={isVisible}
        onClose={handleClose}
        targetElement={targetElement}
        title={currentStepData.title}
        content={currentStepData.content}
        position={currentStepData.position}
      />
      
      {/* Overlay with next button */}
      {isVisible && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-20">
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-white rounded-lg shadow-lg p-4 border-2 border-blue-500">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Step {currentStep + 1} of {tooltipSteps.length}
                </span>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
                >
                  {currentStep === tooltipSteps.length - 1 ? "Finish Tour" : "Next"}
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-medium transition-colors"
                >
                  Skip Tour
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
