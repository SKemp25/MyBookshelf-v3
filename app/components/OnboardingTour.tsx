"use client"

import { useState, useEffect } from "react"
import ContextualTooltip from "./ContextualTooltip"

interface OnboardingStep {
  id: string
  selector: string
  title: string
  content: string
  position: "top" | "bottom" | "left" | "right"
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    selector: "[data-onboarding='welcome']",
    title: "Welcome to My Bookcase! 📚",
    content: "Let's get you started! This quick tour will show you how to build and organize your personal library.",
    position: "bottom"
  },
  {
    id: "authors",
    selector: "[data-onboarding='authors']",
    title: "Step 1: Add Your Favorite Authors",
    content: "Click here to add authors you love. We'll automatically find all their books for you! You can add multiple authors to build your collection.",
    position: "bottom"
  },
  {
    id: "search",
    selector: "[data-onboarding='search']",
    title: "Step 2: Search for Books",
    content: "Use the search bar to find specific books or authors. You can also use filters to narrow down your results.",
    position: "bottom"
  },
  {
    id: "view-modes",
    selector: "[data-onboarding='view-modes']",
    title: "Step 3: Choose Your View",
    content: "Switch between Grid View (cover images) and List View (spreadsheet style) to see your books the way you prefer.",
    position: "bottom"
  },
  {
    id: "book-actions",
    selector: "[data-onboarding='book-actions']",
    title: "Step 4: Organize Your Books",
    content: "For each book, you can mark it as 'Read', 'Want to Read', or 'Pass'. You can also rate books you've loved with the heart icon!",
    position: "top"
  },
  {
    id: "footer",
    selector: "[data-onboarding='footer']",
    title: "Step 5: Quick Navigation",
    content: "Use the footer to quickly filter your books: Library (all books), Favorites (loved books), Want to Read, and Finished books.",
    position: "top"
  },
  {
    id: "settings",
    selector: "[data-onboarding='settings']",
    title: "Step 6: Customize Your Experience",
    content: "Access Settings to customize your preferences, manage your authors, export your data, and access this tour again anytime.",
    position: "bottom"
  },
  {
    id: "complete",
    selector: "[data-onboarding='welcome']",
    title: "You're All Set! 🎉",
    content: "You're ready to start building your personal library! Add your first author to get started, or explore the app at your own pace. Happy reading!",
    position: "bottom"
  }
]

interface OnboardingTourProps {
  isActive: boolean
  onComplete: () => void
  userId?: string
}

export default function OnboardingTour({ isActive, onComplete, userId }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false)
      setCurrentStep(0)
      return
    }

    // Wait for element to be available before showing tooltip
    const showNextTooltip = () => {
      if (currentStep >= onboardingSteps.length) {
        onComplete()
        return
      }

      const step = onboardingSteps[currentStep]
      const element = document.querySelector(step.selector) as HTMLElement
      
      if (element) {
        setTargetElement(element)
        setIsVisible(true)
        
        // Use requestAnimationFrame to batch DOM operations and avoid forced reflows
        requestAnimationFrame(() => {
          // Scroll element into view with padding to account for footer
          element.scrollIntoView({ 
            behavior: "smooth", 
            block: "center",
            inline: "center"
          })
          
          // Add extra padding for footer - batch DOM reads
          requestAnimationFrame(() => {
            const rect = element.getBoundingClientRect()
            const footer = document.querySelector('footer')
            if (footer) {
              const footerHeight = footer.offsetHeight
              if (rect.bottom + footerHeight > window.innerHeight) {
                requestAnimationFrame(() => {
                  window.scrollBy({
                    top: footerHeight + 20,
                    behavior: 'smooth'
                  })
                })
              }
            }
          })
        })
      } else {
        // If element not found, wait longer and try again (don't auto-skip)
        console.warn(`Onboarding tour: Element not found for step ${currentStep + 1}: ${step.selector}`)
        // Don't auto-advance - let user manually proceed or fix the selector
      }
    }

    // Wait longer to ensure DOM is fully ready
    const timer = setTimeout(showNextTooltip, 1000)
    return () => clearTimeout(timer)
  }, [isActive, currentStep, onComplete])

  const handleNext = () => {
    setIsVisible(false)
    // Wait a bit before showing next step to ensure smooth transition
    setTimeout(() => {
      if (currentStep < onboardingSteps.length - 1) {
        setCurrentStep(prev => prev + 1)
      } else {
        onComplete()
      }
    }, 300)
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsVisible(false)
      // Wait a bit before showing previous step
      setTimeout(() => {
        setCurrentStep(prev => prev - 1)
      }, 300)
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    onComplete()
  }

  if (!isActive || currentStep >= onboardingSteps.length) {
    return null
  }

  const currentStepData = onboardingSteps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === onboardingSteps.length - 1

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
      
      {/* Overlay with navigation buttons */}
      {isVisible && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-30">
          <div className="absolute bottom-24 md:bottom-32 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white rounded-lg shadow-xl p-4 border-2 border-orange-500 max-w-sm mx-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Step {currentStep + 1} of {onboardingSteps.length}
                  </span>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close tour"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevious}
                    disabled={isFirstStep}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isFirstStep 
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    {isLastStep ? "Get Started!" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

