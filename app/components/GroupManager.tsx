"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Trash2, UserPlus } from "lucide-react"
import type { BookGroup, Friend, SentRecommendation } from "../lib/types"

interface GroupManagerProps {
  currentUser: string
  groups: BookGroup[]
  setGroups: (groups: BookGroup[]) => void
  friends: Friend[]
  onRecommendationSent: (recommendation: SentRecommendation) => void
}

export default function GroupManager({
  currentUser,
  groups,
  setGroups,
  friends,
  onRecommendationSent,
}: GroupManagerProps) {
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDescription, setNewGroupDescription] = useState("")
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])

  const createGroup = () => {
    if (!newGroupName.trim()) return

    const newGroup: BookGroup = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || undefined,
      members: [
        { id: currentUser, name: "You", email: "", addedAt: new Date().toISOString() },
        ...selectedFriends.map((friendId) => {
          const friend = friends.find((f) => f.id === friendId)!
          return {
            id: friend.id,
            name: friend.name || "Unknown",
            email: friend.email || "",
            addedAt: new Date().toISOString(),
          }
        }),
      ],
      createdAt: new Date().toISOString(),
      createdBy: currentUser,
    }

    setGroups([...groups, newGroup])
    setNewGroupName("")
    setNewGroupDescription("")
    setSelectedFriends([])
    setShowCreateGroup(false)
  }

  const deleteGroup = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId))
  }

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]))
  }

  const userGroups = groups.filter((group) => group.members.some((member) => member.id === currentUser))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-orange-600" />
          <h3 className="text-xl font-display font-bold text-orange-800">Book Groups</h3>
        </div>
        <Button
          onClick={() => setShowCreateGroup(true)}
          size="sm"
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      {userGroups.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-orange-300 mx-auto mb-4" />
          <p className="text-orange-600 font-display text-lg mb-2">No book groups yet</p>
          <p className="text-orange-500 text-sm">Create a group to share book recommendations with friends</p>
        </div>
      ) : (
        <div className="space-y-4">
          {userGroups.map((group) => (
            <div
              key={group.id}
              className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-modern transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h4 className="font-display font-bold text-green-900 mb-1">{group.name}</h4>
                  {group.description && <p className="text-green-700 text-sm mb-2">{group.description}</p>}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {group.members.length} {group.members.length === 1 ? "member" : "members"}
                    </Badge>
                    {group.createdBy === currentUser && (
                      <Badge variant="outline" className="border-green-300 text-green-700">
                        Owner
                      </Badge>
                    )}
                  </div>
                </div>
                {group.createdBy === currentUser && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteGroup(group.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-green-800">Members:</p>
                <div className="flex flex-wrap gap-2">
                  {group.members.map((member) => (
                    <Badge key={member.id} variant="outline" className="border-green-300 text-green-700">
                      {typeof member === "string" ? member : member?.name || "Unknown"}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="sm:max-w-md bg-white border-orange-200 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-orange-800 font-display text-xl flex items-center gap-3">
              <Users className="w-6 h-6" />
              Create Book Group
            </DialogTitle>
            <DialogDescription className="sr-only">
              Create a new book group and add friends to it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label htmlFor="group-name" className="block text-sm font-medium text-orange-700 mb-2">
                Group Name
              </label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Mystery Book Club"
                className="border-orange-200 focus:border-orange-400"
              />
            </div>

            <div>
              <label htmlFor="group-description" className="block text-sm font-medium text-orange-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="group-description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="What's this group about?"
                rows={3}
                className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {friends.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-orange-700 mb-2">Invite Friends</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`friend-${friend.id}`}
                        checked={selectedFriends.includes(friend.id)}
                        onChange={() => toggleFriendSelection(friend.id)}
                        className="rounded border-orange-300 text-orange-600 focus:ring-orange-500"
                      />
                      <label htmlFor={`friend-${friend.id}`} className="text-sm text-orange-800 cursor-pointer">
                        {friend.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateGroup(false)}
                className="flex-1 border-orange-200 text-orange-700"
              >
                Cancel
              </Button>
              <Button
                onClick={createGroup}
                disabled={!newGroupName.trim()}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
