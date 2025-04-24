"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Edit2, Camera, Loader2 } from "lucide-react"
import Image from "next/image"
import { Typography } from "@/components/ui/Typography"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import api from "@/lib/api"
/**
 * Initial profile data for demonstration - will be overridden by user data when available
 */
const initialProfile = {
  firstName: "Sienna",
  lastName: "Hewitt",
  email: "siennahewitt@gmail.com",
  gender: "Female",
  yearOfBirth: "1990",
  country: "United States",
  lastLogin: "July 15, 2025 10:30 AM",
}
// Simplify the ProfileCard component to focus on essential data
export function ProfileCard({ onClose, user }) {
  // State for profile data and UI
  const [profile, setProfile] = useState(() => {
    if (user) {
      return {
        firstName: user.first_name || user.name?.split(" ")[0] || "",
        lastName: user.last_name || user.name?.split(" ").slice(1).join(" ") || "",
        email: user.email || "",
        gender: user.gender || "Male",
        yearOfBirth: user.year_of_birth || "",
        country: user.country || "",
        lastLogin: user.last_login || new Date().toLocaleString(),
      }
    }
    return initialProfile
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.first_name || user.name?.split(" ")[0] || "",
        lastName: user.last_name || user.name?.split(" ").slice(1).join(" ") || "",
        email: user.email || "",
        gender: user.gender || "Male",
        yearOfBirth: user.year_of_birth || "",
        country: user.country || "",
        lastLogin: user.last_login || new Date().toLocaleString(),
      })
    }
  }, [user])

  /**
   * Save profile changes
   */
  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get the user ID from the user object
      const userId = user?.id

      if (!userId) {
        throw new Error("User ID not found")
      }

      // Format the data for the API
      const updateData = {
        email: profile.email,
        first_name: profile.firstName,
        last_name: profile.lastName,
        gender: profile.gender,
        year_of_birth: Number.parseInt(profile.yearOfBirth) || null,
      }

      // Make the API call to update the profile
      await api.put(`/auth/users/${userId}/`, updateData)

      // Since the API only returns a success message and not the updated data,
      // we'll update the user state with our form data
      if (user) {
        // Update the user object with the new values
        user.first_name = profile.firstName
        user.last_name = profile.lastName
        user.email = profile.email
        user.gender = profile.gender
        user.year_of_birth = Number.parseInt(profile.yearOfBirth) || null
      }

      setIsEditing(false)

      // Show success message
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      setError(error.message || "Failed to update profile. Please try again.")

      // Show error message
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update profile. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-3xl bg-white dark:bg-black/80 backdrop-blur-md text-dark-slate dark:text-off-white p-8 relative max-w-3xl w-full mx-auto shadow-xl"
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-6 top-6 text-dark-slate/60 dark:text-white/60 hover:text-dark-slate dark:hover:text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Edit Button */}
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="absolute right-16 top-6 text-dark-slate/60 dark:text-white/60 hover:text-dark-slate dark:hover:text-white transition-colors"
      >
        <Edit2 className="w-5 h-5" />
      </button>

      {/* Header Section */}
      <div className="flex items-start gap-6 mb-8">
        {/* Profile Picture */}
        <div className="relative">
          <Image src="/placeholder.svg" alt="Profile picture" width={100} height={100} className="rounded-full" />
          {isEditing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1">
          <Typography variant="h2" className="mb-1">
            {profile.firstName} {profile.lastName}
          </Typography>
          <Typography variant="body" className="text-dark-slate/60 dark:text-white/60 mb-2">
            {profile.email}
          </Typography>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">{error}</div>}

      {/* Profile Details */}
      <div className="space-y-4 mb-8">
        <Typography variant="h3" className="mb-4">
          Profile Information
        </Typography>

        <div className="grid grid-cols-2 gap-4">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-dark-slate/60 dark:text-white/60">
              First Name
            </Label>
            <Input
              id="firstName"
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              className={`bg-pale-cyan/10 border-pale-cyan dark:border-rich-teal text-dark-slate dark:text-off-white ${isEditing ? "" : "pointer-events-none"}`}
              disabled={!isEditing}
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-dark-slate/60 dark:text-white/60">
              Last Name
            </Label>
            <Input
              id="lastName"
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              className={`bg-pale-cyan/10 border-pale-cyan dark:border-rich-teal text-dark-slate dark:text-off-white ${isEditing ? "" : "pointer-events-none"}`}
              disabled={!isEditing}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-dark-slate/60 dark:text-white/60">
              Email
            </Label>
            <Input
              id="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className={`bg-pale-cyan/10 border-pale-cyan dark:border-rich-teal text-dark-slate dark:text-off-white ${isEditing ? "" : "pointer-events-none"}`}
              disabled={!isEditing}
            />
          </div>

          {/* Gender - New Field */}
          <div className="space-y-2">
            <Label htmlFor="gender" className="text-dark-slate/60 dark:text-white/60">
              Gender
            </Label>
            {isEditing ? (
              <Select
                value={profile.gender}
                onValueChange={(value) => setProfile({ ...profile, gender: value })}
                disabled={!isEditing}
              >
                <SelectTrigger className="bg-pale-cyan/10 border-pale-cyan dark:border-rich-teal text-dark-slate dark:text-off-white">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={profile.gender}
                readOnly
                className="bg-pale-cyan/10 border-pale-cyan dark:border-rich-teal text-dark-slate dark:text-off-white pointer-events-none"
                disabled
              />
            )}
          </div>

          {/* Year of Birth */}
          <div className="space-y-2">
            <Label htmlFor="yearOfBirth" className="text-dark-slate/60 dark:text-white/60">
              Year of Birth
            </Label>
            <Input
              id="yearOfBirth"
              value={profile.yearOfBirth}
              onChange={(e) => setProfile({ ...profile, yearOfBirth: e.target.value })}
              className={`bg-pale-cyan/10 border-pale-cyan dark:border-rich-teal text-dark-slate dark:text-off-white ${isEditing ? "" : "pointer-events-none"}`}
              disabled={!isEditing}
              type="number"
            />
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label htmlFor="country" className="text-dark-slate/60 dark:text-white/60">
              Country
            </Label>
            <Input
              id="country"
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              className={`bg-pale-cyan/10 border-pale-cyan dark:border-rich-teal text-dark-slate dark:text-off-white ${isEditing ? "" : "pointer-events-none"}`}
              disabled={!isEditing}
            />
          </div>

          {/* Last Login */}
          <div className="space-y-2">
            <Label htmlFor="lastLogin" className="text-dark-slate/60 dark:text-white/60">
              Last Login
            </Label>
            <Input
              id="lastLogin"
              value={profile.lastLogin}
              readOnly
              className="bg-pale-cyan/10 border-pale-cyan dark:border-rich-teal text-dark-slate dark:text-off-white pointer-events-none"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            className="bg-pale-cyan/10 border-pale-cyan dark:border-rich-teal text-dark-slate dark:text-off-white hover:bg-pale-cyan/20 dark:hover:bg-rich-teal/30"
            onClick={() => setIsEditing(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-rich-teal text-off-white hover:bg-rich-teal/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      )}
    </motion.div>
  )
}
