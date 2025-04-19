"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, Check, Trash2, FlameIcon as Fire, Loader2 } from "lucide-react"
// Import the GradientBackground component at the top of the file
import { GradientBackground } from "@/components/ui/GradientBackground"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

/**
 * Helper functions for habit tracking
 */
// Generate a unique ID for new habits
const generateId = () => Math.random().toString(36).substring(2, 9)

// Get a date key in YYYY-MM-DD format
const getDayKey = (date) => {
  return date.toISOString().split("T")[0]
}

// Get the days of the current week
const getWeekDays = () => {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const monday = new Date(today.setDate(diff))
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(monday)
    currentDay.setDate(monday.getDate() + i)
    weekDays.push({
      date: currentDay,
      dayKey: getDayKey(currentDay),
      dayName: currentDay.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: currentDay.getDate(),
      isToday: getDayKey(currentDay) === getDayKey(new Date()),
    })
  }
  return weekDays
}

// Calculate the current streak for a habit
const calculateStreak = (habitId, completions) => {
  if (!completions || !habitId) return 0

  const today = new Date()
  let streak = 0

  // Check if today is completed
  const todayKey = getDayKey(today)
  const isTodayCompleted = completions[todayKey]?.[habitId]

  if (!isTodayCompleted) {
    // Check if yesterday was completed
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayKey = getDayKey(yesterday)
    if (!completions[yesterdayKey]?.[habitId]) {
      return 0 // Streak broken
    }
  }

  // Count consecutive days
  for (let i = 0; i < 100; i++) {
    // Limit to 100 days to avoid infinite loop
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    const checkKey = getDayKey(checkDate)
    if (completions[checkKey]?.[habitId]) {
      streak++
    } else {
      break
    }
  }
  return streak
}

/**
 * HabitTrackerPage component
 * Allows users to create, track, and manage habits with daily completion tracking
 */
export default function HabitTrackerPage() {
  // State for habits and UI
  const [habits, setHabits] = useState([])
  const [defaultHabits, setDefaultHabits] = useState([])
  const [newHabitName, setNewHabitName] = useState("")
  const [newHabitDescription, setNewHabitDescription] = useState("")
  const [weekDays, setWeekDays] = useState(getWeekDays())
  const [isSelectingDefault, setIsSelectingDefault] = useState(false)
  const [isCreatingCustom, setIsCreatingCustom] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [completions, setCompletions] = useState({})
  const [trackedHabitIds, setTrackedHabitIds] = useState(new Set())

  // Fetch all available habits from API
  const fetchAvailableHabits = async () => {
    try {
      // Get the token from localStorage
      const token = localStorage.getItem("token")

      // Set up headers with authentication
      const headers = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Fetch all available habits
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/habits/`, {
        headers,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Transform the data into the format we need for default habits
      const availableHabits = data.map((habit) => ({
        id: habit.id,
        name: habit.habit || "Unnamed Habit",
        icon: getHabitIcon(habit.habit),
        description: habit.description || "",
      }))
      console.log("Fetched habits", availableHabits)

      // Remove duplicates based on habit ID
      const uniqueHabits = Array.from(new Map(availableHabits.map((habit) => [habit.id, habit])).values())

      console.log("unique habits", uniqueHabits)

      setDefaultHabits(uniqueHabits)

      return uniqueHabits
    } catch (err) {
      console.error("Error fetching available habits:", err)
      return []
    }
  }

  // Helper function to assign icons based on habit name
  const getHabitIcon = (habitName) => {
    if (!habitName) return "✅"

    const name = habitName.toLowerCase()
    if (name.includes("meditation") || name.includes("mindful")) return "🧘"
    if (name.includes("exercise") || name.includes("workout") || name.includes("run")) return "🏃"
    if (name.includes("journal") || name.includes("write") || name.includes("gratitude")) return "📝"
    if (name.includes("read")) return "📚"
    if (name.includes("water") || name.includes("drink")) return "💧"
    if (name.includes("meal") || name.includes("food") || name.includes("eat")) return "🥗"
    if (name.includes("sleep")) return "😴"

    return "✅" // Default icon
  }

  // Fetch habit tracking data from API
  const fetchHabitTracking = async () => {
    try {
      // Get the token from localStorage
      const token = localStorage.getItem("token")

      // Set up headers with authentication
      const headers = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Fetch habit tracking data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/habit_tracking/`, {
        headers,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      console.error("Error fetching habit tracking:", err)
      return []
    }
  }

  // Fetch habits and tracking data
  const fetchHabits = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // First, fetch all available habits
      const availableHabits = await fetchAvailableHabits()

      // Then, fetch habit tracking data
      const trackingData = await fetchHabitTracking()

      // Process the tracking data
      const habitMap = new Map() // Map to store unique habits
      const completionMap = {} // Map to store completions by date and habit ID
      const trackedIds = new Set() // Set to track which habit IDs are already being tracked

      // Process each habit tracking entry
      trackingData.forEach((entry) => {
        const habitData = entry.habit
        const habitId = habitData.id
        const date = entry.date
        const isDone = entry.is_done

        // Add habit to map if not already there
        if (!habitMap.has(habitId)) {
          habitMap.set(habitId, {
            id: habitId,
            name: habitData.habit || "Unnamed Habit",
            description: habitData.description || "",
            user: habitData.user,
            icon: getHabitIcon(habitData.habit),
            streak: 0,
          })
        }

        // Track this habit ID
        trackedIds.add(habitId)

        // Add completion data
        if (!completionMap[date]) {
          completionMap[date] = {}
        }
        completionMap[date][habitId] = isDone
      })

      // Convert the habit map to an array
      const habitArray = Array.from(habitMap.values())

      // Calculate streaks for each habit
      habitArray.forEach((habit) => {
        habit.streak = calculateStreak(habit.id, completionMap)
      })

      setHabits(habitArray)
      setCompletions(completionMap)
      setTrackedHabitIds(trackedIds)
    } catch (err) {
      console.error("Error fetching habits:", err)
      setError("Failed to load habits. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Load habits on component mount
  useEffect(() => {
    fetchHabits()
  }, [])

  // Recalculate week days when component mounts
  useEffect(() => {
    setWeekDays(getWeekDays())
  }, [])

  // Add a new habit
  const addHabit = async () => {
    if (!newHabitName.trim()) return

    setIsSubmitting(true)

    try {
      // Get token from localStorage
      const token = localStorage.getItem("token")

      // Set up headers with authentication
      const headers = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Create new habit via API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/habits/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          habit: newHabitName.trim(),
          description: newHabitDescription.trim() || "No description provided",
        }),
      })

      if (response.status === 401) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to create habits.",
        })
        setIsSubmitting(false)
        return
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Refresh habits list
      await fetchHabits()

      // Clear form
      setNewHabitName("")
      setNewHabitDescription("")
      setIsCreatingCustom(false)

      // Show success message
      toast({
        title: "Habit created",
        description: "Your new habit has been added successfully.",
      })
    } catch (err) {
      console.error("Error creating habit:", err)
      setError("Failed to create habit. Please try again.")

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create habit. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Add a default habit
  const addDefaultHabit = async (habit) => {
    setIsSubmitting(true)

    try {
      // Get token from localStorage
      const token = localStorage.getItem("token")

      // Set up headers with authentication
      const headers = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Get today's date in YYYY-MM-DD format
      const today = getDayKey(new Date())

      // Add habit to tracking list via API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/habit_tracking/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          habit_id: habit.id,
          date: today,
          is_done: false,
        }),
      })

      if (response.status === 401) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to add habits to tracking.",
        })
        setIsSubmitting(false)
        return
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Refresh habits list
      await fetchHabits()

      // Close the default habits panel
      setIsSelectingDefault(false)

      // Show success message
      toast({
        title: "Habit added to tracking",
        description: `${habit.name} has been added to your tracking list.`,
      })
    } catch (err) {
      console.error("Error adding habit to tracking:", err)

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add habit to tracking. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete a habit
  const deleteHabit = async (habitId) => {
    if (!confirm("Are you sure you want to delete this habit?")) return

    setIsSubmitting(true)

    try {
      // Get token from localStorage
      const token = localStorage.getItem("token")

      // Set up headers with authentication
      const headers = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Delete habit via API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/habits/${habitId}/delete/`, {
        method: "DELETE",
        headers,
      })

      if (response.status === 401) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to delete habits.",
        })
        return
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Refresh habits list
      await fetchHabits()

      // Show success message
      toast({
        title: "Habit deleted",
        description: "The habit has been deleted successfully.",
      })
    } catch (err) {
      console.error("Error deleting habit:", err)

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete habit. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle habit completion for a specific day
  const toggleCompletion = async (habitId,habit_tracking_id ,dayKey) => {
    setIsSubmitting(true)

    try {
      // Get token from localStorage
      const token = localStorage.getItem("token")

      // Set up headers with authentication
      const headers = {
        "Content-Type": "application/json",
      }

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      // Get current completion status
      const isCurrentlyCompleted = completions[dayKey]?.[habitId] || false

      // Update completion status via API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/habit_tracking/${habit_tracking_id}/`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          date: dayKey,
          habit_id: habitId,
          is_done: !isCurrentlyCompleted,
        }),
      })

      if (response.status === 401) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to update your habits.",
        })
        return
      }

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      // Update local state
      setCompletions((prev) => {
        const newCompletions = { ...prev }
        if (!newCompletions[dayKey]) {
          newCompletions[dayKey] = {}
        }
        newCompletions[dayKey][habitId] = !isCurrentlyCompleted
        return newCompletions
      })

      // Update streak for the habit
      setHabits((prev) =>
        prev.map((habit) =>
          habit.id === habitId
            ? {
                ...habit,
                streak: calculateStreak(habitId, {
                  ...completions,
                  [dayKey]: {
                    ...completions[dayKey],
                    [habitId]: !isCurrentlyCompleted,
                  },
                }),
              }
            : habit,
        ),
      )
    } catch (err) {
      console.error("Error toggling habit completion:", err)

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update habit status. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter default habits to show only those not already being tracked
  const filteredDefaultHabits = defaultHabits.filter(
    (defaultHabit) => !habits.some((habit) => habit.id === defaultHabit.id),
  )

  return (
    <Layout>
      <div className="bg-black text-off-white min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-12 px-4 overflow-hidden bg-black">
          <div className="absolute inset-0">
            <GradientBackground intensity="medium" />
          </div>

          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-orange to-brand-white rounded-full opacity-20 blur-md"></div>
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot_20250211_124203_Canva.jpg-MFGUwzCJRN5TUx2f4Msr0b0cWGQNMl.jpeg"
                  alt="Aranya Logo"
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-brand-orange to-brand-white bg-clip-text text-transparent">
                Habit Tracker
              </h1>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Build consistency and transform your life through mindful habit cultivation
              </p>
            </motion.div>
          </div>
        </section>

        {/* Habit Tracker Section */}
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-4xl">
            {/* Add Habit Button/Form */}
            <div className="mb-8">
              <AnimatePresence mode="wait">
                {!isSelectingDefault && !isCreatingCustom ? (
                  <motion.div
                    key="options"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col gap-4"
                  >
                    <Button
                      onClick={() => setIsSelectingDefault(true)}
                      className="w-full bg-gradient-to-r from-rich-teal to-pale-cyan hover:opacity-90 text-white"
                      disabled={isSubmitting || filteredDefaultHabits.length === 0}
                    >
                      <Plus size={18} className="mr-2" /> Choose from Templates
                      {filteredDefaultHabits.length === 0 && " (All added)"}
                    </Button>
                    <Button
                      onClick={() => setIsCreatingCustom(true)}
                      className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                      disabled={isSubmitting}
                    >
                      <Plus size={18} className="mr-2" /> Create Custom Habit
                    </Button>
                  </motion.div>
                ) : isSelectingDefault ? (
                  <motion.div
                    key="default-options"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-gradient-to-br from-rich-teal/10 to-pale-cyan/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Choose a Habit Template</h3>
                      <button
                        onClick={() => setIsSelectingDefault(false)}
                        className="text-white/60 hover:text-white"
                        disabled={isSubmitting}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {filteredDefaultHabits.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        {filteredDefaultHabits.map((habit, index) => (
                          <Button
                            key={habit.id || index}
                            onClick={() => addDefaultHabit(habit)}
                            className="justify-start bg-white/10 hover:bg-white/20 text-left"
                            disabled={isSubmitting}
                          >
                            <span className="mr-2">{habit.icon}</span> {habit.name}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-white/60 mb-4">You've added all the available habits!</div>
                    )}

                    <Button
                      onClick={() => {
                        setIsSelectingDefault(false)
                        setIsCreatingCustom(true)
                      }}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10"
                      disabled={isSubmitting}
                    >
                      Create Custom Habit Instead
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-gradient-to-br from-rich-teal/10 to-pale-cyan/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">Add Custom Habit</h3>
                      <button
                        onClick={() => setIsCreatingCustom(false)}
                        className="text-white/60 hover:text-white"
                        disabled={isSubmitting}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="habit-name">Habit Name</Label>
                        <Input
                          id="habit-name"
                          type="text"
                          placeholder="Enter habit name..."
                          value={newHabitName}
                          onChange={(e) => setNewHabitName(e.target.value)}
                          className="bg-black/20 border-white/10 mt-1"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <Label htmlFor="habit-description">Description (Optional)</Label>
                        <Textarea
                          id="habit-description"
                          placeholder="Add a description for your habit..."
                          value={newHabitDescription}
                          onChange={(e) => setNewHabitDescription(e.target.value)}
                          className="bg-black/20 border-white/10 min-h-[80px] mt-1"
                          disabled={isSubmitting}
                        />
                      </div>

                      <Button
                        onClick={addHabit}
                        className="w-full bg-rich-teal hover:bg-rich-teal/90"
                        disabled={!newHabitName.trim() || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Habit"
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-[1fr_auto] gap-4 mb-4">
              <div className="pl-4">
                <h3 className="text-lg font-semibold">Your Habits</h3>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <div
                    key={day.dayKey}
                    className={`w-10 h-10 flex flex-col items-center justify-center text-xs rounded-full ${day.isToday ? "bg-muted-coral/20 text-white" : "text-white/60"}`}
                  >
                    <span>{day.dayName}</span>
                    <span className="font-bold">{day.dayNumber}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-rich-teal" />
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6 text-center">
                <p className="text-white/90 mb-4">{error}</p>
                {error.includes("Authentication required") ? (
                  <Button
                    onClick={() => (window.location.href = "/auth/login")}
                    className="bg-rich-teal hover:bg-rich-teal/90"
                  >
                    Log In
                  </Button>
                ) : (
                  <Button onClick={fetchHabits} className="bg-rich-teal hover:bg-rich-teal/90">
                    Try Again
                  </Button>
                )}
              </div>
            )}

            {/* Habits List */}
            <AnimatePresence>
              {!isLoading && !error && habits.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-gradient-to-br from-rich-teal/5 to-pale-cyan/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center"
                >
                  <p className="text-white/60 mb-4">You haven't added any habits yet.</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={() => setIsSelectingDefault(true)} className="bg-rich-teal hover:bg-rich-teal/90">
                      <Plus size={18} className="mr-2" /> Add Template Habit
                    </Button>
                    <Button
                      onClick={() => setIsCreatingCustom(true)}
                      className="bg-white/10 hover:bg-white/20 border border-white/20"
                    >
                      <Plus size={18} className="mr-2" /> Create Custom Habit
                    </Button>
                  </div>
                </motion.div>
              ) : (
                !isLoading &&
                !error &&
                habits.map((habit) => (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gradient-to-br from-rich-teal/10 to-pale-cyan/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-4"
                  >
                    <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-lg flex items-center">
                            {habit.icon && <span className="mr-2">{habit.icon}</span>}
                            {habit.name}
                          </h3>
                          {habit.description && <p className="text-sm text-white/60 mt-1">{habit.description}</p>}
                          {habit.streak > 0 && (
                            <div className="flex items-center text-xs text-white/70 mt-1">
                              <Fire size={14} className="text-orange-400 mr-1" />
                              <span>{habit.streak}-day streak</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="text-white/40 hover:text-white/80 transition-colors"
                          disabled={isSubmitting}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {weekDays.map((day) => {
                          const isCompleted = completions[day.dayKey]?.[habit.id] || false
                          const isToday = day.dayKey === getDayKey(new Date())
                          const isPast = new Date(day.date) < new Date(new Date().setHours(0, 0, 0, 0))
                          return (
                            <button
                              key={`${habit.id}-${day.dayKey}`}
                              onClick={() => toggleCompletion(habit.id,habit.habit day.dayKey)}
                              disabled={isSubmitting}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all 
                                ${isCompleted ? "bg-rich-teal text-white" : "bg-white/5 hover:bg-white/10 text-white/40"} 
                                ${day.isToday ? "ring-2 ring-muted-coral/30" : ""} 
                                ${isSubmitting ? "cursor-default opacity-80" : "cursor-pointer"}`}
                              title={isCompleted ? "Completed" : "Not completed"}
                            >
                              {isCompleted && <Check size={16} />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Tips Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rich-teal/20 to-pale-cyan/20 border border-white/10 p-6 md:p-8 text-center"
            >
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
                className="absolute top-1/2 right-0 transform -translate-y-1/2 w-96 h-96 bg-rich-teal/20 rounded-full filter blur-3xl"
              />

              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-6">Habit Building Tips</h2>
                <ul className="text-white/80 text-left max-w-2xl mx-auto space-y-2 mb-4">
                  <li className="flex items-start">
                    <Check size={18} className="text-rich-teal mr-2 mt-1 flex-shrink-0" />
                    <span>Start small: Begin with just 1-3 habits to avoid overwhelm</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-rich-teal mr-2 mt-1 flex-shrink-0" />
                    <span>Be specific: "Meditate for 5 minutes" is better than "Meditate"</span>
                  </li>
                  <li className="flex items-start">
                    <Check size={18} className="text-rich-teal mr-2 mt-1 flex-shrink-0" />
                    <span>Track daily: Check in every day to maintain your streak</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
