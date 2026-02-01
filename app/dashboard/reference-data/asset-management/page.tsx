"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { mockAssetService } from "@/src/services/mockAssetService"
import { mockReferenceDataService } from "@/src/services/mockReferenceDataService"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit2, Trash2, Filter, X, ChevronDown, ChevronUp, ArrowUpDown, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const LOCATION_TAG_NONE_VALUE = "__none__"

const assetFormSchema = z.object({
  asset_id: z.string().max(100, "Asset ID must be less than 100 characters").optional(),
  asset_name: z.string().min(1, { message: "Asset Name is required" }).transform((v) => v.trim()),
  asset_type: z.enum(["forklift", "pallet_jack", "scanner"], {
    required_error: "Please select an asset type.",
  }),
  location_tag_id: z.string().optional(),
  // Dimensions for volume calculation
  length: z.number().positive("Length must be positive").max(999999.999, "Length must be less than 999999.999").optional(),
  breadth: z.number().positive("Breadth must be positive").max(999999.999, "Breadth must be less than 999999.999").optional(),
  height: z.number().positive("Height must be positive").max(999999.999, "Height must be less than 999999.999").optional(),
  unit_of_measurement: z.enum(["meters", "feet", "inches", "centimeters"]).optional(),
}).refine((data) => {
  // If any dimension is provided, all must be provided
  const hasAnyDimension = data.length || data.breadth || data.height
  const hasAllDimensions = data.length && data.breadth && data.height
  return !hasAnyDimension || hasAllDimensions
}, {
  message: "If you provide one dimension, you must provide all three dimensions",
  path: ["length"],
}).refine((data) => {
  // If dimensions are provided, unit of measurement is required
  const hasAnyDimension = data.length || data.breadth || data.height
  const hasUnitOfMeasurement = data.unit_of_measurement
  return !hasAnyDimension || hasUnitOfMeasurement
}, {
  message: "Unit of measurement is required when dimensions are provided",
  path: ["unit_of_measurement"],
})

type AssetFormValues = z.infer<typeof assetFormSchema>

interface Asset {
  id: string
  asset_id?: string
  asset_name: string
  asset_type: "forklift" | "pallet_jack" | "scanner"
  location_tag_id?: string
  departmentId?: string
  unitId?: string
  categoryId?: string
  statusId?: string
  name?: string
  type?: string
  locationId?: string
  length?: number
  breadth?: number
  height?: number
  volume?: number
  unit_of_measurement?: "meters" | "feet" | "inches" | "centimeters"
}

interface LocationTag {
  id: string
  location_tag_name: string
  length?: number
  breadth?: number
  height?: number
  unit_of_measurement?: "meters" | "feet" | "inches" | "centimeters"
  capacity?: number
  current_items: number
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

export default function AssetManagementPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [locationTags, setLocationTags] = useState<LocationTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false)
  const [isEditAssetOpen, setIsEditAssetOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [formMode, setFormMode] = useState<"add" | "edit">("add")
  const [isSubmitting, setIsSubmitting] = useState(false)
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
      asset_id: "",
      asset_name: "",
      asset_type: "forklift" as any,
      location_tag_id: undefined,
      length: undefined,
      breadth: undefined,
      height: undefined,
      unit_of_measurement: undefined,
    },
  })

  useEffect(() => {
    fetchAssets()
    fetchLocationTags()
  }, [])

  const fetchAssets = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) setIsLoading(true)
      
      const response = await mockAssetService.getAssetList({
        page: page - 1,
        pageSize: 20,
        searchText: filters.search,
        refFilter: {
          assetType: filters.assetType,
          locationId: filters.locationTag,
          departmentId: filters.department,
          unitId: filters.unit,
          categoryId: filters.category,
          statusId: filters.status,
        },
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      })

      if (response.data.status === "OK" && response.data.data) {
        const newAssets = response.data.data.list || []
        if (append) {
          setAssets((prev) => [...prev, ...newAssets])
        } else {
          setAssets(newAssets)
        }
        setHasMore(response.data.data.total > page * 20)
        setCurrentPage(page)
      }
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
      const response = await mockReferenceDataService.getTableEntry("68565e75f70897486c46853b")
      if (response.data) {
        const locationTagData = response.data.map((tag: any) => ({
          id: tag.id,
          location_tag_name: tag.detail.name,
          current_items: 0
        }))
        setLocationTags(locationTagData)
      }
    } catch (error) {
      console.error("Error fetching location tags:", error)
    }
  }

  const getLocationTagNameById = (locationTagId?: string) => {
    if (!locationTagId || locationTagId === LOCATION_TAG_NONE_VALUE) return "None"
    const locationTag = locationTags.find((tag) => tag.id === locationTagId)
    return locationTag?.location_tag_name || "Unknown"
  }

  const handleAddAsset = () => {
    setFormMode("add")
    form.reset({
      asset_id: "",
      asset_name: "",
      asset_type: "forklift" as any,
      location_tag_id: undefined,
    })
    setFilterDepartment(departmentDetails)
    setIsAddAssetOpen(true)
  }

  const handleEditAsset = (asset: Asset) => {
    setFormMode("edit")
    setSelectedAsset(asset)
    form.reset({
      asset_id: asset.asset_id || "",
      asset_name: asset.asset_name ?? asset.name ?? "",
      asset_type: asset.asset_type ?? asset.type ?? "forklift",
      location_tag_id: asset.location_tag_id ?? asset.locationId ?? undefined,
      length: asset.length,
      breadth: asset.breadth,
      height: asset.height,
      unit_of_measurement: asset.unit_of_measurement,
    })
    setIsEditAssetOpen(true)
  }

  const handleDeleteAsset = async (asset: Asset) => {
    if (!confirm(`Are you sure you want to delete ${asset.asset_name || asset.name || "this asset"}?`)) {
      return
    }

    try {
      const response = await mockAssetService.deleteAsset(asset.id)
      if (response.data.status === "OK") {
        setAssets((prev) => prev.filter((a) => a.id !== asset.id))
        toast({
          title: "Success",
          description: "Asset deleted successfully.",
        })
      }
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
      const locationTagId = data.location_tag_id === LOCATION_TAG_NONE_VALUE ? undefined : data.location_tag_id
      
      // Calculate volume if dimensions are provided
      const calculatedVolume = data.length && data.breadth && data.height
        ? parseFloat((data.length * data.breadth * data.height).toFixed(3))
        : undefined

      if (formMode === "add") {
        const reqBody = {
          asset_id: data.asset_id || undefined,
          asset_name: data.asset_name,
          asset_type: data.asset_type,
          location_tag_id: locationTagId,

          name: data.asset_name,
          type: data.asset_type,
          locationId: locationTagId,

          // Dimensions and volume
          length: data.length,
          breadth: data.breadth,
          height: data.height,
          volume: calculatedVolume,

          departmentId: departmentFilter,
          unitId: unitFilter || undefined,
          categoryId: categoryFilter || undefined,
          statusId: statusFilter || undefined,
        };

        const response = await mockAssetService.addAsset({
          asset_id: data.asset_id || undefined,
          asset_name: data.asset_name,
          asset_type: data.asset_type,
          location_tag_id: locationTagId || undefined,
          name: data.asset_name,
          type: data.asset_type,
          locationId: locationTagId,
          length: data.length,
          breadth: data.breadth,
          height: data.height,
          volume: calculatedVolume,
          unit_of_measurement: data.unit_of_measurement,
          departmentId: departmentFilter,
          unitId: unitFilter || undefined,
          categoryId: categoryFilter || undefined,
          statusId: statusFilter || undefined,
        })
        
        if (response.data.status === "OK") {
          // Refresh the assets list to get the new asset
          fetchAssets(1, false)
          setIsAddAssetOpen(false)
          form.reset()
          toast({
            title: "Success",
            description: "Asset added successfully.",
          })
        }
      } else {
        const reqBody = {
          id: selectedAsset?.id,
          asset_id: data.asset_id || undefined,
          asset_name: data.asset_name,
          asset_type: data.asset_type,
          location_tag_id: locationTagId,

          name: data.asset_name,
          type: data.asset_type,
          locationId: locationTagId,

          // Dimensions and volume
          length: data.length,
          breadth: data.breadth,
          height: data.height,
          volume: calculatedVolume,

          departmentId: departmentFilter,
          unitId: unitFilter || undefined,
          categoryId: categoryFilter || undefined,
          statusId: statusFilter || undefined,
        };

        const response = await mockAssetService.updateAsset({
          asset_id: data.asset_id || undefined,
          asset_name: data.asset_name,
          asset_type: data.asset_type,
          location_tag_id: locationTagId || undefined,
          id: selectedAsset?.id,
          name: data.asset_name,
          type: data.asset_type,
          locationId: locationTagId,
          length: data.length,
          breadth: data.breadth,
          height: data.height,
          volume: calculatedVolume,
          unit_of_measurement: data.unit_of_measurement,
          departmentId: departmentFilter,
          unitId: unitFilter || undefined,
          categoryId: categoryFilter || undefined,
          statusId: statusFilter || undefined,
        })
        
        if (response.data.status === "OK") {
          // Refresh the assets list to get updated data
          fetchAssets(1, false)
          setIsEditAssetOpen(false)
          setSelectedAsset(null)
          toast({
            title: "Success",
            description: "Asset updated successfully.",
          })
        }
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
    const matchesSearch = !filters.search || 
      (asset.asset_name ?? asset.name ?? "").toLowerCase().includes(filters.search.toLowerCase()) ||
      (asset.asset_id || "").toLowerCase().includes(filters.search.toLowerCase())
    const matchesType = !filters.assetType || asset.asset_type === filters.assetType
    const matchesLocation = !filters.locationTag || 
      (asset.location_tag_id ?? asset.locationId) === filters.locationTag
    return matchesSearch && matchesType && matchesLocation
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
                  <Select value={filters.assetType} onValueChange={(value) => handleFilterChange("assetType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="forklift">Forklift</SelectItem>
                      <SelectItem value="pallet_jack">Pallet Jack</SelectItem>
                      <SelectItem value="scanner">Scanner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Location Tag</label>
                  <Select value={filters.locationTag} onValueChange={(value) => handleFilterChange("locationTag", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All locations</SelectItem>
                      <SelectItem value={LOCATION_TAG_NONE_VALUE}>None</SelectItem>
                      {locationTags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          {tag.location_tag_name}
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
                <TableHeader className="bg-gray-100 text-black dark:bg-slate-950 dark:hover:bg-slate-950">
                  <TableRow>
                    <TableHead className="text-black font-semibold whitespace-nowrap min-w-[200px]">Asset ID</TableHead>
                    <TableHead className="text-black font-semibold whitespace-nowrap min-w-[200px]">Asset Name</TableHead>
                    <TableHead className="text-black font-semibold whitespace-nowrap">Asset Type</TableHead>
                    <TableHead className="text-black font-semibold whitespace-nowrap">Location Tag</TableHead>
                    <TableHead className="text-black font-semibold whitespace-nowrap text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset, index) => (
                    <TableRow
                      key={asset.id}
                      ref={index === filteredAssets.length - 1 ? lastAssetElementRef : null}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="p-4 md:p-6">{asset.asset_id || "-"}</TableCell>
                      <TableCell className="p-4 md:p-6">{asset.asset_name ?? asset.name ?? "-"}</TableCell>
                      <TableCell className="p-4 md:p-6">{asset.asset_type ?? asset.type ?? "-"}</TableCell>
                      <TableCell className="p-4 md:p-6">{getLocationTagNameById(asset.location_tag_id ?? asset.locationId)}</TableCell>
                      <TableCell className="p-4 md:p-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditAsset(asset)} className="cursor-pointer">
                              <Edit2 className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 cursor-pointer hover:bg-red-50"
                              onClick={() => handleDeleteAsset(asset)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {isFetchingMore && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
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
      <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
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
                name="asset_id"
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
                name="asset_name"
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
                name="asset_type"
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
              <FormField
                control={form.control}
                name="location_tag_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Tag</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location tag" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LOCATION_TAG_NONE_VALUE}>None</SelectItem>
                        {locationTags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {tag.location_tag_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Dimensions Section */}
              <div className="space-y-4">
                <FormLabel className="text-sm font-medium">Dimensions (Optional)</FormLabel>
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
                            step="any"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ""}
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
                            step="any"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ""}
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
                            step="any"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Unit of Measurement */}
                  <FormField
                    control={form.control}
                    name="unit_of_measurement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="meters">Meters</SelectItem>
                            <SelectItem value="feet">Feet</SelectItem>
                            <SelectItem value="inches">Inches</SelectItem>
                            <SelectItem value="centimeters">Centimeters</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.getValues().length && form.getValues().breadth && form.getValues().height && form.getValues().unit_of_measurement && (
                  <div className="text-sm text-muted-foreground">
                    Calculated Volume: {(form.getValues().length! * form.getValues().breadth! * form.getValues().height!).toFixed(3)} cubic {form.getValues().unit_of_measurement}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddAssetOpen(false)}>
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
      <Dialog open={isEditAssetOpen} onOpenChange={setIsEditAssetOpen}>
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
                name="asset_id"
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
                name="asset_name"
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
                name="asset_type"
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
              <FormField
                control={form.control}
                name="location_tag_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Tag</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location tag" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LOCATION_TAG_NONE_VALUE}>None</SelectItem>
                        {locationTags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {tag.location_tag_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dimensions Section */}
              <div className="space-y-4">
                <FormLabel className="text-sm font-medium">Dimensions (Optional)</FormLabel>
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
                            step="any"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ""}
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
                            step="any"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ""}
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
                            step="any"
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Unit of Measurement */}
                  <FormField
                    control={form.control}
                    name="unit_of_measurement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="meters">Meters</SelectItem>
                            <SelectItem value="feet">Feet</SelectItem>
                            <SelectItem value="inches">Inches</SelectItem>
                            <SelectItem value="centimeters">Centimeters</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.getValues().length && form.getValues().breadth && form.getValues().height && form.getValues().unit_of_measurement && (
                  <div className="text-sm text-muted-foreground">
                    Calculated Volume: {(form.getValues().length! * form.getValues().breadth! * form.getValues().height!).toFixed(3)} cubic {form.getValues().unit_of_measurement}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditAssetOpen(false)}>
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
