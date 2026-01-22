"use client"

import { Building2, Plus, Search, Filter, MoreVertical, Pencil, Trash2, ChevronDown } from "lucide-react"
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
interface OrgUnit {
  id: string
  name: string
  type: "Warehouse" | "Production" | "Office"
  status: "active" | "inactive"
  location: string
  description?: string
  createdAt: string
  updatedAt: string
}

// Form schema
const orgUnitSchema = z.object({
  id: z.string().min(1, "Org Unit ID is required").max(50, "ID must be less than 50 characters").regex(/^[A-Za-z0-9_-]+$/, "ID can only contain letters, numbers, underscores, and hyphens"),
  name: z.string().min(1, "Org Unit Name is required").max(100, "Name must be less than 100 characters"),
  type: z.enum(["Warehouse", "Production", "Office"], {
    required_error: "Please select a unit type",
  }),
  status: z.enum(["active", "inactive"], {
    required_error: "Please select a status",
  }),
  location: z.string().min(1, "Location is required").max(200, "Location must be less than 200 characters"),
  description: z.string().optional(),
})

type OrgUnitFormValues = z.infer<typeof orgUnitSchema>

// Default data
const defaultOrgUnits: OrgUnit[] = [
  {
    id: "WH-001",
    name: "Warehouse 1",
    type: "Warehouse",
    status: "active",
    location: "Building A, Floor 1",
    description: "Main warehouse for finished goods storage",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-07T14:32:00Z",
  },
  {
    id: "PROD-001",
    name: "Production Line 1",
    type: "Production",
    status: "active",
    location: "Building B, Floor 2",
    description: "Primary production line for assembly operations",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-06T09:15:00Z",
  },
  {
    id: "OFF-001",
    name: "Office Floor 1",
    type: "Office",
    status: "inactive",
    location: "Main Building, Floor 1",
    description: "Administrative offices and management",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-05T16:45:00Z",
  },
]

// localStorage key
const ORG_UNITS_STORAGE_KEY = "worcoor-org-units"

export default function OrgUnitsPage() {
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<OrgUnit | null>(null)
  const [deleteUnit, setDeleteUnit] = useState<OrgUnit | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form initialization
  const form = useForm<OrgUnitFormValues>({
    resolver: zodResolver(orgUnitSchema),
    defaultValues: {
      id: "",
      name: "",
      type: "Warehouse",
      status: "active",
      location: "",
      description: "",
    },
  })

  // Load data from localStorage on mount
  useEffect(() => {
    const storedUnits = localStorage.getItem(ORG_UNITS_STORAGE_KEY)
    if (storedUnits) {
      try {
        const parsedUnits = JSON.parse(storedUnits)
        setOrgUnits(parsedUnits)
      } catch (error) {
        console.error("Error parsing stored org units:", error)
        // Fallback to default data
        setOrgUnits(defaultOrgUnits)
        localStorage.setItem(ORG_UNITS_STORAGE_KEY, JSON.stringify(defaultOrgUnits))
      }
    } else {
      // Initialize with default data
      setOrgUnits(defaultOrgUnits)
      localStorage.setItem(ORG_UNITS_STORAGE_KEY, JSON.stringify(defaultOrgUnits))
    }
  }, [])

  // Save to localStorage whenever orgUnits changes
  useEffect(() => {
    if (orgUnits.length > 0) {
      localStorage.setItem(ORG_UNITS_STORAGE_KEY, JSON.stringify(orgUnits))
    }
  }, [orgUnits])

  // Filter units based on search and filters
  const filteredUnits = orgUnits.filter((unit) => {
    const matchesSearch =
      unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || unit.type === filterType
    const matchesStatus = filterStatus === "all" || unit.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  // Handle add new unit
  const handleAddUnit = (data: OrgUnitFormValues) => {
    setIsSubmitting(true)

    // Check if ID is unique
    const existingUnit = orgUnits.find(unit => unit.id === data.id)
    if (existingUnit) {
      toast({
        title: "Validation Error",
        description: `Org Unit ID "${data.id}" already exists. Please choose a different ID.`,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const newUnit: OrgUnit = {
      id: data.id, // Use provided ID instead of auto-generated
      name: data.name,
      type: data.type,
      status: data.status,
      location: data.location,
      description: data.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setOrgUnits((prev) => [...prev, newUnit])
    setIsAddDialogOpen(false)
    form.reset()

    toast({
      title: "Organizational unit created",
      description: `${newUnit.name} (ID: ${newUnit.id}) has been added successfully.`,
    })

    setIsSubmitting(false)
  }

  // Handle edit unit
  const handleEditUnit = (data: OrgUnitFormValues) => {
    if (!editingUnit) return

    setIsSubmitting(true)

    // Check if ID is unique (excluding current unit)
    const existingUnit = orgUnits.find(unit => unit.id === data.id && unit.id !== editingUnit.id)
    if (existingUnit) {
      toast({
        title: "Validation Error",
        description: `Org Unit ID "${data.id}" already exists. Please choose a different ID.`,
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const updatedUnit: OrgUnit = {
      ...editingUnit,
      id: data.id, // Allow ID changes
      name: data.name,
      type: data.type,
      status: data.status,
      location: data.location,
      description: data.description,
      updatedAt: new Date().toISOString(),
    }

    setOrgUnits((prev) =>
      prev.map((unit) => (unit.id === editingUnit.id ? updatedUnit : unit))
    )
    setIsEditDialogOpen(false)
    setEditingUnit(null)
    form.reset()

    toast({
      title: "Organizational unit updated",
      description: `${updatedUnit.name} (ID: ${updatedUnit.id}) has been updated successfully.`,
    })

    setIsSubmitting(false)
  }

  // Handle delete unit
  const handleDeleteUnit = () => {
    if (!deleteUnit) return

    setOrgUnits((prev) => prev.filter((unit) => unit.id !== deleteUnit.id))

    toast({
      title: "Organizational unit deleted",
      description: `${deleteUnit.name} has been deleted successfully.`,
      variant: "destructive",
    })

    setDeleteUnit(null)
  }

  // Open edit dialog
  const handleEditClick = (unit: OrgUnit) => {
    setEditingUnit(unit)
    form.reset({
      id: unit.id, // Include ID for editing
      name: unit.name,
      type: unit.type,
      status: unit.status,
      location: unit.location,
      description: unit.description || "",
    })
    setIsEditDialogOpen(true)
  }

  // Open delete confirmation
  const handleDeleteClick = (unit: OrgUnit) => {
    setDeleteUnit(unit)
  }

  // Handle form submission
  const onSubmit = (data: OrgUnitFormValues) => {
    if (editingUnit) {
      handleEditUnit(data)
    } else {
      handleAddUnit(data)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Organizational Units</h1>
            <p className="text-muted-foreground">
              Manage and organize your warehouse, production, and office units
            </p>
          </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Unit
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            All Units ({filteredUnits.length} of {orgUnits.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search units..."
                className="pl-8 w-[200px] lg:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Warehouse">Warehouse</SelectItem>
                <SelectItem value="Production">Production</SelectItem>
                <SelectItem value="Office">Office</SelectItem>
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
                <TableHead>Unit Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.length > 0 ? (
                filteredUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {unit.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            unit.status === "active" ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        <span className="capitalize">{unit.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {unit.location}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(unit.updatedAt).toLocaleDateString()}
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
                          <DropdownMenuItem onClick={() => handleEditClick(unit)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteClick(unit)}
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
                  <TableCell colSpan={6} className="h-24 text-center">
                    {orgUnits.length === 0
                      ? "No organizational units found. Add your first unit to get started."
                      : "No units match your current filters."}
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
          setEditingUnit(null)
          form.reset()
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingUnit ? "Edit Organizational Unit" : "Add New Organizational Unit"}
            </DialogTitle>
            <DialogDescription>
              {editingUnit
                ? "Make changes to the organizational unit details below."
                : "Fill in the details below to create a new organizational unit."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Org Unit ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter unique ID (e.g., WH-001, PROD-001)"
                        {...field}
                        disabled={!!editingUnit} // Disable ID editing in edit mode
                      />
                    </FormControl>
                    <FormDescription>
                      Unique identifier for this organizational unit. Cannot be changed after creation.
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
                    <FormLabel>Org Unit Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter unit name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Warehouse">Warehouse</SelectItem>
                        <SelectItem value="Production">Production</SelectItem>
                        <SelectItem value="Office">Office</SelectItem>
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter location details" {...field} />
                    </FormControl>
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
                        placeholder="Enter a description for this unit"
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
                    setEditingUnit(null)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingUnit ? "Update Unit" : "Create Unit"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUnit} onOpenChange={() => setDeleteUnit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the organizational unit
              "{deleteUnit?.name}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUnit}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Unit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
