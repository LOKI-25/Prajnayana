"use client"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { PlusCircle, X, MessageSquare, BookOpen, Trophy, Brain, Edit, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { GradientBackground } from "@/components/ui/GradientBackground"
import { toast } from "@/hooks/use-toast"
import api from "@/lib/api"
/**
 * Note type definitions
 * Each type has specific styling and purpose to help users organize their thoughts
 */
const NOTE_TYPES = {
  AFFIRMATION: {
    id: "AFFIRMATION",
    label: "Affirmation",
    category: "Affirmation",
    color: "bg-blue-100 dark:bg-blue-900/30",
    borderColor: "border-blue-300 dark:border-blue-700",
    icon: MessageSquare,
    emoji: "💬",
  },
  QUOTE: {
    id: "QUOTE",
    label: "Quote",
    category: "Quote",
    color: "bg-green-100 dark:bg-green-900/30",
    borderColor: "border-green-300 dark:border-green-700",
    icon: BookOpen,
    emoji: "📚",
  },
  WIN: {
    id: "WIN",
    label: "Win & Achievement",
    category: "Win",
    color: "bg-yellow-100 dark:bg-yellow-900/30",
    borderColor: "border-yellow-300 dark:border-yellow-700",
    icon: Trophy,
    emoji: "🌟",
  },
  CBT: {
    id: "CBT",
    label: "CBT Prompt",
    category: "CBT",
    color: "bg-purple-100 dark:bg-purple-900/30",
    borderColor: "border-purple-300 dark:border-purple-700",
    icon: Brain,
    emoji: "🧠",
  },
}
// Helper function to get type ID from category
const getTypeFromCategory = (category) => {
  switch (category) {
    case "Affirmations":
      return "AFFIRMATION"
    case "Quotes":
      return "QUOTE"
    case "Wins":
      return "WIN"
    case "CBT":
      return "CBT"
    default:
      return "AFFIRMATION"
  }
}

// Helper function to get category from type ID
const getCategoryFromType = (type) => {
  return NOTE_TYPES[type]?.category || "Affirmations"
}
/**
 * Ensures notes stay within the board boundaries
 * Prevents notes from being dragged off-screen
 */
const ensureWithinBoundaries = (position, boardWidth, boardHeight) => {
  const noteWidth = 200
  const noteHeight = 150
  const padding = 20
  return {
    x: Math.min(Math.max(padding, position.x), boardWidth - noteWidth - padding),
    y: Math.min(Math.max(padding, position.y), boardHeight - noteHeight - padding),
  }
}
/**
 * Vision Board Component
 *
 * An interactive board that allows users to create, edit, and organize notes
 * representing their goals, affirmations, achievements, and reflections.
 */
export default function VisionBoardPage() {
  // State for notes and board
  const [notes, setNotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [boardDimensions, setBoardDimensions] = useState({ width: 800, height: 600 })
  const boardRef = useRef(null)
  // State for adding new notes
  const [newNoteContent, setNewNoteContent] = useState("")
  const [newNoteType, setNewNoteType] = useState("AFFIRMATION")
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false)
  // State for editing notes
  const [editingNote, setEditingNote] = useState(null)
  const [editedContent, setEditedContent] = useState("")
  const [editedType, setEditedType] = useState("AFFIRMATION")
  // State for deleting notes
  const [noteToDelete, setNoteToDelete] = useState(null)
  // State for API errors
  const [error, setError] = useState(null)
  /**
   * Generates a position for a new note with minimal overlap with existing notes
   */
  const generatePosition = (existingNotes = []) => {
    // Note dimensions
    const noteWidth = 200
    const noteHeight = 150
    const padding = 20
    // Calculate safe area within board
    const minX = padding
    const minY = padding
    const maxX = boardDimensions.width - noteWidth - padding
    const maxY = boardDimensions.height - noteHeight - padding
    // Try to find a position with minimal overlap (max 10 attempts)
    let bestPosition = { x: 0, y: 0 }
    let minOverlap = Number.MAX_VALUE
    for (let attempt = 0; attempt < 10; attempt++) {
      // Generate random position
      const randomX = minX + Math.random() * (maxX - minX)
      const randomY = minY + Math.random() * (maxY - minY)
      const position = { x: randomX, y: randomY }
      // Check overlap with existing notes
      let totalOverlap = 0
      for (const note of existingNotes) {
        const dx = Math.abs(note.position.x - position.x) - noteWidth
        const dy = Math.abs(note.position.y - position.y) - noteHeight
        if (dx < 0 && dy < 0) {
          totalOverlap += Math.abs(dx * dy) // Area of overlap
        }
      }
      // Keep track of position with minimal overlap
      if (totalOverlap < minOverlap) {
        minOverlap = totalOverlap
        bestPosition = position
        // If we found a position with no overlap, use it immediately
        if (totalOverlap === 0) break
      }
    }
    return bestPosition
  }
  /**
   * Adds a new note to the board
   */
  const addNote = async () => {
    if (!newNoteContent.trim()) return

    try {
      const position = generatePosition(notes)

      // Create new note via API
      const response = await api.post("/vision-board/", {
        content: newNoteContent,
        category: getCategoryFromType(newNoteType),
        favorite: false,
        position_x: position.x,
        position_y: position.y,
      })

      // Add the new note to state
      const newNote = {
        id: response.data.id,
        content: response.data.content,
        type: getTypeFromCategory(response.data.category),
        position: {
          x: response.data.position_x || position.x,
          y: response.data.position_y || position.y,
        },
        favorite: response.data.favorite,
        createdAt: new Date().toISOString(),
      }

      setNotes([...notes, newNote])
      setNewNoteContent("")
      setIsAddNoteOpen(false)

      toast({
        title: "Note created",
        description: "Your note has been added to the vision board.",
      })
    } catch (err) {
      console.error("Error creating note:", err)
      setError("Failed to create note. Please try again.")
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create note. Please try again.",
      })
    }
  }
  /**
   * Saves changes to an edited note
   */
  const saveEditedNote = async () => {
    if (!editingNote || !editedContent.trim()) return

    try {
      // Update note via API
      await api.put(`/vision-board/${editingNote.id}/`, {
        content: editedContent,
        category: getCategoryFromType(editedType),
        favorite: editingNote.favorite,
        position_x: editingNote.position.x,
        position_y: editingNote.position.y,
      })

      // Update note in state
      setNotes(
        notes.map((note) => {
          if (note.id === editingNote.id) {
            return {
              ...note,
              content: editedContent,
              type: editedType,
              updatedAt: new Date().toISOString(),
            }
          }
          return note
        }),
      )

      setEditingNote(null)
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      })
    } catch (err) {
      console.error("Error updating note:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update note. Please try again.",
      })
    }
  }
  /**
   * Measures board dimensions for positioning notes
   */
  useEffect(() => {
    if (boardRef.current) {
      const updateDimensions = () => {
        const { width, height } = boardRef.current.getBoundingClientRect()
        setBoardDimensions({ width, height })
      }
      // Initial measurement
      updateDimensions()
      // Re-measure on window resize
      window.addEventListener("resize", updateDimensions)
      // Re-measure after a short delay to ensure accurate dimensions
      const timer = setTimeout(updateDimensions, 500)
      return () => {
        window.removeEventListener("resize", updateDimensions)
        clearTimeout(timer)
      }
    }
  }, [])
  /**
   * Loads notes from API
   */
  useEffect(() => {
    const fetchNotes = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await api.get("/vision-board/")

        // Transform API data to match our component's format
        const transformedNotes = response.data.map((note) => ({
          id: note.id,
          content: note.content,
          type: getTypeFromCategory(note.category),
          position: {
            x: note.position_x || Math.random() * (boardDimensions.width - 220) + 20,
            y: note.position_y || Math.random() * (boardDimensions.height - 170) + 20,
          },
          favorite: note.favorite,
          createdAt: note.created_at || new Date().toISOString(),
          updatedAt: note.updated_at,
        }))

        setNotes(transformedNotes)
      } catch (err) {
        console.error("Failed to fetch notes:", err)
        setError("Failed to load vision board notes. Please try again.")
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load vision board notes.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotes()
  }, [boardDimensions.width, boardDimensions.height])
  /**
   * Opens the delete confirmation dialog
   */
  const confirmDelete = (id) => {
    setNoteToDelete(id)
  }
  /**
   * Deletes a note after confirmation
   */
  const deleteNote = async () => {
    if (noteToDelete) {
      try {
        // Delete note via API
        await api.delete(`/vision-board/${noteToDelete}/`)

        // Remove note from state
        setNotes(notes.filter((note) => note.id !== noteToDelete))
        setNoteToDelete(null)

        toast({
          title: "Note deleted",
          description: "Your note has been removed from the vision board.",
        })
      } catch (err) {
        console.error("Error deleting note:", err)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete note. Please try again.",
        })
      }
    }
  }
  /**
   * Cancels the delete operation
   */
  const cancelDelete = () => {
    setNoteToDelete(null)
  }
  /**
   * Updates a note's position after dragging
   */
  const updateNotePosition = async (id, position) => {
    // Find the note to update
    const noteToUpdate = notes.find((note) => note.id === id)
    if (!noteToUpdate) return

    // Ensure position is within boundaries
    const safePosition = ensureWithinBoundaries(position, boardDimensions.width, boardDimensions.height)

    try {
      // Update note position via API
      await api.put(`/vision-board/${id}/`, {
        content: noteToUpdate.content,
        category: getCategoryFromType(noteToUpdate.type),
        favorite: noteToUpdate.favorite,
        position_x: safePosition.x,
        position_y: safePosition.y,
      })

      // Update note in state
      setNotes(notes.map((note) => (note.id === id ? { ...note, position: safePosition } : note)))
    } catch (err) {
      console.error("Error updating note position:", err)
      // Silently fail position updates to avoid disrupting the user experience
    }
  }
  /**
   * Starts editing a note
   */
  const startEditingNote = (note) => {
    setEditingNote(note)
    setEditedContent(note.content)
    setEditedType(note.type)
  }

  /**
   * Toggles a note's favorite status
   */
  const toggleFavorite = async (note) => {
    try {
      // Update note via API
      await api.put(`/vision-board/${note.id}/`, {
        content: note.content,
        category: getCategoryFromType(note.type),
        favorite: !note.favorite,
        position_x: note.position.x,
        position_y: note.position.y,
      })

      // Update note in state
      setNotes(notes.map((n) => (n.id === note.id ? { ...n, favorite: !n.favorite } : n)))

      toast({
        title: note.favorite ? "Removed from favorites" : "Added to favorites",
        description: `Note has been ${note.favorite ? "removed from" : "added to"} favorites.`,
      })
    } catch (err) {
      console.error("Error toggling favorite status:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
      })
    }
  }
  /**
   * Generates example notes for first-time users
   * Places notes in different corners to avoid overlap
   */
  const generateExampleNotes = (boardWidth, boardHeight) => {
    const notes = []
    // Example notes data - one for each category
    const exampleData = [
      {
        content: "I am confident and capable in all situations.",
        type: "AFFIRMATION",
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      },
      {
        content: "The only way to do great work is to love what you do. - Steve Jobs",
        type: "QUOTE",
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
      },
      {
        content: "Completed my first 5K run today!",
        type: "WIN",
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      },
      {
        content: "When I feel anxious, what evidence do I have that I can handle this situation?",
        type: "CBT",
        createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      },
    ]
    // Generate notes with positions in different corners to avoid overlap
    for (const data of exampleData) {
      let position
      // Position notes in different corners
      switch (data.type) {
        case "AFFIRMATION":
          position = { x: boardWidth * 0.1, y: boardHeight * 0.1 } // Top left
          break
        case "QUOTE":
          position = { x: boardWidth * 0.6, y: boardHeight * 0.1 } // Top right
          break
        case "WIN":
          position = { x: boardWidth * 0.1, y: boardHeight * 0.6 } // Bottom left
          break
        case "CBT":
          position = { x: boardWidth * 0.6, y: boardHeight * 0.6 } // Bottom right
          break
        default:
          position = {
            x: Math.random() * (boardWidth - 220) + 20,
            y: Math.random() * (boardHeight - 170) + 20,
          }
      }
      const note = {
        id: `note-${notes.length + 1}`,
        content: data.content,
        type: data.type,
        position,
        createdAt: data.createdAt,
      }
      notes.push(note)
    }
    return notes
  }
  return (
    <Layout>
      <div className="bg-black text-off-white min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 px-4 overflow-hidden bg-black">
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
                Vision Board
              </h1>
              <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
                Visualize your aspirations and manifest your dreams with sticky notes
              </p>
            </motion.div>
          </div>
        </section>

        {/* Vision Board Section */}
        <section className="py-8 px-4">
          <div className="container mx-auto">
            {/* Header with title and add button */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-semibold">My Vision Board</h2>
                <p className="text-white/60">Drag notes to arrange them as you like</p>
              </div>

              {/* Add Note Dialog */}
              <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => setIsAddNoteOpen(true)}
                    className="bg-rich-teal hover:bg-rich-teal/90 flex items-center gap-2"
                  >
                    <PlusCircle size={18} />
                    Add Note
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-black border border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Add New Note</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {/* Note content textarea */}
                    <div className="space-y-2">
                      <Label htmlFor="note-content">Note Content</Label>
                      <Textarea
                        id="note-content"
                        placeholder="Write your note here..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        className="min-h-[100px] bg-white/5 border-white/10"
                      />
                    </div>
                    {/* Note type selection */}
                    <div className="space-y-2">
                      <Label>Note Type</Label>
                      <RadioGroup
                        value={newNoteType}
                        onValueChange={(value) => setNewNoteType(value)}
                        className="grid grid-cols-2 gap-2"
                      >
                        {Object.entries(NOTE_TYPES).map(([key, type]) => (
                          <div
                            key={key}
                            className={`flex items-center space-x-2 p-3 rounded-md border ${newNoteType === key ? type.borderColor : "border-white/10"} ${type.color} transition-all duration-200`}
                          >
                            <RadioGroupItem value={key} id={`note-type-${key}`} />
                            <Label htmlFor={`note-type-${key}`} className="flex items-center gap-2 cursor-pointer">
                              <span>{type.emoji}</span>
                              <span className="font-medium">{type.label}</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={addNote}
                      disabled={!newNoteContent.trim()}
                      className="bg-rich-teal hover:bg-rich-teal/90"
                    >
                      Add to Board
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Main Vision Board Canvas */}
            <div
              ref={boardRef}
              className="relative h-[600px] bg-gradient-to-br from-black to-rich-teal/10 rounded-xl p-4 border border-white/10 overflow-hidden"
            >
              {/* Loading State */}
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rich-teal"></div>
                </div>
              ) : notes.length === 0 ? (
                /* Empty State */
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
                  <div className="mb-4 p-4 rounded-full bg-white/5">
                    <PlusCircle size={40} />
                  </div>
                  <p className="text-center max-w-md">
                    Your vision board is empty. Add notes with affirmations, quotes, achievements, or CBT prompts to get
                    started.
                  </p>
                </div>
              ) : (
                /* Notes Display */
                <div className="relative h-full">
                  {notes.map((note) => {
                    const noteType = NOTE_TYPES[note.type]
                    return (
                      <motion.div
                        key={note.id}
                        className={`absolute p-4 rounded-lg ${noteType.color} border ${noteType.borderColor} shadow-md max-w-[200px]`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          x: note.position.x,
                          y: note.position.y,
                        }}
                        transition={{ duration: 0.3 }}
                        drag
                        dragConstraints={boardRef}
                        dragElastic={0.1}
                        dragMomentum={false}
                        whileHover={{ scale: 1.02, zIndex: 10 }}
                        whileTap={{ scale: 0.98 }}
                        onDragEnd={(e, info) => {
                          // Calculate new position after drag
                          const newPosition = {
                            x: note.position.x + info.offset.x,
                            y: note.position.y + info.offset.y,
                          }
                          // Update note position
                          updateNotePosition(note.id, newPosition)
                        }}
                        style={{
                          zIndex: 1,
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {/* Note Header with Type and Actions */}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1 text-sm opacity-70">
                            <span>{noteType.emoji}</span>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditingNote(note)}
                              className="text-white/60 hover:text-white/90 transition-colors"
                              aria-label="Edit note"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => confirmDelete(note.id)}
                              className="text-white/60 hover:text-white/90 transition-colors"
                              aria-label="Delete note"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                        {/* Note Content */}
                        <p className="whitespace-pre-wrap break-words text-sm">{note.content}</p>
                        {/* Note Footer with Date */}
                        <div className="mt-2 text-xs opacity-50">
                          {note.updatedAt
                            ? `Updated: ${new Date(note.updatedAt).toLocaleDateString()}`
                            : new Date(note.createdAt).toLocaleDateString()}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Edit Note Dialog */}
        <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
          <DialogContent className="sm:max-w-md bg-black border border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Edit Content */}
              <div className="space-y-2">
                <Label htmlFor="edit-note-content">Note Content</Label>
                <Textarea
                  id="edit-note-content"
                  placeholder="Edit your note..."
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[100px] bg-white/5 border-white/10"
                />
              </div>
              {/* Edit Type */}
              <div className="space-y-2">
                <Label>Note Type</Label>
                <RadioGroup
                  value={editedType}
                  onValueChange={(value) => setEditedType(value)}
                  className="grid grid-cols-2 gap-2"
                >
                  {Object.entries(NOTE_TYPES).map(([key, type]) => (
                    <div
                      key={key}
                      className={`flex items-center space-x-2 p-3 rounded-md border ${editedType === key ? type.borderColor : "border-white/10"} ${type.color} transition-all duration-200`}
                    >
                      <RadioGroupItem value={key} id={`edit-note-type-${key}`} />
                      <Label htmlFor={`edit-note-type-${key}`} className="flex items-center gap-2 cursor-pointer">
                        <span>{type.emoji}</span>
                        <span className="font-medium">{type.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingNote(null)}
                className="border-white/10 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={saveEditedNote}
                disabled={!editedContent.trim()}
                className="bg-rich-teal hover:bg-rich-teal/90"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
          <DialogContent className="sm:max-w-md bg-black border border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <AlertTriangle className="text-yellow-500" size={20} />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this note? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={cancelDelete} className="border-white/10 hover:bg-white/10">
                Cancel
              </Button>
              <Button onClick={deleteNote} className="bg-red-600 hover:bg-red-700">
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tips Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rich-teal/20 to-pale-cyan/20 border border-white/10 p-8 md:p-12"
            >
              {/* Animated Background */}
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

              {/* Tips Content */}
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-6">Vision Board Tips</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Affirmations Tip */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <MessageSquare size={18} className="text-blue-400" />
                      Affirmations
                    </h3>
                    <p className="text-white/80">
                      Write positive statements in the present tense as if they're already true. Example: "I am
                      confident and capable in all situations."
                    </p>
                  </div>
                  {/* Quotes Tip */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <BookOpen size={18} className="text-green-400" />
                      Quotes
                    </h3>
                    <p className="text-white/80">
                      Add inspiring quotes that resonate with your goals and values. Include the author if known.
                    </p>
                  </div>
                  {/* Wins Tip */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Trophy size={18} className="text-yellow-400" />
                      Wins & Achievements
                    </h3>
                    <p className="text-white/80">
                      Document your successes, no matter how small. Celebrating wins reinforces positive behavior and
                      builds confidence.
                    </p>
                  </div>
                  {/* CBT Tip */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Brain size={18} className="text-purple-400" />
                      CBT Prompts
                    </h3>
                    <p className="text-white/80">
                      Create cognitive behavioral therapy prompts to challenge negative thoughts. Example: "What
                      evidence supports or contradicts this thought?"
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
