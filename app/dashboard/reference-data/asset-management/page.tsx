"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { assetService } from "@/src/services/assets"
import type { Asset as AssetDto } from "@/src/services/assets"
import { locationTagService } from "@/src/services/locationTags"
import { orgUnitService } from "@/src/services/orgUnits"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, Filter, X, ChevronDown, ChevronUp } from "lucide-react"

const LOCATION_TAG_NONE_VALUE = "__none__"
const LOCATION_TAG_UNASSIGNED_VALUE = "__unassigned__"
const LOCATION_TAG_ALL_VALUE = "__all__"
const ASSET_TYPE_ALL_VALUE = "__all_types__"
const WAREHOUSE_ALL_VALUE = "__all_warehouses__"

const assetFormSchema = z.object({
  assetId: z.string().max(100, "Asset ID must be less than 100 characters").optional(),
  assetName: z.string().min(1, { message: "Asset Name is required" }).transform((v) => v.trim()),
  assetType: z.enum(["forklift", "pallet_jack", "scanner"], {
    required_error: "Please select an asset type.",
  }),
  locationTagId: z.string().optional(),
})

type AssetFormValues = z.infer<typeof assetFormSchema>

interface Asset {
  id: string
  assetId?: string
  assetName: string
  assetType: "forklift" | "pallet_jack" | "scanner"
  locationTagId?: string
  locationTagName?: string
  unitId?: string
}

interface WarehouseOption {
  id: string
  name: string
}

interface LocationTagOption {
  id: string
  name: string
  unitId: string
}

interface FilterOptions {
  search: string
  assetType: string
  locationTag: string
  department: string
  unit: string
  category: string
  status: string
}

const mapApiAssetToView = (asset: AssetDto): Asset => ({
  id: asset.id,
  assetId: asset.assetId || undefined,
  assetName: asset.assetName,
  assetType: (asset.assetType as Asset["assetType"]) || "forklift",
  locationTagId: asset.locationTagId || undefined,
  locationTagName: asset.locationTagName || undefined,
  unitId: asset.unitId || undefined,
})

export default function AssetManagementPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([])
  const [allLocationTags, setAllLocationTags] = useState<LocationTagOption[]>([])
  const [locationTags, setLocationTags] = useState<LocationTagOption[]>([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("")
  const [dialogWarehouseId, setDialogWarehouseId] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false)
  const [isEditAssetOpen, setIsEditAssetOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [formMode, setFormMode] = useState<"add" | "edit">("add")
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    assetType: "",
    locationTag: "",
    department: "",
    unit: "",
    category: "",
    status: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Asset | null
    direction: "asc" | "desc"
  }>({ key: null, direction: "asc" })
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [filterDepartment, setFilterDepartment] = useState<any>(null)
  const [filterUnit, setFilterUnit] = useState<any>(null)
  const [filterCategory, setFilterCategory] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<any>(null)
  const observer = useRef<IntersectionObserver | null>(null)
  const lastAssetElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingMore) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreAssets()
        }
      })
      if (node) observer.current.observe(node)
    },
    [isFetchingMore, hasMore]
  )

  const departmentDetails = {
    id: "dept-001",
    name: "Warehouse Operations",
    description: "Main warehouse department",
  }

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      assetId: "",
      assetName: "",
      assetType: "forklift" as any,
      locationTagId: undefined,
    },
  })

  useEffect(() => {
    fetchAssets()
    fetchLocationTags()
  }, [])

  const fetchAssets = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) setIsLoading(true)

      const limit = 20
      const locationTagFilter =
        filters.locationTag && filters.locationTag !== LOCATION_TAG_NONE_VALUE
          ? filters.locationTag
          : undefined

      const response = await assetService.list({
        search: filters.search || undefined,
        locationTagId: locationTagFilter,
        limit,
        offset: (page - 1) * limit,
      })

      const newAssets = response.items.map(mapApiAssetToView)

      if (append) {
        setAssets((prev) => [...prev, ...newAssets])
      } else {
        setAssets(newAssets)
      }

      setHasMore((page - 1) * limit + newAssets.length < response.pagination.total)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error fetching assets:", error)
      toast({
        title: "Error",
        description: "Failed to fetch assets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }

  const loadMoreAssets = () => {
    if (!isFetchingMore && hasMore) {
      setIsFetchingMore(true)
      fetchAssets(currentPage + 1, true)
    }
  }

  const fetchLocationTags = async () => {
    try {
      const units = await orgUnitService.list()
      const warehouseUnits = units.filter((unit) => unit.unitType === "warehouse")
      const warehouseOptions: WarehouseOption[] = warehouseUnits.map((unit) => ({
        id: unit.id,
        name: unit.unitName,
      }))
      setWarehouses(warehouseOptions)

      const tagOptions: LocationTagOption[] = []

      await Promise.all(
        warehouseUnits.map(async (unit) => {
          try {
            const tags = await locationTagService.listByUnit(unit.id)
            tags.forEach((tag) => {
              tagOptions.push({
                id: tag.id,
                name: tag.locationTagName,
                unitId: unit.id,
              })
            })
          } catch (error) {
            console.error(`Failed to load location tags for unit ${unit.unitName}`, error)
          }
        }),
      )

      setAllLocationTags(tagOptions)
      setLocationTags(selectedWarehouseId ? tagOptions.filter((tag) => tag.unitId === selectedWarehouseId) : tagOptions)
    } catch (error) {
      console.error("Failed to load warehouses and location tags", error)
    }
  }

  const getFilteredLocationTags = (warehouseId: string) => {
    if (!warehouseId) return allLocationTags
    return allLocationTags.filter((tag) => tag.unitId === warehouseId)
  }

  const handleWarehouseChange = (warehouseId: string) => {
    setDialogWarehouseId(warehouseId)
    form.setValue("locationTagId", undefined)
  }

  const getLocationTagNameById = (locationTagId?: string) => {
    if (!locationTagId || locationTagId === LOCATION_TAG_NONE_VALUE) return "None"
    const locationTag = locationTags.find((tag) => tag.id === locationTagId)
    return locationTag?.name || "Unknown"
  }

  const getWarehouseNameByAsset = (asset: Asset) => {
    // First try to get warehouse from asset's unitId
    if (asset.unitId) {
      const warehouse = warehouses.find((wh) => wh.id === asset.unitId)
      if (warehouse) return warehouse.name
    }
    // If no unitId, try to get warehouse from location tag
    if (asset.locationTagId) {
      const locationTag = allLocationTags.find((tag) => tag.id === asset.locationTagId)
      if (locationTag?.unitId) {
        const warehouse = warehouses.find((wh) => wh.id === locationTag.unitId)
        if (warehouse) return warehouse.name
      }
    }
    return "-"
  }

  const handleAddAsset = () => {
    setFormMode("add")
    form.reset({
      assetId: "",
      assetName: "",
      assetType: "forklift" as any,
      locationTagId: undefined,
    })
    setDialogWarehouseId(selectedWarehouseId)
    setFilterDepartment(departmentDetails)
    setIsAddAssetOpen(true)
  }

  const handleEditAsset = (asset: Asset) => {
    setFormMode("edit")
    setSelectedAsset(asset)
    form.reset({
      assetId: asset.assetId || "",
      assetName: asset.assetName,
      assetType: asset.assetType ?? "forklift",
      locationTagId: asset.locationTagId ?? undefined,
    })
    const assetWarehouseId = asset.unitId || allLocationTags.find((t) => t.id === asset.locationTagId)?.unitId || ""
    setDialogWarehouseId(assetWarehouseId)
    setIsEditAssetOpen(true)
  }

  const handleDeleteAsset = async (asset: Asset) => {
    if (!confirm(`Are you sure you want to delete ${asset.assetName || "this asset"}?`)) {
      return
    }

    try {
      await assetService.remove(asset.id)
      setAssets((prev) => prev.filter((a) => a.id !== asset.id))
      toast({
        title: "Success",
        description: "Asset deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting asset:", error)
      toast({
        title: "Error",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive",
      })
    }
  }
  const onSubmit = async (data: AssetFormValues) => {
    setIsSubmitting(true)

    try {
      const locationTagId = data.locationTagId === LOCATION_TAG_NONE_VALUE ? undefined : data.locationTagId

      if (formMode === "add") {
        const created = await assetService.create({
          assetId: data.assetId || null,
          assetName: data.assetName,
          assetType: data.assetType,
          locationTagId: locationTagId || null,
        })

        setAssets((prev) => [mapApiAssetToView(created), ...prev])
        toast({
          title: "Success",
          description: "Asset added successfully.",
        })
      } else if (selectedAsset) {
        const updated = await assetService.update(selectedAsset.id, {
          assetId: data.assetId || null,
          assetName: data.assetName,
          assetType: data.assetType,
          locationTagId: locationTagId ?? null,
        })

        setAssets((prev) => prev.map((asset) => (asset.id === updated.id ? mapApiAssetToView(updated) : asset)))
        toast({
          title: "Success",
          description: "Asset updated successfully.",
        })
      }
      if (formMode === "add") {
        setIsAddAssetOpen(false)
      } else {
        setIsEditAssetOpen(false)
      }
    } catch (error) {
      console.error("Error submitting asset:", error)
      toast({
        title: "Error",
        description: `Failed to ${formMode} asset. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    setCurrentPage(1)
    fetchAssets(1, false)
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      assetType: "",
      locationTag: "",
      department: "",
      unit: "",
      category: "",
      status: "",
    })
    setCurrentPage(1)
    fetchAssets(1, false)
  }

  const handleSort = (key: keyof Asset) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
    setCurrentPage(1)
    fetchAssets(1, false)
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      !filters.search ||
      asset.assetName.toLowerCase().includes(filters.search.toLowerCase()) ||
      (asset.assetId || "").toLowerCase().includes(filters.search.toLowerCase())
    const matchesType = !filters.assetType || asset.assetType === filters.assetType
    const matchesLocation = !filters.locationTag || asset.locationTagId === filters.locationTag
    const matchesWarehouse = !selectedWarehouseId || asset.unitId === selectedWarehouseId ||
      allLocationTags.find((tag) => tag.id === asset.locationTagId)?.unitId === selectedWarehouseId
    return matchesSearch && matchesType && matchesLocation && matchesWarehouse
  })

  const departmentFilter = filterDepartment?.id
  const unitFilter = filterUnit?.id
  const categoryFilter = filterCategory?.id
  const statusFilter = filterStatus?.id

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Management</h1>
          <p className="text-muted-foreground">Manage your warehouse assets</p>
        </div>
        <Button onClick={handleAddAsset}>
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assets</CardTitle>
              <CardDescription>View and manage your warehouse assets</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select
                value={selectedWarehouseId || WAREHOUSE_ALL_VALUE}
                onValueChange={(value) => {
                  const newWarehouseId = value === WAREHOUSE_ALL_VALUE ? "" : value
                  setSelectedWarehouseId(newWarehouseId)
                  setLocationTags(newWarehouseId ? allLocationTags.filter((t) => t.unitId === newWarehouseId) : allLocationTags)
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WAREHOUSE_ALL_VALUE}>All Warehouses</SelectItem>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {showFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showFilters && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Asset Type</label>
                  <Select
                    value={filters.assetType || ASSET_TYPE_ALL_VALUE}
                    onValueChange={(value) => handleFilterChange("assetType", value === ASSET_TYPE_ALL_VALUE ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ASSET_TYPE_ALL_VALUE}>All types</SelectItem>
                      <SelectItem value="forklift">Forklift</SelectItem>
                      <SelectItem value="pallet_jack">Pallet Jack</SelectItem>
                      <SelectItem value="scanner">Scanner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Location Tag</label>
                  <Select
                    value={filters.locationTag ? filters.locationTag : LOCATION_TAG_ALL_VALUE}
                    onValueChange={(value) =>
                      handleFilterChange("locationTag", value === LOCATION_TAG_ALL_VALUE ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LOCATION_TAG_ALL_VALUE}>All locations</SelectItem>
                      <SelectItem value={LOCATION_TAG_NONE_VALUE}>None</SelectItem>
                      {locationTags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end space-x-2">
                  <Button onClick={applyFilters}>Apply Filters</Button>
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No assets found.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground font-semibold whitespace-nowrap min-w-[200px]">Asset ID</TableHead>
                    <TableHead className="text-foreground font-semibold whitespace-nowrap min-w-[200px]">Asset Name</TableHead>
                    <TableHead className="text-foreground font-semibold whitespace-nowrap">Asset Type</TableHead>
                    <TableHead className="text-foreground font-semibold whitespace-nowrap">Warehouse</TableHead>
                    <TableHead className="text-foreground font-semibold whitespace-nowrap">Location Tag</TableHead>
                    <TableHead className="text-foreground font-semibold whitespace-nowrap text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset, index) => (
                    <TableRow
                      key={asset.id}
                      ref={index === filteredAssets.length - 1 ? lastAssetElementRef : null}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="p-4 md:p-6 text-foreground">{asset.assetId || "-"}</TableCell>
                      <TableCell className="p-4 md:p-6 text-foreground">{asset.assetName}</TableCell>
                      <TableCell className="p-4 md:p-6 text-foreground">{asset.assetType}</TableCell>
                      <TableCell className="p-4 md:p-6 text-foreground">{getWarehouseNameByAsset(asset)}</TableCell>
                      <TableCell className="p-4 md:p-6 text-foreground">{asset.locationTagName || getLocationTagNameById(asset.locationTagId)}</TableCell>
                      <TableCell className="p-4 md:p-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAsset(asset)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteAsset(asset)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {isFetchingMore && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Asset Dialog */}
      <Dialog open={isAddAssetOpen} onOpenChange={(open) => {
        setIsAddAssetOpen(open)
        if (!open) {
          form.reset()
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Add a new asset to your warehouse inventory.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Asset ID */}
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem className="space-y-0 mt-0">
                    <FormLabel className="text-sm font-medium leading-none">Asset ID</FormLabel>
                    <FormControl>
                      <Input className="h-12 rounded-md border border-input" placeholder="e.g., AST-001, FRK-LFT-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assetName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter asset name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="forklift">Forklift</SelectItem>
                        <SelectItem value="pallet_jack">Pallet Jack</SelectItem>
                        <SelectItem value="scanner">Scanner</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Warehouse Selection */}
              <FormItem>
                <FormLabel>Warehouse</FormLabel>
                <Select
                  value={dialogWarehouseId || WAREHOUSE_ALL_VALUE}
                  onValueChange={(value) => handleWarehouseChange(value === WAREHOUSE_ALL_VALUE ? "" : value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={WAREHOUSE_ALL_VALUE}>All Warehouses</SelectItem>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>

              <FormField
                control={form.control}
                name="locationTagId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Tag</FormLabel>
                    <Select
                      value={field.value ?? LOCATION_TAG_UNASSIGNED_VALUE}
                      onValueChange={(value) =>
                        field.onChange(value === LOCATION_TAG_UNASSIGNED_VALUE ? undefined : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location tag" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LOCATION_TAG_UNASSIGNED_VALUE}>Unassigned</SelectItem>
                        <SelectItem value={LOCATION_TAG_NONE_VALUE}>None</SelectItem>
                        {getFilteredLocationTags(dialogWarehouseId).map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddAssetOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Asset"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={isEditAssetOpen} onOpenChange={(open) => {
        setIsEditAssetOpen(open)
        if (!open) {
          setSelectedAsset(null)
          form.reset()
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update the asset information.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Asset ID */}
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem className="space-y-0 mt-0">
                    <FormLabel className="text-sm font-medium leading-none">Asset ID</FormLabel>
                    <FormControl>
                      <Input className="h-12 rounded-md border border-input" placeholder="e.g., AST-001, FRK-LFT-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assetName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter asset name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="forklift">Forklift</SelectItem>
                        <SelectItem value="pallet_jack">Pallet Jack</SelectItem>
                        <SelectItem value="scanner">Scanner</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Warehouse Selection */}
              <FormItem>
                <FormLabel>Warehouse</FormLabel>
                <Select
                  value={dialogWarehouseId || WAREHOUSE_ALL_VALUE}
                  onValueChange={(value) => handleWarehouseChange(value === WAREHOUSE_ALL_VALUE ? "" : value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={WAREHOUSE_ALL_VALUE}>All Warehouses</SelectItem>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>

              <FormField
                control={form.control}
                name="locationTagId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Tag</FormLabel>
                    <Select
                      value={field.value ?? LOCATION_TAG_UNASSIGNED_VALUE}
                      onValueChange={(value) =>
                        field.onChange(value === LOCATION_TAG_UNASSIGNED_VALUE ? undefined : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location tag" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LOCATION_TAG_UNASSIGNED_VALUE}>Unassigned</SelectItem>
                        <SelectItem value={LOCATION_TAG_NONE_VALUE}>None</SelectItem>
                        {getFilteredLocationTags(dialogWarehouseId).map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {tag.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditAssetOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Updating..." : "Update Asset"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
