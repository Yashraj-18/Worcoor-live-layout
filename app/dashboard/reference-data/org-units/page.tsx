"use client"

import { Building2, Plus, Search, Edit, Trash2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
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
import { orgUnitService, type OrgUnit } from "@/src/services/orgUnits"

const unitIdRegex = /^[a-zA-Z0-9_-]+$/
const areaRegex = /^\d+(?:\.\d+)?\s+sq\s+[A-Za-z]+$/

const orgUnitSchema = z.object({
  unitId: z
    .string()
    .min(1, "Unit ID is required")
    .max(100, "Unit ID must be less than 100 characters")
    .regex(unitIdRegex, "Unit ID can only contain letters, numbers, hyphens, and underscores"),
  unitName: z
    .string()
    .min(1, "Unit Name is required")
    .max(255, "Name must be less than 255 characters"),
  unitType: z.enum(["warehouse", "office", "production"], {
    required_error: "Please select a unit type",
  }),
  status: z.enum(["LIVE", "OFFLINE", "MAINTENANCE", "PLANNING"], {
    required_error: "Please select a status",
  }),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  area: z
    .string()
    .max(100, "Area must be less than 100 characters")
    .regex(areaRegex, "Area must be in format: [number] sq [unit] (e.g., 200 sq meters)")
    .optional()
    .or(z.literal("")),
})

type OrgUnitFormValues = z.infer<typeof orgUnitSchema>

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
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Form initialization
  const form = useForm<OrgUnitFormValues>({
    resolver: zodResolver(orgUnitSchema),
    defaultValues: {
      unitId: "",
      unitName: "",
      unitType: "warehouse",
      status: "LIVE",
      description: "",
      area: "",
    },
  })

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoadError(null)
        const data = await orgUnitService.list()
        setOrgUnits(data)
      } catch (error: any) {
        console.error("Failed to load organizational units", error)
        setLoadError("Unable to load organizational units. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnits()
  }, [])

  const normalizePayload = (data: OrgUnitFormValues) => ({
    unitId: data.unitId.trim(),
    unitName: data.unitName.trim(),
    unitType: data.unitType,
    status: data.status,
    description: data.description?.trim() ? data.description.trim() : null,
    area: data.area?.trim() ? data.area.trim() : null,
  })

  // Filter units based on search and filters
  const filteredUnits = orgUnits.filter((unit) => {
    const search = searchTerm.toLowerCase()
    const unitId = (unit.unitId ?? "").toLowerCase()
    const unitName = unit.unitName.toLowerCase()

    const matchesSearch = unitId.includes(search) || unitName.includes(search)

    const matchesType = filterType === "all" || unit.unitType === filterType
    const matchesStatus = filterStatus === "all" || unit.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  // Handle add new unit
  const handleAddUnit = async (data: OrgUnitFormValues) => {
    setIsSubmitting(true)
    try {
      const created = await orgUnitService.create(normalizePayload(data))
      setOrgUnits((prev) => [...prev, created])
      toast({
        title: "Organizational unit created",
        description: `${created.unitName} has been added successfully.${created.area ? ` Area: ${created.area}` : ''}`,
      })
      setIsAddDialogOpen(false)
    } catch (error: any) {
      if (error?.response?.status === 409) {
        form.setError("unitId", { type: "manual", message: error.response.data.error })
      } else {
        toast({ title: "Error", description: error?.response?.data?.error || "Failed to create organizational unit.", variant: "destructive" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit unit
  const handleEditUnit = async (data: OrgUnitFormValues) => {
    if (!editingUnit) return

    setIsSubmitting(true)
    try {
      const updated = await orgUnitService.update(editingUnit.id, normalizePayload(data))
      setOrgUnits((prev) => prev.map((unit) => (unit.id === updated.id ? updated : unit)))
      toast({
        title: "Organizational unit updated",
        description: `${updated.unitName} has been updated successfully.${updated.area ? ` Area: ${updated.area}` : ''}`,
      })
      setIsEditDialogOpen(false)
    } catch (error: any) {
      if (error?.response?.status === 409) {
        form.setError("unitId", { type: "manual", message: error.response.data.error })
      } else {
        toast({ title: "Error", description: error?.response?.data?.error || "Failed to update organizational unit.", variant: "destructive" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete unit
  const handleDeleteUnit = async () => {
    if (!deleteUnit) return

    try {
      await orgUnitService.remove(deleteUnit.id)
      setOrgUnits((prev) => prev.filter((unit) => unit.id !== deleteUnit.id))
      toast({
        title: "Organizational unit deleted",
        description: `${deleteUnit.unitName} has been deleted successfully.`,
        variant: "destructive",
      })
    } catch (error: any) {
      const message = error?.response?.data?.error || "Failed to delete organizational unit."
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setDeleteUnit(null)
    }
  }

  // Open edit dialog
  const handleEditClick = (unit: OrgUnit) => {
    setEditingUnit(unit)
    form.reset({
      unitId: unit.unitId ?? "",
      unitName: unit.unitName,
      unitType: unit.unitType,
      status: unit.status,
      description: unit.description ?? "",
      area: unit.area ?? "",
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

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-muted-foreground">Loading organizational units…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-muted-foreground">{loadError}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
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
                <SelectItem value="warehouse">Warehouse</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="office">Office</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="LIVE">Live</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="PLANNING">Planning</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground font-semibold">Unit ID</TableHead>
                <TableHead className="text-foreground font-semibold">Unit Name</TableHead>
                <TableHead className="text-foreground font-semibold">Type</TableHead>
                <TableHead className="text-foreground font-semibold">Status</TableHead>
                <TableHead className="text-foreground font-semibold">Area</TableHead>
                <TableHead className="text-right text-foreground font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.length > 0 ? (
                filteredUnits.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium text-foreground">{unit.unitId ?? "—"}</TableCell>
                    <TableCell className="font-medium text-foreground">{unit.unitName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {unit.unitType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${unit.status === "LIVE"
                            ? "bg-green-500"
                            : unit.status === "OFFLINE"
                              ? "bg-gray-400"
                              : unit.status === "MAINTENANCE"
                                ? "bg-amber-500"
                                : "bg-blue-500"
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
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(unit)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClick(unit)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open)
        if (!open) {
          form.reset()
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Organizational Unit</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new organizational unit.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="unitId"
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
                name="unitName"
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
                name="unitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                        value={field.value ?? ""}
                        onChange={field.onChange}
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
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Unit"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          setEditingUnit(null)
          form.reset()
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Organizational Unit</DialogTitle>
            <DialogDescription>
              Make changes to the organizational unit details below.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="unitId"
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
                name="unitName"
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
                name="unitType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                        placeholder="Enter unit description"
                        value={field.value ?? ""}
                        onChange={field.onChange}
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
                        value={field.value ?? ""}
                        onChange={field.onChange}
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
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Unit"}
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
              "{deleteUnit?.unitName}" and remove all associated data.
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
