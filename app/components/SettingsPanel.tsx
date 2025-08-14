"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Plus, Trash2 } from "lucide-react"
import type { ReadingPlatform } from "../lib/types"

interface SettingsPanelProps {
  platforms: ReadingPlatform[]
  setPlatforms: (platforms: ReadingPlatform[]) => void
}

export default function SettingsPanel({ platforms, setPlatforms }: SettingsPanelProps) {
  const [newPlatformName, setNewPlatformName] = useState("")
  const [newPlatformUrl, setNewPlatformUrl] = useState("")

  const togglePlatform = (index: number) => {
    const updatedPlatforms = platforms.map((platform, i) =>
      i === index ? { ...platform, enabled: !platform.enabled } : platform,
    )
    setPlatforms(updatedPlatforms)
  }

  const addPlatform = () => {
    if (newPlatformName.trim() && newPlatformUrl.trim()) {
      const newPlatform: ReadingPlatform = {
        name: newPlatformName.trim(),
        url: newPlatformUrl.trim(),
        enabled: true,
      }
      setPlatforms([...platforms, newPlatform])
      setNewPlatformName("")
      setNewPlatformUrl("")
    }
  }

  const removePlatform = (index: number) => {
    const updatedPlatforms = platforms.filter((_, i) => i !== index)
    setPlatforms(updatedPlatforms)
  }

  const updatePlatformUrl = (index: number, newUrl: string) => {
    const updatedPlatforms = platforms.map((platform, i) => (i === index ? { ...platform, url: newUrl } : platform))
    setPlatforms(updatedPlatforms)
  }

  return (
    <Card className="bg-white border-orange-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Settings className="w-5 h-5" />
          Reading Platforms
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-orange-600 mb-4">
          Configure your preferred reading platforms. Use {"{title}"} as a placeholder for book titles in URLs.
        </div>

        {/* Existing Platforms */}
        <div className="space-y-3">
          {platforms.map((platform, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <Switch
                checked={platform.enabled}
                onCheckedChange={() => togglePlatform(index)}
                className="data-[state=checked]:bg-orange-500"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-orange-900">{platform.name}</div>
                <Input
                  value={platform.url}
                  onChange={(e) => updatePlatformUrl(index, e.target.value)}
                  className="mt-1 text-xs border-orange-200 focus:border-orange-400"
                  placeholder="https://example.com/search?q={title}"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removePlatform(index)}
                className="text-red-600 hover:text-red-800 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add New Platform */}
        <div className="border-t border-orange-200 pt-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="platform-name" className="text-orange-700">
                Platform Name
              </Label>
              <Input
                id="platform-name"
                value={newPlatformName}
                onChange={(e) => setNewPlatformName(e.target.value)}
                placeholder="e.g., Kindle Store"
                className="border-orange-200 focus:border-orange-400"
              />
            </div>
            <div>
              <Label htmlFor="platform-url" className="text-orange-700">
                Search URL Template
              </Label>
              <Input
                id="platform-url"
                value={newPlatformUrl}
                onChange={(e) => setNewPlatformUrl(e.target.value)}
                placeholder="https://example.com/search?q={title}"
                className="border-orange-200 focus:border-orange-400"
              />
            </div>
            <Button
              onClick={addPlatform}
              disabled={!newPlatformName.trim() || !newPlatformUrl.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Platform
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-xs text-orange-500 bg-orange-50 p-3 rounded-lg">
          <strong>Tip:</strong> Use {"{title}"} in your URL template where the book title should be inserted. For
          example: https://www.amazon.com/s?k={"{title}"}
        </div>
      </CardContent>
    </Card>
  )
}
