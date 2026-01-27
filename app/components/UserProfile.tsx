"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { User, Settings, Plus, Trash2, Users } from "lucide-react"
import type { User as UserType, Friend, SentRecommendation, ReadingPlatform } from "../lib/types"

interface UserProfileProps {
  user: UserType
  setUser: (user: UserType) => void
  friends: Friend[]
  setFriends: (friends: Friend[]) => void
  sentRecommendations: SentRecommendation[]
  platforms: ReadingPlatform[]
}

export default function UserProfile({
  user,
  setUser,
  friends,
  setFriends,
  sentRecommendations,
  platforms,
}: UserProfileProps) {
  const [showProfile, setShowProfile] = useState(false)
  const [newFriendName, setNewFriendName] = useState("")
  const [newFriendEmail, setNewFriendEmail] = useState("")
  const [newFriendPhone, setNewFriendPhone] = useState("")

  const updateUserSettings = (key: keyof UserType["settings"], value: any) => {
    setUser({
      ...user,
      settings: {
        ...user.settings,
        [key]: value,
      },
    })
  }

  const addFriend = () => {
    if (!newFriendName.trim()) return

    const newFriend: Friend = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: newFriendName.trim(),
      email: newFriendEmail.trim() || undefined,
      addedAt: new Date().toISOString(),
    }

    setFriends([...friends, newFriend])
    setNewFriendName("")
    setNewFriendEmail("")
    setNewFriendPhone("")
  }

  const removeFriend = (friendId: string) => {
    setFriends(friends.filter((f) => f.id !== friendId))
  }

  const togglePlatformPreference = (platformName: string) => {
    const currentPrefs = user.settings.preferredPlatforms
    const newPrefs = currentPrefs.includes(platformName)
      ? currentPrefs.filter((p) => p !== platformName)
      : [...currentPrefs, platformName]

    updateUserSettings("preferredPlatforms", newPrefs)
  }

  return (
    <>
      <Button
        onClick={() => setShowProfile(true)}
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/20 rounded-lg px-3 py-2"
      >
        <User className="w-5 h-5 mr-2" />
        <span className="hidden sm:inline">Profile</span>
      </Button>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-orange-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-orange-800 font-display text-2xl flex items-center gap-3">
              <User className="w-7 h-7" />
              User Profile & Settings
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-800 border-b border-orange-200 pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user-name" className="text-orange-700">
                    Display Name
                  </Label>
                  <Input
                    id="user-name"
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
                <div>
                  <Label htmlFor="user-email" className="text-orange-700">
                    Email
                  </Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={user.email}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    className="border-orange-200 focus:border-orange-400"
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-800 border-b border-orange-200 pb-2">Settings</h3>

              <div>
                <Label className="text-orange-700 mb-3 block">Default Language</Label>
                <Select
                  value={user.settings.defaultLanguage}
                  onValueChange={(value) => updateUserSettings("defaultLanguage", value)}
                >
                  <SelectTrigger className="border-orange-200 focus:border-orange-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-orange-700 mb-3 block">Preferred Reading Platforms</Label>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((platform, index) => (
                    <div key={`${platform.name}-${platform.category || 'default'}-${index}`} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`platform-${platform.name}`}
                        checked={user.settings.preferredPlatforms.includes(platform.name)}
                        onChange={() => togglePlatformPreference(platform.name)}
                        className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                      />
                      <label htmlFor={`platform-${platform.name}`} className="text-sm text-orange-800 cursor-pointer">
                        {platform.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-orange-700">Email Notifications</Label>
                  <Switch
                    checked={user.settings.emailNotifications}
                    onCheckedChange={(checked) => updateUserSettings("emailNotifications", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-orange-700">SMS Notifications</Label>
                  <Switch
                    checked={user.settings.smsNotifications}
                    onCheckedChange={(checked) => updateUserSettings("smsNotifications", checked)}
                  />
                </div>
              </div>
            </div>

            {/* Friends */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-800 border-b border-orange-200 pb-2 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Friends & Recommendations ({friends.length})
              </h3>

              {/* Add Friend */}
              <div className="space-y-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                <h4 className="font-medium text-orange-800">Add New Friend</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    placeholder="Name"
                    value={newFriendName}
                    onChange={(e) => setNewFriendName(e.target.value)}
                    className="border-orange-200 focus:border-orange-400"
                  />
                  <Input
                    placeholder="Email address"
                    type="email"
                    value={newFriendEmail}
                    onChange={(e) => setNewFriendEmail(e.target.value)}
                    className="border-orange-200 focus:border-orange-400"
                  />
                  <textarea
                    placeholder="Phone (optional)"
                    value={newFriendPhone}
                    onChange={(e) => setNewFriendPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={1}
                  />
                </div>
                <Button
                  onClick={addFriend}
                  disabled={!newFriendName.trim()}
                  size="sm"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Friend
                </Button>
              </div>

              {/* Friends List */}
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-orange-300 mx-auto mb-4" />
                  <p className="text-orange-600">No friends added yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                    >
                      <div>
                        <p className="font-medium text-orange-900">
                          {typeof friend.name === "string" ? friend.name : "Unknown Friend"}
                        </p>
                        {friend.email && (
                          <p className="text-sm text-orange-600">
                            {typeof friend.email === "string" ? friend.email : ""}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFriend(friend.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Sent Recommendations */}
              {sentRecommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-orange-800">Recent Recommendations Sent</h4>
                  <div className="space-y-2">
                    {sentRecommendations.slice(0, 5).map((rec) => (
                      <div key={rec.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-blue-900">
                              "{typeof rec.bookTitle === "string" ? rec.bookTitle : "Unknown Title"}" by{" "}
                              {typeof rec.bookAuthor === "string" ? rec.bookAuthor : "Unknown Author"}
                            </p>
                            <p className="text-sm text-blue-700">
                              Recommended to{" "}
                              {typeof rec.recipientName === "string" ? rec.recipientName : "Unknown Recipient"} (
                              {rec.recipientType})
                            </p>
                            <p className="text-xs text-blue-600 mt-1">{new Date(rec.sentAt).toLocaleDateString()}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              rec.status === "sent"
                                ? "border-blue-300 text-blue-700"
                                : rec.status === "read"
                                  ? "border-green-300 text-green-700"
                                  : "border-orange-300 text-orange-700"
                            }
                          >
                            {rec.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-orange-200">
              <Button
                onClick={() => setShowProfile(false)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8"
              >
                <Settings className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
