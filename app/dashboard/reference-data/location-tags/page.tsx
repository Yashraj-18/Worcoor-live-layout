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
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"

// Types
interface LocationTag {
  id: string
  name: string
  orgUnit: string
  type: "Storage" | "Operation" | "Quality" | "Production" | "Shipping"
  status: "active" | "inactive"
  description?: string
  createdAt: string
  updatedAt: string
}

// Form schema
const locationTagSchema = z.object({
  id: z.string().min(1, "Location ID is required").max(50, "ID must be less than 50 characters").regex(/^[A-Za-z0-9_-]+$/, "ID can only contain letters, numbers, underscores, and hyphens"),
  name: z.string().min(1, "Location Name is required").max(100, "Name must be less than 100 characters"),
  orgUnit: z.string().min(1, "Organizational Unit is required"),
  type: z.enum(["Storage", "Operation", "Quality", "Production", "Shipping"], {
    required_error: "Please select a location type",
  }),
  status: z.enum(["active", "inactive"], {
    required_error: "Please select a status",
  }),
  description: z.string().optional(),
})

type LocationTagFormValues = z.infer<typeof locationTagSchema>

// Default data
const defaultLocationTags: LocationTag[] = [
  {
    id: "WH-A-RK1",
    name: "Warehouse A - Rack 1",
    orgUnit: "WH-001",
    type: "Storage",
    status: "active",
    description: "Primary storage rack in Warehouse A",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-07T14:32:00Z",
  },
  {
    id: "WH-A-DOCK",
    name: "Warehouse A - Loading Dock",
    orgUnit: "WH-001",
    type: "Operation",
    status: "active",
    description: "Main loading and unloading area",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-06T09:15:00Z",
  },
  {
    id: "WH-B-QC",
    name: "Warehouse B - Quality Check",
    orgUnit: "WH-002",
    type: "Quality",
    status: "inactive",
    description: "Quality inspection and testing area",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-05T16:45:00Z",
  },
]

// localStorage keys
const LOCATION_TAGS_STORAGE_KEY = "worcoor-location-tags"
const ORG_UNITS_STORAGE_KEY = "worcoor-org-units"

export default function LocationTagsPage() {
  const [locationTags, setLocationTags] = useState<LocationTag[]>([])
  const [orgUnits, setOrgUnits] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterOrgUnit, setFilterOrgUnit] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<LocationTag | null>(null)
  const [deleteTag, setDeleteTag] = useState<LocationTag | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form initialization
  const form = useForm<LocationTagFormValues>({
    resolver: zodResolver(locationTagSchema),
    defaultValues: {
      id: "",
      name: "",
      orgUnit: "",
      type: "Storage",
      status: "active",
      description: "",
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

    // Load org units
    const storedOrgUnits = localStorage.getItem(ORG_UNITS_STORAGE_KEY)
    if (storedOrgUnits) {
      try {
        const parsedOrgUnits = JSON.parse(storedOrgUnits)
        setOrgUnits(parsedOrgUnits)
      } catch (error) {
        console.error("Error parsing stored org units:", error)
        // Fallback to default org units
        const defaultOrgUnits = [
          { id: "WH-001", name: "Warehouse 1", type: "Warehouse", status: "active" },
          { id: "PROD-001", name: "Production Line 1", type: "Production", status: "active" },
          { id: "OFF-001", name: "Office Floor 1", type: "Office", status: "inactive" }
        ]
        setOrgUnits(defaultOrgUnits)
      }
    } else {
      // Fallback to default org units
      const defaultOrgUnits = [
        { id: "WH-001", name: "Warehouse 1", type: "Warehouse", status: "active" },
        { id: "PROD-001", name: "Production Line 1", type: "Production", status: "active" },
        { id: "OFF-001", name: "Office Floor 1", type: "Office", status: "inactive" }
      ]
      setOrgUnits(defaultOrgUnits)
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
    const matchesSearch =
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.orgUnit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || tag.type === filterType
    const matchesStatus = filterStatus === "all" || tag.status === filterStatus
    const matchesOrgUnit = filterOrgUnit === "all" || tag.orgUnit === filterOrgUnit

    return matchesSearch && matchesType && matchesStatus && matchesOrgUnit
  })

  // Get unique org units for filter
  const uniqueOrgUnits = Array.from(new Set(locationTags.map(tag => tag.orgUnit)))

  // Handle add new tag
  const handleAddTag = (data: LocationTagFormValues) => {
    setIsSubmitting(true)

    // Check if ID is unique
    const existingTag = locationTags.find(tag => tag.id === data.id)
    if (existingTag) {
      toast({
        title: "Validation Error",
        description: `Location ID "${data.id}" already exists. Please choose a different ID.`,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const newTag: LocationTag = {
      id: data.id,
      name: data.name,
      orgUnit: data.orgUnit,
      type: data.type,
      status: data.status,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setLocationTags((prev) => [...prev, newTag])
    setIsAddDialogOpen(false)
    form.reset()

    toast({
      title: "Location tag created",
      description: `${newTag.name} (ID: ${newTag.id}) has been added successfully.`,
    })

    setIsSubmitting(false)
  }

  // Handle edit tag
  const handleEditTag = (data: LocationTagFormValues) => {
    if (!editingTag) return

    setIsSubmitting(true)

    // Check if ID is unique (excluding current tag)
    const existingTag = locationTags.find(tag => tag.id === data.id && tag.id !== editingTag.id)
    if (existingTag) {
      toast({
        title: "Validation Error",
        description: `Location ID "${data.id}" already exists. Please choose a different ID.`,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const updatedTag: LocationTag = {
      ...editingTag,
      id: data.id,
      name: data.name,
      orgUnit: data.orgUnit,
      type: data.type,
      status: data.status,
      description: data.description,
      updatedAt: new Date().toISOString(),
    }

    setLocationTags((prev) =>
      prev.map((tag) => (tag.id === editingTag.id ? updatedTag : tag))
    )
    setIsEditDialogOpen(false)
    setEditingTag(null)
    form.reset()

    toast({
      title: "Location tag updated",
      description: `${updatedTag.name} (ID: ${updatedTag.id}) has been updated successfully.`,
    })

    setIsSubmitting(false)
  }

  // Handle delete tag
  const handleDeleteTag = () => {
    if (!deleteTag) return

    setLocationTags((prev) => prev.filter((tag) => tag.id !== deleteTag.id))

    toast({
      title: "Location tag deleted",
      description: `${deleteTag.name} has been deleted successfully.`,
      variant: "destructive",
    })

    setDeleteTag(null)
  }

  // Open edit dialog
  const handleEditClick = (tag: LocationTag) => {
    setEditingTag(tag)
    form.reset({
      id: tag.id,
      name: tag.name,
      orgUnit: tag.orgUnit,
      type: tag.type,
      status: tag.status,
      description: tag.description || "",
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
                className="pl-8 w-[200px] lg:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterOrgUnit} onValueChange={setFilterOrgUnit}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Org Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Units</SelectItem>
                {orgUnits.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Storage">Storage</SelectItem>
                <SelectItem value="Operation">Operation</SelectItem>
                <SelectItem value="Quality">Quality</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
                <SelectItem value="Shipping">Shipping</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Org Unit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTags.length > 0 ? (
                filteredTags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.id}</TableCell>
                    <TableCell>{tag.name}</TableCell>
                    <TableCell>{orgUnits.find(unit => unit.id === tag.orgUnit)?.name || tag.orgUnit}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {tag.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            tag.status === "active" ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        <span className="capitalize">{tag.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tag.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(tag)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
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
                  <TableCell colSpan={7} className="h-24 text-center">
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
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter unique ID (e.g., WH-A-RK1)"
                        {...field}
                        disabled={!!editingTag}
                      />
                    </FormControl>
                    <FormDescription>
                      Unique identifier for this location. Cannot be changed after creation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orgUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organizational Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select org unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orgUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the organizational unit this location belongs to.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Storage">Storage</SelectItem>
                        <SelectItem value="Operation">Operation</SelectItem>
                        <SelectItem value="Quality">Quality</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Shipping">Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a description for this location"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
              "{deleteTag?.name}" and remove all associated data.
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
