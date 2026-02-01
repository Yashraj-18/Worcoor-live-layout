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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "@/components/ui/use-toast"

// Types
interface OrgUnit {
  unit_id: string
  unit_name: string
  unit_type: "warehouse" | "office" | "production"
  status: "LIVE" | "OFFLINE" | "MAINTENANCE" | "PLANNING"
  description?: string
  area?: string // Format: "[number] sq [unit]" - e.g., "200 sq meters"
}

// Form schema
const orgUnitSchema = z.object({
  unit_id: z.string().min(1, "Unit ID is required").max(100, "Unit ID must be less than 100 characters"),
  unit_name: z.string().min(1, "Unit Name is required").max(100, "Name must be less than 100 characters"),
  unit_type: z.enum(["warehouse", "office", "production"], {
    required_error: "Please select a unit type",
  }),
  status: z.enum(["LIVE", "OFFLINE", "MAINTENANCE", "PLANNING"], {
    required_error: "Please select a status",
  }),
  description: z.string().optional(),
  area: z.string().max(100, "Area must be less than 100 characters").optional(),
})

type OrgUnitFormValues = z.infer<typeof orgUnitSchema>

// Default data
const defaultOrgUnits: OrgUnit[] = [
  {
    unit_id: "WH-001",
    unit_name: "Warehouse 1",
    unit_type: "warehouse",
    status: "LIVE",
    description: "Main warehouse for finished goods storage",
    area: "5000 sq meters",
  },
  {
    unit_id: "PU-001",
    unit_name: "Production Unit 1",
    unit_type: "production",
    status: "PLANNING",
    description: "Primary production line for assembly operations",
    area: "3200 sq meters",
  },
  {
    unit_id: "OF-001",
    unit_name: "Main Office",
    unit_type: "office",
    status: "OFFLINE",
    description: "Administrative offices and management",
    area: "600 sq feet",
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
      unit_id: "",
      unit_name: "",
      unit_type: "warehouse",
      status: "LIVE",
      description: "",
      area: "",
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
    const search = searchTerm.toLowerCase()
    const unitName = (unit.unit_name ?? (unit as any).name ?? "").toString().toLowerCase()
    const unitDescription = (unit.description ?? "").toString().toLowerCase()

    const matchesSearch = unitName.includes(search) || unitDescription.includes(search)

    const matchesType = filterType === "all" || unit.unit_type === filterType
    const matchesStatus = filterStatus === "all" || unit.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  // Handle add new unit
  const handleAddUnit = (data: OrgUnitFormValues) => {
    setIsSubmitting(true)

    const newUnit: OrgUnit = {
      unit_id: data.unit_id,
      unit_name: data.unit_name,
      unit_type: data.unit_type,
      status: data.status,
      description: data.description,
      area: data.area,
    }

    setOrgUnits((prev) => [...prev, newUnit])
    setIsAddDialogOpen(false)
    form.reset()

    toast({
      title: "Organizational unit created",
      description: `${newUnit.unit_name} has been added successfully.${newUnit.area ? ` Area: ${newUnit.area}` : ''}`,
    })

    setIsSubmitting(false)
  }

  // Handle edit unit
  const handleEditUnit = (data: OrgUnitFormValues) => {
    if (!editingUnit) return

    setIsSubmitting(true)

    const updatedUnit: OrgUnit = {
      ...editingUnit,
      unit_id: data.unit_id,
      unit_name: data.unit_name,
      unit_type: data.unit_type,
      status: data.status,
      description: data.description,
      area: data.area,
    }

    setOrgUnits((prev) =>
      prev.map((unit) => (unit === editingUnit ? updatedUnit : unit))
    )
    setIsEditDialogOpen(false)
    setEditingUnit(null)
    form.reset()

    toast({
      title: "Organizational unit updated",
      description: `${updatedUnit.unit_name} has been updated successfully.${updatedUnit.area ? ` Area: ${updatedUnit.area}` : ''}`,
    })

    setIsSubmitting(false)
  }

  // Handle delete unit
  const handleDeleteUnit = () => {
    if (!deleteUnit) return

    setOrgUnits((prev) => prev.filter((unit) => unit !== deleteUnit))

    toast({
      title: "Organizational unit deleted",
      description: `${deleteUnit.unit_name} has been deleted successfully.`,
      variant: "destructive",
    })

    setDeleteUnit(null)
  }

  // Open edit dialog
  const handleEditClick = (unit: OrgUnit) => {
    setEditingUnit(unit)
    form.reset({
      unit_id: unit.unit_id,
      unit_name: unit.unit_name,
      unit_type: unit.unit_type,
      status: unit.status,
      description: unit.description || "",
      area: unit.area || "",
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
                <TableHead>Unit ID</TableHead>
                <TableHead>Unit Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Area</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.length > 0 ? (
                filteredUnits.map((unit, idx) => (
                  <TableRow key={`${unit.unit_id}-${idx}`}>
                    <TableCell className="font-medium">{unit.unit_id}</TableCell>
                    <TableCell className="font-medium">{unit.unit_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {unit.unit_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            unit.status === "LIVE" ? "bg-green-500" : unit.status === "OFFLINE" ? "bg-gray-400" : unit.status === "MAINTENANCE" ? "bg-amber-500" : "bg-blue-500"
                          }`}
                        />
                        <span>{unit.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {unit.area ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{unit.area}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Not specified</span>
                      )}
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
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter unit ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter unit name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_type"
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
                        <SelectItem value="warehouse">warehouse</SelectItem>
                        <SelectItem value="office">office</SelectItem>
                        <SelectItem value="production">production</SelectItem>
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
                        <SelectItem value="LIVE">LIVE</SelectItem>
                        <SelectItem value="OFFLINE">OFFLINE</SelectItem>
                        <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                        <SelectItem value="PLANNING">PLANNING</SelectItem>
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
                        placeholder="Enter a description for this unit"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 200 sq meters, 500 sq feet"
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
              "{deleteUnit?.unit_name}" and remove all associated data.
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
