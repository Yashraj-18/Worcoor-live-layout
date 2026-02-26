"use client"

import { Tag, Plus, Search, Edit, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCallback, useEffect, useMemo, useState } from "react"
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
import { orgUnitService, type OrgUnit } from "@/src/services/orgUnits"
import {
  locationTagService,
  type LocationTag as ApiLocationTag,
} from "@/src/services/locationTags"

const dimensionField = z
  .number({ invalid_type_error: "Dimension must be a number" })
  .positive("Value must be positive")
  .max(999999.999, "Value must be less than 999999.999")
  .optional();

const locationTagSchema = z
  .object({
    locationTagName: z
      .string()
      .min(1, "Location Tag is required")
      .max(100, "Name must be less than 100 characters"),
    unitId: z.string().min(1, "Unit is required"),
    length: dimensionField,
    breadth: dimensionField,
    height: dimensionField,
    unitOfMeasurement: z.enum(["meters", "feet", "inches", "centimeters"]).optional(),
  })
  .refine((data) => {
    const dimensions = [data.length, data.breadth, data.height];
    const hasAnyDimension = dimensions.some((value) => value !== undefined && value !== null);
    const hasAllDimensions = dimensions.every((value) => typeof value === "number");
    const hasUnit = data.unitOfMeasurement !== undefined && data.unitOfMeasurement !== null;

    if (!hasAnyDimension && !hasUnit) {
      return true;
    }

    return hasAllDimensions && hasUnit;
  }, {
    message: "Provide length, breadth, height, and unit together",
    path: ["length"],
  });

type LocationTagFormValues = z.infer<typeof locationTagSchema>

export default function LocationTagsPage() {
  const [locationTags, setLocationTags] = useState<ApiLocationTag[]>([])
  const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUnitId, setSelectedUnitId] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<ApiLocationTag | null>(null)
  const [deleteTag, setDeleteTag] = useState<ApiLocationTag | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const dimensionFieldNames = ["length", "breadth", "height"] as const
  type DimensionField = typeof dimensionFieldNames[number]
  const emptyDimensionInputs = useMemo<Record<DimensionField, string>>(
    () => ({ length: "", breadth: "", height: "" }),
    [],
  )
  const [dimensionInputs, setDimensionInputs] = useState<Record<DimensionField, string>>(emptyDimensionInputs)

  const resetDimensionInputs = useCallback(() => {
    setDimensionInputs({ ...emptyDimensionInputs })
  }, [emptyDimensionInputs])

  const setDimensionInputsFromValues = useCallback((values?: Partial<Record<DimensionField, number | null>>) => {
    setDimensionInputs({
      length: values?.length !== undefined && values?.length !== null ? values.length.toString() : "",
      breadth: values?.breadth !== undefined && values?.breadth !== null ? values.breadth.toString() : "",
      height: values?.height !== undefined && values?.height !== null ? values.height.toString() : "",
    })
  }, [])

  // Form initialization
  const form = useForm<LocationTagFormValues>({
    resolver: zodResolver(locationTagSchema),
    defaultValues: {
      locationTagName: "",
      unitId: "",
      length: undefined,
      breadth: undefined,
      height: undefined,
      unitOfMeasurement: undefined,
    },
  })

  const handleDimensionChange = useCallback(
    (fieldName: DimensionField, nextValue: string, onChange: (value: number | undefined) => void) => {
      setDimensionInputs((prev) => ({
        ...prev,
        [fieldName]: nextValue,
      }))

      const trimmed = nextValue.trim()

      if (trimmed === "") {
        onChange(undefined)
        return
      }

      const parsed = Number(trimmed)

      if (Number.isNaN(parsed)) {
        return
      }

      onChange(parsed)
    },
    [],
  )

  const handleDialogClose = useCallback(() => {
    setIsAddDialogOpen(false)
    setIsEditDialogOpen(false)
    setEditingTag(null)
    form.reset()
    resetDimensionInputs()
  }, [form, resetDimensionInputs])

  const openAddDialog = useCallback(() => {
    setEditingTag(null)
    resetDimensionInputs()
    form.reset()
    setIsEditDialogOpen(false)
    setIsAddDialogOpen(true)
  }, [form, resetDimensionInputs])

  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)

      const units = await orgUnitService.list()
      setOrgUnits(units)

      if (units.length === 0) {
        setLocationTags([])
        return
      }

      const tagGroups = await Promise.all(units.map((unit) => locationTagService.listByUnit(unit.id)))
      setLocationTags(tagGroups.flat())
    } catch (error) {
      console.error("Failed to load location tags:", error)
      setErrorMessage("Failed to load location tags data.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  const unitMap = useMemo(() => {
    const map = new Map<string, OrgUnit>()
    orgUnits.forEach((unit) => map.set(unit.id, unit))
    return map
  }, [orgUnits])

  const filteredTags = useMemo(() => {
    const search = searchTerm.toLowerCase()

    return locationTags.filter((tag) => {
      const matchesSearch = tag.locationTagName.toLowerCase().includes(search)
      const matchesUnit = selectedUnitId === "all" || tag.unitId === selectedUnitId

      return matchesSearch && matchesUnit
    })
  }, [locationTags, searchTerm, selectedUnitId])

  const getUnitLabel = (unit: OrgUnit) =>
    unit.unitId ? `${unit.unitId} - ${unit.unitName}` : unit.unitName

  const mapFormValuesToPayload = (values: LocationTagFormValues) => ({
    unitId: values.unitId,
    locationTagName: values.locationTagName,
    length: values.length ?? null,
    breadth: values.breadth ?? null,
    height: values.height ?? null,
    unitOfMeasurement: values.unitOfMeasurement ?? null,
  })

  const handleAddTag = async (data: LocationTagFormValues) => {
    setIsSubmitting(true)
    try {
      const created = await locationTagService.create(mapFormValuesToPayload(data))
      setLocationTags((prev) => [...prev, created])
      toast({
        title: "Location tag created",
        description: `${created.locationTagName} has been added successfully.`,
      })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error creating location tag:", error)
      setErrorMessage("Failed to create location tag.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditTag = async (data: LocationTagFormValues) => {
    if (!editingTag) return

    setIsSubmitting(true)
    try {
      const updated = await locationTagService.update(
        editingTag.id,
        mapFormValuesToPayload(data),
      )
      setLocationTags((prev) => prev.map((tag) => (tag.id === updated.id ? updated : tag)))
      toast({
        title: "Location tag updated",
        description: `${updated.locationTagName} has been updated successfully.`,
      })
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating location tag:", error)
      setErrorMessage("Failed to update location tag.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteTag = async () => {
    if (!deleteTag) return

    try {
      await locationTagService.remove(deleteTag.id)
      setLocationTags((prev) => prev.filter((tag) => tag.id !== deleteTag.id))

      toast({
        title: "Location tag deleted",
        description: `${deleteTag.locationTagName} has been deleted successfully.`,
        variant: "destructive",
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.details || error?.response?.data?.error || "Failed to delete location tag."
      const statusCode = error?.response?.status

      console.log("Delete failed:", {
        status: statusCode,
        error: error?.response?.data?.error,
        details: error?.response?.data?.details,
        message: errorMessage
      })

      toast({
        title: "Cannot delete location tag",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setDeleteTag(null)
    }
  }

  const handleEditClick = (tag: ApiLocationTag) => {
    setEditingTag(tag)
    form.reset({
      locationTagName: tag.locationTagName,
      unitId: tag.unitId,
      length: tag.length ?? undefined,
      breadth: tag.breadth ?? undefined,
      height: tag.height ?? undefined,
      unitOfMeasurement: tag.unitOfMeasurement ?? undefined,
    })
    setDimensionInputsFromValues({
      length: tag.length,
      breadth: tag.breadth,
      height: tag.height,
    })
    setIsAddDialogOpen(false)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (tag: ApiLocationTag) => {
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-32">
        <Loader2 className="mr-3 h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading location tags...</p>
      </div>
    )
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
        <Button onClick={openAddDialog}>
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
                    <SelectItem key={unit.id} value={unit.id}>
                      {getUnitLabel(unit)}
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
                  <TableRow key={`${tag.locationTagName}-${tag.unitId || 'no-unit'}-${idx}`}>
                    <TableCell className="font-medium text-foreground">{tag.locationTagName}</TableCell>
                    <TableCell className="text-foreground">
                      {tag.length && tag.breadth && tag.height && tag.unitOfMeasurement
                        ? `${tag.length}×${tag.breadth}×${tag.height} ${tag.unitOfMeasurement}`
                        : "Not specified"
                      }
                    </TableCell>
                    <TableCell className="text-foreground font-medium">
                      {tag.capacity && tag.unitOfMeasurement
                        ? `${tag.capacity.toFixed(3)} cubic ${tag.unitOfMeasurement}`
                        : "Not specified"
                      }
                    </TableCell>
                    <TableCell className="text-foreground">{tag.currentItems}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(tag)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteClick(tag)}
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
      <Dialog
        open={isAddDialogOpen || isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false)
            setIsEditDialogOpen(false)
            setEditingTag(null)
            form.reset()
            resetDimensionInputs()
          }
        }}
      >
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
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Unit *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="text-foreground border-border focus:border-primary">
                          <SelectValue placeholder="Select organizational unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {orgUnits.length > 0 ? (
                          orgUnits.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {getUnitLabel(unit)}
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
                name="locationTagName"
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
                  {dimensionFieldNames.map((fieldName) => (
                    <FormField
                      key={fieldName}
                      control={form.control}
                      name={fieldName}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize">{fieldName}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              min="0"
                              step="0.001"
                              className="text-foreground placeholder:text-muted-foreground border-border focus:border-primary"
                              value={dimensionInputs[fieldName]}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              onChange={(event) => handleDimensionChange(fieldName, event.target.value, field.onChange)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}

                  <FormField
                    control={form.control}
                    name="unitOfMeasurement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                        const unit = form.watch("unitOfMeasurement");
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
                    <p className="text-sm text-foreground font-medium mt-1">{editingTag.currentItems}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground">Capacity</Label>
                    <p className="text-sm text-foreground font-medium mt-1">
                      {editingTag.capacity && editingTag.unitOfMeasurement
                        ? `${editingTag.capacity.toFixed(3)} cubic ${editingTag.unitOfMeasurement}`
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
                  }}
                  disabled={isSubmitting}
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
              "{deleteTag?.locationTagName}" and remove all associated data.
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
