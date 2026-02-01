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
  location_tag: string
  unit_id?: string // Reference to organizational unit
  // Volume capacity fields
  length?: number
  breadth?: number
  height?: number
  unit_of_measurement?: "meters" | "feet" | "inches" | "centimeters"
  capacity?: number // Calculated: L x B x H (NUMERIC(15,3))
  current_items: number
}

// Form schema
const locationTagSchema = z.object({
  location_tag: z.string().min(1, "Location Tag is required").max(100, "Name must be less than 100 characters"),
  unit_id: z.string().min(1, "Unit ID is required"),
  // Volume capacity fields
  length: z.number().positive("Length must be positive").max(999999.999, "Length must be less than 999999.999").optional(),
  breadth: z.number().positive("Breadth must be positive").max(999999.999, "Breadth must be less than 999999.999").optional(),
  height: z.number().positive("Height must be positive").max(999999.999, "Height must be less than 999999.999").optional(),
  unit_of_measurement: z.enum(["meters", "feet", "inches", "centimeters"]).optional(),
}).refine((data) => {
  // If any dimension is provided, all dimensions and unit must be provided
  const hasAnyDimension = data.length || data.breadth || data.height;
  const hasAllDimensions = data.length && data.breadth && data.height;
  const hasUnit = data.unit_of_measurement;
  return !hasAnyDimension || (hasAllDimensions && hasUnit);
}, {
  message: "If you provide one dimension, you must provide all three dimensions and unit of measurement",
  path: ["length"],
});

type LocationTagFormValues = z.infer<typeof locationTagSchema>

// Default data
const defaultLocationTags: LocationTag[] = [
  {
    location_tag: "Warehouse A - Rack 1",
    unit_id: "WH-001",
    length: 10,
    breadth: 5,
    height: 2,
    unit_of_measurement: "meters",
    capacity: 100.000, // 10 x 5 x 2
    current_items: 0,
  },
  {
    location_tag: "Warehouse A - Loading Dock",
    unit_id: "WH-001",
    length: 5,
    breadth: 5,
    height: 2,
    unit_of_measurement: "meters",
    capacity: 50.000, // 5 x 5 x 2
    current_items: 0,
  },
  {
    location_tag: "Warehouse B - Quality Check",
    unit_id: "WH-002",
    length: 5,
    breadth: 2.5,
    height: 2,
    unit_of_measurement: "meters",
    capacity: 25.000, // 5 x 2.5 x 2
    current_items: 0,
  },
]

// localStorage keys
const LOCATION_TAGS_STORAGE_KEY = "worcoor-location-tags"
const ORG_UNITS_STORAGE_KEY = "worcoor-org-units"

export default function LocationTagsPage() {
  const [locationTags, setLocationTags] = useState<LocationTag[]>([])
  const [orgUnits, setOrgUnits] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnitId, setSelectedUnitId] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<LocationTag | null>(null)
  const [deleteTag, setDeleteTag] = useState<LocationTag | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form initialization
  const form = useForm<LocationTagFormValues>({
    resolver: zodResolver(locationTagSchema),
    defaultValues: {
      location_tag: "",
      unit_id: "",
      length: undefined,
      breadth: undefined,
      height: undefined,
      unit_of_measurement: undefined,
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

    // Load organizational units
    const storedOrgUnits = localStorage.getItem(ORG_UNITS_STORAGE_KEY)
    if (storedOrgUnits) {
      try {
        const parsedOrgUnits = JSON.parse(storedOrgUnits)
        setOrgUnits(parsedOrgUnits)
      } catch (error) {
        console.error("Error parsing stored org units:", error)
        setOrgUnits([])
      }
    } else {
      setOrgUnits([])
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
    const tagName = (tag.location_tag ?? (tag as any).name ?? "").toString().toLowerCase()

    const matchesSearch = tagName.includes(search)
    const matchesUnit = selectedUnitId === "all" || tag.unit_id === selectedUnitId

    return matchesSearch && matchesUnit
  })

  // Handle add new tag
  const handleAddTag = (data: LocationTagFormValues) => {
    setIsSubmitting(true)

    // Calculate capacity if dimensions are provided
    const calculatedCapacity = (data.length && data.breadth && data.height) 
      ? parseFloat((data.length * data.breadth * data.height).toFixed(3))
      : undefined

    const newTag: LocationTag = {
      location_tag: data.location_tag,
      unit_id: data.unit_id,
      length: data.length,
      breadth: data.breadth,
      height: data.height,
      unit_of_measurement: data.unit_of_measurement,
      capacity: calculatedCapacity,
      current_items: 0,
    }

    setLocationTags((prev) => [...prev, newTag])
    setIsAddDialogOpen(false)
    form.reset()

    toast({
      title: "Location tag created",
      description: `${newTag.location_tag} has been added successfully.`,
    })

    setIsSubmitting(false)
  }

  // Handle edit tag
  const handleEditTag = (data: LocationTagFormValues) => {
    if (!editingTag) return

    setIsSubmitting(true)

    // Calculate capacity if dimensions are provided
    const calculatedCapacity = (data.length && data.breadth && data.height) 
      ? parseFloat((data.length * data.breadth * data.height).toFixed(3))
      : undefined

    const updatedTag: LocationTag = {
      ...editingTag,
      location_tag: data.location_tag,
      unit_id: data.unit_id,
      length: data.length,
      breadth: data.breadth,
      height: data.height,
      unit_of_measurement: data.unit_of_measurement,
      capacity: calculatedCapacity,
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
      description: `${updatedTag.location_tag} has been updated successfully.`,
    })

    setIsSubmitting(false)
  }

  // Handle delete tag
  const handleDeleteTag = () => {
    if (!deleteTag) return

    setLocationTags((prev) => prev.filter((tag) => tag !== deleteTag))

    toast({
      title: "Location tag deleted",
      description: `${deleteTag.location_tag} has been deleted successfully.`,
      variant: "destructive",
    })

    setDeleteTag(null)
  }

  // Open edit dialog
  const handleEditClick = (tag: LocationTag) => {
    setEditingTag(tag)
    form.reset({
      location_tag: tag.location_tag,
      unit_id: tag.unit_id,
      length: tag.length,
      breadth: tag.breadth,
      height: tag.height,
      unit_of_measurement: tag.unit_of_measurement,
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
            <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
              <SelectTrigger className="w-[200px] text-foreground border-border focus:border-primary">
                <SelectValue placeholder="Filter by Unit ID" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" key="all">All Units</SelectItem>
                {orgUnits.length > 0 ? (
                  orgUnits.map((unit) => (
                    <SelectItem key={unit.unit_id} value={unit.unit_id}>
                      {unit.unit_id} - {unit.unit_name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled key="none">
                    No units available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
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
                <TableHead className="text-foreground font-semibold">Location Tag</TableHead>
                <TableHead className="text-foreground font-semibold">Dimensions</TableHead>
                <TableHead className="text-foreground font-semibold">Capacity</TableHead>
                <TableHead className="text-foreground font-semibold">Current Items</TableHead>
                <TableHead className="text-right text-foreground font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags.length > 0 ? (
                filteredTags.map((tag, idx) => (
                  <TableRow key={`${tag.location_tag}-${tag.unit_id || 'no-unit'}-${idx}`}>
                    <TableCell className="font-medium text-foreground">{tag.location_tag}</TableCell>
                    <TableCell className="text-foreground">
                      {tag.length && tag.breadth && tag.height && tag.unit_of_measurement 
                        ? `${tag.length}×${tag.breadth}×${tag.height} ${tag.unit_of_measurement}`
                        : "Not specified"
                      }
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {tag.capacity && tag.unit_of_measurement 
                        ? `${tag.capacity.toFixed(3)} cubic ${tag.unit_of_measurement}`
                        : "Not specified"
                      }
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
                          <DropdownMenuItem onClick={() => handleEditClick(tag)} className="cursor-pointer" key="edit">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 cursor-pointer hover:bg-red-50"
                            onClick={() => handleDeleteClick(tag)}
                            key="delete"
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
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Unit ID *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-foreground border-border focus:border-primary">
                          <SelectValue placeholder="Select organizational unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orgUnits.length > 0 ? (
                          orgUnits.map((unit) => (
                            <SelectItem key={unit.unit_id} value={unit.unit_id}>
                              {unit.unit_id} - {unit.unit_name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled key="no-units">
                            No organizational units available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location_tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Location Tag</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter location tag" 
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
                  <span className="text-sm font-medium text-foreground">Capacity (Optional)</span>
                  <span className="text-xs text-muted-foreground">L × B × H = Capacity</span>
                </div>
                
                <div className="grid grid-cols-4 gap-4">
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
                            step="0.001"
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
                            step="0.001"
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
                            step="0.001"
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
                    name="unit_of_measurement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-foreground border-border focus:border-primary">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="meters" key="meters">Meters</SelectItem>
                            <SelectItem value="feet" key="feet">Feet</SelectItem>
                            <SelectItem value="inches" key="inches">Inches</SelectItem>
                            <SelectItem value="centimeters" key="centimeters">Centimeters</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Calculated Capacity Display */}
                {(form.watch("length") || form.watch("breadth") || form.watch("height")) && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <div className="text-sm font-medium text-foreground">Calculated Capacity:</div>
                    <div className="text-lg font-bold text-primary">
                      {(() => {
                        const length = form.watch("length") || 0;
                        const breadth = form.watch("breadth") || 0;
                        const height = form.watch("height") || 0;
                        const unit = form.watch("unit_of_measurement");
                        const capacity = parseFloat((length * breadth * height).toFixed(3));
                        return capacity > 0 && unit 
                          ? `${capacity.toFixed(3)} cubic ${unit}` 
                          : capacity > 0 
                            ? `${capacity.toFixed(3)} cubic units`
                            : "Enter all dimensions and unit";
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
                    <Label className="text-sm font-medium text-foreground">Capacity</Label>
                    <p className="text-sm text-foreground font-medium mt-1">
                      {editingTag.capacity && editingTag.unit_of_measurement 
                        ? `${editingTag.capacity.toFixed(3)} cubic ${editingTag.unit_of_measurement}`
                        : "Not specified"
                      }
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
              "{deleteTag?.location_tag}" and remove all associated data.
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
