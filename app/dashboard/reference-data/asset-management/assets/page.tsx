"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Upload, Edit, Trash2, Package } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { PageHeader } from "@/components/dashboard/page-header"
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/utils/AuthContext";
import { notification } from '@/src/services/notificationService'
import { apiService } from "@/src/services/apiService";
import { api_url } from "@/src/constants/api_url";
import { useInfiniteScroll } from "@/src/lib/use-infinite-scroll";
import { getPaginatedRequestParams } from "@/src/lib/pagination";
import { FileUploadBox } from "@/components/file-uploaders/file-upload-box"

// Asset form schema
const assetFormSchema = z.object({
  parentResource: z.string({
    required_error: "Please select a parent resource.",
  }).min(1, { message: "Please select a parent resource." }),
  category: z.string({
    required_error: "Please select a category.",
  }).min(1, { message: "Please select a category." }),
  name: z.string().min(2, { message: "Asset name is required" }),
  code: z.string().min(2, { message: "Asset code is required" }),
  description: z.string().optional(),
  status: z.string({
    required_error: "Please select a asset status.",
  }).min(1, { message: "Please select a asset status." }),
  locationTag: z.string({
    required_error: "Please select a location tag.",
  }).min(1, { message: "Please select a location tag." }),
  unit: z.string({
    required_error: "Please select a unit.",
  }).min(1, { message: "Please select a unit." }),
  department: z.string({
    required_error: "Please select a department.",
  }).min(1, { message: "Please select a department." }),
  attachments: z.array(z.string().url()).optional()
})

type AssetFormValues = z.infer<typeof assetFormSchema>

export default function AssetManagementPage() {
  
  const [assetData, setAssetData] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [rawSearchTerm, setRawSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false)
  const [isViewAssetOpen, setIsViewAssetOpen] = useState(false)
  const [isEditAssetOpen, setIsEditAssetOpen] = useState(false)
  const [isDeleteAssetOpen, setIsDeleteAssetOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [formMode, setFormMode] = useState<"add" | "edit" | "view">("add")
  const [isDeleting, setIsDeleting] = useState(false);
  const [filtersReady, setFiltersReady] = useState(false);
  const [units, setUnit] = useState<{ value: string; label: string }[]>([]);
  const [unitFilter, setUnitFilter] = useState<string>("");
  const [departments, setDepartments] = useState<{ value: string; label: string }[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [locationTags, setlocationTags] = useState<{ value: string; label: string }[]>([]);
  const [locationTagFilter, setLocationTagFilter] = useState<string>("");
  const [statuses, setStatuses] = useState<{ value: string; label: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [parentResources, setParentResources] = useState<{ value: string; label: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {isAuthenticated, isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [departmentDetails, setDepartmentDetails] = useState<any[]>([]);
  const [filterDepartment, setFilterDepartment] = useState<any[]>([]);

  const router = useRouter();
  const scrollContainerRef = useInfiniteScroll<HTMLDivElement>({
    hasMore,
    onLoadMore: () => {
      if (isLoading || !hasMore) return;
      setIsLoading(true);
      setPage((prev) => prev + 1);
    }
  });

  // Auth Check
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthenticated, isAuthLoading, router]);

  // Get Units
  useEffect(() => {
    fetchDropdownOptions({
      apiId: "68565c5df70897486c46852e",
      setState: setUnit,
      defaultLabel: "Units",
    });
  }, []);

  useEffect(() => {
    if (units.length > 0 && !unitFilter) {
      setUnitFilter(units[0].value);
    }
  }, [units, unitFilter]);

  const getUnitNameById = (unitId: string): string => {
    const unit = units.find(u => u.value === unitId);
    return unit ? unit.label : "-";
  };

  // Get Departments
  useEffect(() => {
    fetchDropdownOptions({
      apiId: "68565ce0f70897486c46852f",
      setState: setDepartments,
      defaultLabel: "Departments",
    });
  }, []);

  useEffect(() => {
    if (departments.length > 0 && !departmentFilter) {
      setDepartmentFilter(departments[0].value);
    }
  }, [departments, departmentFilter]);

  const getDepartmentsNameById = (id: string): string => {
    const department = departments.find(d => d.value === id);
    return department ? department.label : "-";
  };

  // Get Categories
  useEffect(() => {
    fetchDropdownOptions({
      apiId: "68565ef7f70897486c468540",
      setState: setCategories,
      defaultLabel: "Categories",
    });
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !categoryFilter) {
      setCategoryFilter(categories[0].value);
    }
  }, [categories, categoryFilter]);

  const getCategoriesNameById = (id: string): string => {
    const category = categories.find(d => d.value === id);
    return category ? category.label : "-";
  };

  // Get Location Tag
  useEffect(() => {
    fetchDropdownOptions({
      apiId: "68565e75f70897486c46853b",
      setState: setlocationTags,
      defaultLabel: "LocationTags",
    });
  }, []);

  useEffect(() => {
    if (locationTags.length > 0 && !locationTagFilter) {
      setLocationTagFilter(locationTags[0].value);
    }
  }, [locationTags, setLocationTagFilter]);

  const getLocationTagNameById = (id: string): string => {
    const location = locationTags.find(d => d.value === id);
    return location ? location.label : "-";
  };

  // Get Status
  useEffect(() => {
    fetchDropdownOptions({
      apiId: "68565f14f70897486c468541",
      setState: setStatuses,
      defaultLabel: "statuses",
    });
  }, []);

  useEffect(() => {
    if (statuses.length > 0 && !statusFilter) {
      setStatusFilter(statuses[0].value);
    }
  }, [statuses, setStatusFilter]);

  const getStatusesNameById = (id: string): string => {
    const status = statuses.find(d => d.value === id);
    return status ? status.label : "-";
  };

  // Get Parent Resources
  useEffect(() => {
    fetchDropdownOptions({
      apiId: "68565df7f70897486c468538",
      setState: setParentResources,
      defaultLabel: "ParentResources",
    });
  }, []);

  const getParentResourcesNameById = (id: string): string => {
    const resource = parentResources.find(d => d.value === id);
    return resource ? resource.label : "-";
  };

  // Comman Dropdown Filter Api
  const fetchDropdownOptions = async ({
    apiId,
    setState,
    defaultLabel,
  }: {
    apiId: string;
    setState: React.Dispatch<React.SetStateAction<{ value: string; label: string }[]>>;
    defaultLabel: string;
  }) => {
    try {
      const response = await apiService.get({
        path: `${api_url.worCoorService.referenceDataTable.listTableEntry}/${apiId}`,
        isAuth: true,
      });

      let rawData = response.data?.data || [];
      if (defaultLabel == 'Departments') {
        setDepartmentDetails(response.data?.data || []);
        setFilterDepartment(response.data?.data || []);
      }
      if (defaultLabel == 'ParentResources') {
        rawData = rawData.filter(
          (item: any) => item?.detail?.typeId === "6863f3d65f3b843029c7941e"
        );
      }
      const formattedData = rawData.map((item: any) => ({
        value: item.id,
        label: item.detail?.name || "",
      }));

      setState([...formattedData]);
    } catch (error) {
      notification.error(`Failed to load ${defaultLabel}.`);
    }
  };

  // Filter Set All
  useEffect(() => {
    const allFetched = [units, departments, categories, locationTags, statuses].every(arr => Array.isArray(arr));
    const allFiltersSelected = unitFilter && departmentFilter && categoryFilter && locationTagFilter && statusFilter;

    if (allFetched && allFiltersSelected) {
      setFiltersReady(true);
    }
  }, [
    units, departments, categories, locationTags, statuses,
    unitFilter, departmentFilter, categoryFilter, locationTagFilter, statusFilter,
  ]);

  const buildFilterQuery = () => {
    const query: any = {};
    if (statusFilter && statusFilter !== "000000000000000000000000") {
      query.statusId = statusFilter;
    }
    if (categoryFilter && categoryFilter !== "000000000000000000000000") {
      query.categoryId = categoryFilter;
    }
    if (locationTagFilter && locationTagFilter !== "000000000000000000000000") {
      query.locationId = locationTagFilter;
    }
    if (unitFilter && unitFilter !== "000000000000000000000000") {
      query.unitId = unitFilter;
    }
    if (departmentFilter && departmentFilter !== "000000000000000000000000") {
      query.departmentId = departmentFilter;
    }
    return query;
  };
  
  // Search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(rawSearchTerm);
    }, 400);
    return () => clearTimeout(timeout);
  }, [rawSearchTerm]);

  // Asset Listing
  useEffect(() => {
    if (filtersReady) {
      fetchAssetList();
    }
  }, [page, searchTerm, statusFilter, categoryFilter, locationTagFilter, unitFilter, departmentFilter, filtersReady]);

  useEffect(() => {
    setPage(0);
    setAssetData([]);
    setHasMore(true);
    setIsLoading(false);
  }, [searchTerm, statusFilter, categoryFilter, locationTagFilter, unitFilter, departmentFilter]);

  const fetchAssetList = async () => {
    setIsLoading(true);
    try {

      const filters = buildFilterQuery(); // dynamic filtering logic
      const requestData: any = {
        ...getPaginatedRequestParams(page, pageSize),
        searchText: searchTerm || undefined,
      };
      if (Object.keys(filters).length > 0) {
        requestData.refFilter = filters;
      }
      
      const response = await apiService.post({
        path: api_url.worCoorService.asset.assetlist,
        data: requestData,
        isAuth: true,
      });

      const list = Array.isArray(response.data?.data?.list) ? response.data.data.list : [];
      const totalCount = response.data?.data?.total || 0;
      setAssetData((prev) => {
        const merged = [...prev, ...list];
        const uniqueById = Array.from(new Map(merged.map((item) => [item.id, item])).values());
        setHasMore(uniqueById.length < totalCount);
        return uniqueById;
      });
    } catch (error) {
      setHasMore(false);
      notification.error("Failed to load asset list.");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize form
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      parentResource: "",
      name: "",
      code: "",
      category: "",
      description: "",
      status: "",
      locationTag: "",
      unit: "",
      department: "",
      attachments: []
    },
  })

  // Function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Under Maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "Decommissioned":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Handle row double click
  const handleRowDoubleClick = (asset: any) => {
    setSelectedAsset(asset)
    setIsViewAssetOpen(true)
  }

  // Open edit dialog
  const handleEditAsset = (asset: any) => {
    setSelectedAsset(asset)
    setFilterDepartment(departmentDetails)
    setFormMode("edit")
    form.reset({
      parentResource: asset.resourceId,
      name: asset.name,
      code: asset.code,
      category: asset.categoryId,
      description: asset.description,
      status: asset.statusId,
      locationTag: asset.locationId,
      unit: asset.unitId,
      department: asset.departmentId,
      attachments: asset.attachments
    })
    setIsEditAssetOpen(true)
  }

  // Open delete dialog
  const handleDeleteAsset = (asset: any) => {
    setSelectedAsset(asset)
    setIsDeleteAssetOpen(true)
  }

  // Add asset
  const handleAddAsset = () => {
    setFormMode("add")
    form.reset({
      parentResource: "",
      name: "",
      code: "",
      category: "",
      description: "",
      status: "",
      locationTag: "",
      unit: "",
      department: "",
      attachments: []
    })
    setFilterDepartment(departmentDetails)
    setIsAddAssetOpen(true)
  }

  // Submit form (Add / Edit)
  const onSubmit = async (data: AssetFormValues) => {
    
    if (formMode === "add") {
      setIsSubmitting(true);
      try {
        const reqBody = {
          resourceId: data.parentResource,
          name: data.name.trim(),
          code: data.code.trim(),
          categoryId: data.category,
          description: data.description ? data.description.trim() : undefined,
          statusId: data.status,
          locationId: data.locationTag,
          unitId: data.unit,
          departmentId: data.department,
          attachments: data.attachments ? data.attachments : undefined,
        };

        const response = await apiService.post({
          path: api_url.worCoorService.asset.addAsset,
          isAuth: true,
          data: reqBody,
        });

        if (response.data.status === "OK") {
          notification.success(response.data.message);
          setIsAddAssetOpen(false);
          form.reset();
          setPage(0);
          setAssetData([]);
          setHasMore(true);
          setIsLoading(false);
          await fetchAssetList();
        } else {
          notification.error(response.data.message);
        }
      } catch (error) {
        notification.error("Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    } else if (formMode === "edit") {
      setIsSubmitting(true);
      try {
        const reqBody = {
          id: selectedAsset.id,
          resourceId: data.parentResource,
          name: data.name.trim(),
          code: data.code.trim(),
          categoryId: data.category,
          description: data.description ? data.description.trim() : undefined,
          statusId: data.status,
          locationId: data.locationTag,
          unitId: data.unit,
          departmentId: data.department,
          attachments: data.attachments ? data.attachments : undefined
        };

        const response = await apiService.put({
          path: `${api_url.worCoorService.asset.updateAsset}`,
          isAuth: true,
          data: reqBody,
        });

        if (response.data.status === "OK") {
          notification.success(response.data.message);
          setIsEditAssetOpen(false);
          setSelectedAsset(null);
          setPage(0);
          setAssetData([]);
          setHasMore(true);
          setIsLoading(false);
          await fetchAssetList();
        } else {
          notification.error(response.data.message);
        }
      } catch (error) {
        notification.error("Something went wrong while updating the asset.");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  // Delete confirmation
  const confirmDeleteAsset = async () => {
    if (!selectedAsset) return;
    setIsDeleting(true);
    try {
      const response = await apiService.delete({
        path: `${api_url.worCoorService.asset.deleteAsset}/${selectedAsset.id}`,
        isAuth: true,
      });

      if (response.data?.status === "OK") {
        // Show success message
        notification.success(response.data.message || "Asset deleted successfully.");

        // Refresh data
        setPage(0);
        setAssetData([]);
        setHasMore(true);
        setIsLoading(false);
        await fetchAssetList();
        // Close modals
        setIsDeleteAssetOpen(false);
        setIsViewAssetOpen(false);
      } else {
        notification.error(response.data?.message || "Failed to delete asset.");
      }
    } catch (error) {
      notification.error("Something went wrong while deleting the asset.");
    } finally {
      setIsDeleting(false);
    }
  };

  const onUploadSuccess = (res: any) => {
    if (res.length) {
      notification.success("Attachment Uploaded.");
    }
  };

  const onUploadError = (res: any) => {
    notification.error(res);
  };

  if (isAuthLoading || !isAuthenticated) return null;

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden">
      <div className="asset-management h-full flex flex-col gap-2">
        <div className="flex items-center pb-2 sm:pb-4">
          <PageHeader title="Asset Management"
          description="Manage and track all your assets in one place"
          icon={Package} />

          <Button 
            className="border border-primary bg-darkblue text-white hover:bg-darkblue/90 ml-auto"
            onClick={() => handleAddAsset()}>
            <span className="hidden md:block"> Add Asset</span>
            <Plus className="h-4 w-4 block text-white md:hidden" />
          </Button>
        </div>
        <div className="h-full grow rounded-2xl border-0 sm:border border-slate-200 backdrop-blur-sm text-card-foreground shadow-soft hover:shadow-medium transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/80 p-0 sm:p-6">
          <div className="border-gray-200 pb-7 pt-1">
            <div className="w-full flex flex-wrap gap-4 items-center">
              <div className="w-full md:w-auto flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Search className="absolute align-middle h-full text-muted-foreground left-1 pl-1" size='22' />
                  <Input
                    type="search"
                    placeholder="Search Assets..."
                    value={rawSearchTerm}
                    onChange={(e) => setRawSearchTerm(e.target.value)}
                    className="h-11 bg-background border-input rounded-xl pl-8 focus:outline-transparent focus:ring-0 focus:border-input focus:ring-transparent focus-visible:ring-0 focus-visible:outline-none focus-visible:outline-transparent  focus-visible:ring-transparent"
                  />
                </div>
              </div>
              <div className="w-fit flex flex-wrap align-middle gap-3 md:gap-2 ml-auto md:flex-none">
                {/* Status Wise Filter  */}
              <div  className="relative w-[160px]">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={`peer w-full bg-background border text-left border-input 
                        focus:outline-none focus:ring-0 focus:border-input focus:ring-transparent`}
                    >
                    <SelectValue/>
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                    <label
                      htmlFor="status"
                      className={`pointer-events-none absolute left-3 -top-2 text-sm text-muted-foreground 
                      transition-all duration-200 bg-background px-1
                      peer-focus:-top-1.4 peer-focus:text-xs peer-focus:font-medium 
                      ${statusFilter ? '-top-1.4 text-xs font-medium' : 'top-3.5'}
                    `}
                    >
                    Asset Statuses
                  </label>
                </div>
                {/* Category Wise Filter  */}
                <div className="relative w-[160px]">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className={`peer w-full bg-background border text-left border-input 
                        focus:outline-none focus:ring-0 focus:border-input focus:ring-transparent`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label
                    className={`pointer-events-none absolute left-3 -top-2 text-sm text-muted-foreground 
                      transition-all duration-200 bg-background px-1
                      peer-focus:-top-1.4 peer-focus:text-xs peer-focus:font-medium 
                      ${categoryFilter ? '-top-1.4 text-xs font-medium' : 'top-3.5'}
                    `}>
                    Category
                  </label>
                </div>
                {/* Unit Wise Filter  */}
                <div className="relative w-[160px]">
                  <Select value={unitFilter} onValueChange={(value) => {
                    setUnitFilter(value);
                    // Filter departments that belong to this unit
                    if (value === "000000000000000000000000") {
                      setFilterDepartment(departmentDetails);
                    } else {
                      const matched = departmentDetails.filter(
                        (dept) => dept.detail.unitId === value
                      );
                      setFilterDepartment(matched);
                    }
                  }}>
                    <SelectTrigger className={`peer w-full bg-background border text-left border-input 
                        focus:outline-none focus:ring-0 focus:border-input focus:ring-transparent`}>
                      <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label
                    className={`pointer-events-none absolute left-3 -top-2 text-sm text-muted-foreground 
                      transition-all duration-200 bg-background px-1
                      peer-focus:-top-1.4 peer-focus:text-xs peer-focus:font-medium 
                      ${unitFilter ? '-top-1.4 text-xs font-medium' : 'top-3.5'}
                    `}>
                    Org Unit
                  </label>
                </div>

                {/* Department Wise Filter  */}
                <div className="relative w-[160px]">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className={`peer w-full bg-background border text-left border-input 
                        focus:outline-none focus:ring-0 focus:border-input focus:ring-transparent`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterDepartment.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No departments found</div>
                    ) : (
                      filterDepartment.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.detail.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <label
                    className={`pointer-events-none absolute left-3 -top-2 text-sm text-muted-foreground 
                      transition-all duration-200 bg-background px-1
                      peer-focus:-top-1.4 peer-focus:text-xs peer-focus:font-medium 
                      ${departmentFilter ? '-top-1.4 text-xs font-medium' : 'top-3.5'}
                    `}>
                    Department
                  </label>
                </div>

                {/* Location Tag Wise Filter  */}
                <div className="relative w-[160px]">
                <Select value={locationTagFilter} onValueChange={setLocationTagFilter}>
                  <SelectTrigger className={`peer w-full bg-background border text-left border-input 
                        focus:outline-none focus:ring-0 focus:border-input focus:ring-transparent`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locationTags.map((locationTag) => (
                      <SelectItem key={locationTag.value} value={locationTag.value}>
                        {locationTag.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                  <label
                    className={`pointer-events-none absolute left-3 -top-2 text-sm text-muted-foreground 
                      transition-all duration-200 bg-background px-1
                      peer-focus:-top-1.4 peer-focus:text-xs peer-focus:font-medium 
                      ${locationTagFilter ? '-top-1.4 text-xs font-medium' : 'top-3.5'}
                    `}>
                  Location Tag
                  </label>
                </div>
              </div>
            </div>
            {/* <Button className="flex items-center gap-2" onClick={handleAddAsset}>
              <Plus className="h-4 w-4" />
              Add Asset
            </Button> */}
          </div>

          <div ref={scrollContainerRef}
            className="rounded-md min-h-[300px] max-h-[calc(100dvh-240px)] overflow-y-auto overflow-x-auto scroll-auto"
          >
            <Table className="table-auto">
              {assetData.length === 0 ? (
                <TableBody>
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={10} className="text-center">
                        No assets found. Try adjusting your filters.
                      </TableCell>
                    </TableRow>
                </TableBody>
              ) : (
                <>
                  <TableHeader className="bg-gray-100 text-black dark:bg-slate-950 dark:hover:bg-slate-950">
                    <TableRow>
                      <TableHead className="text-black font-semibold whitespace-nowrap">Parent Resource</TableHead>
                      <TableHead className="text-black font-semibold whitespace-nowrap min-w-[150px]">Asset Name</TableHead>
                      <TableHead className="text-black font-semibold whitespace-nowrap">Location Tag</TableHead>
                      <TableHead className="text-black font-semibold whitespace-nowrap min-w-[150px]">Asset Code</TableHead>
                      <TableHead className="text-black font-semibold whitespace-nowrap min-w-[150px]">Org Unit</TableHead>
                      <TableHead className="text-black font-semibold whitespace-nowrap">Department</TableHead>
                      <TableHead className="text-black font-semibold whitespace-nowrap">Category</TableHead>
                      <TableHead className="text-black font-semibold whitespace-nowrap">Asset Status</TableHead>
                      <TableHead className="text-black font-semibold whitespace-nowrap">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {
                      assetData.map((asset) => (
                        <TableRow
                          key={asset.id || `${asset.name}-${asset.instanceName}`}
                          onDoubleClick={() => handleRowDoubleClick(asset)}
                          className="cursor-pointer bg-muted/30"
                        >
                          <TableCell className="p-4 md:p-6">{getParentResourcesNameById(asset.resourceId)}</TableCell>
                          <TableCell className="p-4 md:p-6">{asset.name}</TableCell>
                          <TableCell className="p-4 md:p-6">{getLocationTagNameById(asset.locationId)}</TableCell>
                          <TableCell className="p-4 md:p-6">{asset.code}</TableCell>
                          <TableCell className="p-4 md:p-6">{getUnitNameById(asset.unitId)}</TableCell>
                          <TableCell className="p-4 md:p-6">{getDepartmentsNameById(asset.departmentId)}</TableCell>
                          <TableCell className="p-4 md:p-6">{getCategoriesNameById(asset.categoryId)}</TableCell>
                          <TableCell className="p-4 md:p-6 whitespace-nowrap">
                            <Badge className={getStatusBadgeColor(getStatusesNameById(asset.statusId))}>
                              {getStatusesNameById(asset.statusId)}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-4 md:p-6 max-w-[200px] truncate" title={asset.description}>
                            {asset.description ? asset.description : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </>
              )}
            </Table>
          </div>
        </div>

        {/* Add Asset Dialog */}
        <Dialog open={isAddAssetOpen} onOpenChange={setIsAddAssetOpen}>
          <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={() => setIsAddAssetOpen(false)}
              className="sm:max-w-[600px] max-w-md md:max-h-[90dvh] min-h-[90dvh] md:h-[90dvh] h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] dark:bg-modal p-0 gap-0">
              <DialogHeader className="px-2 md:px-6 pt-6 pb-[1.1rem] border-b">
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>Enter the details of the asset you want to add.</DialogDescription>
              </DialogHeader>
                <div className="h-full space-y-4 flex-grow-1 overflow-y-auto px-2 md:px-6 dark:[&::-webkit-scrollbar-thumb]:bg-slate-500  dark:[&::-webkit-scrollbar]:w-[4px] pt-4 z-0">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="h-full space-y-4">
                      {/* Parent Resource and Category */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                        <FormField control={form.control} name="parentResource"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium leading-none">Parent Resource <span className="text-destructive">*</span></FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-md border border-input">
                                    <SelectValue placeholder="Select Parent Resource" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[300px]">
                                  {parentResources.map((resource) => (
                                    <SelectItem key={resource.value} value={resource.value} className="py-2.5">
                                      {resource.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium leading-none">Category <span className="text-destructive">*</span></FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-md border border-input">
                                    <SelectValue placeholder="Select Category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category.value} value={category.value}>
                                      {category.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Assets Name and Code  */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                        <FormField control={form.control} name="name"
                          render={({ field }) => (
                            <FormItem className="space-y-0 mt-0">
                              <FormLabel className="text-sm font-medium leading-none">Asset Name <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input className="h-12 rounded-md border border-input" placeholder="Enter Asset Name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="code"
                          render={({ field }) => (
                            <FormItem className="space-y-0 mt-0">
                              <FormLabel className="text-sm font-medium leading-none">Asset Code <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input className="h-12 rounded-md border border-input" placeholder="Enter Asset Code" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Status and Location Tag */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium leading-none">Asset Status <span className="text-destructive">*</span></FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-md border border-input">
                                    <SelectValue placeholder="Select Status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {statuses.map((status) => (
                                    <SelectItem key={status.value} value={status.value}>
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="locationTag"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium leading-none">Location Tag <span className="text-destructive">*</span></FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-md border border-input">
                                    <SelectValue placeholder="Select Location Tag" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {locationTags.map((location) => (
                                    <SelectItem key={location.value} value={location.value}>
                                      {location.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Unit and Department */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium leading-none">Org Unit <span className="text-destructive">*</span></FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value); // <-- ✅ call it here!
                                  if (value === "000000000000000000000000") {
                                    setFilterDepartment(departmentDetails);
                                  } else {
                                    const matched = departmentDetails.filter(
                                      (dept) => dept.detail.unitId === value
                                    );
                                    setFilterDepartment(matched);
                                  }
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-md border border-input">
                                    <SelectValue placeholder="Select Org Unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {units.map((unit) => (
                                    <SelectItem key={unit.value} value={unit.value}>
                                      {unit.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField control={form.control} name="department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium leading-none">Department <span className="text-destructive">*</span></FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-md border border-input">
                                    <SelectValue placeholder="Select Department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filterDepartment.length === 0 ? (
                                    <div className="p-2 text-sm text-muted-foreground">No departments found</div>
                                  ) : (
                                    filterDepartment.map((d) => (
                                      <SelectItem key={d.id} value={d.id}>
                                        {d.detail.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* Description */}
                      <FormField control={form.control} name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium leading-none">Asset Specification</FormLabel>
                            <FormControl>
                              <Textarea className="h-12 rounded-md border border-input" placeholder="Enter Asset Specification" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Attechments */}
                      <FormField control={form.control} name="attachments"
                        render={({ field }) => (
                          <FileUploadBox
                            label="Upload Attachments"
                            uploadUrl={api_url.mediaService.dpvmu}
                            uploadType="multiple"
                            accept=".jpg,.jpeg,.png,.pdf"
                            maxFileSizeMB={5}
                            value={field.value}
                            onChange={field.onChange}
                            onUploadError={onUploadError}
                            onUploadSuccess= {onUploadSuccess}
                          />
                        )}
                      />
                      <DialogFooter className="py-4 gap-2">
                        <Button type="button" variant="outline"
                          onClick={() => {
                            setIsAddAssetOpen(false)
                          }}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
              </div>
          </DialogContent>
        </Dialog>

        {/* View Asset Dialog */}
        <Dialog open={isViewAssetOpen} onOpenChange={setIsViewAssetOpen}>
          <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={() => setIsViewAssetOpen(false)}
              className="sm:max-w-[600px] max-w-md md:max-h-[90dvh] min-h-[90dvh] md:h-[90dvh] h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] dark:bg-modal p-0 gap-0">
            <DialogHeader className="px-2 md:px-6 py-6 border-b">
              <DialogTitle>Asset Details</DialogTitle>
              <DialogDescription>View details of the selected asset.</DialogDescription>
            </DialogHeader>
            {selectedAsset && (
              <div className="h-full space-y-4 flex-grow-1 overflow-y-auto px-2 md:px-6 dark:[&::-webkit-scrollbar-thumb]:bg-slate-500  dark:[&::-webkit-scrollbar]:w-[4px] pt-4 z-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Parent Resource</Label>
                    <p className="text-sm">{getParentResourcesNameById(selectedAsset.resourceId)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <p className="text-sm">{getCategoriesNameById(selectedAsset.categoryId)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Asset Name</Label>
                    <p className="text-sm">{selectedAsset.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Asset Code</Label>
                    <p className="text-sm">{selectedAsset.code}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div>
                      <Badge className={getStatusBadgeColor(getStatusesNameById(selectedAsset.statusId))}>
                        {getStatusesNameById(selectedAsset.statusId)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Location Tag</Label>
                    <p className="text-sm">{getLocationTagNameById(selectedAsset.locationId)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Org Unit</Label>
                    <p className="text-sm">{getUnitNameById(selectedAsset.unitId)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                    <p className="text-sm">{getDepartmentsNameById(selectedAsset.departmentId)}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm">{selectedAsset.description || "No description provided."}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Attachments</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAsset.attachments && selectedAsset.attachments.length > 0 ? (
                      selectedAsset.attachments.map((url: string, index: number) => (
                        <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                          <div className="w-24 h-24 max-h-24 min-h-24 min-w-24 max-w-24 rounded-xl border hover:opacity-80">
                            <img
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="h-full w-full object-cover rounded-xl"
                            />
                          </div>
                        </a>
                      ))
                    ) : (
                      <span className="text-sm">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter  className="px-2 md:px-6 py-4 gap-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      setIsViewAssetOpen(false)
                      handleEditAsset(selectedAsset)
                    }}>
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteAsset(selectedAsset)
                    }}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Asset Dialog */}
        <Dialog open={isEditAssetOpen} onOpenChange={setIsEditAssetOpen}>
          <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={() => setIsEditAssetOpen(false)}
              className="sm:max-w-[600px] max-w-md md:max-h-[90dvh] min-h-[90dvh] md:h-[90dvh] h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] dark:bg-modal p-0 gap-0">
            <DialogHeader className="px-2 md:px-6 py-6 border-b">
              <DialogTitle>Edit Asset</DialogTitle>
              <DialogDescription>Update the details of the selected asset.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="h-full space-y-4 flex-grow-1 overflow-y-auto px-2 md:px-6 dark:[&::-webkit-scrollbar-thumb]:bg-slate-500  dark:[&::-webkit-scrollbar]:w-[4px] pt-4 z-0">
                {/* Parent Resource and Category */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="parentResource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="">Parent Resource <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                              <SelectValue placeholder="Select Parent Resource" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[300px]">
                            {parentResources.map((resource) => (
                              <SelectItem key={resource.value} value={resource.value} className="py-2.5">
                                {resource.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Asset Name and Code */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-0 mt-0">
                        <FormLabel>Asset Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input disabled={!!selectedAsset} className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" placeholder="Enter Asset Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="code"
                    render={({ field }) => (
                      <FormItem className="space-y-0 mt-0">
                        <FormLabel className="text-sm font-medium leading-none">Asset Code <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input disabled={!!selectedAsset} className="h-12 rounded-md border border-input" placeholder="Enter Asset Code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Status and Location Tag */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Status <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                              <SelectValue placeholder="Select Asset Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="locationTag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Tag <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                              <SelectValue placeholder="Select Location Tag" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locationTags.map((location) => (
                              <SelectItem key={location.value} value={location.value}>
                                {location.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Unit and Department */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Org Unit <span className="text-destructive">*</span></FormLabel>
                        <Select  defaultValue={field.value} onValueChange={(value) => {
                            field.onChange;
                            // Filter departments that belong to this org unit
                            if (value === "000000000000000000000000") {
                              setFilterDepartment(departmentDetails);
                            } else {
                              const matched = departmentDetails.filter(
                                (dept) => dept.detail.unitId === value
                              );
                              setFilterDepartment(matched);
                            }
                          }}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                              <SelectValue placeholder="Select Org Unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                              <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filterDepartment.map((d) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.detail.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {/* Description */}
                <FormField control={form.control} name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Specification</FormLabel>
                      <FormControl>
                        <Textarea className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" placeholder="Enter Asset Specification" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Attechments */}
                <FormField control={form.control} name="attachments"
                  render={({ field }) => (
                    <FileUploadBox
                      label="Upload Attachments"
                      uploadUrl={api_url.mediaService.dpvmu}
                      uploadType="multiple"
                      accept=".jpg,.jpeg,.png,.pdf"
                      maxFileSizeMB={5}
                      value={field.value}
                      onChange={field.onChange}
                      onUploadError={onUploadError}
                      onUploadSuccess= {onUploadSuccess}
                    />
                  )}
                />
                <DialogFooter className="py-4 gap-2">
                  <Button variant="outline" onClick={() => setIsEditAssetOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Asset Dialog */}
        <Dialog open={isDeleteAssetOpen} onOpenChange={setIsDeleteAssetOpen}>
          <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={() => setIsDeleteAssetOpen(false)}>
            <DialogHeader>
              <DialogTitle>Delete Asset</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this asset? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedAsset && (
              <div className="py-4">
                <p className="mb-2">
                  You are about to delete: <strong>{selectedAsset.name}</strong>
                </p>
                <p className="text-destructive">This will permanently remove the asset and all associated records.</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteAssetOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteAsset} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
