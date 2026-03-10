"use client"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"

const LOCATION_TAG_NONE_VALUE = "__none__"

const skuFormSchema = z.object({
  skuId: z
    .string()
    .max(100, "SKU ID must be less than 100 characters")
    .optional()
    .transform((val) => (val?.trim() ? val.trim() : undefined)),
  skuName: z.string().min(1, { message: "SKU Name is required." }).transform((val) => val.trim()),
  skuCategory: z.enum(["raw_material", "finished_good"], {
    required_error: "Please select a SKU Category.",
  }),
  quantity: z.coerce.number().min(0.01, { message: "Quantity must be greater than 0." }),
  skuUnit: z.enum(["kg", "liters", "pieces", "boxes"], {
    required_error: "Please select a Unit of Measure.",
  }),
  effectiveDate: z.string().min(1, { message: "Effective Date is required." }).regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Invalid date format. Please use YYYY-MM-DD format." }),
  expiryDate: z.string().optional().refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), { message: "Invalid date format. Please use YYYY-MM-DD format." }),
  locationTagId: z.string().optional(),
})

// Explicitly define the form values type to match zod schema
type SkuFormValues = z.infer<typeof skuFormSchema>

type LocationTagOption = {
  label: string
  value: string
  unitId: string
  unitName: string
}

type WarehouseOption = {
  label: string
  value: string
}

interface SkuFormProps {
  initialData?: Partial<SkuFormValues>
  onSubmit: (data: SkuFormValues) => void
  onCancel: () => void
  locationTags: LocationTagOption[]
  warehouses: WarehouseOption[]
  defaultWarehouseId?: string
  isSubmitting?: boolean
}

export function SkuForm({
  initialData = {},
  onSubmit,
  onCancel,
  locationTags,
  warehouses,
  defaultWarehouseId,
  isSubmitting,
}: SkuFormProps) {
  // Initialize form with default values or initial data
  const form = useForm<SkuFormValues>({
    resolver: zodResolver(skuFormSchema) as any,
    defaultValues: {
      skuId: initialData?.skuId || "",
      skuName: initialData?.skuName || "",
      skuCategory: (initialData?.skuCategory as any) || "raw_material",
      quantity: (initialData?.quantity as any) ?? 0,
      skuUnit: (initialData?.skuUnit as any) || "kg",
      effectiveDate: initialData?.effectiveDate || "",
      expiryDate: initialData?.expiryDate || "",
      locationTagId: initialData?.locationTagId || undefined,
    },
  })

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(defaultWarehouseId ?? "")

  useEffect(() => {
    if (initialData?.locationTagId) {
      const matchedTag = locationTags.find((tag) => tag.value === initialData.locationTagId)
      if (matchedTag) {
        setSelectedWarehouseId(matchedTag.unitId)
        return
      }
    }
    if (defaultWarehouseId) {
      setSelectedWarehouseId(defaultWarehouseId)
    } else {
      setSelectedWarehouseId("")
    }
  }, [defaultWarehouseId, initialData?.locationTagId, locationTags])

  const filteredLocationTags = useMemo(() => {
    if (!selectedWarehouseId) return []
    return locationTags.filter((tag) => tag.unitId === selectedWarehouseId)
  }, [locationTags, selectedWarehouseId])

  const selectedWarehouseName = useMemo(() => {
    if (!selectedWarehouseId) return null
    return warehouses.find((wh) => wh.value === selectedWarehouseId)?.label ?? null
  }, [selectedWarehouseId, warehouses])

  const handleWarehouseChange = (warehouseId: string) => {
    setSelectedWarehouseId(warehouseId)
    form.setValue("locationTagId", undefined)
  }

  // Submit handler
  const handleSubmit = (data: SkuFormValues) => {
    // Since we're using z.coerce in the schema, the values should already be properly typed
    onSubmit(data)
    // Don't reset here - let parent handle dialog close and reset
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-6 flex-grow-1 overflow-y-auto px-4 md:px-6">
          <div className="space-y-4">
            {/* SKU ID */}
            <FormField control={form.control} name="skuId"
              render={({ field }) => (
                <FormItem className="space-y-1 gap-2">
                  <FormLabel className="text-sm font-medium leading-none">SKU ID</FormLabel>
                  <FormControl>
                    <Input className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" placeholder="e.g., SKU-001, STEEL-B-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* SKU Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="skuName"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">SKU Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" placeholder="Enter SKU name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="skuCategory"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">SKU Category <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                          <SelectValue placeholder="Select SKU Category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="raw_material">raw_material</SelectItem>
                        <SelectItem value="finished_good">finished_good</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Quantity + Unit of Measure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="quantity"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">Quantity <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700"
                        placeholder="Enter quantity"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="skuUnit"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">Unit of Measure <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="liters">liters</SelectItem>
                        <SelectItem value="pieces">pieces</SelectItem>
                        <SelectItem value="boxes">boxes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Effective Date + Expiry Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="effectiveDate"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">Effective Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="expiryDate"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormItem className="space-y-1 gap-2">
                <FormLabel className="text-sm font-medium leading-none">Warehouse</FormLabel>
                <Select value={selectedWarehouseId} onValueChange={handleWarehouseChange}>
                  <FormControl>
                    <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                      <SelectValue placeholder="Select Warehouse" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.value} value={warehouse.value}>
                        {warehouse.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!selectedWarehouseId && (
                  <p className="text-xs text-muted-foreground">Choose a warehouse to see its location tags.</p>
                )}
              </FormItem>
              <FormField
                control={form.control}
                name="locationTagId"
                render={({ field }) => (
                  <FormItem className="space-y-1 gap-2">
                    <FormLabel className="text-sm font-medium leading-none">
                      Location Tag
                      {selectedWarehouseName ? (
                        <span className="block text-xs font-normal text-muted-foreground">{selectedWarehouseName}</span>
                      ) : null}
                    </FormLabel>
                    <Select
                      disabled={!selectedWarehouseId}
                      onValueChange={(val) => field.onChange(val === LOCATION_TAG_NONE_VALUE ? undefined : val)}
                      value={field.value || LOCATION_TAG_NONE_VALUE}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-md border border-input bg-white/100 dark:bg-slate-800/80 dark:border-slate-700">
                          <SelectValue placeholder={selectedWarehouseId ? "Select Location Tag" : "Select Warehouse first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LOCATION_TAG_NONE_VALUE}>None</SelectItem>
                        {filteredLocationTags.length === 0 && selectedWarehouseId ? (
                          <SelectItem value="__disabled__" disabled>
                            No location tags
                          </SelectItem>
                        ) : (
                          filteredLocationTags.map((tag) => (
                            <SelectItem key={tag.value} value={tag.value}>
                              {tag.label}
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
          </div>
        </div>
        <DialogFooter className="px-2 md:px-6 py-4">
          <Button variant="outline" className="text-sm font-medium" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="bg-darkblue text-sm font-medium" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialData?.skuName ? "Update SKU" : "Add SKU"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

export default SkuForm
