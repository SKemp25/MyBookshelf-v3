"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, X } from "lucide-react"
import type { Book } from "../lib/types"

interface LanguageFilterProps {
  books: Book[]
  selectedLanguages: string[]
  onLanguagesChange: (languages: string[]) => void
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  hi: "Hindi",
  nl: "Dutch",
  sv: "Swedish",
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  pl: "Polish",
  cs: "Czech",
  hu: "Hungarian",
  tr: "Turkish",
  he: "Hebrew",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
  tl: "Filipino",
  uk: "Ukrainian",
  bg: "Bulgarian",
  hr: "Croatian",
  sr: "Serbian",
  sk: "Slovak",
  sl: "Slovenian",
  et: "Estonian",
  lv: "Latvian",
  lt: "Lithuanian",
  ro: "Romanian",
  el: "Greek",
  mt: "Maltese",
  ga: "Irish",
  cy: "Welsh",
  is: "Icelandic",
  fo: "Faroese",
}

export default function LanguageFilter({ books, selectedLanguages, onLanguagesChange }: LanguageFilterProps) {
  // Get available languages from books
  const availableLanguages = Array.from(
    new Set(
      books
        .map((book) => book.language)
        .filter(Boolean)
        .map((lang) => lang || "en"),
    ),
  ).sort()

  // Don't render if only one language available
  if (availableLanguages.length <= 1) {
    return null
  }

  const toggleLanguage = (language: string) => {
    if (selectedLanguages.includes(language)) {
      onLanguagesChange(selectedLanguages.filter((l) => l !== language))
    } else {
      onLanguagesChange([...selectedLanguages, language])
    }
  }

  const clearAllLanguages = () => {
    onLanguagesChange([])
  }

  const getLanguageName = (code: string) => {
    return LANGUAGE_NAMES[code] || code.toUpperCase()
  }

  const getBookCount = (language: string) => {
    return books.filter((book) => book.language === language).length
  }

  return (
    <Card className="bg-white border-orange-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-orange-800">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Languages
          </div>
          {selectedLanguages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllLanguages}
              className="text-orange-600 hover:text-orange-800 h-6 px-2"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {availableLanguages.map((language) => {
            const isSelected = selectedLanguages.includes(language)
            const bookCount = getBookCount(language)

            return (
              <Badge
                key={language}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                    : "border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent"
                }`}
                onClick={() => toggleLanguage(language)}
              >
                {getLanguageName(language)} ({bookCount})
              </Badge>
            )
          })}
        </div>

        {selectedLanguages.length > 0 && (
          <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
            Filtering by: {selectedLanguages.map(getLanguageName).join(", ")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
