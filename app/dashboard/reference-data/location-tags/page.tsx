"use client"

import { Tag, Plus, Search, Filter, MoreVertical, Pencil, Trash2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"

// Types
interface LocationTag {
  location_tag_name: string
  // Volume capacity fields
  length?: number
  breadth?: number
  height?: number
  volume?: number // Calculated: L x B x H
  current_items: number
}

// Form schema
const locationTagSchema = z.object({
  location_tag_name: z.string().min(1, "Location Tag Name is required").max(100, "Name must be less than 100 characters"),
  // Volume capacity fields
  length: z.number().positive("Length must be positive").optional(),
  breadth: z.number().positive("Breadth must be positive").optional(),
  height: z.number().positive("Height must be positive").optional(),
}).refine((data) => {
  // If any dimension is provided, all must be provided
  const hasAnyDimension = data.length || data.breadth || data.height;
  const hasAllDimensions = data.length && data.breadth && data.height;
  return !hasAnyDimension || hasAllDimensions;
}, {
  message: "If you provide one dimension, you must provide all three (Length, Breadth, Height)",
  path: ["length"],
});

type LocationTagFormValues = z.infer<typeof locationTagSchema>

// Default data
const defaultLocationTags: LocationTag[] = [
  {
    location_tag_name: "Warehouse A - Rack 1",
    length: 10,
    breadth: 5,
    height: 2,
    volume: 100, // 10 x 5 x 2
    current_items: 0,
  },
  {
    location_tag_name: "Warehouse A - Loading Dock",
    length: 5,
    breadth: 5,
    height: 2,
    volume: 50, // 5 x 5 x 2
    current_items: 0,
  },
  {
    location_tag_name: "Warehouse B - Quality Check",
    length: 5,
    breadth: 2.5,
    height: 2,
    volume: 25, // 5 x 2.5 x 2
    current_items: 0,
  },
]

// localStorage keys
const LOCATION_TAGS_STORAGE_KEY = "worcoor-location-tags"
const ORG_UNITS_STORAGE_KEY = "worcoor-org-units"

export default function LocationTagsPage() {
  const [locationTags, setLocationTags] = useState<LocationTag[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<LocationTag | null>(null)
  const [deleteTag, setDeleteTag] = useState<LocationTag | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form initialization
  const form = useForm<LocationTagFormValues>({
    resolver: zodResolver(locationTagSchema),
    defaultValues: {
      location_tag_name: "",
      length: undefined,
      breadth: undefined,
      height: undefined,
    },
  })

  // Load data from localStorage on mount
  useEffect(() => {
    // Load location tags
    const storedTags = localStorage.getItem(LOCATION_TAGS_STORAGE_KEY)
    if (storedTags) {
      try {
        const parsedTags = JSON.parse(storedTags)
        setLocationTags(parsedTags)
      } catch (error) {
        console.error("Error parsing stored location tags:", error)
        // Fallback to default data
        setLocationTags(defaultLocationTags)
        localStorage.setItem(LOCATION_TAGS_STORAGE_KEY, JSON.stringify(defaultLocationTags))
      }
    } else {
      // Initialize with default data
      setLocationTags(defaultLocationTags)
      localStorage.setItem(LOCATION_TAGS_STORAGE_KEY, JSON.stringify(defaultLocationTags))
    }

  }, [])

  // Save to localStorage whenever locationTags changes
  useEffect(() => {
    if (locationTags.length > 0) {
      localStorage.setItem(LOCATION_TAGS_STORAGE_KEY, JSON.stringify(locationTags))
    }
  }, [locationTags])

  // Filter tags based on search and filters
  const filteredTags = locationTags.filter((tag) => {
    const search = searchTerm.toLowerCase()
    const tagName = (tag.location_tag_name ?? (tag as any).name ?? "").toString().toLowerCase()

    const matchesSearch = tagName.includes(search)

    return matchesSearch
  })

  // Handle add new tag
  const handleAddTag = (data: LocationTagFormValues) => {
    setIsSubmitting(true)

    // Calculate volume if dimensions are provided
    const calculatedVolume = (data.length && data.breadth && data.height) 
      ? data.length * data.breadth * data.height 
      : undefined

    const newTag: LocationTag = {
      location_tag_name: data.location_tag_name,
      length: data.length,
      breadth: data.breadth,
      height: data.height,
      volume: calculatedVolume,
      current_items: 0,
    }

    setLocationTags((prev) => [...prev, newTag])
    setIsAddDialogOpen(false)
    form.reset()

    toast({
      title: "Location tag created",
      description: `${newTag.location_tag_name} has been added successfully.`,
    })

    setIsSubmitting(false)
  }

  // Handle edit tag
  const handleEditTag = (data: LocationTagFormValues) => {
    if (!editingTag) return

    setIsSubmitting(true)

    // Calculate volume if dimensions are provided
    const calculatedVolume = (data.length && data.breadth && data.height) 
      ? data.length * data.breadth * data.height 
      : undefined

    const updatedTag: LocationTag = {
      ...editingTag,
      location_tag_name: data.location_tag_name,
      length: data.length,
      breadth: data.breadth,
      height: data.height,
      volume: calculatedVolume,
      current_items: editingTag.current_items,
    }

    setLocationTags((prev) =>
      prev.map((tag) => (tag === editingTag ? updatedTag : tag))
    )
    setIsEditDialogOpen(false)
    setEditingTag(null)
    form.reset()

    toast({
      title: "Location tag updated",
      description: `${updatedTag.location_tag_name} has been updated successfully.`,
    })

    setIsSubmitting(false)
  }

  // Handle delete tag
  const handleDeleteTag = () => {
    if (!deleteTag) return

    setLocationTags((prev) => prev.filter((tag) => tag !== deleteTag))

    toast({
      title: "Location tag deleted",
      description: `${deleteTag.location_tag_name} has been deleted successfully.`,
      variant: "destructive",
    })

    setDeleteTag(null)
  }

  // Open edit dialog
  const handleEditClick = (tag: LocationTag) => {
    setEditingTag(tag)
    form.reset({
      location_tag_name: tag.location_tag_name,
      length: tag.length,
      breadth: tag.breadth,
      height: tag.height,
    })
    setIsEditDialogOpen(true)
  }

  // Open delete confirmation
  const handleDeleteClick = (tag: LocationTag) => {
    setDeleteTag(tag)
  }

  // Handle form submission
  const onSubmit = (data: LocationTagFormValues) => {
    if (editingTag) {
      handleEditTag(data)
    } else {
      handleAddTag(data)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Tag className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Location Tags</h1>
            <p className="text-muted-foreground">
              Manage and organize storage locations across organizational units
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Location
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            All Location Tags ({filteredTags.length} of {locationTags.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search locations..."
                className="pl-8 w-[200px] lg:w-[300px] text-foreground placeholder:text-muted-foreground border-border focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground font-semibold">Location Tag Name</TableHead>
                <TableHead className="text-foreground font-semibold">Dimensions (L×B×H)</TableHead>
                <TableHead className="text-foreground font-semibold">Volume</TableHead>
                <TableHead className="text-foreground font-semibold">Current Items</TableHead>
                <TableHead className="text-right text-foreground font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags.length > 0 ? (
                filteredTags.map((tag, idx) => (
                  <TableRow key={`${tag.location_tag_name}-${idx}`}>
                    <TableCell className="font-medium text-foreground">{tag.location_tag_name}</TableCell>
                    <TableCell className="text-foreground">
                      {tag.length && tag.breadth && tag.height 
                        ? `${tag.length}×${tag.breadth}×${tag.height}`
                        : "Not specified"
                      }
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {tag.volume ? tag.volume.toLocaleString() : "Not specified"}
                    </TableCell>
                    <TableCell className="text-foreground">{tag.current_items}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(tag)} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 cursor-pointer hover:bg-red-50"
                            onClick={() => handleDeleteClick(tag)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {locationTags.length === 0
                      ? "No location tags found. Add your first location to get started."
                      : "No locations match your current filters."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
          setEditingTag(null)
          form.reset()
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "Edit Location Tag" : "Add New Location Tag"}
            </DialogTitle>
            <DialogDescription>
              {editingTag
                ? "Make changes to the location tag details below."
                : "Fill in the details below to create a new location tag."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="location_tag_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Location Tag Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter location tag name" 
                        className="text-foreground placeholder:text-muted-foreground border-border focus:border-primary"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Volume Capacity Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <span className="text-sm font-medium text-foreground">Volume Capacity (Optional)</span>
                  <span className="text-xs text-muted-foreground">L × B × H = Volume</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Length</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="text-foreground placeholder:text-muted-foreground border-border focus:border-primary"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="breadth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Breadth</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="text-foreground placeholder:text-muted-foreground border-border focus:border-primary"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="text-foreground placeholder:text-muted-foreground border-border focus:border-primary"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Calculated Volume Display */}
                {(form.watch("length") || form.watch("breadth") || form.watch("height")) && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <div className="text-sm font-medium text-foreground">Calculated Volume:</div>
                    <div className="text-lg font-bold text-primary">
                      {(() => {
                        const length = form.watch("length") || 0;
                        const breadth = form.watch("breadth") || 0;
                        const height = form.watch("height") || 0;
                        const volume = length * breadth * height;
                        return volume > 0 ? `${volume.toLocaleString()} cubic units` : "Enter all dimensions";
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {editingTag && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label className="text-sm font-medium text-foreground">Current Items</Label>
                    <p className="text-sm text-foreground font-medium mt-1">{editingTag.current_items}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground">Volume Capacity</Label>
                    <p className="text-sm text-foreground font-medium mt-1">
                      {editingTag.volume ? `${editingTag.volume.toLocaleString()} cubic units` : "Not specified"}
                    </p>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false)
                    setIsEditDialogOpen(false)
                    setEditingTag(null)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingTag ? "Update Location" : "Create Location"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTag} onOpenChange={() => setDeleteTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the location tag
              "{deleteTag?.location_tag_name}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
